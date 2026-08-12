import type { MuseumMedia } from "./types";

/** Selects an explicitly typed still for image presentation; live media is never decoded as an image. */
export function selectMuseumStillMedia(
  media: readonly MuseumMedia[]
): MuseumMedia | undefined {
  return media.find((item) => item.kind === "still");
}
