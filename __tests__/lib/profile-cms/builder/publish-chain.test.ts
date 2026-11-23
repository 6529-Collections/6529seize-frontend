import {
  getProfileCmsPackageById,
  getProfileCmsPrimaryPackageHash,
  publishProfileCmsPackage,
  type ProfileCmsPackageRecord,
} from "@/lib/profile-cms/builder/api";
import {
  signAndPublishProfileCms,
  type ProfileCmsPublishContext,
} from "@/lib/profile-cms/builder/publish";
import { cmsCidFromHash } from "@/lib/profile-cms/chain/cms-cid";
import {
  ProfileDocWriteError,
  registerProfileDocWriter,
  type ProfileDocWriter,
} from "@/lib/profile-cms/chain/profile-doc-writer";

jest.mock("@/lib/profile-cms/builder/api", () => ({
  getProfileCmsPackageById: jest.fn(),
  getProfileCmsPrimaryPackageHash: jest.fn(),
  listProfileCmsPackagesForProfile: jest.fn(),
  publishProfileCmsPackage: jest.fn(),
  runProfileCmsBuilderAction: jest.fn(),
  uploadProfileCmsPackageStorage: jest.fn(),
}));

const PACKAGE_HASH = `sha256:${"2".repeat(64)}`;
const PUBLICATION_CID =
  "bafkreie5cyyazg2mwjwk7foh6qhhev4ize3dkpz5656e6ty6sjn4zyfzjq";

const context: ProfileCmsPublishContext = {
  draftId: "draft-1",
  profileId: "profile-1",
  handle: "testhandle",
  packageId: "profile-native-home",
  version: 1,
  payloadHash: `sha256:${"1".repeat(64)}`,
  packageHash: PACKAGE_HASH,
  primaryPath: "/testhandle/index.html",
  receipt: {
    provider: "arweave",
    uri: "ar://tx-abc",
    content_hash: PACKAGE_HASH,
    canonical: true,
    recorded_at: "2026-11-25T00:00:00.000Z",
  },
};

const signedDraft: ProfileCmsPackageRecord = {
  id: "draft-1",
  profileId: "profile-1",
  profileHandle: "testhandle",
  packageId: "profile-native-home",
  version: 1,
  status: "draft",
  isPrimary: false,
  packageHash: PACKAGE_HASH,
  payloadHash: `sha256:${"1".repeat(64)}`,
  createdAt: "2026-11-25T00:00:00.000Z",
  updatedAt: "2026-11-25T00:00:00.000Z",
  publicationCid: PUBLICATION_CID,
};

function writerRecording(outcome?: Error) {
  const docs: Record<string, string>[] = [];
  const writer: ProfileDocWriter = {
    availableSigners: async () => ["session-key", "wallet"],
    replaceProfileDoc: async (edit) => {
      if (outcome) throw outcome;
      docs.push(Object.fromEntries(edit(new Map([["bio", "kept"]]))));
      return { txId: `0x${"cd".repeat(32)}` };
    },
  };
  return { writer, docs };
}

function publish() {
  return signAndPublishProfileCms({
    context,
    chainId: 1,
    signerAddress: "0x0000000000000000000000000000000000000001",
    signTypedData: async () => ({
      ok: true,
      signature: `0x${"a".repeat(130)}`,
    }),
    now: () => Date.parse("2026-11-25T00:00:00.000Z"),
  });
}

describe("publishing with profile sites on the 6529 chain", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(publishProfileCmsPackage).mockResolvedValue(signedDraft);
  });
  afterEach(() => registerProfileDocWriter(null));

  it("names the signed publication in the ProfileDoc and waits for the index", async () => {
    const { writer, docs } = writerRecording();
    registerProfileDocWriter(writer);
    jest
      .mocked(getProfileCmsPrimaryPackageHash)
      .mockResolvedValue(PACKAGE_HASH);
    const live = {
      ...signedDraft,
      status: "published" as const,
      isPrimary: true,
    };
    jest.mocked(getProfileCmsPackageById).mockResolvedValue(live as never);

    const result = await publish();

    expect(docs).toEqual([
      {
        bio: "kept",
        "cms.primary.package": cmsCidFromHash(PACKAGE_HASH),
        "cms.primary.publication": PUBLICATION_CID,
      },
    ]);
    expect(getProfileCmsPrimaryPackageHash).toHaveBeenCalledWith("testhandle");
    expect(result).toMatchObject({
      ok: true,
      isCurrent: true,
      pendingOnChain: false,
      published: { status: "published" },
    });
  });

  it("never moves the pointer to a published or superseded record a retry returns", async () => {
    const { writer, docs } = writerRecording();
    registerProfileDocWriter(writer);
    for (const status of ["superseded", "published"] as const) {
      jest.mocked(publishProfileCmsPackage).mockResolvedValue({
        ...signedDraft,
        status,
        isPrimary: status === "published",
      });
      const result = await publish();
      expect(result).toMatchObject({ ok: true, published: { status } });
    }
    expect(docs).toEqual([]);
  });

  it("reports a submitted change the index has not shown yet", async () => {
    registerProfileDocWriter(writerRecording().writer);
    jest.mocked(getProfileCmsPrimaryPackageHash).mockResolvedValue(null);
    jest.useFakeTimers();
    try {
      const pending = publish();
      await jest.runAllTimersAsync();
      expect(await pending).toMatchObject({
        ok: true,
        isCurrent: false,
        pendingOnChain: true,
        published: signedDraft,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps the signed request for a retry when the chain move fails", async () => {
    registerProfileDocWriter(
      writerRecording(new ProfileDocWriteError("submit_failed", "refused"))
        .writer
    );
    const result = await publish();
    expect(result).toMatchObject({
      ok: false,
      step: "publish",
      code: "chain_failed",
      context,
      signedRequest: {
        signer_address: "0x0000000000000000000000000000000000000001",
      },
    });
  });

  it("says so when this browser can't sign profile changes", async () => {
    expect(await publish()).toMatchObject({
      ok: false,
      code: "chain_unavailable",
    });
  });

  it("keeps the old path when 6529.io moves the pointer itself", async () => {
    jest.mocked(publishProfileCmsPackage).mockResolvedValue({
      ...signedDraft,
      publicationCid: undefined,
      status: "published",
      isPrimary: true,
    });
    expect(await publish()).toMatchObject({ ok: true, isCurrent: true });
    expect(getProfileCmsPrimaryPackageHash).not.toHaveBeenCalled();
  });
});
