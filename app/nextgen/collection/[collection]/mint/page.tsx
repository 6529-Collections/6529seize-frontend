import NextGenCollectionMint from "@/components/nextGen/collections/collectionParts/mint/NextGenCollectionMint";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionPageShell from "../CollectionPageShell";
import { fetchCollection } from "../page-utils";

export async function generateMetadata({
  params,
}: {
  params: { collection: string };
}): Promise<Metadata> {
  const collection = await fetchCollection(params.collection);
  if (!collection) {
    return getAppMetadata({ title: "Mint" });
  }
  return getAppMetadata({
    title: `Mint | ${collection.name}`,
    ogImage: collection.image,
    description: "NextGen",
    twitterCard: "summary_large_image",
  });
}

export default async function NextGenMintPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const resolvedCollection = await fetchCollection(collection);
  if (!resolvedCollection) {
    notFound();
  }
  return (
    <CollectionPageShell collection={resolvedCollection} withNav={false}>
      <NextGenCollectionMint collection={resolvedCollection} />
    </CollectionPageShell>
  );
}
