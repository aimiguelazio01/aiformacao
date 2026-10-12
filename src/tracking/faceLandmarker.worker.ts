import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface WorkerRequest {
  type: 'init' | 'frame' | 'dispose';
  bitmap?: ImageBitmap;
  timestamp?: number;
}

type WorkerResponse =
  | { type: 'ready' }
  | { type: 'pose'; sample: { x: number; y: number; size: number } }
  | { type: 'missing' }
  | { type: 'error'; code: 'model-load' | 'inference'; detail?: string };

const WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MODEL_PATH = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse) => void;
  close: () => void;
};

let landmarker: FaceLandmarker | null = null;
let initialization: Promise<void> | null = null;

async function initialize(): Promise<void> {
  if (initialization) return initialization;

  initialization = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_ROOT, true);
    landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_PATH },
      runningMode: 'VIDEO',
      numFaces: 1,
      minFaceDetectionConfidence: 0.55,
      minFacePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
    workerScope.postMessage({ type: 'ready' });
  })();

  try {
    await initialization;
  } catch (error) {
    initialization = null;
    throw error;
  }
}

function getFaceSample(
  landmarks: Array<{ x: number; y: number }>,
): { x: number; y: number; size: number } | null {
  if (landmarks.length === 0) return null;

  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;

  for (const point of landmarks) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    size: maxX - minX,
  };
}

workerScope.onmessage = async (event): Promise<void> => {
  const request = event.data;

  if (request.type === 'init') {
    try {
      await initialize();
    } catch (error) {
      workerScope.postMessage({
        type: 'error',
        code: 'model-load',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (request.type === 'dispose') {
    landmarker?.close();
    landmarker = null;
    workerScope.close();
    return;
  }

  const bitmap = request.bitmap;
  if (!bitmap || !landmarker) {
    bitmap?.close();
    workerScope.postMessage({ type: 'missing' });
    return;
  }

  try {
    const result = landmarker.detectForVideo(bitmap, request.timestamp ?? performance.now());
    const sample = getFaceSample(result.faceLandmarks[0] ?? []);
    if (sample) workerScope.postMessage({ type: 'pose', sample });
    else workerScope.postMessage({ type: 'missing' });
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      code: 'inference',
      detail: error instanceof Error ? error.message : String(error),
    });
  } finally {
    bitmap.close();
  }
};

