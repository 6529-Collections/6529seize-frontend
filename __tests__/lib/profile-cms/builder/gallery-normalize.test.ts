import type { ApiProfileCmsWalletGallerySnapshot } from "@/generated/models/ApiProfileCmsWalletGallerySnapshot";
import { normalizeWalletGallerySnapshotResponse } from "@/lib/profile-cms/builder/gallery-normalize";
import type { WalletGallerySource } from "@/lib/profile-cms/builder/gallery";

// Realistic backend-shaped response: mirrors
// ApiProfileCmsWalletGallerySnapshot generated from
// 6529seize-backend/src/api-serverless/src/profile-cms/wallet-gallery.api.service.ts.
function buildBackendSnapshot(
  overrides: Partial<ApiProfileCmsWalletGallerySnapshot> = {}
): ApiProfileCmsWalletGallerySnapshot {
  return {
    generated_at: 1750204800000,
    source: "indexed_ownership",
    block_reference: 23000000,
    wallets: [
      {
        input: "punk6529.eth",
        address: "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
        ens: "punk6529.eth",
        display: "punk6529.eth",
        status: "resolved",
        reason: null,
      },
    ],
    assets: [
      {
        contract: "0x33FD426905F149f8376e227d0C9D3340AaD17af1",
        token_id: 1,
        balance: 1,
        owner_wallet: "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
        owner_display: "punk6529.eth",
        collection: "The Memes by 6529",
        collection_key: "MEMES",
        name: "The Memes #1",
        description: "A meme card.",
        artist: "An Artist",
        artist_seize_handle: "anartist",
        token_type: "ERC1155",
        media: {
          image: "https://media.6529.io/memes/1.png",
          image_preview: null,
          thumbnail: null,
          animation: null,
          animation_preview: null,
          mime_type: "image/png",
        },
        metadata: { name: "The Memes #1" },
        flags: { spam: false, excluded: false, exclusion_reason: null },
      },
    ],
    excluded_assets: [],
    totals: {
      requested_wallets: 1,
      resolved_wallets: 1,
      unresolved_wallets: 0,
      indexed_assets: 1,
      visible_assets: 1,
      excluded_assets: 0,
      spam_assets: 0,
      truncated: false,
    },
    ...overrides,
  } as ApiProfileCmsWalletGallerySnapshot;
}

const REQUESTED_SOURCES: readonly WalletGallerySource[] = [
  { kind: "ens", input: "punk6529.eth", normalized: "punk6529.eth" },
];

describe("wallet gallery snapshot normalization", () => {
  it("normalizes snake_case backend assets into the camelCase FE review model", () => {
    const snapshot = normalizeWalletGallerySnapshotResponse(
      buildBackendSnapshot(),
      REQUESTED_SOURCES
    );

    expect(snapshot.source).toBe("backend");
    expect(snapshot.blockNumber).toBe(23000000);
    expect(snapshot.capturedAt).toBe(new Date(1750204800000).toISOString());
    expect(snapshot.assets).toEqual([
      expect.objectContaining({
        id: "0x33fd426905f149f8376e227d0c9d3340aad17af1:1:0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
        title: "The Memes #1",
        collectionId: "MEMES",
        collectionName: "The Memes by 6529",
        contract: "0x33FD426905F149f8376e227d0C9D3340AaD17af1",
        tokenId: "1",
        chainId: 1,
        owner: "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
        imageUri: "https://media.6529.io/memes/1.png",
        mimeType: "image/png",
        mediaState: "ready",
        altText: "The Memes #1",
        flags: { spam: false, excluded: false },
      }),
    ]);
  });

  it("marks assets with no indexed media at all as missing and drops imageUri", () => {
    const snapshot = normalizeWalletGallerySnapshotResponse(
      buildBackendSnapshot({
        assets: [
          {
            ...buildBackendSnapshot().assets[0],
            media: {
              image: null,
              image_preview: null,
              thumbnail: null,
              animation: null,
              animation_preview: null,
              mime_type: null,
            },
          },
        ],
      }),
      REQUESTED_SOURCES
    );

    expect(snapshot.assets[0]?.mediaState).toBe("missing");
    expect(snapshot.assets[0]?.imageUri).toBeUndefined();
  });

  it("marks preview-only media as partial while keeping the preview image", () => {
    const snapshot = normalizeWalletGallerySnapshotResponse(
      buildBackendSnapshot({
        assets: [
          {
            ...buildBackendSnapshot().assets[0],
            media: {
              image: null,
              image_preview: "https://media.6529.io/previews/1.png",
              thumbnail: null,
              animation: null,
              animation_preview: null,
              mime_type: "image/png",
            },
          },
        ],
      }),
      REQUESTED_SOURCES
    );

    expect(snapshot.assets[0]?.mediaState).toBe("partial");
    expect(snapshot.assets[0]?.imageUri).toBe(
      "https://media.6529.io/previews/1.png"
    );
  });

  it("surfaces backend exclusion flags and the excluded_assets list separately", () => {
    const snapshot = normalizeWalletGallerySnapshotResponse(
      buildBackendSnapshot({
        excluded_assets: [
          {
            contract: "0x0000000000000000000000000000000000dead",
            token_id: 99,
            owner_wallet: "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
            reason: "asset_excluded",
          },
        ],
      }),
      REQUESTED_SOURCES
    );

    expect(snapshot.excludedAssets).toEqual([
      {
        contract: "0x0000000000000000000000000000000000dead",
        tokenId: "99",
        owner: "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
        reason: "asset_excluded",
      },
    ]);
  });

  it("derives collections by grouping assets on collection_key when the backend has no collections list", () => {
    const snapshot = normalizeWalletGallerySnapshotResponse(
      buildBackendSnapshot({
        assets: [
          buildBackendSnapshot().assets[0],
          {
            ...buildBackendSnapshot().assets[0],
            token_id: 2,
            name: "The Memes #2",
          },
        ],
      }),
      REQUESTED_SOURCES
    );

    expect(snapshot.collections).toEqual([
      expect.objectContaining({
        id: "MEMES",
        name: "The Memes by 6529",
        assetIds: [
          "0x33fd426905f149f8376e227d0c9d3340aad17af1:1:0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
          "0x33fd426905f149f8376e227d0c9d3340aad17af1:2:0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
        ],
      }),
    ]);
  });

  it("maps totals and flags a truncated warning when the backend truncates results", () => {
    const snapshot = normalizeWalletGallerySnapshotResponse(
      buildBackendSnapshot({
        totals: {
          requested_wallets: 1,
          resolved_wallets: 1,
          unresolved_wallets: 0,
          indexed_assets: 500,
          visible_assets: 200,
          excluded_assets: 0,
          spam_assets: 0,
          truncated: true,
        },
      }),
      REQUESTED_SOURCES
    );

    expect(snapshot.totals).toEqual({
      requestedWallets: 1,
      resolvedWallets: 1,
      unresolvedWallets: 0,
      indexedAssets: 500,
      visibleAssets: 200,
      excludedAssets: 0,
      spamAssets: 0,
      truncated: true,
    });
    expect(snapshot.warnings).toEqual(["backend_snapshot_truncated"]);
  });

  it("flags an unresolved-wallets warning when some inputs could not be resolved", () => {
    const snapshot = normalizeWalletGallerySnapshotResponse(
      buildBackendSnapshot({
        totals: {
          requested_wallets: 2,
          resolved_wallets: 1,
          unresolved_wallets: 1,
          indexed_assets: 1,
          visible_assets: 1,
          excluded_assets: 0,
          spam_assets: 0,
          truncated: false,
        },
      }),
      REQUESTED_SOURCES
    );

    expect(snapshot.warnings).toEqual(["backend_snapshot_unresolved_wallets"]);
  });

  it("falls back to the requested wallet sources when the backend cannot resolve any wallet", () => {
    const snapshot = normalizeWalletGallerySnapshotResponse(
      buildBackendSnapshot({
        wallets: [
          {
            input: "not-a-wallet",
            address: null,
            ens: null,
            display: null,
            status: "unresolved",
            reason: "unresolvable_input",
          },
        ],
      }),
      REQUESTED_SOURCES
    );

    expect(snapshot.wallets).toEqual(REQUESTED_SOURCES);
  });
});
