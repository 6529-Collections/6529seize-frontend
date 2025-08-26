import NextGenCollectionPageClient from "./NextGenCollectionPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { fetchCollection, getCollectionView } from "../page-utils";
import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { notFound } from "next/navigation";

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

export default async function Page({
  params,
}: {
  params: { collection: string; view?: string[] };
}) {
  const collection = await fetchCollection(params.collection);
  if (!collection) {
    notFound();
  }
  const view = getCollectionView(params.view?.[0] ?? "");
  return <NextGenCollectionPageClient collection={collection} view={view} />;
}
