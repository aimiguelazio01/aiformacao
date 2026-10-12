import { describe, expect, it } from 'vitest';
import { applyDeadZone, normalizePointer, smoothToward } from '../src/input/parallax';

describe('pointer normalization', () => {
  it('maps the center and edges of the hero to normalized coordinates', () => {
    const bounds = { left: 20, top: 10, width: 200, height: 100 };

    expect(normalizePointer(120, 60, bounds)).toEqual({ x: 0, y: 0 });
    expect(normalizePointer(20, 10, bounds)).toEqual({ x: -1, y: 1 });
    expect(normalizePointer(220, 110, bounds)).toEqual({ x: 1, y: -1 });
  });

  it('clamps positions outside the hero and handles zero-sized bounds', () => {
    expect(normalizePointer(-100, 500, { left: 0, top: 0, width: 100, height: 100 }))
      .toEqual({ x: -1, y: -1 });
    expect(normalizePointer(5, 5, { left: 0, top: 0, width: 0, height: 100 }))
      .toEqual({ x: 0, y: 0 });
  });
});

describe('dead zone and smoothing', () => {
  it('removes small motion and rescales the remaining range', () => {
    expect(applyDeadZone(0.02, 0.05)).toBe(0);
    expect(applyDeadZone(1, 0.05)).toBe(1);
    expect(applyDeadZone(-0.525, 0.05)).toBeCloseTo(-0.5);
  });

  it('is nearly frame-rate independent over the same elapsed time', () => {
    const step = (frameMs: number, count: number): number => {
      let value = 0;
      for (let index = 0; index < count; index += 1) {
        value = smoothToward(value, 1, frameMs, 150);
      }
      return value;
    };

    expect(step(1000 / 30, 30)).toBeCloseTo(step(1000 / 60, 60), 5);
  });

  it('caps paused-frame delta so a resumed tab does not snap to target', () => {
    expect(smoothToward(0, 1, 5000, 150, 100))
      .toBeCloseTo(smoothToward(0, 1, 100, 150, 100), 10);
  });
});
