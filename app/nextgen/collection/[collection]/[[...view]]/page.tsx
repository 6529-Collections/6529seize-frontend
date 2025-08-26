import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { getAppMetadata } from "@/components/providers/metadata";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCollection, getCollectionView } from "../page-utils";
import NextGenCollectionPageClient from "./NextGenCollectionPageClient";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ collection: string; view?: string[] }>;
}): Promise<Metadata> {
  const { collection, view } = await params;
  const headers = await getAppCommonHeaders();
  const resolvedCollection = await fetchCollection(collection, headers);
  if (!resolvedCollection) {
    return getAppMetadata({ title: "NextGen" });
  }
  const resolvedView = getCollectionView(view?.[0] ?? "");
  let title = resolvedCollection.name;
  if (resolvedView !== ContentView.OVERVIEW) {
    title += ` | ${resolvedView}`;
  }
  return getAppMetadata({
    title,
    ogImage:
      resolvedCollection.banner ||
      resolvedCollection.image ||
      `${process.env.BASE_ENDPOINT}/nextgen.png`,
    description: "NextGen",
    twitterCard: "summary_large_image",
  });
}

export default async function NextGenCollectionPage({
  params,
}: {
  readonly params: Promise<{ collection: string; view?: string[] }>;
}) {
  const { collection, view } = await params;
  const headers = await getAppCommonHeaders();
  const resolvedCollection = await fetchCollection(collection, headers);
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
