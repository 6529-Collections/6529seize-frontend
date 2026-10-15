import type {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "@/entities/INextgen";
import { isEmptyObject } from "@/helpers/Helpers";
import { NextgenCollectionView } from "@/types/enums";
import { getNextgenTokenView } from "@/components/nextGen/collections/nextgenToken/nextgen-token-view.helpers";
import { fetchNextgenOrNull } from "@/app/nextgen/nextgen-api";

interface TokenData {
  tokenId: number;
  token: NextGenToken | null;
  traits: NextGenTrait[];
  tokenCount: number;
  collection: NextGenCollection;
}

const TOKEN_ID_PATTERN = /^\d+$/;
const TOKENS_PER_COLLECTION = 10000000000;

// Resolves `null` only when the token's collection is genuinely missing (404 or
// empty body); any other API failure is rethrown to the route error boundary
// instead of becoming a 404.
export async function fetchTokenData(
  tokenId: string,
  headers: Record<string, string>
): Promise<TokenData | null> {
  // Malformed ids can never match a token (the API rejects them with a 400).
  if (!TOKEN_ID_PATTERN.test(tokenId)) {
    return null;
  }

  const fetchedToken = await fetchNextgenOrNull<NextGenToken>({
    endpoint: `nextgen/tokens/${tokenId}`,
    headers,
  });
  const token = fetchedToken && !fetchedToken.pending ? fetchedToken : null;
  const collectionId = token
    ? token.collection_id
    : Math.round(Number(tokenId) / TOKENS_PER_COLLECTION);

  const traits = token
    ? ((await fetchNextgenOrNull<NextGenTrait[]>({
        endpoint: `nextgen/tokens/${token.id}/traits`,
        headers,
      })) ?? [])
    : [];
  const collection = await fetchNextgenOrNull<NextGenCollection>({
    endpoint: `nextgen/collections/${collectionId}`,
    headers,
  });

  if (!collection || isEmptyObject(collection)) {
    return null;
  }

  return {
    tokenId: Number(tokenId),
    token,
    traits,
    tokenCount: traits[0]?.token_count ?? 0,
    collection,
  };
}

export function getContentView(view: string): NextgenCollectionView {
  return getNextgenTokenView(view);
}
