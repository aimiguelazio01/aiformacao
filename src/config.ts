export const HERO_CONFIG = {
  camera: {
    fieldOfView: 45,
    near: 0.1,
    far: 60,
    positionZ: 10,
    travelX: 0.3,
    travelY: 0.2,
    travelZ: 0.12,
  },
  motion: {
    deadZone: 0.035,
    timeConstantMs: 150,
    settleThreshold: 0.0015,
    maxDeltaMs: 100,
  },
  render: {
    maxPixelRatio: 1.5,
    mobileBreakpoint: 640,
    tabletBreakpoint: 900,
  },
  particles: {
    count: 180,
    seed: 93817,
  },
} as const;
