import {
  getProfileCmsPrimaryPackageHash,
  isProfileCmsPointerOnChainError,
  rollbackProfileCmsPackage,
  unpublishProfileCmsPackage,
  type ProfileCmsPackageRecord,
} from "@/lib/profile-cms/builder/api";
import {
  makeProfileSitePrimary,
  ProfileSiteMoveFailed,
  unpublishProfileSite,
} from "@/lib/profile-cms/builder/pointer-actions";
import { cmsCidFromHash } from "@/lib/profile-cms/chain/cms-cid";
import {
  ProfileDocWriteError,
  registerProfileDocWriter,
  type ProfileDocWriter,
} from "@/lib/profile-cms/chain/profile-doc-writer";

jest.mock("@/lib/profile-cms/builder/api", () => ({
  getProfileCmsPrimaryPackageHash: jest.fn(),
  isProfileCmsPointerOnChainError: jest.fn(),
  rollbackProfileCmsPackage: jest.fn(),
  unpublishProfileCmsPackage: jest.fn(),
}));

const PACKAGE_HASH = `sha256:${"3".repeat(64)}`;
const record: ProfileCmsPackageRecord = {
  id: "draft-3",
  profileId: "profile-1",
  profileHandle: "testhandle",
  packageId: "profile-native-home",
  version: 3,
  status: "superseded",
  isPrimary: false,
  packageHash: PACKAGE_HASH,
  payloadHash: `sha256:${"1".repeat(64)}`,
  createdAt: "2026-11-20T00:00:00.000Z",
  updatedAt: "2026-11-20T00:00:00.000Z",
  publicationCid: "bafkreie5cyyazg2mwjwk7foh6qhhev4ize3dkpz5656e6ty6sjn4zyfzjq",
};
const onChain = new Error("Profile sites now change on the 6529 Network.");

function recordingWriter() {
  const docs: Record<string, string>[] = [];
  const writer: ProfileDocWriter = {
    availableSigners: async () => ["wallet"],
    replaceProfileDoc: async (edit) => {
      docs.push(
        Object.fromEntries(edit(new Map([["cms.archive", "bafkreiarchive"]])))
      );
      return { txId: "0x01" };
    },
    uploadDocuments: async () => undefined,
  };
  registerProfileDocWriter(writer);
  return docs;
}

describe("profile site pointer actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(isProfileCmsPointerOnChainError)
      .mockImplementation((error) => error === onChain);
  });
  afterEach(() => registerProfileDocWriter(null));

  it("roll back on 6529.io while it still moves the pointer", async () => {
    const docs = recordingWriter();
    jest.mocked(rollbackProfileCmsPackage).mockResolvedValue(record);
    expect(
      await makeProfileSitePrimary(record, {
        expected_current_package_id: null,
      })
    ).toBe("done");
    expect(rollbackProfileCmsPackage).toHaveBeenCalledWith("draft-3", {
      expected_current_package_id: null,
    });
    expect(docs).toEqual([]);
  });

  it("roll back on the chain to the version's signed publication", async () => {
    const docs = recordingWriter();
    jest.mocked(rollbackProfileCmsPackage).mockRejectedValue(onChain);
    jest
      .mocked(getProfileCmsPrimaryPackageHash)
      .mockResolvedValue(PACKAGE_HASH);
    expect(
      await makeProfileSitePrimary(record, {
        expected_current_package_id: null,
      })
    ).toBe("done");
    expect(docs).toEqual([
      {
        "cms.archive": "bafkreiarchive",
        "cms.primary.package": cmsCidFromHash(PACKAGE_HASH),
        "cms.primary.publication": record.publicationCid,
      },
    ]);
  });

  it("report a chain rollback 6529.io doesn't show yet as pending, not done", async () => {
    recordingWriter();
    jest.mocked(rollbackProfileCmsPackage).mockRejectedValue(onChain);
    jest.mocked(getProfileCmsPrimaryPackageHash).mockResolvedValue(null);
    jest.useFakeTimers();
    try {
      const outcome = makeProfileSitePrimary(record, {
        expected_current_package_id: null,
      });
      await jest.runAllTimersAsync();
      expect(await outcome).toBe("pending");
    } finally {
      jest.useRealTimers();
    }
  });

  it("pass 6529.io's refusal of a version through, before any signature", async () => {
    const docs = recordingWriter();
    const refused = new Error("This version can't be the site.");
    jest.mocked(rollbackProfileCmsPackage).mockRejectedValue(refused);
    await expect(
      makeProfileSitePrimary(record, { expected_current_package_id: null })
    ).rejects.toBe(refused);
    expect(docs).toEqual([]);
  });

  it("refuse a chain rollback to a version without a signed publication", async () => {
    recordingWriter();
    jest.mocked(rollbackProfileCmsPackage).mockRejectedValue(onChain);
    await expect(
      makeProfileSitePrimary(
        { ...record, publicationCid: undefined },
        { expected_current_package_id: null }
      )
    ).rejects.toThrow("no signed publication");
  });

  it("unpublish on the chain by dropping the site", async () => {
    const docs = recordingWriter();
    jest.mocked(unpublishProfileCmsPackage).mockRejectedValue(onChain);
    jest.mocked(getProfileCmsPrimaryPackageHash).mockResolvedValue(null);
    expect(await unpublishProfileSite(record)).toBe("done");
    expect(docs).toEqual([{ "cms.archive": "bafkreiarchive" }]);
  });

  it("pass other errors through", async () => {
    const other = new Error("conflict");
    jest.mocked(unpublishProfileCmsPackage).mockRejectedValue(other);
    await expect(unpublishProfileSite(record)).rejects.toBe(other);
  });

  it("fail with the profile tools' own words when the change is refused", async () => {
    const words = "Switch your wallet to 0x0000…0001 and try again.";
    registerProfileDocWriter({
      availableSigners: async () => ["wallet"],
      replaceProfileDoc: async () => {
        throw new ProfileDocWriteError("submit_failed", words);
      },
      uploadDocuments: async () => undefined,
    });
    jest.mocked(unpublishProfileCmsPackage).mockRejectedValue(onChain);
    const failure = await unpublishProfileSite(record).then(
      () => null,
      (error: unknown) => error
    );
    expect(failure).toBeInstanceOf(ProfileSiteMoveFailed);
    expect((failure as Error).message).toBe(words);
  });

  it("fail when this browser can't sign profile changes", async () => {
    jest.mocked(unpublishProfileCmsPackage).mockRejectedValue(onChain);
    await expect(unpublishProfileSite(record)).rejects.toThrow(
      "can't sign profile changes"
    );
  });
});
