import type { CSSProperties } from "react";

export const MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME =
  "tw-pb-[calc(4rem+env(safe-area-inset-bottom,0px))]";

export const MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME =
  "tw-pb-[calc(10rem+env(safe-area-inset-bottom,0px))]";

const MEMES_WAVE_FLOATING_FOOTER_SAFE_BOTTOM_STYLE = {
  "--memes-wave-floating-footer-safe-bottom":
    "max(calc(env(safe-area-inset-bottom, 0px) - 0.875rem), 0px)",
} as const;

type MemesWaveFloatingFooterBottomStyle = CSSProperties & {
  readonly "--memes-wave-floating-footer-safe-bottom": string;
};

// Keep these floating offsets coordinated with the dock heights: 64px expanded
// and 54px compact. Both leave a small visual gap above the dock.
export const MEMES_WAVE_FLOATING_FOOTER_EXPANDED_BOTTOM_STYLE = {
  ...MEMES_WAVE_FLOATING_FOOTER_SAFE_BOTTOM_STYLE,
  bottom: "calc(4.5rem + var(--memes-wave-floating-footer-safe-bottom))",
} as MemesWaveFloatingFooterBottomStyle;

export const MEMES_WAVE_FLOATING_FOOTER_COMPACT_BOTTOM_STYLE = {
  ...MEMES_WAVE_FLOATING_FOOTER_SAFE_BOTTOM_STYLE,
  bottom: "calc(3.875rem + var(--memes-wave-floating-footer-safe-bottom))",
} as MemesWaveFloatingFooterBottomStyle;

export const MEMES_WAVE_FLOATING_FOOTER_WIDTH_CLASS_NAME =
  "tw-w-[min(calc(100vw-2.25rem),38rem)]";
