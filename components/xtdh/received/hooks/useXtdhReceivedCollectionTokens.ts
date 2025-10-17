'use client';

import { useMemo } from "react";

import type {
  XtdhReceivedCollectionSummary,
  XtdhReceivedNft,
} from "@/types/xtdh";

/**
 * Combines collection-level details with each token to align with the NFT card expectations.
 */
export function useXtdhReceivedCollectionTokens(
  collection: XtdhReceivedCollectionSummary,
): readonly XtdhReceivedNft[] {
  const { collectionId, collectionImage, collectionName, tokens } = collection;

  return useMemo(
    () =>
      tokens.map<XtdhReceivedNft>((token) => ({
        ...token,
        collectionId,
        collectionImage,
        collectionName,
      })),
    [collectionId, collectionImage, collectionName, tokens],
  );
}

