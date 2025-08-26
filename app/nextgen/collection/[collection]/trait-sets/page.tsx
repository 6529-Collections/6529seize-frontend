import NextGenTraitSets from "@/components/nextGen/collections/collectionParts/NextGenTraitSets";
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
    return getAppMetadata({ title: "Trait Sets" });
  }
  return getAppMetadata({
    title: `Trait Sets | ${collection.name}`,
    ogImage: collection.image,
    description: "NextGen",
    twitterCard: "summary_large_image",
  });
}

export default async function NextGenTraitSetsPage({
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
    <CollectionPageShell collection={resolvedCollection}>
      <NextGenTraitSets collection={resolvedCollection} />
    </CollectionPageShell>
  );
}
