import { describe, expect, it } from 'vitest';
import { calibrateFace, mapFaceToViewpoint, type FaceSample } from '../src/tracking/headPose';

const neutral: FaceSample = { x: 0.5, y: 0.48, size: 0.28 };

describe('head pose calibration', () => {
  it('calibrates only after a stable window of samples', () => {
    const stable = Array.from({ length: 12 }, (_, index) => ({
      x: 0.5 + index * 0.001,
      y: 0.48 - index * 0.001,
      size: 0.28 + index * 0.001,
    }));
    const calibration = calibrateFace(stable);

    expect(calibration).not.toBeNull();
    expect(calibration?.x).toBeCloseTo(0.5055, 8);
    expect(calibration?.y).toBeCloseTo(0.4745, 8);
    expect(calibration?.size).toBeCloseTo(0.2855, 8);
  });

  it('waits when the user is still settling into a neutral pose', () => {
    const unstable = Array.from({ length: 12 }, (_, index) => ({
      x: index % 2 === 0 ? 0.4 : 0.6,
      y: 0.48,
      size: 0.28,
    }));

    expect(calibrateFace(unstable)).toBeNull();
  });
});

describe('head pose mapping', () => {
  it('maps movement direction and relative distance to a bounded viewpoint', () => {
    const towardRightAndUp = mapFaceToViewpoint({ x: 0.63, y: 0.35, size: 0.33 }, neutral);
    expect(towardRightAndUp.x).toBe(1);
    expect(towardRightAndUp.y).toBe(1);
    expect(towardRightAndUp.z).toBeCloseTo(0.5);

    const beyondEnvelope = mapFaceToViewpoint({ x: 0.2, y: 0.8, size: 0.1 }, neutral);
    expect(beyondEnvelope).toEqual({ x: -1, y: -1, z: -1 });
  });
});
