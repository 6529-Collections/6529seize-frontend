import CollectionPageShell from "../CollectionPageShell";
import NextGenCollectionArtPage from "@/components/nextGen/collections/collectionParts/art/NextGenCollectionArtPage";
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
    return getAppMetadata({ title: "Art" });
  }
  return getAppMetadata({
    title: `Art | ${collection.name}`,
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
      <NextGenCollectionArtPage collection={collection} />
    </CollectionPageShell>
  );
}
