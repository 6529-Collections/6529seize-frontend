import { publicEnv } from "@/config/env";
import {
  PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT,
  requestProfileCmsGallerySnapshot,
} from "@/lib/profile-cms/builder/api";
import { parseWalletGallerySources } from "@/lib/profile-cms/builder/gallery";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return { ...actual, publicEnv: { ...actual.publicEnv } };
});

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const commonApiPostMock = commonApiPost as jest.Mock;

describe("profile CMS builder API adapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete publicEnv.PROFILE_CMS_BUILDER_API_ENABLED;
    delete publicEnv.NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED;
  });

  it("uses the fixture snapshot fallback while backend gallery API is disabled", async () => {
    const sources = parseWalletGallerySources("punk6529.eth").sources;

    const snapshot = await requestProfileCmsGallerySnapshot({
      handle: "punk6529",
      profileId: "profile-punk6529",
      sources,
    });

    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(snapshot.source).toBe("fixture");
    expect(snapshot.assets).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "work-memes-1" })])
    );
  });

  it("posts the expected backend snapshot contract when the API is enabled", async () => {
    publicEnv.PROFILE_CMS_BUILDER_API_ENABLED = "true";
    const sources = parseWalletGallerySources("punk6529.eth").sources;
    commonApiPostMock.mockResolvedValue({
      snapshot_id: "snapshot-1",
      source: "backend",
      wallets: [
        {
          kind: "ens",
          input: "punk6529.eth",
          normalized: "punk6529.eth",
        },
      ],
      captured_at: "2026-06-18T00:00:00.000Z",
      block_number: 23000000,
      assets: [
        {
          id: "asset-1",
          title: "Backend Work",
          collection_id: "collection-1",
          collection_name: "Backend Collection",
          contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
          token_id: "1",
          chain_id: 1,
          owner: "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
          image_uri: "ipfs://backend/work.png",
          media_state: "ready",
        },
      ],
    });

    const snapshot = await requestProfileCmsGallerySnapshot({
      handle: "punk6529",
      profileId: "profile-punk6529",
      sources,
    });

    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT,
      body: {
        profile_id: "profile-punk6529",
        wallets: [
          {
            kind: "ens",
            input: "punk6529.eth",
            normalized: "punk6529.eth",
          },
        ],
      },
      errorMode: "structured",
    });
    expect(snapshot).toEqual(
      expect.objectContaining({
        snapshotId: "snapshot-1",
        source: "backend",
        blockNumber: 23000000,
      })
    );
    expect(snapshot.assets[0]).toEqual(
      expect.objectContaining({
        id: "asset-1",
        imageUri: "ipfs://backend/work.png",
      })
    );
    expect(snapshot.collections[0]).toEqual(
      expect.objectContaining({
        id: "collection-1",
        name: "Backend Collection",
        slug: "collection-1",
        assetIds: ["asset-1"],
      })
    );
  });
});
