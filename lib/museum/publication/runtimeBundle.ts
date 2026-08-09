import { getMuseumView } from "@/lib/museum/normalize";
import { getMuseumPublicationState } from "./runtime";
import type { MuseumView } from "@/lib/museum/types";
import type { MuseumPublicationLoadState } from "./types";

/**
 * The legacy corpus normalizer is retained as a compatibility adapter for
 * records that predate the typed publication. It is only admitted alongside a
 * strict publication when both loaders describe the same manifest. A partial,
 * stale, or differently committed corpus is never joined into the public IA.
 */
export function isMuseumViewAtomicToPublication(
  publicationState: MuseumPublicationLoadState,
  view: MuseumView
): boolean {
  const publication = publicationState.publication;
  return (
    publication !== null &&
    publication.identity.manifestSha256 !== null &&
    view.sourceState === "fresh" &&
    view.release !== null &&
    view.release.manifestSha256 === publication.identity.manifestSha256
  );
}

export async function getMuseumPublicationBundle(): Promise<{
  readonly publicationState: MuseumPublicationLoadState;
  readonly view: MuseumView | null;
}> {
  const [publicationState, view] = await Promise.all([
    getMuseumPublicationState(),
    getMuseumView(),
  ]);

  return {
    publicationState,
    view: isMuseumViewAtomicToPublication(publicationState, view)
      ? view
      : null,
  };
}
