import CollectionPageShell from "../CollectionPageShell";
import NextGenCollectionMint from "@/components/nextGen/collections/collectionParts/mint/NextGenCollectionMint";
import { fetchCollection } from "../page-utils";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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

export default async function Page({
  params,
}: {
  params: { collection: string };
}) {
  const collection = await fetchCollection(params.collection);
  if (!collection) {
    notFound();
  }
  return (
    <CollectionPageShell collection={collection} withNav={false}>
      <NextGenCollectionMint collection={collection} />
    </CollectionPageShell>
  );
}
