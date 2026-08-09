import { notFound, permanentRedirect } from "next/navigation";
import { getMuseumView } from "@/lib/museum/normalize";
import { museumSlugMatches } from "@/lib/museum/presentation";
import { museumApprovedCollectionSlug } from "@/lib/museum/publication/routes";

export default async function MuseumLegacyApprovedCollectionPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await getMuseumView();
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
