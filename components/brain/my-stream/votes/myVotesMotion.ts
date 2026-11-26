// Material Standard springs, with mass 1 and no visible bounce.
export const MY_VOTES_SPATIAL_TRANSITION = {
  type: "spring",
  stiffness: 700,
  damping: 2 * 0.9 * Math.sqrt(700),
} as const;

export const MY_VOTES_EFFECT_TRANSITION = {
  type: "spring",
  stiffness: 1600,
  damping: 80,
} as const;

export const MY_VOTES_FADE_TRANSITION = { duration: 0.15 } as const;
