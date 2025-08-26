import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCollection, getCollectionView } from "../page-utils";
import NextGenCollectionPageClient from "./NextGenCollectionPageClient";

export async function generateMetadata({
  params,
}: {
  params: { collection: string; view?: string[] };
}): Promise<Metadata> {
  const collection = await fetchCollection(params.collection);
  if (!collection) {
    return getAppMetadata({ title: "NextGen" });
  }
  const view = getCollectionView(params.view?.[0] ?? "");
  let title = collection.name;
  if (view !== ContentView.OVERVIEW) {
    title += ` | ${view}`;
  }
  return getAppMetadata({
    title,
    ogImage:
      collection.banner ||
      collection.image ||
      `${process.env.BASE_ENDPOINT}/nextgen.png`,
    description: "NextGen",
    twitterCard: "summary_large_image",
  });
}

export default async function NextGenCollectionPage({
  params,
}: {
  params: Promise<{ collection: string; view?: string[] }>;
}) {
  const { collection, view } = await params;
  const resolvedCollection = await fetchCollection(collection);
  if (!resolvedCollection) {
    notFound();
  }
  const resolvedView = getCollectionView(view?.[0] ?? "");
  return (
    <NextGenCollectionPageClient
      collection={resolvedCollection}
      view={resolvedView}
    />
  );
}
