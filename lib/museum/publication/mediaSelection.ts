import type { MuseumMedia, MuseumWorkPublicStatus } from "./types";

const KEYS_AND_GATES_SLUG = "keys-and-gates";
const ACCESSIONED_STATUS = "accessioned_into_permanent_collection";

/** Selects an explicitly typed still for image presentation; live media is never decoded as an image. */
export function selectMuseumStillMedia(
  media: readonly MuseumMedia[]
): MuseumMedia | undefined {
  return media.find((item) => item.kind === "still");
}

export function shouldWithholdKeysAndGatesMedia(
  status: MuseumWorkPublicStatus,
  programSlugs: readonly string[]
): boolean {
  return (
    status !== ACCESSIONED_STATUS && programSlugs.includes(KEYS_AND_GATES_SLUG)
  );
}
