import {
  getProfileCmsPrimaryPackageHash,
  isProfileCmsPointerOnChainError,
} from "@/lib/profile-cms/builder/api";
import { normalizeProfileCmsPackageRecord } from "@/lib/profile-cms/builder/package-normalize";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => {
  const actual = jest.requireActual("@/services/api/common-api");
  return {
    ...actual,
    commonApiFetch: jest.fn(),
    commonApiPost: jest.fn(),
  };
});

const fetchMock = jest.mocked(commonApiFetch);

function apiError(status: number, body: unknown) {
  return Object.assign(new Error("request failed"), {
    status,
    response: { status, body: JSON.stringify(body) },
  });
}

describe("profile site chain helpers in the builder API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("recognizes 6529.io's refusal to move a pointer the chain owns", () => {
    expect(
      isProfileCmsPointerOnChainError(
        apiError(409, { error: "Reload", code: "cms_pointer_on_chain" })
      )
    ).toBe(true);
    expect(
      isProfileCmsPointerOnChainError(
        apiError(409, { error: "Changed", code: "cms_pointer_frozen" })
      )
    ).toBe(false);
    expect(isProfileCmsPointerOnChainError(new Error("x"))).toBe(false);
  });

  it("reads the primary package hash without wallet auth or cache", async () => {
    fetchMock.mockResolvedValue({ package_hash: "sha256:abc" });
    expect(await getProfileCmsPrimaryPackageHash("test handle")).toBe(
      "sha256:abc"
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "profile-cms/test%20handle/primary",
        includeWalletAuth: false,
        cache: "no-store",
      })
    );
  });

  it("reads a missing primary as none and passes other errors on", async () => {
    fetchMock.mockRejectedValueOnce(apiError(404, { error: "none" }));
    expect(await getProfileCmsPrimaryPackageHash("testhandle")).toBeNull();
    const failure = apiError(500, { error: "down" });
    fetchMock.mockRejectedValueOnce(failure);
    await expect(getProfileCmsPrimaryPackageHash("testhandle")).rejects.toBe(
      failure
    );
  });

  it("carries the publication CID on package records", () => {
    const base = {
      id: "draft-1",
      profile_id: "profile-1",
      profile_handle: "testhandle",
      package_id: "profile-native-home",
      version: 1,
      status: "draft",
      package_hash: "sha256:a",
      payload_hash: "sha256:b",
      updated_at: 1,
      created_at: 1,
      package: {},
    } as never;
    expect(
      normalizeProfileCmsPackageRecord({
        ...(base as object),
        publication_cid: "bafkreiabc",
      } as never).publicationCid
    ).toBe("bafkreiabc");
    expect(normalizeProfileCmsPackageRecord(base)).not.toHaveProperty(
      "publicationCid"
    );
  });

  it("decodes a chain publish answer's files", () => {
    const base = {
      id: "draft-1",
      profile_id: "profile-1",
      profile_handle: "testhandle",
      package_id: "profile-native-home",
      version: 1,
      status: "draft",
      package_hash: "sha256:a",
      payload_hash: "sha256:b",
      updated_at: 1,
      created_at: 1,
      package: {},
    } as never;
    const record = normalizeProfileCmsPackageRecord({
      ...(base as object),
      publication_cid: "bafkreipublication",
      chain_documents: {
        content_core: { cid: "bafkreicore", bytes_base64: btoa("core") },
        publication: {
          cid: "bafkreipublication",
          bytes_base64: btoa("record"),
        },
      },
    } as never);
    expect(record.chainDocuments?.contentCore.cid).toBe("bafkreicore");
    expect(
      new TextDecoder().decode(record.chainDocuments?.contentCore.bytes)
    ).toBe("core");
    expect(
      new TextDecoder().decode(record.chainDocuments?.publication.bytes)
    ).toBe("record");
    expect(normalizeProfileCmsPackageRecord(base)).not.toHaveProperty(
      "chainDocuments"
    );
  });
});
