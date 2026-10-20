/** True when the user asked the OS/browser to reduce motion. */
function prefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    // matchMedia is missing in some embedded and test environments.
    return false;
  }
}

/** Scroll behavior that respects reduced-motion preferences. */
export function getScrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}
