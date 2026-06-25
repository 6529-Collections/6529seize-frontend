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

export const MEMES_WAVE_FLOATING_FOOTER_DOCK_GAP_PX = 4;
export const MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM =
  "calc(4.25rem + var(--memes-wave-floating-footer-safe-bottom))";

// Fallback used until the mobile dock has been measured. Runtime positioning
// follows the actual dock top edge so expanded/compact transitions stay in sync.
export const MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM_STYLE = {
  ...MEMES_WAVE_FLOATING_FOOTER_SAFE_BOTTOM_STYLE,
  bottom: MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM,
} as MemesWaveFloatingFooterBottomStyle;

export const MEMES_WAVE_FLOATING_FOOTER_WIDTH_CLASS_NAME =
  "tw-w-[min(calc(100vw-2.25rem),38rem)]";
