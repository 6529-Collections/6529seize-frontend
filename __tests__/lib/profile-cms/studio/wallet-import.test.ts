import { createMockWalletGallerySnapshot } from "@/lib/profile-cms/builder/gallery";
import { normalizeWalletGallerySnapshotResponse } from "@/lib/profile-cms/builder/gallery-normalize";
import type { ApiProfileCmsWalletGallerySnapshot } from "@/generated/models/ApiProfileCmsWalletGallerySnapshot";
import {
  buildCmsPackageCandidate,
  createDefaultCmsBuilderState,
} from "@/lib/profile-cms/builder/package";
import {
  cmsPackageSchema,
  validateCmsPackageV1,
  withComputedCmsHashes,
} from "@/lib/profile-cms/protocol/v1";
import {
  getCmsPublicPagePath,
  resolveCmsRoute,
} from "@/lib/profile-cms/runtime/routes";
import { addCmsStudioWalletGallery } from "@/lib/profile-cms/studio/wallet-import";

const NOW = new Date("2026-09-10T12:00:00.000Z");
const HANDLE = "ExampleProfile";
const SNAPSHOT = createMockWalletGallerySnapshot({
  handle: HANDLE,
  sources: [],
  now: NOW,
});

function document() {
  const original = buildCmsPackageCandidate(
    createDefaultCmsBuilderState(HANDLE),
    NOW
  );
  original.site.theme.tokens = {
    studio_revision: 1,
    studio_layout: "editorial",
    custom_token: "preserve",
  };
  const sourcePackets = [
    {
      id: "original-source",
      source_type: "import" as const,
      captured_at: NOW.toISOString(),
      text: "Author's original material",
    },
  ];
  original.payload.source_packets = sourcePackets;
  return withComputedCmsHashes(original);
}

function options(base = document()) {
  return {
    expectedBaseHash: base.integrity.package_hash,
    snapshot: SNAPSHOT,
    selectedAssetIds: SNAPSHOT.assets.slice(0, 2).map((asset) => asset.id),
    title: "Selected works",
    description: "A curated collection",
    collectionsTitle: "Collections",
    noPreviewText: "Preview unavailable; NFT details remain available.",
    now: NOW,
  };
}

describe("studio wallet gallery import", () => {
  it("imports a real API-shaped snapshot with exact original dimensions", () => {
    const originalAsset = SNAPSHOT.assets[0]!;
    const snapshot = normalizeWalletGallerySnapshotResponse(
      {
        generated_at: NOW.getTime(),
        source: "indexed_ownership",
        block_reference: 23000000,
        wallets: [],
        excluded_assets: [],
        assets: [
          {
            contract: originalAsset.contract.toLowerCase(),
            token_id: 1,
            balance: 1,
            owner_wallet: originalAsset.owner,
            owner_display: null,
            collection: "The Memes",
            collection_key: "MEMES",
            name: "A selected card",
            description: "",
            artist: "Artist",
            artist_seize_handle: null,
            token_type: "ERC1155",
            media: {
              image: "https://example.com/card.png",
              image_preview: null,
              thumbnail: null,
              animation: null,
              animation_preview: null,
              mime_type: "image/png",
            },
            metadata: { image_details: { width: 1200, height: 1800 } },
            flags: { spam: false, excluded: false, exclusion_reason: null },
          },
        ],
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
      } as ApiProfileCmsWalletGallerySnapshot,
      []
    );
    const base = document();
    const result = addCmsStudioWalletGallery(base, {
      ...options(base),
      snapshot,
      selectedAssetIds: [snapshot.assets[0]!.id],
    });
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    expect(result.document.payload.assets.at(-1)).toMatchObject({
      uri: "https://example.com/card.png",
      width: 1200,
      height: 1800,
    });
    expect(
      result.document.payload.nft_media_profiles?.[0]?.snapshot?.owner
    ).toBe(originalAsset.owner);
  });

  it("preserves selection order and localizes new labels without rewriting artwork titles", () => {
    const base = document();
    const ids = SNAPSHOT.assets
      .slice(0, 2)
      .map((asset) => asset.id)
      .reverse();
    const result = addCmsStudioWalletGallery(base, {
      ...options(base),
      selectedAssetIds: ids,
      title: "page-gallery",
      collectionsTitle: "Sammlungen",
      locale: "de-DE",
    });
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    const pages = result.document.payload.pages.slice(
      base.payload.pages.length
    );
    expect(pages[0]?.metadata.title).toBe("page-gallery");
    expect(pages[1]?.metadata).toMatchObject({
      title: "Sammlungen",
      locale: "de-DE",
    });
    expect(pages[0]?.blocks.at(-1)).toMatchObject({
      block_type: "button_link",
      page_id: pages[1]?.id,
      label: "Sammlungen",
    });
    const imported = result.document.payload.assets.slice(
      base.payload.assets.length
    );
    expect(imported.map((asset) => asset.uri)).toEqual(
      ids.map(
        (id) => SNAPSHOT.assets.find((asset) => asset.id === id)?.imageUri
      )
    );
  });

  it("adds a valid gallery and detail routes while preserving every existing document section", () => {
    const base = document();
    const before = JSON.stringify(base);
    const result = addCmsStudioWalletGallery(base, options(base));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    expect(JSON.stringify(base)).toBe(before);
    const updated = result.document;
    expect(updated.profile).toEqual(base.profile);
    expect(updated.site).toEqual(base.site);
    expect(updated.provenance).toEqual(base.provenance);
    expect(updated.signatures).toEqual(base.signatures);
    expect(updated.storage).toEqual(base.storage);
    expect(updated.payload.pages.slice(0, base.payload.pages.length)).toEqual(
      base.payload.pages
    );
    expect(updated.payload.assets.slice(0, base.payload.assets.length)).toEqual(
      base.payload.assets
    );
    expect(updated.payload.source_packets?.[0]).toEqual(
      base.payload.source_packets?.[0]
    );
    expect(updated.payload.build_manifest?.renderer).toBe(
      base.payload.build_manifest?.renderer
    );
    expect(updated.payload.navigation[0]?.items.at(-1)?.label).toBe(
      "Selected works"
    );
    const gallery = updated.payload.pages[base.payload.pages.length]!;
    expect(getCmsPublicPagePath(updated, gallery.id)).toBe(
      "/exampleprofile/wallet-gallery"
    );
    expect(gallery.metadata.title).toBe("Selected works");
    for (const page of updated.payload.pages)
      expect(resolveCmsRoute(updated, page.path).kind).toBe("page");
    expect(
      validateCmsPackageV1(updated, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      }).valid
    ).toBe(true);
    expect(
      cmsPackageSchema.safeParse(JSON.parse(JSON.stringify(updated))).success
    ).toBe(true);
  });

  it("includes only selected holdings and their owners in the recoverable source packet", () => {
    const base = document();
    const selected = SNAPSHOT.assets[0]!;
    const unselected = {
      ...SNAPSHOT.assets[1]!,
      id: "private-unselected-holding",
      title: "Private unselected title",
      owner: "0x0000000000000000000000000000000000000022",
    };
    const snapshot = {
      ...SNAPSHOT,
      wallets: [
        ...SNAPSHOT.wallets,
        {
          kind: "ens" as const,
          input: "private-input.eth",
          normalized: "private-input.eth",
        },
      ],
      assets: [selected, unselected],
      excludedAssets: [
        {
          contract: unselected.contract,
          tokenId: "998877",
          owner: unselected.owner,
          reason: "Private excluded reason",
        },
      ],
    };
    const result = addCmsStudioWalletGallery(base, {
      ...options(base),
      snapshot,
      selectedAssetIds: [selected.id],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    const serialized = JSON.stringify(result.document);
    for (const secret of [
      unselected.id,
      unselected.title,
      unselected.owner,
      "private-input.eth",
      "998877",
      "Private excluded reason",
    ])
      expect(serialized).not.toContain(secret);
    expect(serialized).toContain(selected.owner.toLowerCase());
    expect(result.document.payload.nft_media_profiles).toHaveLength(1);
  });

  it("allocates a separate collision-free subtree for each import without changing earlier pages", () => {
    const base = document();
    const first = addCmsStudioWalletGallery(base, options(base));
    if (!first.ok) throw new Error(JSON.stringify(first.error));
    const second = addCmsStudioWalletGallery(
      first.document,
      options(first.document)
    );
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error(JSON.stringify(second.error));
    expect(
      second.document.payload.pages.slice(
        0,
        first.document.payload.pages.length
      )
    ).toEqual(first.document.payload.pages);
    expect(
      second.document.payload.pages.some(
        (page) =>
          page.path === `/${base.profile.handle}/wallet-gallery-2/index.html`
      )
    ).toBe(true);
    expect(
      new Set(second.document.payload.routes.map((route) => route.path)).size
    ).toBe(second.document.payload.routes.length);
    expect(
      validateCmsPackageV1(second.document, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      }).valid
    ).toBe(true);
  });

  it("retains NFT details for selected works with no measured image", () => {
    const base = document();
    const asset = {
      ...SNAPSHOT.assets[0]!,
      width: undefined,
      height: undefined,
      mediaState: "partial" as const,
    };
    const result = addCmsStudioWalletGallery(base, {
      ...options(base),
      snapshot: { ...SNAPSHOT, assets: [asset] },
      selectedAssetIds: [asset.id],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    expect(result.document.payload.assets).toEqual(base.payload.assets);
    expect(
      result.document.payload.pages.some((page) => page.type === "nft_detail")
    ).toBe(true);
  });

  it("returns an atomic failure for selected media with invalid dimensions", () => {
    const base = document();
    const before = JSON.stringify(base);
    const asset = { ...SNAPSHOT.assets[0]!, width: 1200.5 };
    const result = addCmsStudioWalletGallery(base, {
      ...options(base),
      snapshot: { ...SNAPSHOT, assets: [asset] },
      selectedAssetIds: [asset.id],
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "wallet.invalid_result" },
    });
    expect(JSON.stringify(base)).toBe(before);
  });

  it("rejects empty, unavailable, duplicate, excluded and oversized selections atomically", () => {
    const base = document();
    const original = JSON.stringify(base);
    for (const ids of [
      [],
      ["missing"],
      [SNAPSHOT.assets[0]!.id, SNAPSHOT.assets[0]!.id],
      Array.from({ length: 51 }, (_, index) => `asset-${index}`),
    ]) {
      expect(
        addCmsStudioWalletGallery(base, {
          ...options(base),
          selectedAssetIds: ids,
        })
      ).toMatchObject({
        ok: false,
        error: { code: "wallet.invalid_selection" },
      });
    }
    const blocked = {
      ...SNAPSHOT.assets[0]!,
      flags: { spam: true, excluded: false },
    };
    expect(
      addCmsStudioWalletGallery(base, {
        ...options(base),
        snapshot: { ...SNAPSHOT, assets: [blocked] },
        selectedAssetIds: [blocked.id],
      }).ok
    ).toBe(false);
    expect(JSON.stringify(base)).toBe(original);
  });

  it("rejects a stale base hash and un-hashed edits", () => {
    const base = document();
    expect(
      addCmsStudioWalletGallery(base, {
        ...options(base),
        expectedBaseHash: "old",
      })
    ).toMatchObject({ ok: false, error: { code: "wallet.stale_document" } });
    base.site.title = "Changed elsewhere";
    expect(addCmsStudioWalletGallery(base, options(base))).toMatchObject({
      ok: false,
      error: { code: "wallet.stale_document" },
    });
  });
});
