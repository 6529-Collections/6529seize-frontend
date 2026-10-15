"use client";

import { useEffect } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface ScrollToHashOptions {
  /** Skip the scroll while false, for example while the section is gated. */
  readonly enabled?: boolean | undefined;
  /**
   * Element that receives keyboard and screen-reader focus after the scroll,
   * usually the section heading with `tabIndex={-1}`. Defaults to the target.
   */
  readonly focusId?: string | undefined;
}

function readHashId(): string | null {
  const raw = globalThis.location.hash.slice(1);
  if (raw === "") {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

/**
 * Scrolls to, and focuses, the element named by the URL hash once that
 * element exists.
 *
 * The browser's own hash scroll and Next.js's route scroll both run before
 * content that mounts late (after hydration, auth, or a native-shell check) is
 * in the DOM, so they silently find nothing. Mounting the component that owns
 * the target runs this effect after it is in the DOM. It runs once per mount,
 * and again whenever the hash changes while mounted (an in-page link, or
 * back/forward between hash entries). Loads without a matching hash neither
 * scroll nor move focus.
 *
 * Call it unconditionally and pass `enabled: false` where the target must not
 * be revealed, so a gated surface never scrolls toward content it hides.
 * Reserve space for fixed headers with `scroll-margin-top` on the target.
 */
export function useScrollToHashOnMount(
  targetId: string,
  { enabled = true, focusId }: ScrollToHashOptions = {}
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frame: number | undefined;

    const cancelPendingFrame = () => {
      if (frame !== undefined) {
        globalThis.cancelAnimationFrame(frame);
        frame = undefined;
      }
    };

    const reveal = () => {
      if (readHashId() !== targetId) {
        return;
      }
      cancelPendingFrame();
      // Wait one frame so Next.js's own post-navigation scroll runs first.
      frame = globalThis.requestAnimationFrame(() => {
        frame = undefined;
        const target = globalThis.document.getElementById(targetId);
        if (!target) {
          return;
        }
        target.scrollIntoView({
          block: "start",
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
        const focusTarget =
          (focusId ? globalThis.document.getElementById(focusId) : null) ??
          target;
        focusTarget.focus({ preventScroll: true });
      });
    };

    reveal();
    globalThis.addEventListener("hashchange", reveal);
    return () => {
      globalThis.removeEventListener("hashchange", reveal);
      cancelPendingFrame();
    };
  }, [targetId, enabled, focusId]);
}
