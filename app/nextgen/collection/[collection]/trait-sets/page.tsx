import NextGenTraitSets from "@/components/nextGen/collections/collectionParts/NextGenTraitSets";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionPageShell from "../CollectionPageShell";
import {
  fetchCollection,
  generateNextgenCollectionMetadata,
} from "../page-utils";
import { getNextgenRequestHeaders } from "@/app/nextgen/request-headers";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const headers = await getNextgenRequestHeaders();
  return generateNextgenCollectionMetadata({
    collection,
    routeSegment: "trait-sets",
    headers,
    page: "Trait Sets",
  });
}

export default async function NextGenTraitSetsPage({
  params,
}: {
  readonly params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const headers = await getNextgenRequestHeaders();
  const resolvedCollection = await fetchCollection(collection, headers);
  if (!resolvedCollection) {
    notFound();
  }
  return (
    <CollectionPageShell collection={resolvedCollection}>
      <NextGenTraitSets collection={resolvedCollection} />
    </CollectionPageShell>
  );
}
