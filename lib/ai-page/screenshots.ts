import { AI_USE_IMAGES } from "./content/useImages";

/**
 * Screenshots of the 6529 AI app on the /ai pages. Each file is the app in
 * its dark theme with no browser frame, captured at twice the size it
 * shows at; `width` and `height` are the file's own pixels. A slot with no
 * file renders nothing: the pages never show a stand-in for the app.
 * They are pictures from the walk-through on /ai/use.
 */
export type AiScreenshotSlot = {
  /** The file under /public, or null while there is none. */
  readonly src: string | null;
  readonly width: number;
  readonly height: number;
};

function fromUse(key: keyof typeof AI_USE_IMAGES): AiScreenshotSlot {
  const { src, width, height } = AI_USE_IMAGES[key];
  return { src, width, height };
}

export const AI_SCREENSHOTS = {
  /** Start's model list: the download page's first screen. */
  models: fromUse("31-start-dark"),
  /** The app's question on a Mac: alone, or beside a validator. */
  placement: fromUse("14-mac-first-run"),
  /** A chat reply: the first chat, at the end of the guide. */
  firstChat: fromUse("40-chat-dark"),
} as const satisfies Record<string, AiScreenshotSlot>;
