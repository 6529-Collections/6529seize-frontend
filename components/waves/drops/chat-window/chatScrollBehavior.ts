/** What the windowed chat list exposes to the chat around it. */
export interface ChatListHandle {
  /** Scrolls to the newest message. */
  readonly scrollToEnd: (behavior: ScrollBehavior) => void;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Smooth chat scrolls jump instead when the reader prefers reduced motion. */
export const resolveChatScrollBehavior = (
  behavior: ScrollBehavior
): ScrollBehavior => {
  if (behavior !== "smooth") {
    return behavior;
  }
  const prefersReducedMotion =
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia(REDUCED_MOTION_QUERY).matches;
  return prefersReducedMotion ? "auto" : behavior;
};
