import { z } from "zod";
import type { WalletGalleryBuilderState } from "./gallery";

// Source packets are extensible JSON. Validate our embedded editor state before
// using its arrays and nested snapshot in the visual gallery controls.
const strings = z.array(z.string());
const asset = z.object({
  id: z.string(),
  title: z.string(),
  collectionId: z.string(),
  collectionName: z.string(),
  contract: z.string(),
  tokenId: z.string(),
  chainId: z.number(),
  owner: z.string(),
  imageUri: z.string().optional(),
  mimeType: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  metadataUri: z.string().optional(),
  altText: z.string(),
  mediaState: z.enum(["ready", "partial", "missing"]),
  flags: z.object({
    spam: z.boolean(),
    excluded: z.boolean(),
    reason: z.string().optional(),
  }),
});
const state = z.object({
  walletInput: z.string(),
  hiddenAssetIds: strings,
  featuredAssetIds: strings,
  featuredCollectionIds: strings,
  orderedAssetIds: strings,
  snapshot: z.object({
    snapshotId: z.string(),
    source: z.enum(["backend", "fixture"]),
    capturedAt: z.string(),
    wallets: z.array(
      z.object({
        kind: z.enum(["address", "ens"]),
        input: z.string(),
        normalized: z.string(),
      })
    ),
    blockNumber: z.number().optional(),
    assets: z.array(asset),
    collections: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        contract: z.string(),
        chainId: z.number(),
        assetIds: strings,
      })
    ),
    excludedAssets: z.array(
      z.object({
        contract: z.string(),
        tokenId: z.string(),
        owner: z.string(),
        reason: z.string(),
      })
    ),
    totals: z
      .object({
        requestedWallets: z.number(),
        resolvedWallets: z.number(),
        unresolvedWallets: z.number(),
        indexedAssets: z.number(),
        visibleAssets: z.number(),
        excludedAssets: z.number(),
        spamAssets: z.number(),
        truncated: z.boolean(),
      })
      .optional(),
    warnings: strings,
  }),
});

export function parseWalletGalleryEditorState(
  value: unknown
): WalletGalleryBuilderState | undefined {
  const parsed = state.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
