import NextgenCollectionMintingPlan from "@/components/nextGen/collections/collectionParts/mint/NextgenCollectionMintingPlan";
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
    page: "Distribution Plan",
    headers,
  });
}

export default async function NextGenDistributionPlanPage({
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
      <NextgenCollectionMintingPlan collection={resolvedCollection} />
    </CollectionPageShell>
  );
}
