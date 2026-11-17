/**
 * Screenshots of the 6529 AI app on the /ai pages. Each file is the app in
 * its dark theme with no browser frame, captured at twice the size it
 * shows at; `width` and `height` are the file's own pixels. A slot with no
 * file yet renders nothing: the pages never show a stand-in for the app.
 */
export type AiScreenshotSlot = {
  /** The file under /public, or null while there is none. */
  readonly src: string | null;
  readonly width: number;
  readonly height: number;
};

export const AI_SCREENSHOTS = {
  /** The model list: the download page's first screen. */
  models: { src: null, width: 2880, height: 1800 },
  /** The app's question on a Mac: alone, or beside a validator. */
  placement: { src: null, width: 1040, height: 640 },
  /** A chat reply: the first chat, at the end of the guide. */
  firstChat: { src: null, width: 2880, height: 1800 },
} as const satisfies Record<string, AiScreenshotSlot>;
