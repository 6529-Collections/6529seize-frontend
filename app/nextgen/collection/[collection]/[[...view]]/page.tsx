import {
  getArtCanonicalQuery,
  type ArtSearchParams,
} from "@/components/nextGen/collections/collectionParts/art/artCanonical";
import NextGenCollectionComponent from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { NEXTGEN_PAGE_FRAME_CLASSNAME } from "@/components/nextGen/collections/NextGenPageFrame";
import { getAppMetadata } from "@/components/providers/metadata";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildNextgenCollectionPageJsonLd } from "@/lib/structured-data/nextgen";
import { NextgenCollectionView } from "@/types/enums";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchCollection,
  getCollectionView,
  getNextgenCollectionCanonicalPath,
  getNextgenCollectionDocumentTitle,
  getNextgenCollectionSocialCardTitle,
  getNextgenCollectionMetadata,
} from "../page-utils";

export async function generateMetadata({
  params,
  searchParams,
}: {
  readonly params: Promise<{ collection: string; view?: string[] | undefined }>;
  readonly searchParams?: Promise<ArtSearchParams>;
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
  const canonicalQuery = getArtCanonicalQuery((await searchParams) ?? {});
  let canonicalView = view?.[0]?.toLowerCase();
  if (resolvedView === NextgenCollectionView.OVERVIEW) {
    canonicalView = undefined;
  } else if (resolvedView === NextgenCollectionView.TOP_TRAIT_SETS) {
    canonicalView = "top-trait-sets";
  }
  return getNextgenCollectionMetadata({
    collection: resolvedCollection,
    // Keep this route's view identity (including the top-trait-sets shell),
    // rather than folding distinct collection tabs into the overview.
    canonicalPath: getNextgenCollectionCanonicalPath(
      resolvedCollection.name,
      canonicalView,
      canonicalQuery
    ),
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
