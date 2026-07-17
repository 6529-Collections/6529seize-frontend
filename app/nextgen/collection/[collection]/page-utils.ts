import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import type { NextGenCollection } from "@/entities/INextgen";
import { isEmptyObject } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { NextgenCollectionView } from "@/types/enums";
import type { Metadata } from "next";
import { getNextgenTitle } from "../../title-utils";

export async function fetchCollection(
  id: string,
  headers: Record<string, string>
): Promise<NextGenCollection | null> {
  const parsedId = encodeURIComponent(id.replaceAll(/-/g, " "));
  const collection = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/collections/${parsedId}`,
    headers: headers,
  }).catch(() => null);
  return collection === null || isEmptyObject(collection) ? null : collection;
}

export function getCollectionView(view: string): NextgenCollectionView {
  const normalizedView = view.toLowerCase();
  const entry = Object.entries(NextgenCollectionView).find(
    ([key]) => key.toLowerCase() === normalizedView
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
  subtitle,
  title,
}: {
  readonly collection: NextGenCollection;
  readonly documentTitle?: string | undefined;
  readonly subtitle?: string | undefined;
  readonly title: string;
}): Metadata {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: documentTitle ?? title,
      description: "NextGen",
      ogImage: getCollectionSocialCardImagePath("nextgen", {
        image: collection.banner || collection.image,
        subtitle: subtitle ?? `${collection.name} | NextGen`,
        title,
      }),
      ogImageAlt: `${title} social card`,
    })
  );
}

export async function generateNextgenCollectionMetadata({
  collection,
  headers,
  page,
}: {
  readonly collection: string;
  readonly headers: Record<string, string>;
  readonly page: string;
}): Promise<Metadata> {
  const resolvedCollection = await fetchCollection(collection, headers);
  if (!resolvedCollection) {
    return getAppMetadata({ title: getNextgenTitle(page, "NextGen") });
  }
  const title = getNextgenTitle(page, resolvedCollection.name);
  return getNextgenCollectionMetadata({
    collection: resolvedCollection,
    documentTitle: title,
    subtitle: `${resolvedCollection.name} | NextGen`,
    title,
  });
}
