import { notFound, permanentRedirect } from "next/navigation";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import { museumSlugMatches } from "@/lib/museum/presentation";
import {
  museumAcquisitionProgramHref,
  museumApprovedCollectionSlug,
} from "@/lib/museum/publication/routes";

export default async function MuseumLegacyApprovedCollectionPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (publication === null) notFound();
  const routeAliases =
    publication.routeAliases ??
    publication.entityGraph?.identityInventory.routeAliases ??
    [];
  const typedAlias = routeAliases.find((alias) => {
    const prefix = "/museum/network/collections/";
    if (!alias.legacyRoute.startsWith(prefix)) return false;
    const encodedSlug = alias.legacyRoute.slice(prefix.length);
    try {
      return (
        decodeURIComponent(encodedSlug) === slug &&
        alias.canonicalRoute.startsWith(
          `${museumAcquisitionProgramHref("gift-acquisitions")}#`
        )
      );
    } catch {
      return false;
    }
  });
  if (typedAlias !== undefined)
    return permanentRedirect(typedAlias.canonicalRoute);
  if (publication.entityGraph !== undefined || view === null) notFound();
  const collection = view.approvedCollections.find(
    (candidate) =>
      museumSlugMatches(candidate.approvalId, slug) ||
      museumApprovedCollectionSlug(candidate.preferredName) === slug
  );
  if (collection === undefined) notFound();
  permanentRedirect(
    `/museum/network/acquisition-programs/gift-acquisitions#${museumApprovedCollectionSlug(
      collection.preferredName
    )}`
  );
}
