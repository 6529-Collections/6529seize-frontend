import {
  getArtCanonicalQuery,
  type ArtSearchParams,
} from "@/components/nextGen/collections/collectionParts/art/artCanonical";
import NextGenCollectionArtPage from "@/components/nextGen/collections/collectionParts/art/NextGenCollectionArtPage";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionPageShell from "../CollectionPageShell";
import {
  fetchCollection,
  generateNextgenCollectionMetadata,
} from "../page-utils";

export async function generateMetadata({
  params,
  searchParams,
}: {
  readonly params: Promise<{ collection: string }>;
  readonly searchParams?: Promise<ArtSearchParams>;
}): Promise<Metadata> {
  const { collection } = await params;
  const headers = await getAppCommonHeaders();
  return generateNextgenCollectionMetadata({
    collection,
    routeSegment: "art",
    page: "Art",
    canonicalQuery: getArtCanonicalQuery((await searchParams) ?? {}),
    headers,
  });
}

export default async function NextGenArtPage({
  params,
}: {
  readonly params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const headers = await getAppCommonHeaders();
  const resolvedCollection = await fetchCollection(collection, headers);
  if (!resolvedCollection) {
    notFound();
  }
  return (
    <CollectionPageShell collection={resolvedCollection} withNav={false}>
      <NextGenCollectionArtPage collection={resolvedCollection} />
    </CollectionPageShell>
  );
}
