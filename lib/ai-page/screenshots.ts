/**
 * Screenshots of the 6529 AI app on the /ai pages, from release candidate
 * 1. A slot with no file yet shows a neutral placeholder of the same size;
 * the pages never show a made-up picture of the app.
 */
export type AiScreenshotSlot = {
  /** The file under /public, or null while there is none. */
  readonly src: string | null;
  readonly width: number;
  readonly height: number;
};

export const AI_SCREENSHOTS = {
  /** The chat page with a model answering: the download page. */
  chat: { src: null, width: 1440, height: 900 },
  /** The app's question on a Mac: alone, or beside a validator. */
  placement: { src: null, width: 1040, height: 640 },
  /** The first chat, at the end of the guide. */
  firstChat: { src: null, width: 1440, height: 900 },
} as const satisfies Record<string, AiScreenshotSlot>;
