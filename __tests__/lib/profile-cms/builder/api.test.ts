import {
  getProfileCmsPackageById,
  listProfileCmsPackagesForProfile,
  PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT,
  PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT,
  PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT,
  requestProfileCmsGallerySnapshot,
  runProfileCmsBuilderAction,
} from "@/lib/profile-cms/builder/api";
import { parseWalletGallerySources } from "@/lib/profile-cms/builder/gallery";
import { createDefaultCmsBuilderState } from "@/lib/profile-cms/builder/package";
import { validateCmsBuilderState } from "@/lib/profile-cms/builder/package";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiFetch: jest.fn(),
}));

const commonApiPostMock = commonApiPost as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;

describe("profile CMS builder API adapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env["PROFILE_CMS_BUILDER_API_ENABLED"];
    delete process.env["NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED"];
  });

  describe("wallet gallery snapshot", () => {
    it("uses the fixture snapshot fallback while the backend gallery API is disabled", async () => {
      const sources = parseWalletGallerySources("punk6529.eth").sources;

      const snapshot = await requestProfileCmsGallerySnapshot({
        handle: "punk6529",
        sources,
      });

      expect(commonApiPostMock).not.toHaveBeenCalled();
      expect(snapshot.source).toBe("fixture");
      expect(snapshot.assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "work-memes-1" }),
        ])
      );
    });

    it("posts to the real backend endpoint and normalizes the snake_case response", async () => {
      process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
      const sources = parseWalletGallerySources("punk6529.eth").sources;

      // Realistic backend-shaped fixture: matches
      // ApiProfileCmsWalletGallerySnapshot from
      // 6529seize-backend/src/api-serverless/src/generated/models, produced
      // by ProfileCmsWalletGalleryApiService#createSnapshot.
      commonApiPostMock.mockResolvedValue({
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
            token_id: 12,
            balance: 1,
            owner_wallet: "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
            owner_display: "punk6529.eth",
            collection: "The Memes by 6529",
            collection_key: "MEMES",
            name: "The Memes #12",
            description: "A meme card.",
            artist: "An Artist",
            artist_seize_handle: "anartist",
            token_type: "ERC1155",
            media: {
              image: "https://media.6529.io/memes/12.png",
              image_preview: null,
              thumbnail: null,
              animation: null,
              animation_preview: null,
              mime_type: "image/png",
            },
            metadata: { name: "The Memes #12" },
            flags: { spam: false, excluded: false, exclusion_reason: null },
          },
          {
            contract: "0x33FD426905F149f8376e227d0C9D3340AaD17af1",
            token_id: 13,
            balance: 1,
            owner_wallet: "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
            owner_display: null,
            collection: "The Memes by 6529",
            collection_key: "MEMES",
            name: "The Memes #13",
            description: null,
            artist: null,
            artist_seize_handle: null,
            token_type: "ERC1155",
            media: {
              image: null,
              image_preview: null,
              thumbnail: null,
              animation: null,
              animation_preview: null,
              mime_type: null,
            },
            metadata: null,
            flags: { spam: false, excluded: false, exclusion_reason: null },
          },
        ],
        excluded_assets: [
          {
            contract: "0x0000000000000000000000000000000000dead",
            token_id: 1,
            owner_wallet: "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
            reason: "contract_excluded",
          },
        ],
        totals: {
          requested_wallets: 1,
          resolved_wallets: 1,
          unresolved_wallets: 0,
          indexed_assets: 2,
          visible_assets: 2,
          excluded_assets: 1,
          spam_assets: 0,
          truncated: false,
        },
      });

      const snapshot = await requestProfileCmsGallerySnapshot({
        handle: "punk6529",
        sources,
      });

      expect(commonApiPostMock).toHaveBeenCalledWith({
        endpoint: PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT,
        body: { wallets: ["punk6529.eth"] },
        errorMode: "structured",
      });
      expect(PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT).toBe(
        "profile-cms/wallet-gallery/snapshot"
      );

      expect(snapshot.source).toBe("backend");
      expect(snapshot.blockNumber).toBe(23000000);
      expect(snapshot.capturedAt).toBe(new Date(1750204800000).toISOString());
      expect(snapshot.assets).toHaveLength(2);
      expect(snapshot.assets[0]).toEqual(
        expect.objectContaining({
          id: "0x33fd426905f149f8376e227d0c9d3340aad17af1:12:0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
          title: "The Memes #12",
          collectionId: "MEMES",
          collectionName: "The Memes by 6529",
          tokenId: "12",
          owner: "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
          imageUri: "https://media.6529.io/memes/12.png",
          mediaState: "ready",
          altText: "The Memes #12",
          flags: { spam: false, excluded: false },
        })
      );
      expect(snapshot.assets[1]).toEqual(
        expect.objectContaining({
          mediaState: "missing",
          altText: "The Memes #13",
        })
      );
      expect(snapshot.assets[1]?.imageUri).toBeUndefined();

      expect(snapshot.collections).toHaveLength(1);
      expect(snapshot.collections[0]).toEqual(
        expect.objectContaining({
          id: "MEMES",
          name: "The Memes by 6529",
          assetIds: [
            "0x33fd426905f149f8376e227d0c9d3340aad17af1:12:0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
            "0x33fd426905f149f8376e227d0c9d3340aad17af1:13:0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
          ],
        })
      );

      expect(snapshot.excludedAssets).toEqual([
        {
          contract: "0x0000000000000000000000000000000000dead",
          tokenId: "1",
          owner: "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0",
          reason: "contract_excluded",
        },
      ]);
      expect(snapshot.totals).toEqual({
        requestedWallets: 1,
        resolvedWallets: 1,
        unresolvedWallets: 0,
        indexedAssets: 2,
        visibleAssets: 2,
        excludedAssets: 1,
        spamAssets: 0,
        truncated: false,
      });
    });
  });

  describe("draft lifecycle", () => {
    it("saves a draft against the real packages endpoint and returns the backend id/hash", async () => {
      process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
      const state = createDefaultCmsBuilderState("punk6529");
      const { cmsPackage } = validateCmsBuilderState(state);
      commonApiPostMock.mockResolvedValue({
        id: "draft-123",
        profile_id: "profile-punk6529",
        profile_handle: "punk6529",
        package_id: "pkg-punk6529-builder-mvp",
        version: 1,
        status: "draft",
        package_hash: cmsPackage.integrity.package_hash,
        payload_hash: cmsPackage.integrity.payload_hash,
        updated_at: 1750204800000,
        created_at: 1750204800000,
      });

      const result = await runProfileCmsBuilderAction({
        action: "save_draft",
        cmsPackage,
        profileId: "profile-punk6529",
      });

      expect(PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT).toBe(
        "profile-cms/packages"
      );
      expect(commonApiPostMock).toHaveBeenCalledWith({
        endpoint: "profile-cms/packages",
        body: { profile_id: "profile-punk6529", cms_package: cmsPackage },
        errorMode: "structured",
      });
      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          code: "draft_saved",
          draftId: "draft-123",
          packageHash: cmsPackage.integrity.package_hash,
        })
      );
    });

    it("posts server validation against the real validate endpoint", async () => {
      process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
      const state = createDefaultCmsBuilderState("punk6529");
      const { cmsPackage } = validateCmsBuilderState(state);
      commonApiPostMock.mockResolvedValue({
        schema: "6529.cms.validation_result.v1",
        valid: true,
        checked_at: "2026-06-18T00:00:00.000Z",
        issues: [],
        target: {
          package_hash: cmsPackage.integrity.package_hash,
        },
      });

      const result = await runProfileCmsBuilderAction({
        action: "validate",
        cmsPackage,
        profileId: "profile-punk6529",
      });

      expect(PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT).toBe(
        "profile-cms/packages/validate"
      );
      expect(commonApiPostMock).toHaveBeenCalledWith({
        endpoint: "profile-cms/packages/validate",
        body: {
          cms_package: cmsPackage,
          allow_fixture_signatures: true,
          allow_fixture_storage: true,
          enforce_hashes: true,
        },
        errorMode: "structured",
      });
      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          code: "server_validation_completed",
          packageHash: cmsPackage.integrity.package_hash,
        })
      );
    });

    it("keeps publish hard-blocked regardless of the API-enabled flag", async () => {
      process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
      const state = createDefaultCmsBuilderState("punk6529");
      const { cmsPackage } = validateCmsBuilderState(state);

      const result = await runProfileCmsBuilderAction({
        action: "publish",
        cmsPackage,
        draftId: "draft-123",
        profileId: "profile-punk6529",
      });

      expect(commonApiPostMock).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "publish_requires_signed_storage",
          expectedEndpoint: "profile-cms/packages/draft-123/publish",
        })
      );
    });

    it("models a rejected server validation as a failure that still carries the target", async () => {
      process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
      const state = createDefaultCmsBuilderState("punk6529");
      const { cmsPackage } = validateCmsBuilderState(state);
      const issue = {
        severity: "error",
        code: "package.hash_mismatch",
        message: "Package hash mismatch.",
        path: "/integrity/package_hash",
      };
      commonApiPostMock.mockResolvedValue({
        schema: "6529.cms.validation_result.v1",
        valid: false,
        checked_at: "2026-06-18T00:00:00.000Z",
        issues: [issue],
        target: {
          package_hash: cmsPackage.integrity.package_hash,
          draft_id: "draft-from-validate",
        },
      });

      const result = await runProfileCmsBuilderAction({
        action: "validate",
        cmsPackage,
        profileId: "profile-punk6529",
      });

      expect(result).toEqual({
        ok: false,
        action: "validate",
        code: "server_validation_invalid",
        expectedEndpoint: "profile-cms/packages/validate",
        draftId: "draft-from-validate",
        packageHash: cmsPackage.integrity.package_hash,
        serverIssues: [issue],
      });
    });

    it("lists saved packages for a profile from the real profile packages endpoint", async () => {
      process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
      commonApiFetchMock.mockResolvedValue([
        {
          id: "draft-123",
          package: { schema: "6529.cms.package.v1" },
          profile_id: "profile-punk6529",
          profile_handle: "punk6529",
          package_id: "pkg-punk6529-builder-mvp",
          version: 2,
          status: "draft",
          package_hash: "sha256:abc",
          payload_hash: "sha256:def",
          updated_at: 1750204800000,
          created_at: 1750204700000,
        },
      ]);

      const records =
        await listProfileCmsPackagesForProfile("profile-punk6529");

      expect(commonApiFetchMock).toHaveBeenCalledWith({
        endpoint: "profile-cms/profiles/profile-punk6529/packages",
      });
      expect(records).toEqual([
        {
          id: "draft-123",
          profileId: "profile-punk6529",
          profileHandle: "punk6529",
          packageId: "pkg-punk6529-builder-mvp",
          version: 2,
          status: "draft",
          packageHash: "sha256:abc",
          payloadHash: "sha256:def",
          updatedAt: new Date(1750204800000).toISOString(),
          createdAt: new Date(1750204700000).toISOString(),
        },
      ]);
    });

    it("gets a single package by id and validates its stored V1 payload", async () => {
      process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
      const state = createDefaultCmsBuilderState("punk6529");
      const { cmsPackage } = validateCmsBuilderState(state);
      commonApiFetchMock.mockResolvedValue({
        id: "draft-123",
        package: cmsPackage,
        profile_id: "profile-punk6529",
        profile_handle: "punk6529",
        package_id: "pkg-punk6529-builder-mvp",
        version: 1,
        status: "published",
        package_hash: cmsPackage.integrity.package_hash,
        payload_hash: cmsPackage.integrity.payload_hash,
        updated_at: 1750204800000,
        created_at: 1750204700000,
        published_at: 1750204900000,
      });

      const record = await getProfileCmsPackageById("draft-123");

      expect(commonApiFetchMock).toHaveBeenCalledWith({
        endpoint: "profile-cms/packages/draft-123",
      });
      expect(record).toEqual(
        expect.objectContaining({
          id: "draft-123",
          status: "published",
          publishedAt: new Date(1750204900000).toISOString(),
          cmsPackage,
        })
      );
    });

    it("rejects stored packages that fail local V1 validation on load", async () => {
      process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
      commonApiFetchMock.mockResolvedValue({
        id: "draft-123",
        package: { schema: "not-a-cms-package" },
        profile_id: "profile-punk6529",
        profile_handle: "punk6529",
        package_id: "pkg-punk6529-builder-mvp",
        version: 1,
        status: "draft",
        package_hash: "sha256:abc",
        payload_hash: "sha256:def",
        updated_at: 1750204800000,
        created_at: 1750204700000,
      });

      await expect(getProfileCmsPackageById("draft-123")).rejects.toThrow(
        "invalid_profile_cms_package"
      );
    });

    it("refuses draft list/load reads while the builder API flag is disabled", async () => {
      await expect(
        listProfileCmsPackagesForProfile("profile-punk6529")
      ).rejects.toThrow("profile_cms_builder_api_disabled");
      await expect(getProfileCmsPackageById("draft-123")).rejects.toThrow(
        "profile_cms_builder_api_disabled"
      );
      expect(commonApiFetchMock).not.toHaveBeenCalled();
    });
  });
});
