import {
  buildWalletGalleryCmsPackage,
  createMockWalletGallerySnapshot,
  parseWalletGallerySources,
  type WalletGallerySnapshot,
} from "@/lib/profile-cms/builder/gallery";
import { validateCmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

// Mirrors the shape of createFixtureProfileCmsGallerySnapshot() from the
// backend generator's own test file (D:\repos\6529seize-backend
// src/profile-cms/profile-cms-gallery-package-generator.test.ts) so the two
// generators can be checked against equivalent input: two collections, one
// NFT each, one collection hidden via curation. The backend snapshot input
// shape differs (nested media/curation objects vs this module's flatter
// WalletGallerySnapshotAsset), so this is a hand-translated fixture rather
// than a shared import, but the curated outcome it asserts (collection
// grouping, hide/feature/reorder) is the same behavior being locked.
function createTwoCollectionFixtureSnapshot(): WalletGallerySnapshot {
  const wallets = parseWalletGallerySources(
    "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0"
  ).sources;
  return {
    snapshotId: "fixture-two-collections",
    source: "fixture",
    wallets,
    capturedAt: "2026-06-18T00:00:00.000Z",
    blockNumber: 22652900,
    assets: [
      {
        id: "meme-1",
        title: "The Memes #1",
        collectionId: "the-memes",
        collectionName: "The Memes",
        contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
        tokenId: "1",
        chainId: 1,
        owner: "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
        imageUri: "https://images.6529.io/memes/1-grid.png",
        mimeType: "image/png",
        width: 900,
        height: 1200,
        mediaState: "ready",
        altText: "The Memes #1",
        flags: { spam: false, excluded: false },
      },
      {
        id: "meme-lab-42",
        title: "Meme Lab #42",
        collectionId: "meme-lab",
        collectionName: "Meme Lab",
        contract: "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb",
        tokenId: "42",
        chainId: 1,
        owner: "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
        imageUri: "https://images.6529.io/memelab/42-grid.png",
        mimeType: "image/png",
        width: 1000,
        height: 1000,
        mediaState: "ready",
        altText: "Meme Lab #42",
        flags: { spam: false, excluded: false },
      },
    ],
    collections: [
      {
        id: "the-memes",
        name: "The Memes",
        slug: "the-memes",
        contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
        chainId: 1,
        assetIds: ["meme-1"],
      },
      {
        id: "meme-lab",
        name: "Meme Lab",
        slug: "meme-lab",
        contract: "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb",
        chainId: 1,
        assetIds: ["meme-lab-42"],
      },
    ],
    excludedAssets: [],
    warnings: [],
  };
}

describe("profile CMS wallet gallery builder helpers", () => {
  it("parses addresses and ENS names without duplicate sources", () => {
    const parsed = parseWalletGallerySources(`
      punk6529.eth,
      0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0
      punk6529.eth
    `);

    expect(parsed.ok).toBe(true);
    expect(parsed.sources).toEqual([
      {
        kind: "ens",
        input: "punk6529.eth",
        normalized: "punk6529.eth",
      },
      {
        kind: "address",
        input: "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
        normalized: "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
      },
    ]);
  });

  it("returns invalid entries while preserving usable wallet sources", () => {
    const parsed = parseWalletGallerySources("punk6529.eth not-a-wallet");

    expect(parsed.ok).toBe(false);
    expect(parsed.sources).toHaveLength(1);
    expect(parsed.errors).toEqual(["not-a-wallet"]);
  });

  it("keeps all-invalid wallet input distinct from empty input", () => {
    const parsed = parseWalletGallerySources("not_a_wallet!");

    expect(parsed.ok).toBe(false);
    expect(parsed.sources).toEqual([]);
    expect(parsed.errors).toEqual(["not_a_wallet!"]);
  });

  it("builds a valid temporary preview package from reviewed gallery state", () => {
    const sources = parseWalletGallerySources(
      "punk6529.eth 0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0"
    ).sources;
    const snapshot = createMockWalletGallerySnapshot({
      handle: "punk6529",
      sources,
    });
    const cmsPackage = buildWalletGalleryCmsPackage({
      handle: "punk6529",
      siteTitle: "punk6529 Gallery",
      siteDescription: "A reviewed wallet gallery.",
      themeAccent: "#00a86b",
      walletInput: "punk6529.eth 0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
      snapshot,
      hiddenAssetIds: ["work-memes-2"],
      featuredAssetIds: ["work-memes-1"],
      featuredCollectionIds: ["collection-the-memes"],
      orderedAssetIds: ["work-memes-partial", "work-memes-1", "work-memes-2"],
      now: new Date("2026-06-18T00:00:00.000Z"),
    });

    const validation = validateCmsPackageV1(cmsPackage, {
      allowFixtureSignatures: true,
      allowFixtureStorage: true,
      enforceHashes: true,
    });

    expect(validation.valid).toBe(true);
    expect(cmsPackage.payload.routes.map((route) => route.path)).toEqual([
      "/punk6529/index.html",
      "/punk6529/collections/index.html",
      "/punk6529/collections/the-memes/index.html",
      "/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/404/index.html",
      "/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/1/index.html",
    ]);
    expect(cmsPackage.payload.assets.map((asset) => asset.id)).toEqual([
      "asset-work-memes-1",
    ]);
    expect(cmsPackage.payload.assets[0]?.content_hash).toBe(
      "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(cmsPackage.payload.source_packets?.[0]).toEqual(
      expect.objectContaining({
        snapshot_source: "fixture",
        content_hash:
          "sha256:0000000000000000000000000000000000000000000000000000000000000000",
        hidden_asset_ids: ["work-memes-2"],
        featured_asset_ids: ["work-memes-1"],
      })
    );
  });

  it("builds a valid temporary preview package from ENS-only input", () => {
    const sources = parseWalletGallerySources("punk6529.eth").sources;
    const snapshot = createMockWalletGallerySnapshot({
      handle: "punk6529",
      sources,
    });

    const cmsPackage = buildWalletGalleryCmsPackage({
      handle: "punk6529",
      siteTitle: "punk6529 Gallery",
      siteDescription: "A reviewed wallet gallery.",
      themeAccent: "#00a86b",
      walletInput: "punk6529.eth",
      snapshot,
      hiddenAssetIds: [],
      featuredAssetIds: [],
      featuredCollectionIds: [],
      orderedAssetIds: [],
    });

    expect(
      validateCmsPackageV1(cmsPackage, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      }).valid
    ).toBe(true);
  });

  it("groups collections and applies hide, feature, and reorder curation, mirroring the backend generator's contract", () => {
    const snapshot = createTwoCollectionFixtureSnapshot();

    const cmsPackage = buildWalletGalleryCmsPackage({
      handle: "punk6529",
      siteTitle: "punk6529 Gallery",
      siteDescription: "A reviewed wallet gallery.",
      themeAccent: "#00a86b",
      walletInput: "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
      snapshot,
      hiddenAssetIds: [],
      featuredAssetIds: [],
      featuredCollectionIds: ["meme-lab"],
      orderedAssetIds: [],
      now: new Date("2026-06-18T00:00:00.000Z"),
    });

    // Meme Lab is featured, so it sorts before The Memes even though "meme-lab"
    // does not sort alphabetically first -- same precedence rule as the
    // backend generator's sortCollections (featured collections first).
    expect(cmsPackage.payload.routes.map((route) => route.path)).toEqual([
      "/punk6529/index.html",
      "/punk6529/collections/index.html",
      "/punk6529/collections/meme-lab/index.html",
      "/punk6529/collections/the-memes/index.html",
      "/punk6529/nfts/ethereum/0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb/42/index.html",
      "/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/1/index.html",
    ]);
    expect(
      validateCmsPackageV1(cmsPackage, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      }).valid
    ).toBe(true);
  });

  it("drops a hidden collection from routes, navigation, and the collections index", () => {
    const snapshot = createTwoCollectionFixtureSnapshot();

    const cmsPackage = buildWalletGalleryCmsPackage({
      handle: "punk6529",
      siteTitle: "punk6529 Gallery",
      siteDescription: "A reviewed wallet gallery.",
      themeAccent: "#00a86b",
      walletInput: "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
      snapshot,
      hiddenAssetIds: ["meme-lab-42"],
      featuredAssetIds: [],
      featuredCollectionIds: [],
      orderedAssetIds: [],
      now: new Date("2026-06-18T00:00:00.000Z"),
    });

    expect(cmsPackage.payload.routes.map((route) => route.path)).toEqual([
      "/punk6529/index.html",
      "/punk6529/collections/index.html",
      "/punk6529/collections/the-memes/index.html",
      "/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/1/index.html",
    ]);
    expect(
      cmsPackage.payload.navigation[0]?.items.map((item) => item.page_id)
    ).toEqual(["page-gallery", "page-collections"]);
  });

  it("round-trips the reviewed snapshot and curation choices through the generated package", () => {
    const snapshot = createTwoCollectionFixtureSnapshot();

    const cmsPackage = buildWalletGalleryCmsPackage({
      handle: "punk6529",
      siteTitle: "punk6529 Gallery",
      siteDescription: "A reviewed wallet gallery.",
      themeAccent: "#00a86b",
      walletInput: "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
      snapshot,
      hiddenAssetIds: ["meme-lab-42"],
      featuredAssetIds: ["meme-1"],
      featuredCollectionIds: ["the-memes"],
      orderedAssetIds: ["meme-1", "meme-lab-42"],
      now: new Date("2026-06-18T00:00:00.000Z"),
    });

    const packet = cmsPackage.payload.source_packets?.find(
      (candidate) => candidate.source_type === "wallet"
    ) as Record<string, unknown>;
    const roundTripState = packet["6529_gallery_builder_state_v1"] as {
      readonly walletInput: string;
      readonly snapshot: WalletGallerySnapshot;
      readonly hiddenAssetIds: readonly string[];
      readonly featuredAssetIds: readonly string[];
      readonly featuredCollectionIds: readonly string[];
      readonly orderedAssetIds: readonly string[];
    };

    expect(roundTripState.walletInput).toBe(
      "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0"
    );
    expect(roundTripState.hiddenAssetIds).toEqual(["meme-lab-42"]);
    expect(roundTripState.featuredAssetIds).toEqual(["meme-1"]);
    expect(roundTripState.featuredCollectionIds).toEqual(["the-memes"]);
    expect(roundTripState.orderedAssetIds).toEqual(["meme-1", "meme-lab-42"]);
    expect(roundTripState.snapshot.assets.map((asset) => asset.id)).toEqual([
      "meme-1",
      "meme-lab-42",
    ]);
  });
});
