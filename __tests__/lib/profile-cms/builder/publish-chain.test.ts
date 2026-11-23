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
import { sha256 } from "js-sha256";
import {
  cmsCidFromBytes,
  cmsCidFromHash,
} from "@/lib/profile-cms/chain/cms-cid";
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

// The signed site's two files: its content core (the package hash is its
// SHA-256) and its publication record.
const CORE_BYTES = new TextEncoder().encode('{"core":"of the signed site"}');
const PUBLICATION_BYTES = new TextEncoder().encode("{}");
const PACKAGE_HASH = `sha256:${sha256(CORE_BYTES)}`;
const PUBLICATION_CID = cmsCidFromBytes(PUBLICATION_BYTES);

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
  chainDocuments: {
    contentCore: { cid: cmsCidFromHash(PACKAGE_HASH), bytes: CORE_BYTES },
    publication: { cid: PUBLICATION_CID, bytes: PUBLICATION_BYTES },
  },
};

function writerRecording(outcome?: Error, uploadOutcome?: Error) {
  const docs: Record<string, string>[] = [];
  const uploads: string[] = [];
  const steps: string[] = [];
  const writer: ProfileDocWriter = {
    availableSigners: async () => ["session-key", "wallet"],
    replaceProfileDoc: async (edit) => {
      steps.push("replace");
      if (outcome) throw outcome;
      docs.push(Object.fromEntries(edit(new Map([["bio", "kept"]]))));
      return { txId: `0x${"cd".repeat(32)}` };
    },
    uploadDocuments: async (documents) => {
      steps.push("upload");
      if (uploadOutcome) throw uploadOutcome;
      uploads.push(...documents.map((document) => document.cid));
    },
  };
  return { writer, docs, uploads, steps };
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

  it("uploads the publish answer's files before the PROFILE_REPLACE that names them", async () => {
    const { writer, uploads, steps } = writerRecording();
    registerProfileDocWriter(writer);
    jest
      .mocked(getProfileCmsPrimaryPackageHash)
      .mockResolvedValue(PACKAGE_HASH);
    jest
      .mocked(getProfileCmsPackageById)
      .mockResolvedValue(signedDraft as never);

    const result = await publish();

    expect(uploads).toEqual([cmsCidFromHash(PACKAGE_HASH), PUBLICATION_CID]);
    expect(steps).toEqual(["upload", "replace"]);
    expect(result).toMatchObject({ ok: true });
  });

  it("signs nothing when the document store refuses the files, and keeps the signed request", async () => {
    const { writer, steps } = writerRecording(
      undefined,
      new ProfileDocWriteError(
        "upload_refused",
        "Too many files at once. Try again in a few minutes."
      )
    );
    registerProfileDocWriter(writer);

    const result = await publish();

    expect(steps).toEqual(["upload"]);
    expect(result).toMatchObject({
      ok: false,
      step: "publish",
      code: "chain_upload_failed",
      message: "Too many files at once. Try again in a few minutes.",
      signedRequest: expect.objectContaining({ signature: expect.any(String) }),
    });
  });

  it("uploads and names the files on a retry after a refused upload", async () => {
    const { writer, uploads, steps, docs } = writerRecording();
    registerProfileDocWriter(writer);
    const upload = writer.uploadDocuments.bind(writer);
    let first = true;
    writer.uploadDocuments = async (documents) => {
      if (first) {
        first = false;
        steps.push("upload");
        throw new ProfileDocWriteError(
          "upload_refused",
          "6529's document store couldn't take the files right now. Try again later."
        );
      }
      return upload(documents);
    };
    jest
      .mocked(getProfileCmsPrimaryPackageHash)
      .mockResolvedValue(PACKAGE_HASH);
    jest
      .mocked(getProfileCmsPackageById)
      .mockResolvedValue(signedDraft as never);

    expect(await publish()).toMatchObject({
      ok: false,
      code: "chain_upload_failed",
    });
    // The retry publishes again: 6529.io returns the recorded files.
    expect(await publish()).toMatchObject({ ok: true });
    expect(uploads).toEqual([cmsCidFromHash(PACKAGE_HASH), PUBLICATION_CID]);
    expect(steps).toEqual(["upload", "upload", "replace"]);
    expect(docs).toHaveLength(1);
  });

  it.each([
    [
      "a package hash other than the one signed",
      { packageHash: `sha256:${"3".repeat(64)}` },
    ],
    [
      "a content core other than the signed package's",
      {
        chainDocuments: {
          ...signedDraft.chainDocuments!,
          contentCore: {
            cid: cmsCidFromBytes(PUBLICATION_BYTES),
            bytes: PUBLICATION_BYTES,
          },
        },
      },
    ],
    [
      "a publication record other than the one recorded",
      {
        chainDocuments: {
          ...signedDraft.chainDocuments!,
          publication: { cid: cmsCidFromHash(PACKAGE_HASH), bytes: CORE_BYTES },
        },
      },
    ],
  ])("uploads and signs nothing for %s", async (_label, change) => {
    const { writer, steps } = writerRecording();
    registerProfileDocWriter(writer);
    jest
      .mocked(publishProfileCmsPackage)
      .mockResolvedValue({ ...signedDraft, ...change });

    expect(await publish()).toMatchObject({
      ok: false,
      code: "chain_upload_failed",
      message:
        "6529.io's answer doesn't match the site you signed. Try publishing again.",
    });
    expect(steps).toEqual([]);
  });

  it("uploads and signs nothing for a chain answer without its files", async () => {
    const { writer, steps } = writerRecording();
    registerProfileDocWriter(writer);
    jest
      .mocked(publishProfileCmsPackage)
      .mockResolvedValue({ ...signedDraft, chainDocuments: undefined });

    expect(await publish()).toMatchObject({
      ok: false,
      code: "chain_upload_failed",
    });
    expect(steps).toEqual([]);
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
