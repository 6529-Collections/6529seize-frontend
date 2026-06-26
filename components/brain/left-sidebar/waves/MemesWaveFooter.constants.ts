import type { CSSProperties } from "react";

export const MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME =
  "tw-pb-[calc(4rem+env(safe-area-inset-bottom,0px))]";

// Keep this clearance with the floating card width and the measured dock
// fallback: it covers the 64px expanded dock plus the quick-vote card height.
export const MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME =
  "tw-pb-[calc(10rem+env(safe-area-inset-bottom,0px))]";

const MEMES_WAVE_FLOATING_FOOTER_SAFE_BOTTOM_STYLE = {
  "--memes-wave-floating-footer-safe-bottom":
    "max(calc(env(safe-area-inset-bottom, 0px) - 0.875rem), 0px)",
} as const;

export const MEMES_WAVE_FLOATING_FOOTER_DOCK_GAP_PX = 4;
export const MEMES_WAVE_FLOATING_FOOTER_SCALE_PROPERTY =
  "--memes-wave-floating-footer-scale";
const MEMES_WAVE_FLOATING_FOOTER_FALLBACK_SCALE = "1";
export const MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM =
  "calc(4.25rem + var(--memes-wave-floating-footer-safe-bottom))";

type MemesWaveFloatingFooterStyle = CSSProperties & {
  readonly "--memes-wave-floating-footer-safe-bottom": string;
  readonly [MEMES_WAVE_FLOATING_FOOTER_SCALE_PROPERTY]: string;
};

// Fallback used until the mobile dock has been measured. Runtime positioning
// follows the actual dock top edge so expanded/compact transitions stay in sync.
export const MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM_STYLE = {
  ...MEMES_WAVE_FLOATING_FOOTER_SAFE_BOTTOM_STYLE,
  [MEMES_WAVE_FLOATING_FOOTER_SCALE_PROPERTY]:
    MEMES_WAVE_FLOATING_FOOTER_FALLBACK_SCALE,
  bottom: MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM,
} as MemesWaveFloatingFooterStyle;

// Match the expanded mobile dock width so the overlay reads as part of the same
// bottom stack on narrow screens.
export const MEMES_WAVE_FLOATING_FOOTER_WIDTH_CLASS_NAME =
  "tw-w-[min(calc(100vw-2.25rem),38rem)]";
