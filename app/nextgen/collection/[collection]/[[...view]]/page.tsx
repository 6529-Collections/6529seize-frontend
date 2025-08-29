import NextGenCollectionComponent from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { getAppMetadata } from "@/components/providers/metadata";
import { NextgenCollectionView } from "@/enums";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCollection, getCollectionView } from "../page-utils";

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
  if (resolvedView !== NextgenCollectionView.OVERVIEW) {
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
    <main className={styles.main}>
      <NextGenCollectionComponent
        collection={resolvedCollection}
        initialView={resolvedView}
      />
    </main>
  );
}
