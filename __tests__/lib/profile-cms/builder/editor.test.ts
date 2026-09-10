import {
  canVisuallyEditCmsPackage,
  updateCmsBuilderState,
} from "@/lib/profile-cms/builder/editor";
import {
  buildCmsPackageCandidate,
  createBuilderStateFromPackage,
  createDefaultCmsBuilderState,
} from "@/lib/profile-cms/builder/package";
import {
  createMockWalletGallerySnapshot,
  parseWalletGallerySources,
} from "@/lib/profile-cms/builder/gallery";
import {
  validateCmsPackageV1,
  withComputedCmsHashes,
} from "@/lib/profile-cms/protocol/v1";

describe("lossless CMS editor", () => {
  it("requires JSON or agent editing when authored IDs differ from the visual projection", () => {
    const state = createDefaultCmsBuilderState("punk6529");
    const original = buildCmsPackageCandidate({
      ...state,
      blocks: [
        {
          ...state.blocks[0]!,
          kind: "image",
          assetUri: "https://example.com/old.png",
        },
      ],
    });
    expect(
      canVisuallyEditCmsPackage(createBuilderStateFromPackage(original))
    ).toBe(true);
    const custom = withComputedCmsHashes({
      ...original,
      payload: {
        ...original.payload,
        assets: original.payload.assets.map((asset) => ({
          ...asset,
          id: "custom-image",
        })),
        pages: original.payload.pages.map((page) => ({
          ...page,
          blocks: page.blocks.map((block) => ({
            ...block,
            asset_id: "custom-image",
          })),
        })),
      },
    });
    const loaded = createBuilderStateFromPackage(custom);
    expect(canVisuallyEditCmsPackage(loaded)).toBe(false);
    expect(buildCmsPackageCandidate(loaded)).toEqual(custom);
  });

  it("keeps long distinct NFT token IDs distinct in generated page and asset identifiers", () => {
    const state = createDefaultCmsBuilderState("punk6529");
    const snapshot = createMockWalletGallerySnapshot({
      handle: "punk6529",
      sources: parseWalletGallerySources("punk6529.eth").sources,
    });
    const first = snapshot.assets[0]!;
    const assets = [
      "1234567890123456789012345678901234567890123456789012345678901",
      "1234567890123456789012345678901234567890123456789012345678902",
    ].map((tokenId) => ({
      ...first,
      tokenId,
      id: `${first.contract}:${tokenId}:${first.owner}`,
    }));
    const cmsPackage = buildCmsPackageCandidate({
      ...state,
      template: "wallet_gallery",
      gallery: { ...state.gallery, snapshot: { ...snapshot, assets } },
    });
    expect(
      new Set(cmsPackage.payload.assets.map((asset) => asset.id)).size
    ).toBe(2);
    expect(new Set(cmsPackage.payload.pages.map((page) => page.id)).size).toBe(
      cmsPackage.payload.pages.length
    );
    expect(
      validateCmsPackageV1(cmsPackage, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      }).issues.filter((issue) => issue.severity === "error")
    ).toEqual([]);
  });
  it("retains authored pages, routes, theme, build data and block fields after importing and editing a generated homepage", () => {
    const original = buildCmsPackageCandidate(
      createDefaultCmsBuilderState("punk6529")
    );
    const home = original.payload.pages[0]!;
    const custom = withComputedCmsHashes({
      ...original,
      payload: {
        ...original.payload,
        pages: [
          {
            ...home,
            blocks: home.blocks.map((block) => ({
              ...block,
              author_note: "preserve",
            })),
          },
          { ...home, id: "page-about", path: "/punk6529/about/index.html" },
        ],
        routes: [
          ...original.payload.routes,
          {
            kind: "page" as const,
            page_id: "page-about",
            path: "/punk6529/about/index.html",
          },
        ],
        build_manifest: {
          ...original.payload.build_manifest!,
          warnings: ["Author note"],
        },
      },
    });
    const loaded = createBuilderStateFromPackage(custom);
    expect(buildCmsPackageCandidate(loaded)).toEqual(custom);
    const edited = buildCmsPackageCandidate(
      updateCmsBuilderState(loaded, { pageTitle: "Revised home" })
    );
    expect(edited.payload.pages[0]!.metadata.title).toBe("Revised home");
    expect(edited.payload.pages[0]!.blocks).toEqual(
      custom.payload.pages[0]!.blocks
    );
    expect(edited.payload.pages[1]).toEqual(custom.payload.pages[1]);
    expect(edited.payload.routes).toEqual(custom.payload.routes);
    expect(edited.payload.build_manifest).toEqual(
      custom.payload.build_manifest
    );
    expect(edited.site.theme).toEqual(custom.site.theme);
    expect(
      validateCmsPackageV1(edited, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      }).valid
    ).toBe(true);
  });

  it("preserves an arbitrary package exactly and directs its author to JSON or agent editing", () => {
    const original = buildCmsPackageCandidate(
      createDefaultCmsBuilderState("punk6529")
    );
    const custom = withComputedCmsHashes({
      ...original,
      payload: {
        ...original.payload,
        build_manifest: {
          ...original.payload.build_manifest!,
          renderer: "custom-renderer",
        },
      },
    });
    const loaded = createBuilderStateFromPackage(custom);
    expect(canVisuallyEditCmsPackage(loaded)).toBe(false);
    expect(buildCmsPackageCandidate(loaded)).toEqual(custom);
  });

  it("reopens a saved gallery with its reviewed snapshot and applies further curation without losing the generated package", () => {
    const state = createDefaultCmsBuilderState("punk6529");
    const sources = parseWalletGallerySources("punk6529.eth").sources;
    const snapshot = createMockWalletGallerySnapshot({
      handle: "punk6529",
      sources,
    });
    const packageBefore = buildCmsPackageCandidate({
      ...state,
      template: "wallet_gallery",
      gallery: {
        ...state.gallery,
        snapshot,
        orderedAssetIds: snapshot.assets.map((asset) => asset.id),
      },
    });
    const loaded = createBuilderStateFromPackage(
      JSON.parse(JSON.stringify(packageBefore))
    );
    expect(buildCmsPackageCandidate(loaded)).toEqual(packageBefore);
    expect(loaded.gallery.snapshot).toEqual(snapshot);
    const hidden = snapshot.assets[0]!.id;
    const edited = updateCmsBuilderState(loaded, {
      gallery: { ...loaded.gallery, hiddenAssetIds: [hidden] },
    });
    const savedAgain = buildCmsPackageCandidate(edited);
    const reopened = createBuilderStateFromPackage(savedAgain);
    expect(reopened.gallery.hiddenAssetIds).toEqual([hidden]);
    expect(reopened.gallery.snapshot).toEqual(snapshot);
    expect(savedAgain.payload.pages.length).toBeLessThan(
      packageBefore.payload.pages.length
    );
    expect(
      validateCmsPackageV1(savedAgain, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      }).valid
    ).toBe(true);
  });

  it("generates one NFT route when consolidated wallets own the same ERC-1155 token", () => {
    const state = createDefaultCmsBuilderState("punk6529");
    const snapshot = createMockWalletGallerySnapshot({
      handle: "punk6529",
      sources: parseWalletGallerySources("punk6529.eth").sources,
    });
    const duplicate = {
      ...snapshot.assets[0]!,
      id: "second-owner",
      owner: "0x0000000000000000000000000000000000000002",
    };
    const cmsPackage = buildCmsPackageCandidate({
      ...state,
      template: "wallet_gallery",
      gallery: {
        ...state.gallery,
        snapshot: { ...snapshot, assets: [...snapshot.assets, duplicate] },
      },
    });
    expect(
      new Set(cmsPackage.payload.routes.map((route) => route.path)).size
    ).toBe(cmsPackage.payload.routes.length);
    expect(
      validateCmsPackageV1(cmsPackage, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      }).valid
    ).toBe(true);
    expect(
      createBuilderStateFromPackage(cmsPackage).gallery.snapshot!.assets
    ).toHaveLength(snapshot.assets.length + 1);
  });
});
