import NextGenCollectionComponent from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { NEXTGEN_PAGE_FRAME_CLASSNAME } from "@/components/nextGen/collections/NextGenPageFrame";
import { getAppMetadata } from "@/components/providers/metadata";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildNextgenCollectionPageJsonLd } from "@/lib/structured-data/nextgen";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchCollection,
  getCollectionView,
  getNextgenCollectionDocumentTitle,
  getNextgenCollectionSocialCardTitle,
  getNextgenCollectionMetadata,
} from "../page-utils";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ collection: string; view?: string[] | undefined }>;
}): Promise<Metadata> {
  const { collection, view } = await params;
  const headers = await getAppCommonHeaders();
  const resolvedCollection = await fetchCollection(collection, headers);
  if (!resolvedCollection) {
    return getAppMetadata({ title: "NextGen" });
  }
  const resolvedView = getCollectionView(view?.[0] ?? "");
  const title = getNextgenCollectionSocialCardTitle(
    resolvedCollection.name,
    resolvedView
  );
  return getNextgenCollectionMetadata({
    collection: resolvedCollection,
    documentTitle: getNextgenCollectionDocumentTitle(
      resolvedCollection.name,
      resolvedView
    ),
    title,
  });
}

export default async function NextGenCollectionPage({
  params,
}: {
  readonly params: Promise<{ collection: string; view?: string[] | undefined }>;
}) {
  const { collection, view } = await params;
  const headers = await getAppCommonHeaders();
  const resolvedCollection = await fetchCollection(collection, headers);
  if (!resolvedCollection) {
    notFound();
  }
  const resolvedView = getCollectionView(view?.[0] ?? "");
  const path = `/nextgen/collection/${collection}${
    view?.[0] ? `/${view[0]}` : ""
  }`;
  return (
    <main className={NEXTGEN_PAGE_FRAME_CLASSNAME}>
      <JsonLdScript
        data={buildNextgenCollectionPageJsonLd({
          collection: resolvedCollection,
          path,
        })}
      />
      <NextGenCollectionComponent
        collection={resolvedCollection}
        initialView={resolvedView}
      />
    </main>
  );
}
