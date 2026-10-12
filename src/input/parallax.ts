export interface PointerBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface NormalizedPointer {
  x: number;
  y: number;
}

export function normalizePointer(
  clientX: number,
  clientY: number,
  bounds: PointerBounds,
): NormalizedPointer {
  if (bounds.width <= 0 || bounds.height <= 0) return { x: 0, y: 0 };

  return {
    x: clamp(((clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1),
    y: clamp(1 - ((clientY - bounds.top) / bounds.height) * 2, -1, 1),
  };
}

export function applyDeadZone(value: number, zone: number): number {
  const magnitude = Math.abs(value);
  if (magnitude <= zone) return 0;

  return Math.sign(value) * clamp((magnitude - zone) / (1 - zone), 0, 1);
}

export function smoothToward(
  current: number,
  target: number,
  deltaMs: number,
  timeConstantMs: number,
  maxDeltaMs = 100,
): number {
  if (timeConstantMs <= 0) return target;

  const safeDelta = clamp(deltaMs, 0, maxDeltaMs);
  const amount = 1 - Math.exp(-safeDelta / timeConstantMs);
  return current + (target - current) * amount;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
