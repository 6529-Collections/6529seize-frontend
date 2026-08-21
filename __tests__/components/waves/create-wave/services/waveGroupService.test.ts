import {
  getAdminGroupId,
  getOnlyMeGroupDescription,
  WaveAdminGroupError,
} from "@/components/waves/create-wave/services/waveGroupService";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const mockedCommonApiPost = commonApiPost as jest.Mock;

describe("waveGroupService", () => {
  beforeEach(() => {
    mockedCommonApiPost.mockReset();
  });

  it("builds the same creator-only criteria used by preview and submission", () => {
    expect(getOnlyMeGroupDescription("0xCreator")).toEqual(
      expect.objectContaining({
        identity_addresses: ["0xCreator"],
        excluded_identity_addresses: null,
        owns_nfts: [],
      })
    );
  });

  it("returns existing admin group id if provided", async () => {
    const result = await getAdminGroupId({
      adminGroupId: "123",
      primaryWallet: "0x1",
      handle: "alice",
      onError: jest.fn(),
    });
    expect(result).toBe("123");
    expect(mockedCommonApiPost).not.toHaveBeenCalled();
  });

  it("returns an actionable error when no primary wallet is available", async () => {
    const onError = jest.fn();
    const result = await getAdminGroupId({
      adminGroupId: null,
      primaryWallet: null,
      handle: "alice",
      onError,
    });
    expect(result).toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(WaveAdminGroupError));
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      reason: "missing-primary-wallet",
    });
  });

  it("creates and publishes a personal group when no admin group id exists", async () => {
    mockedCommonApiPost
      .mockResolvedValueOnce({ id: "new" }) // create group
      .mockResolvedValueOnce({}); // set visible
    const result = await getAdminGroupId({
      adminGroupId: null,
      primaryWallet: "0x1",
      handle: "alice",
      onError: jest.fn(),
    });
    expect(result).toBe("new");
    expect(mockedCommonApiPost).toHaveBeenCalledTimes(2);
    expect(mockedCommonApiPost).toHaveBeenNthCalledWith(2, {
      endpoint: "groups/new/visible",
      body: { visible: true, old_version_id: null },
      signal: undefined,
    });
  });

  it("reports whether personal-group creation failed", async () => {
    mockedCommonApiPost.mockRejectedValueOnce("create failed");
    const onError = jest.fn();

    const result = await getAdminGroupId({
      adminGroupId: null,
      primaryWallet: "0x1",
      handle: "alice",
      onError,
    });

    expect(result).toBeNull();
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      reason: "create-personal-group",
      cause: "create failed",
    });
  });

  it("reports whether personal-group publication failed", async () => {
    mockedCommonApiPost
      .mockResolvedValueOnce({ id: "new" })
      .mockRejectedValueOnce("publish failed");
    const onError = jest.fn();

    const result = await getAdminGroupId({
      adminGroupId: null,
      primaryWallet: "0x1",
      handle: "alice",
      onError,
    });

    expect(result).toBeNull();
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      reason: "publish-personal-group",
      cause: "publish failed",
    });
  });
});
