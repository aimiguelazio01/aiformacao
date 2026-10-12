import { calibrateFace, mapFaceToViewpoint, type FaceSample, type HeadViewpoint } from './headPose';

interface WorkerMessage {
  type: 'ready' | 'pose' | 'missing' | 'error';
  sample?: FaceSample;
}

interface TrackingCallbacks {
  onPose: (pose: HeadViewpoint) => void;
  onStatus: (message: string) => void;
  onError: () => void;
}

export class HeadTrackingSession {
  private readonly callbacks: TrackingCallbacks;
  private worker: Worker | null = null;
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private videoFrameId: number | null = null;
  private fallbackFrameId = 0;
  private lastSubmitAt = 0;
  private lastTimestamp = 0;
  private framePending = false;
  private workerReady = false;
  private closed = false;
  private failed = false;
  private neutral: FaceSample | null = null;
  private calibrationSamples: FaceSample[] = [];
  private missingSince = 0;
  private faceLost = false;
  private lastStatus = '';

  constructor(callbacks: TrackingCallbacks) {
    this.callbacks = callbacks;
  }

  async start(): Promise<void> {
    this.setStatus('Requesting camera access…');
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access is unavailable in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 24, max: 30 },
      },
    });
    this.stream = stream;

    if (this.closed) {
      this.stopTracks();
      throw new Error('Head tracking was cancelled.');
    }

    const video = document.createElement('video');
    video.className = 'head-tracker-video';
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute('aria-hidden', 'true');
    video.tabIndex = -1;
    video.srcObject = stream;
    document.body.append(video);
    this.video = video;

    const worker = new Worker(new URL('./faceLandmarker.worker.ts', import.meta.url), { type: 'module' });
    this.worker = worker;

    let resolveReady!: () => void;
    let rejectReady!: (error: Error) => void;
    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (message.type === 'ready') {
        this.workerReady = true;
        resolveReady();
      } else if (message.type === 'pose' && message.sample) {
        this.framePending = false;
        this.receivePose(message.sample);
      } else if (message.type === 'missing') {
        this.framePending = false;
        this.receiveMissingFace();
      } else if (message.type === 'error') {
        const error = new Error('The face tracker could not process a frame.');
        if (!this.workerReady) rejectReady(error);
        else this.fail();
      }
    });
    worker.addEventListener('error', () => {
      const error = new Error('The face tracker worker stopped.');
      if (!this.workerReady) rejectReady(error);
      else this.fail();
    });

    this.setStatus('Loading the on-device face model…');
    worker.postMessage({ type: 'init' });

    try {
      await Promise.all([video.play(), ready]);
    } catch (error) {
      this.stop();
      throw error;
    }

    if (this.closed) throw new Error('Head tracking was cancelled.');
    this.setStatus('Hold still while the view calibrates.');
    this.scheduleNextFrame();
  }

  recalibrate(): void {
    if (this.closed) return;
    this.neutral = null;
    this.calibrationSamples = [];
    this.missingSince = 0;
    this.faceLost = false;
    this.callbacks.onPose({ x: 0, y: 0, z: 0 });
    this.setStatus('Hold still while the view recalibrates.');
  }

  stop(): void {
    if (this.closed) return;
    this.closed = true;

    if (this.video && this.videoFrameId !== null) {
      this.video.cancelVideoFrameCallback(this.videoFrameId);
    }
    if (this.fallbackFrameId !== 0) cancelAnimationFrame(this.fallbackFrameId);

    if (this.worker) {
      this.worker.postMessage({ type: 'dispose' });
      this.worker.terminate();
      this.worker = null;
    }

    this.video?.pause();
    if (this.video) {
      this.video.srcObject = null;
      this.video.remove();
      this.video = null;
    }
    this.stopTracks();
  }

  private stopTracks(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  private scheduleNextFrame(): void {
    if (this.closed || !this.video) return;

    if ('requestVideoFrameCallback' in this.video) {
      this.videoFrameId = this.video.requestVideoFrameCallback((now) => {
        this.videoFrameId = null;
        this.submitFrame(now);
        this.scheduleNextFrame();
      });
      return;
    }

    this.fallbackFrameId = requestAnimationFrame((now) => {
      this.fallbackFrameId = 0;
      if (now - this.lastSubmitAt >= 66) this.submitFrame(now);
      this.scheduleNextFrame();
    });
  }

  private submitFrame(now: number): void {
    const video = this.video;
    const worker = this.worker;
    if (
      this.closed
      || this.framePending
      || !this.workerReady
      || !video
      || !worker
      || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      || now - this.lastSubmitAt < 50
    ) {
      return;
    }

    if (typeof createImageBitmap !== 'function') {
      this.fail();
      return;
    }

    this.lastSubmitAt = now;
    this.framePending = true;
    void createImageBitmap(video).then((bitmap) => {
      if (this.closed || !this.worker) {
        bitmap.close();
        this.framePending = false;
        return;
      }

      this.lastTimestamp = Math.max(this.lastTimestamp + 0.01, now);
      this.worker.postMessage({
        type: 'frame',
        bitmap,
        timestamp: this.lastTimestamp,
      }, [bitmap]);
    }).catch(() => {
      this.framePending = false;
      this.fail();
    });
  }

  private receivePose(sample: FaceSample): void {
    this.missingSince = 0;
    this.faceLost = false;

    if (!this.neutral) {
      this.calibrationSamples = [...this.calibrationSamples.slice(-11), sample];
      const neutral = calibrateFace(this.calibrationSamples);
      if (!neutral) {
        this.setStatus('Hold still while the view calibrates.');
        return;
      }

      this.neutral = neutral;
      this.calibrationSamples = [];
      this.callbacks.onPose({ x: 0, y: 0, z: 0 });
      this.setStatus('Head view ready. Move gently to explore.');
      return;
    }

    this.callbacks.onPose(mapFaceToViewpoint(sample, this.neutral));
    this.setStatus('Head view active · video stays on this device.');
  }

  private receiveMissingFace(): void {
    if (!this.neutral) {
      this.calibrationSamples = [];
      this.setStatus('Face not found. Center your face in the camera view.');
      return;
    }

    if (this.missingSince === 0) this.missingSince = performance.now();
    if (!this.faceLost && performance.now() - this.missingSince > 700) {
      this.faceLost = true;
      this.callbacks.onPose({ x: 0, y: 0, z: 0 });
      this.setStatus('Face lost. Return to view to resume tracking.');
    }
  }

  private setStatus(message: string): void {
    if (message === this.lastStatus) return;
    this.lastStatus = message;
    this.callbacks.onStatus(message);
  }

  private fail(): void {
    if (this.failed || this.closed) return;
    this.failed = true;
    this.stop();
    this.callbacks.onError();
  }
}

