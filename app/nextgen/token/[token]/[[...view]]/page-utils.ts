import {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "@/entities/INextgen";
import { NextgenCollectionView } from "@/enums";
import { isEmptyObject } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";

export interface TokenData {
  tokenId: number;
  token: NextGenToken | null;
  traits: NextGenTrait[];
  tokenCount: number;
  collection: NextGenCollection;
}

export async function fetchTokenData(
  tokenId: string,
  headers: Record<string, string>
): Promise<TokenData | null> {
  let token: NextGenToken | null;
  try {
    token = await commonApiFetch<NextGenToken>({
      endpoint: `nextgen/tokens/${tokenId}`,
      headers: headers,
    });
  } catch {
    token = null;
  }

  let traits: NextGenTrait[] = [];
  let tokenCount = 0;
  let collectionId: number;

  if (token && !token.pending) {
    traits = await commonApiFetch<NextGenTrait[]>({
      endpoint: `nextgen/tokens/${token.id}/traits`,
      headers: headers,
    }).catch(() => []);
    tokenCount = traits[0]?.token_count ?? 0;
    collectionId = token.collection_id;
  } else {
    token = null;
    collectionId = Math.round(Number(tokenId) / 10000000000);
  }

  const collection = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/collections/${collectionId}`,
    headers: headers,
  }).catch(() => null);

  if (!collection || isEmptyObject(collection)) {
    return null;
  }

  return { tokenId: Number(tokenId), token, traits, tokenCount, collection };
}

export function getContentView(view: string): NextgenCollectionView {
  view = view?.toLowerCase().replaceAll("-", " ") ?? "";
  const allowedViews = [
    NextgenCollectionView.DISPLAY_CENTER,
    NextgenCollectionView.PROVENANCE,
    NextgenCollectionView.RARITY,
  ];
  const matchedView = allowedViews.find((v) => v.toLowerCase() === view);
  return matchedView ?? NextgenCollectionView.ABOUT;
}
