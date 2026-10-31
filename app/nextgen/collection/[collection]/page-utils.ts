import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import type { NextGenCollection } from "@/entities/INextgen";
import { formatNameForUrl } from "@/helpers/nextgen-utils";
import { isEmptyObject } from "@/helpers/Helpers";
import { NextgenCollectionView } from "@/types/enums";
import type { Metadata } from "next";
import { cache } from "react";
import { fetchNextgenOrNull } from "@/app/nextgen/nextgen-api";
import { getNextgenTitle } from "../../title-utils";

const COLLECTION_VIEW_PATH_SEGMENT_INDEX = 3;

// Request-scoped memoization (React `cache`): `generateMetadata` and the page
// share one fetch per request, as long as they pass the same headers object
// (see `getNextgenRequestHeaders`). Resolves `null` only for a real 404 or an
// empty body; any other API failure is rethrown to the route error boundary.
export const fetchCollection = cache(
  async (
    id: string,
    headers: Record<string, string>
  ): Promise<NextGenCollection | null> => {
    const parsedId = encodeURIComponent(id.replaceAll(/-/g, " "));
    const collection = await fetchNextgenOrNull<NextGenCollection>({
      endpoint: `nextgen/collections/${parsedId}`,
      headers,
    });
    return collection === null || isEmptyObject(collection) ? null : collection;
  }
);

export function getCollectionView(view: string): NextgenCollectionView {
  const normalizedView = view.toLowerCase();
  const entry = Object.entries(NextgenCollectionView).find(
    ([key, value]) =>
      value !== NextgenCollectionView.LISTINGS_AND_OFFERS &&
      key.toLowerCase() === normalizedView
  );

  if (entry) {
    return NextgenCollectionView[
      entry[0] as keyof typeof NextgenCollectionView
    ];
  }
  if (view === "top-trait-sets") {
    return NextgenCollectionView.TOP_TRAIT_SETS;
  }
  return NextgenCollectionView.OVERVIEW;
}

export function getCollectionViewFromPathname(
  pathname: string
): NextgenCollectionView {
  const pathSegments = pathname.split("/").filter(Boolean);
  const viewSegment = pathSegments[COLLECTION_VIEW_PATH_SEGMENT_INDEX] ?? "";
  return getCollectionView(viewSegment);
}

export function getContentViewKeyByValue(value: string): string {
  for (const [key, val] of Object.entries(NextgenCollectionView)) {
    if (val === value) {
      return key;
    }
  }
  if (value === "trait-sets") {
    return NextgenCollectionView.TOP_TRAIT_SETS;
  }
  return NextgenCollectionView.OVERVIEW;
}

export function getNextgenCollectionDocumentTitle(
  collectionName: string,
  view: NextgenCollectionView
): string {
  return view === NextgenCollectionView.OVERVIEW
    ? getNextgenTitle(collectionName, "NextGen")
    : getNextgenTitle(String(view), collectionName);
}

export function getNextgenCollectionSocialCardTitle(
  collectionName: string,
  view: NextgenCollectionView
): string {
  return view === NextgenCollectionView.OVERVIEW
    ? getNextgenTitle(collectionName)
    : getNextgenTitle(String(view), collectionName);
}

export function getNextgenCollectionMetadata({
  collection,
  documentTitle,
  canonicalPath,
  title,
  view,
}: {
  readonly collection: NextGenCollection;
  readonly canonicalPath: string;
  readonly documentTitle?: string | undefined;
  readonly title: string;
  readonly view?: string | undefined;
}): Metadata {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: documentTitle ?? title,
      description: "NextGen",
      ogImage: getCollectionSocialCardImagePath("nextgen", {
        collectionId: collection.id,
        view,
      }),
      ogImageAlt: `${title} social card`,
    }),
    { canonicalPath }
  );
}

export async function generateNextgenCollectionMetadata({
  collection,
  headers,
  page,
  routeSegment,
  canonicalQuery,
}: {
  readonly collection: string;
  readonly headers: Record<string, string>;
  readonly page: string;
  readonly routeSegment: "art" | "mint" | "trait-sets" | "distribution-plan";
  readonly canonicalQuery?: string;
}): Promise<Metadata> {
  const resolvedCollection = await fetchCollection(collection, headers);
  if (!resolvedCollection) {
    return getAppMetadata({ title: getNextgenTitle(page, "NextGen") });
  }
  const title = getNextgenTitle(page, resolvedCollection.name);
  return getNextgenCollectionMetadata({
    collection: resolvedCollection,
    canonicalPath: getNextgenCollectionCanonicalPath(
      resolvedCollection.name,
      routeSegment,
      canonicalQuery
    ),
    documentTitle: title,
    title,
    view: page,
  });
}

export function getNextgenCollectionCanonicalPath(
  collectionName: string,
  view = "",
  query = ""
): string {
  const path = `/nextgen/collection/${encodeURIComponent(formatNameForUrl(collectionName))}`;
  const viewPath = view ? `${path}/${encodeURIComponent(view)}` : path;
  return query ? `${viewPath}?${query}` : viewPath;
}
