import {
  buildWalletGalleryCmsPackage,
  createMockWalletGallerySnapshot,
  parseWalletGallerySources,
} from "@/lib/profile-cms/builder/gallery";
import {
  buildCmsPackageCandidate,
  createBuilderBlock,
  createBuilderStateFromPackage,
  createDefaultCmsBuilderState,
  getBuilderFieldIdForIssuePath,
  parseCmsPackageCandidateJson,
  validateCmsBuilderState,
} from "@/lib/profile-cms/builder/package";

describe("profile CMS builder package helpers", () => {
  it("builds a hashed V1 homepage package that validates with fixture artifacts", () => {
    const state = createDefaultCmsBuilderState("Punk6529");
    const validation = validateCmsBuilderState(
      state,
      new Date("2026-06-17T00:00:00.000Z")
    );

    expect(validation.result.valid).toBe(true);
    expect(validation.cmsPackage.profile.handle).toBe("punk6529");
    expect(validation.cmsPackage.site.base_path).toBe("/punk6529/index.html");
    expect(validation.cmsPackage.payload.routes).toEqual([
      {
        path: "/punk6529/index.html",
        kind: "page",
        page_id: "page-home",
      },
    ]);
    expect(validation.cmsPackage.integrity.payload_hash).toMatch(
      /^sha256:[a-f0-9]{64}$/
    );
    expect(validation.cmsPackage.integrity.package_hash).toMatch(
      /^sha256:[a-f0-9]{64}$/
    );
  });

  it("surfaces validator errors for unsafe authored URLs", () => {
    const state = {
      ...createDefaultCmsBuilderState("punk6529"),
      blocks: [
        createBuilderBlock("button_link", 0, {
          text: "Bad link",
          url: "javascript:alert(1)",
        }),
      ],
    };

    const validation = validateCmsBuilderState(state);

    expect(validation.result.valid).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "block.unsafe_url",
          path: "/payload/pages/0/blocks/0/href",
        }),
      ])
    );
    expect(
      getBuilderFieldIdForIssuePath("/payload/pages/0/blocks/0/href")
    ).toBe("cms-builder-block-0");
  });

  it("round-trips exported package JSON back into editable state", () => {
    const original = {
      ...createDefaultCmsBuilderState("punk6529"),
      siteTitle: "A site",
      blocks: [
        createBuilderBlock("heading", 0, { text: "Hello" }),
        createBuilderBlock("callout", 1, {
          title: "Read this",
          text: "Important detail",
        }),
      ],
    };
    const cmsPackage = buildCmsPackageCandidate(
      original,
      new Date("2026-06-17T00:00:00.000Z")
    );

    const parsed = parseCmsPackageCandidateJson(JSON.stringify(cmsPackage));
    const imported = createBuilderStateFromPackage(parsed);

    expect(imported.siteTitle).toBe("A site");
    expect(imported.blocks).toHaveLength(2);
    expect(imported.blocks[1]).toEqual(
      expect.objectContaining({
        kind: "callout",
        title: "Read this",
        text: "Important detail",
      })
    );
  });

  it("builds an editable 3D room package with a faithful 2D detail route", () => {
    const state = {
      ...createDefaultCmsBuilderState("punk6529"),
      blocks: [
        createBuilderBlock("room_viewer", 0, {
          altText: "A square room work",
          assetUri: "ipfs://bafyroom/work.png",
          roomStyle: "white_cube",
          title: "Room Work",
        }),
      ],
    };
    const cmsPackage = buildCmsPackageCandidate(
      state,
      new Date("2026-06-17T00:00:00.000Z")
    );

    expect(validateCmsBuilderState(state).result.valid).toBe(true);
    expect(cmsPackage.payload.exhibition_rooms?.[0]).toEqual(
      expect.objectContaining({
        room_type: "white_cube",
        fallback_page_id: "page-room-work-1",
      })
    );
    expect(cmsPackage.payload.routes).toEqual(
      expect.arrayContaining([
        {
          kind: "page",
          page_id: "page-room-work-1",
          path: "/punk6529/rooms/work-1/index.html",
        },
      ])
    );

    const imported = createBuilderStateFromPackage(cmsPackage);
    expect(imported.blocks[0]).toEqual(
      expect.objectContaining({
        assetUri: "ipfs://bafyroom/work.png",
        kind: "room_viewer",
        roomStyle: "white_cube",
        title: "Room Work",
      })
    );
  });

  it("round-trips a saved wallet-gallery draft back into gallery editor state instead of a homepage template", () => {
    // Regression test for the WS-B round-trip gap: loading a saved gallery
    // draft used to always call createBuilderStateFromPackage and land on the
    // "homepage" template with the generated pages misread as authored
    // blocks. A gallery-generated package must restore the gallery tab and
    // its curation choices instead.
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

    // Simulate reloading a saved draft: parse it back from JSON the way the
    // builder does for loaded packages / JSON import.
    const reloaded = parseCmsPackageCandidateJson(JSON.stringify(cmsPackage));
    const imported = createBuilderStateFromPackage(reloaded);

    expect(imported.template).toBe("wallet_gallery");
    expect(imported.siteTitle).toBe("punk6529 Gallery");
    expect(imported.gallery.walletInput).toBe(
      "punk6529.eth 0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0"
    );
    expect(imported.gallery.hiddenAssetIds).toEqual(["work-memes-2"]);
    expect(imported.gallery.featuredAssetIds).toEqual(["work-memes-1"]);
    expect(imported.gallery.featuredCollectionIds).toEqual([
      "collection-the-memes",
    ]);
    expect(imported.gallery.orderedAssetIds).toEqual([
      "work-memes-partial",
      "work-memes-1",
      "work-memes-2",
    ]);
    expect(imported.gallery.snapshot?.assets.map((asset) => asset.id)).toEqual([
      "work-memes-1",
      "work-memes-2",
      "work-memes-partial",
    ]);
  });

  it("falls back to a fresh gallery state when a gallery package has no embedded round-trip payload", () => {
    const cmsPackage = buildWalletGalleryCmsPackage({
      handle: "punk6529",
      siteTitle: "punk6529 Gallery",
      siteDescription: "A reviewed wallet gallery.",
      themeAccent: "#00a86b",
      walletInput: "punk6529.eth",
      snapshot: createMockWalletGallerySnapshot({
        handle: "punk6529",
        sources: parseWalletGallerySources("punk6529.eth").sources,
      }),
      hiddenAssetIds: [],
      featuredAssetIds: [],
      featuredCollectionIds: [],
      orderedAssetIds: [],
    });
    const packet = cmsPackage.payload.source_packets?.find(
      (candidate) => candidate.source_type === "wallet"
    ) as Record<string, unknown>;
    delete packet["6529_gallery_builder_state_v1"];

    const imported = createBuilderStateFromPackage(cmsPackage);

    expect(imported.template).toBe("wallet_gallery");
    expect(imported.gallery.snapshot).toBeUndefined();
    expect(imported.gallery.walletInput).toBe("punk6529.eth");
  });
});
