/** Material 3 Standard spring ratios, converted to Motion's damping coefficient.
 * Source: material-components-android/docs/theming/Motion.md.
 * Keep physics-based: duration/bounce would discard gesture velocity.
 */
function spring(stiffness: number, dampingRatio: number) {
  return {
    type: "spring",
    mass: 1,
    stiffness,
    damping: 2 * dampingRatio * Math.sqrt(stiffness),
    restDelta: 0.25,
    restSpeed: 5,
  } as const;
}

export const MOTION_SPRINGS = {
  spatial: {
    fast: spring(1400, 0.9),
    default: spring(700, 0.9),
    slow: spring(300, 0.9),
  },
  effects: spring(1600, 1),
} as const;
