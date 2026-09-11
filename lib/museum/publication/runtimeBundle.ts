import { getMuseumView } from "@/lib/museum/normalize";
import { getMuseumPublicationState } from "./runtime";
import { applyMuseumCollectionSemanticsToLoadState } from "./collectionSemantics";
import type { MuseumView } from "@/lib/museum/types";
import type { MuseumPublicationLoadState } from "./types";

/**
 * The legacy corpus normalizer is retained as a compatibility adapter for
 * records that predate the typed publication. It is only admitted alongside a
 * strict publication when both loaders describe the same manifest. A partial,
 * stale, or differently committed corpus is never joined into the public IA.
 */
function isMuseumViewAtomicToPublication(
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
  const publicationState = applyMuseumCollectionSemanticsToLoadState(
    await getMuseumPublicationState()
  );
  const publication = publicationState.publication;

  // A catalog-activated typed graph is authoritative. Do not also read the
  // legacy moving-main corpus: besides being unnecessary, that fetch would
  // re-open the pre-ontology source boundary during static generation.
  if (publication?.entityGraph !== undefined || publication === null) {
    return { publicationState, view: null };
  }

  const view = await getMuseumView();

  return {
    publicationState,
    view: isMuseumViewAtomicToPublication(publicationState, view) ? view : null,
  };
}
