import type { CSSProperties } from "react";

export const MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME =
  "tw-pb-[calc(4rem+env(safe-area-inset-bottom,0px))]";

export const MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME =
  "tw-pb-[calc(10rem+env(safe-area-inset-bottom,0px))]";

// Keep these floating offsets coordinated with the expanded 64px dock height:
// 4.75rem positions the card just above the dock, while 10rem scroll clearance
// gives the final rows room to scroll above both the card and the dock.
export const MEMES_WAVE_FLOATING_FOOTER_BOTTOM_STYLE = {
  "--memes-wave-floating-footer-safe-bottom":
    "max(calc(env(safe-area-inset-bottom, 0px) - 0.875rem), 0px)",
  bottom: "calc(4.75rem + var(--memes-wave-floating-footer-safe-bottom))",
} as CSSProperties & {
  readonly "--memes-wave-floating-footer-safe-bottom": string;
};

export const MEMES_WAVE_FLOATING_FOOTER_WIDTH_CLASS_NAME =
  "tw-w-[min(calc(100vw-2.25rem),38rem)]";
