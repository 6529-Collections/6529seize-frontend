import type { MuseumMedia } from "./types";

const KEYS_AND_GATES_SLUG = "keys-and-gates";
const SELECTED_ACQUISITION_PENDING_STATUS =
  "selected_through_acquisition_program_acquisition_pending";

/** Selects an explicitly typed still for image presentation; live media is never decoded as an image. */
export function selectMuseumStillMedia(
  media: readonly MuseumMedia[]
): MuseumMedia | undefined {
  return media.find((item) => item.kind === "still");
}

export function shouldWithholdKeysAndGatesMedia(
  status: string,
  programSlugs: readonly string[]
): boolean {
  return (
    status === SELECTED_ACQUISITION_PENDING_STATUS &&
    programSlugs.includes(KEYS_AND_GATES_SLUG)
  );
}
