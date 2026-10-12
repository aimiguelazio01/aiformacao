export interface FaceSample {
  x: number;
  y: number;
  size: number;
}

export interface HeadViewpoint {
  x: number;
  y: number;
  z: number;
}

const CALIBRATION_SAMPLE_COUNT = 12;
const MAX_CENTER_RANGE = 0.035;
const MAX_SIZE_RANGE = 0.025;

export function calibrateFace(samples: readonly FaceSample[]): FaceSample | null {
  if (samples.length < CALIBRATION_SAMPLE_COUNT) return null;

  const recent = samples.slice(-CALIBRATION_SAMPLE_COUNT);
  if (
    range(recent.map((sample) => sample.x)) > MAX_CENTER_RANGE
    || range(recent.map((sample) => sample.y)) > MAX_CENTER_RANGE
    || range(recent.map((sample) => sample.size)) > MAX_SIZE_RANGE
  ) {
    return null;
  }

  return {
    x: average(recent.map((sample) => sample.x)),
    y: average(recent.map((sample) => sample.y)),
    size: average(recent.map((sample) => sample.size)),
  };
}

export function mapFaceToViewpoint(sample: FaceSample, neutral: FaceSample): HeadViewpoint {
  return {
    x: clamp((sample.x - neutral.x) / 0.13, -1, 1),
    y: clamp((neutral.y - sample.y) / 0.13, -1, 1),
    z: clamp((sample.size - neutral.size) / 0.1, -1, 1),
  };
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function range(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
