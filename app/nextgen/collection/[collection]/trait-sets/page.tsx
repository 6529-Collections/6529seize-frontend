import NextGenTraitSets from "@/components/nextGen/collections/collectionParts/NextGenTraitSets";
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
}: {
  readonly params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const headers = await getAppCommonHeaders();
  return generateNextgenCollectionMetadata({
    collection,
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
  const headers = await getAppCommonHeaders();
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
