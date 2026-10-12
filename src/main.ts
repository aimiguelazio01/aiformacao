import './styles.css';
import { HERO_CONFIG } from './config';
import { applyDeadZone, normalizePointer, smoothToward } from './input/parallax';
import { createHeroScene } from './scene/createHeroScene';
import { HeadTrackingSession } from './tracking/headTracking';

const canvas = document.querySelector<HTMLCanvasElement>('.hero__canvas');
const hero = document.querySelector<HTMLElement>('.hero');
const status = document.querySelector<HTMLElement>('[data-status]');
const readout = document.querySelector<HTMLOutputElement>('[data-readout]');
const resetButton = document.querySelector<HTMLButtonElement>('[data-reset]');
const diagnosticsButton = document.querySelector<HTMLButtonElement>('[data-diagnostics]');
const headToggleButton = document.querySelector<HTMLButtonElement>('[data-head-toggle]');

if (!canvas || !hero || !status || !readout || !resetButton || !diagnosticsButton || !headToggleButton) {
  throw new Error('The hero markup is incomplete.');
}

const heroElement = hero;
const statusElement = status;
const headButton = headToggleButton;
const readoutElement = readout;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let scene: ReturnType<typeof createHeroScene>;

try {
  scene = createHeroScene(canvas);
} catch (error) {
  statusElement.textContent = 'Static view — WebGL is unavailable in this browser.';
  heroElement.classList.add('hero--static');
  console.error('Could not create the Three.js scene.', error);
  throw error;
}

const state = {
  targetX: 0,
  targetY: 0,
  targetZ: 0,
  cameraX: 0,
  cameraY: 0,
  cameraZ: 0,
  frameId: 0,
  lastTime: 0,
  lastReadout: 0,
  diagnostics: false,
  headActive: false,
};

let headSession: HeadTrackingSession | null = null;

function updateReadout(now: number): void {
  if (!state.diagnostics || now - state.lastReadout < 100) return;
  state.lastReadout = now;
  readoutElement.textContent = 'Camera x '
    + (state.cameraX * HERO_CONFIG.camera.travelX).toFixed(2)
    + ' · y '
    + (state.cameraY * HERO_CONFIG.camera.travelY).toFixed(2)
    + ' · z '
    + (state.cameraZ * HERO_CONFIG.camera.travelZ).toFixed(2);
}

function updateHeadButton(): void {
  headButton.textContent = state.headActive ? 'Disable head view' : 'Enable head view';
  headButton.setAttribute('aria-pressed', String(state.headActive));
  headButton.setAttribute(
    'aria-label',
    state.headActive
      ? 'Disable head tracking and release the camera'
      : 'Enable optional local head tracking. Camera frames stay on this device.',
  );
  headButton.disabled = reducedMotion.matches;
  headButton.title = reducedMotion.matches
    ? 'Head movement is disabled while reduced motion is enabled.'
    : '';
}

function tick(now: number): void {
  const deltaMs = state.lastTime === 0 ? 16.67 : Math.min(now - state.lastTime, HERO_CONFIG.motion.maxDeltaMs);
  state.lastTime = now;

  state.cameraX = smoothToward(
    state.cameraX,
    state.targetX,
    deltaMs,
    HERO_CONFIG.motion.timeConstantMs,
    HERO_CONFIG.motion.maxDeltaMs,
  );
  state.cameraY = smoothToward(
    state.cameraY,
    state.targetY,
    deltaMs,
    HERO_CONFIG.motion.timeConstantMs,
    HERO_CONFIG.motion.maxDeltaMs,
  );
  state.cameraZ = smoothToward(
    state.cameraZ,
    state.targetZ,
    deltaMs,
    HERO_CONFIG.motion.timeConstantMs,
    HERO_CONFIG.motion.maxDeltaMs,
  );

  scene.setViewpoint(state.cameraX, state.cameraY, state.cameraZ);
  scene.render(now);
  updateReadout(now);

  const unsettled = Math.abs(state.targetX - state.cameraX) > HERO_CONFIG.motion.settleThreshold
    || Math.abs(state.targetY - state.cameraY) > HERO_CONFIG.motion.settleThreshold
    || Math.abs(state.targetZ - state.cameraZ) > HERO_CONFIG.motion.settleThreshold;
  if (unsettled || !reducedMotion.matches) {
    state.frameId = requestAnimationFrame(tick);
  } else {
    state.cameraX = state.targetX;
    state.cameraY = state.targetY;
    state.cameraZ = state.targetZ;
    scene.setViewpoint(state.cameraX, state.cameraY, state.cameraZ);
    scene.render();
    updateReadout(now + 100);
    state.frameId = 0;
    state.lastTime = 0;
  }
}

function scheduleFrame(): void {
  if (state.frameId === 0 && !reducedMotion.matches) {
    state.frameId = requestAnimationFrame(tick);
  } else if (reducedMotion.matches) {
    scene.render();
  }
}

function recenter(): void {
  if (state.headActive) {
    headSession?.recalibrate();
    return;
  }

  state.targetX = 0;
  state.targetY = 0;
  state.targetZ = 0;
  if (reducedMotion.matches) {
    if (state.frameId !== 0) cancelAnimationFrame(state.frameId);
    state.frameId = 0;
    state.lastTime = 0;
    state.cameraX = 0;
    state.cameraY = 0;
    state.cameraZ = 0;
    scene.setViewpoint(0, 0, 0);
    scene.render();
    updateReadout(performance.now() + 100);
  } else {
    scheduleFrame();
  }
}

function stopHeadTracking(message: string): void {
  const session = headSession;
  headSession = null;
  state.headActive = false;
  session?.stop();
  updateHeadButton();
  state.targetX = 0;
  state.targetY = 0;
  state.targetZ = 0;
  recenter();
  statusElement.textContent = message;
}

async function toggleHeadTracking(): Promise<void> {
  if (state.headActive) {
    stopHeadTracking('Head view off. Mouse control is available.');
    return;
  }
  if (reducedMotion.matches) return;

  state.headActive = true;
  state.targetX = 0;
  state.targetY = 0;
  state.targetZ = 0;
  scheduleFrame();
  updateHeadButton();
  statusElement.textContent = 'Camera access is requested only for head view.';

  let session: HeadTrackingSession;
  session = new HeadTrackingSession({
    onPose(pose) {
      if (headSession !== session) return;
      state.targetX = applyDeadZone(pose.x, HERO_CONFIG.motion.deadZone);
      state.targetY = applyDeadZone(pose.y, HERO_CONFIG.motion.deadZone);
      state.targetZ = applyDeadZone(pose.z, HERO_CONFIG.motion.deadZone);
      scheduleFrame();
    },
    onStatus(message) {
      if (headSession === session) statusElement.textContent = message;
    },
    onError() {
      if (headSession === session) {
        stopHeadTracking('Head tracking stopped. Mouse control is available.');
      }
    },
  });
  headSession = session;

  try {
    await session.start();
  } catch (error) {
    if (headSession !== session) return;
    session.stop();
    headSession = null;
    state.headActive = false;
    updateHeadButton();
    state.targetX = 0;
    state.targetY = 0;
    state.targetZ = 0;
    recenter();
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      statusElement.textContent = 'Camera access was denied. Mouse control is available.';
    } else {
      statusElement.textContent = 'Head view could not start. Camera closed; mouse control is available.';
    }
  }
}

function handlePointerMove(event: PointerEvent): void {
  if (state.headActive || reducedMotion.matches || event.pointerType === 'touch') return;
  const pointer = normalizePointer(event.clientX, event.clientY, heroElement.getBoundingClientRect());
  state.targetX = applyDeadZone(pointer.x, HERO_CONFIG.motion.deadZone);
  state.targetY = applyDeadZone(pointer.y, HERO_CONFIG.motion.deadZone);
  state.targetZ = 0;
  scheduleFrame();
}

function handlePointerLeave(): void {
  if (!state.headActive) recenter();
}

function handleResize(): void {
  const bounds = heroElement.getBoundingClientRect();
  scene.resize(bounds.width, bounds.height);
  scene.render();
}

heroElement.addEventListener('pointermove', handlePointerMove);
heroElement.addEventListener('pointerleave', handlePointerLeave);
resetButton.addEventListener('click', recenter);
headButton.addEventListener('click', () => {
  void toggleHeadTracking();
});
diagnosticsButton.addEventListener('click', () => {
  state.diagnostics = !state.diagnostics;
  diagnosticsButton.setAttribute('aria-pressed', String(state.diagnostics));
  readoutElement.hidden = !state.diagnostics;
  if (state.diagnostics) updateReadout(performance.now() + 100);
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    if (state.headActive) stopHeadTracking('Head view disabled by reduced-motion preference.');
    else recenter();
  }
  updateHeadButton();
  scene.render();
});

const resizeObserver = new ResizeObserver(handleResize);
resizeObserver.observe(heroElement);
handleResize();
if (!reducedMotion.matches) scheduleFrame();
updateHeadButton();

scene.onContextLost(() => {
  if (state.headActive) stopHeadTracking('The 3D view paused. Head tracking stopped.');
  statusElement.textContent = 'The 3D view paused. Reload the page to restore it.';
  heroElement.classList.add('hero--static');
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (state.headActive) stopHeadTracking('Head view stopped while the page was hidden.');
    if (state.frameId !== 0) cancelAnimationFrame(state.frameId);
    state.frameId = 0;
    state.lastTime = 0;
  } else if (!reducedMotion.matches) {
    scheduleFrame();
  }
});

window.addEventListener('pagehide', () => {
  resizeObserver.disconnect();
  if (state.frameId !== 0) cancelAnimationFrame(state.frameId);
  headSession?.stop();
  scene.dispose();
}, { once: true });





