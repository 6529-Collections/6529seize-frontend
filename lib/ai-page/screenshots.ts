import type { AiUseImageKey } from "./content/useImages";

/**
 * The app's screenshots on the first pages, from the walk-through's
 * pictures (lib/ai-page/content/useImages.ts): each shows the part of the
 * capture its place is about, at its real size or the column's width, and
 * a click shows the whole. `phone`, where there is one, is the app's own
 * phone-width capture, which reads better on a phone than a crop of the
 * desktop one.
 */
export type AiScreenshotSlot = {
  readonly image: AiUseImageKey;
  readonly phone?: AiUseImageKey | undefined;
};

export const AI_SCREENSHOTS = {
  /** Start's model list: the download page's first screen. */
  models: { image: "31-start", phone: "98c-phone-start-models" },
  /** The app's question on a Mac: alone, or beside a validator. */
  placement: { image: "14-mac-first-run" },
  /**
   * A chat reply, the first chat at the end of the guide: the same chat at
   * both widths, since the walk-through has it at phone width too.
   */
  firstChat: { image: "43-vision-answer" },
} as const satisfies Record<string, AiScreenshotSlot>;
