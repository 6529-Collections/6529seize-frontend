import NextgenCollectionMintingPlan from "@/components/nextGen/collections/collectionParts/mint/NextgenCollectionMintingPlan";
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
    routeSegment: "distribution-plan",
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
  const headers = await getNextgenRequestHeaders();
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
