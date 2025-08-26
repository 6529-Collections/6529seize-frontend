import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { NextGenCollection } from "@/entities/INextgen";
import { isEmptyObject } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";

export async function fetchCollection(
  id: string,
  headers: Record<string, string>
): Promise<NextGenCollection | null> {
  const parsedId = encodeURIComponent(id.replaceAll(/-/g, " "));
  const collection = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/collections/${parsedId}`,
    headers: headers,
  }).catch(() => null);
  return isEmptyObject(collection) ? null : collection;
}

export function getCollectionView(view: string): ContentView {
  const normalizedView = view.toLowerCase();
  const entry = Object.entries(ContentView).find(
    ([key]) => key.toLowerCase() === normalizedView
  );

  if (entry) {
    return ContentView[entry[0] as keyof typeof ContentView];
  }
  if (view === "top-trait-sets") {
    return ContentView.TOP_TRAIT_SETS;
  }
  return ContentView.OVERVIEW;
}

export function getContentViewKeyByValue(value: string): string {
  for (const [key, val] of Object.entries(ContentView)) {
    if (val === value) {
      return key;
    }
  }
  if (value === "trait-sets") {
    return ContentView.TOP_TRAIT_SETS;
  }
  return ContentView.OVERVIEW;
}
