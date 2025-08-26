import NextGenCollectionArtPage from "@/components/nextGen/collections/collectionParts/art/NextGenCollectionArtPage";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionPageShell from "../CollectionPageShell";
import { fetchCollection } from "../page-utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const resolvedCollection = await fetchCollection(collection);
  if (!resolvedCollection) {
    return getAppMetadata({ title: "Art" });
  }
  return getAppMetadata({
    title: `Art | ${resolvedCollection.name}`,
    ogImage: resolvedCollection.image,
    description: "NextGen",
    twitterCard: "summary_large_image",
  });
}

export default async function NextGenArtPage({
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
      <NextGenCollectionArtPage collection={resolvedCollection} />
    </CollectionPageShell>
  );
}
