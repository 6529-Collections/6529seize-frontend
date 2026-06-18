import {
  buildWalletGalleryCmsPackage,
  createMockWalletGallerySnapshot,
  parseWalletGallerySources,
} from "@/lib/profile-cms/builder/gallery";
import { validateCmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

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
      "/punk6529/collections/the-memes/index.html",
      "/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/404/index.html",
      "/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/1/index.html",
    ]);
    expect(cmsPackage.payload.assets.map((asset) => asset.id)).toEqual([
      "asset-work-memes-1",
    ]);
    expect(cmsPackage.payload.source_packets?.[0]).toEqual(
      expect.objectContaining({
        snapshot_source: "fixture",
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
});
