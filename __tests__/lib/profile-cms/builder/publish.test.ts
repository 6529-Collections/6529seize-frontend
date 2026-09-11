import { ethers } from "ethers";
import { getAddress, hashTypedData } from "viem";

import {
  getProfileCmsPackageById,
  listProfileCmsPackagesForProfile,
  runProfileCmsBuilderAction,
  uploadProfileCmsPackageStorage,
  publishProfileCmsPackage,
  type ProfileCmsStorageReceipt,
} from "@/lib/profile-cms/builder/api";
import {
  buildProfileCmsPublishTypedData,
  getProfileCmsPublishedUrl,
  runProfileCmsPublish,
  signAndPublishProfileCms,
  PROFILE_CMS_PUBLISH_DEADLINE_MS,
  PROFILE_CMS_PUBLISH_DOMAIN_NAME,
  PROFILE_CMS_PUBLISH_DOMAIN_VERSION,
  type ProfileCmsPublishContext,
  type ProfileCmsSignTypedData,
} from "@/lib/profile-cms/builder/publish";
import { createDefaultCmsBuilderState } from "@/lib/profile-cms/builder/package";
import { validateCmsBuilderState } from "@/lib/profile-cms/builder/package";

jest.mock("@/lib/profile-cms/builder/api", () => ({
  listProfileCmsPackagesForProfile: jest.fn(),
  getProfileCmsPackageById: jest.fn(),
  runProfileCmsBuilderAction: jest.fn(),
  uploadProfileCmsPackageStorage: jest.fn(),
  publishProfileCmsPackage: jest.fn(),
}));

const runActionMock = runProfileCmsBuilderAction as jest.Mock;
const uploadMock = uploadProfileCmsPackageStorage as jest.Mock;
const publishMock = publishProfileCmsPackage as jest.Mock;

const RECEIPT: ProfileCmsStorageReceipt = {
  provider: "arweave",
  uri: "ar://tx-abc",
  content_hash: `sha256:${"2".repeat(64)}`,
  provider_content_id: "tx-abc",
  canonical: true,
  recorded_at: "2026-07-05T00:00:00.000Z",
};

const buildPackage = () => {
  const state = createDefaultCmsBuilderState("punk6529");
  return validateCmsBuilderState(state).cmsPackage;
};

const okSign =
  (signature = `0x${"a".repeat(130)}`): ProfileCmsSignTypedData =>
  async () => ({ ok: true, signature });

const publishedRecord = {
  id: "draft-1",
  profileId: "profile-1",
  profileHandle: "punk6529",
  packageId: "pkg-punk6529-builder-mvp",
  version: 1,
  status: "published" as const,
  packageHash: `sha256:${"2".repeat(64)}`,
  payloadHash: `sha256:${"1".repeat(64)}`,
  updatedAt: "2026-07-05T00:00:00.000Z",
  createdAt: "2026-07-05T00:00:00.000Z",
  publishedAt: "2026-07-05T00:00:00.000Z",
};

const mockSaveOk = () =>
  runActionMock.mockImplementation(async ({ action }) => {
    if (action === "save_draft") {
      return {
        ok: true,
        action: "save_draft",
        code: "draft_saved",
        draftId: "draft-1",
        version: 1,
        packageHash: `sha256:${"2".repeat(64)}`,
        payloadHash: `sha256:${"1".repeat(64)}`,
      };
    }
    return {
      ok: true,
      action: "validate",
      code: "server_validation_completed",
      packageHash: `sha256:${"2".repeat(64)}`,
    };
  });

describe("profile CMS publish orchestration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (listProfileCmsPackagesForProfile as jest.Mock).mockResolvedValue([]);
    (getProfileCmsPackageById as jest.Mock).mockResolvedValue({
      ...publishedRecord,
      cmsPackage: { ...buildPackage(), storage: [RECEIPT] },
    });
  });

  describe("typed data construction", () => {
    it("matches the backend EIP-712 domain and type field order/values", () => {
      // Backend fixture from
      // 6529seize-backend/src/profile-cms/profile-cms-signing.test.ts
      const context: ProfileCmsPublishContext = {
        draftId: "draft-1",
        profileId: "profile-1",
        handle: "punk6529bot",
        packageId: "profile-native-home",
        version: 1,
        payloadHash: `sha256:${"1".repeat(64)}`,
        packageHash: `sha256:${"2".repeat(64)}`,
        primaryPath: "/punk6529bot/index.html",
        receipt: {
          provider: "ipfs",
          uri: "ipfs://bafybeigdyrztmrgfydgytzqojqfaytmqmvqwxqk66xcs4i6hj5yq",
          content_hash: `sha256:${"2".repeat(64)}`,
          canonical: true,
          recorded_at: "2026-07-05T00:00:00.000Z",
        },
      };
      const typedData = buildProfileCmsPublishTypedData({
        context,
        chainId: 1,
        deadline: 1792345678000,
      });

      expect(typedData.domain).toEqual({
        name: PROFILE_CMS_PUBLISH_DOMAIN_NAME,
        version: PROFILE_CMS_PUBLISH_DOMAIN_VERSION,
        chainId: 1,
      });
      expect(typedData.types.ProfileCmsPublish.map((f) => f.name)).toEqual([
        "action",
        "profileId",
        "handle",
        "packageId",
        "version",
        "draftId",
        "payloadHash",
        "packageHash",
        "primaryPath",
        "storageProvider",
        "storageUri",
        "storageContentHash",
        "deadline",
      ]);

      // Replicate the backend fixture's expected typed-data hash exactly, using
      // both ethers (backend uses ethers.TypedDataEncoder.hash) and viem.
      const expectedHash =
        "0x1fe21ab2829931ed7cd8777ad1ead3300701b7e8d5dcc2e56de8be396e3b0372";
      expect(
        ethers.TypedDataEncoder.hash(
          {
            ...typedData.domain,
            verifyingContract: typedData.domain.verifyingContract ?? null,
          },
          { ProfileCmsPublish: [...typedData.types.ProfileCmsPublish] },
          typedData.message
        )
      ).toBe(expectedHash);
      expect(
        hashTypedData({
          domain: {
            ...typedData.domain,
            verifyingContract: typedData.domain.verifyingContract
              ? getAddress(typedData.domain.verifyingContract)
              : undefined,
          },
          types: typedData.types,
          primaryType: "ProfileCmsPublish",
          message: {
            ...typedData.message,
            version: BigInt(typedData.message.version),
            deadline: BigInt(typedData.message.deadline),
          },
        })
      ).toBe(expectedHash);
    });

    it("adds verifyingContract to the domain only when provided", () => {
      const context: ProfileCmsPublishContext = {
        draftId: "d",
        profileId: "p",
        handle: "h",
        packageId: "pkg",
        version: 2,
        payloadHash: "sha256:aa",
        packageHash: "sha256:bb",
        primaryPath: "/h/index.html",
        receipt: RECEIPT,
      };
      const withContract = buildProfileCmsPublishTypedData({
        context,
        chainId: 1,
        deadline: 1,
        verifyingContract: "0x0000000000000000000000000000000000000001",
      });
      expect(withContract.domain.verifyingContract).toBe(
        "0x0000000000000000000000000000000000000001"
      );
      const withoutContract = buildProfileCmsPublishTypedData({
        context,
        chainId: 1,
        deadline: 1,
      });
      expect(withoutContract.domain.verifyingContract).toBeUndefined();
    });
  });

  describe("happy path", () => {
    it("sequences save -> validate -> upload -> sign -> publish and returns the URL", async () => {
      mockSaveOk();
      uploadMock.mockResolvedValue(RECEIPT);
      publishMock.mockResolvedValue(publishedRecord);
      const signTypedData = jest.fn(okSign());

      const result = await runProfileCmsPublish({
        cmsPackage: buildPackage(),
        profileId: "profile-1",
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData,
        now: () => 1_000_000,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.publishedUrl).toBe("https://6529.io/punk6529/index.html");
      }
      // Ordering: save + validate before upload before publish.
      expect(runActionMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ action: "save_draft" })
      );
      expect(runActionMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ action: "validate" })
      );
      expect(uploadMock).toHaveBeenCalledWith("draft-1");
      expect(signTypedData).toHaveBeenCalledTimes(1);
      // Publish carries the signature, chain id, deadline and expected hashes.
      const publishArgs = publishMock.mock.calls[0];
      expect(publishArgs[0]).toBe("draft-1");
      expect(publishArgs[1]).toEqual(
        expect.objectContaining({
          signer_address: "0xabc",
          chain_id: 1,
          deadline: 1_000_000 + PROFILE_CMS_PUBLISH_DEADLINE_MS,
          expected_package_hash: `sha256:${"2".repeat(64)}`,
          expected_payload_hash: `sha256:${"1".repeat(64)}`,
        })
      );
      expect(publishArgs[1]).not.toHaveProperty("is_safe_signature");
    });

    it("sets is_safe_signature for Safe wallets", async () => {
      mockSaveOk();
      uploadMock.mockResolvedValue(RECEIPT);
      publishMock.mockResolvedValue(publishedRecord);

      await runProfileCmsPublish({
        cmsPackage: buildPackage(),
        profileId: "profile-1",
        chainId: 1,
        signerAddress: "0xsafe",
        signTypedData: okSign(),
        isSafe: true,
      });

      expect(publishMock.mock.calls[0][1]).toEqual(
        expect.objectContaining({ is_safe_signature: true })
      );
    });
  });

  describe("failure branches", () => {
    it.each([
      [undefined, "response lost"],
      [502, "cms_storage_upload_failed"],
      [503, "cms_storage_pending"],
      [409, "cms_upload_in_progress"],
    ])(
      "resumes the same saved draft after core upload fails with %s %s",
      async (status, message) => {
        mockSaveOk();
        (listProfileCmsPackagesForProfile as jest.Mock).mockResolvedValue([
          { ...publishedRecord, id: "previous-db-id", isPrimary: true },
        ]);
        uploadMock
          .mockRejectedValueOnce(Object.assign(new Error(message), { status }))
          .mockResolvedValueOnce(RECEIPT);
        publishMock.mockResolvedValueOnce(publishedRecord);
        const input = {
          cmsPackage: buildPackage(),
          profileId: "profile-1",
          chainId: 1,
          signerAddress: "0xabc",
          signTypedData: jest.fn(okSign()),
        };
        const first = await runProfileCmsPublish(input);
        expect(first.ok).toBe(false);
        if (first.ok || !first.uploadContext)
          throw new Error("expected resumable upload");
        expect(input.signTypedData).not.toHaveBeenCalled();
        const second = await runProfileCmsPublish({
          ...input,
          uploadContext: first.uploadContext,
        });
        expect(second.ok).toBe(true);
        expect(
          runActionMock.mock.calls.filter(
            ([request]) => request.action === "save_draft"
          )
        ).toHaveLength(1);
        expect(uploadMock.mock.calls).toEqual([["draft-1"], ["draft-1"]]);
        expect(input.signTypedData).toHaveBeenCalledTimes(1);
        expect(publishMock.mock.calls[0][1]).toEqual(
          expect.objectContaining({
            expected_current_package_id: "previous-db-id",
          })
        );
      }
    );

    it.each(["package", "profile", "wallet", "chain", "server_hash"])(
      "discards upload retry context when %s changes",
      async (change) => {
        mockSaveOk();
        uploadMock.mockRejectedValueOnce(
          Object.assign(new Error("cms_storage_upload_failed"), { status: 502 })
        );
        const input = {
          cmsPackage: buildPackage(),
          profileId: "profile-1",
          chainId: 1,
          signerAddress: "0xabc",
          signTypedData: jest.fn(okSign()),
        };
        const first = await runProfileCmsPublish(input);
        if (first.ok || !first.uploadContext)
          throw new Error("expected resumable upload");
        if (change === "server_hash")
          (getProfileCmsPackageById as jest.Mock).mockResolvedValueOnce({
            ...publishedRecord,
            packageHash: "different",
            cmsPackage: input.cmsPackage,
          });
        const second = await runProfileCmsPublish({
          ...input,
          ...(change === "package"
            ? {
                cmsPackage: {
                  ...input.cmsPackage,
                  integrity: {
                    ...input.cmsPackage.integrity,
                    package_hash: "sha256:changed",
                  },
                },
              }
            : {}),
          ...(change === "profile" ? { profileId: "profile-2" } : {}),
          ...(change === "wallet" ? { signerAddress: "0xdef" } : {}),
          ...(change === "chain" ? { chainId: 2 } : {}),
          uploadContext: first.uploadContext,
        });
        expect(second).toEqual(
          expect.objectContaining({ ok: false, code: "publish_conflict" })
        );
        expect(second).not.toHaveProperty("uploadContext");
        expect(second).not.toHaveProperty("context");
        expect(uploadMock).toHaveBeenCalledTimes(1);
        expect(input.signTypedData).not.toHaveBeenCalled();
      }
    );

    it.each([
      [400, "cms_package_hash_mismatch"],
      [403, "cms_profile_changed"],
      [409, "cms_primary_changed"],
    ])(
      "discards core-upload retry context after nonretryable %s %s",
      async (status, message) => {
        mockSaveOk();
        uploadMock.mockRejectedValueOnce(
          Object.assign(new Error(message), { status })
        );
        const result = await runProfileCmsPublish({
          cmsPackage: buildPackage(),
          profileId: "profile-1",
          chainId: 1,
          signerAddress: "0xabc",
          signTypedData: okSign(),
        });
        expect(result).toEqual(
          expect.objectContaining({ ok: false, code: "upload_failed" })
        );
        expect(result).not.toHaveProperty("uploadContext");
      }
    );

    it("aborts before upload when server validation is invalid", async () => {
      runActionMock.mockImplementation(async ({ action }) => {
        if (action === "save_draft") {
          return {
            ok: true,
            action: "save_draft",
            code: "draft_saved",
            draftId: "draft-1",
            version: 1,
          };
        }
        return {
          ok: false,
          action: "validate",
          code: "server_validation_invalid",
          expectedEndpoint: "profile-cms/packages/validate",
        };
      });

      const result = await runProfileCmsPublish({
        cmsPackage: buildPackage(),
        profileId: "profile-1",
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData: okSign(),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("server_validation_invalid");
        expect(result.step).toBe("validate");
      }
      expect(uploadMock).not.toHaveBeenCalled();
      expect(publishMock).not.toHaveBeenCalled();
    });

    it("reports an upload failure and does not sign", async () => {
      mockSaveOk();
      uploadMock.mockRejectedValue(new Error("bad key"));
      const signTypedData = jest.fn(okSign());

      const result = await runProfileCmsPublish({
        cmsPackage: buildPackage(),
        profileId: "profile-1",
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("upload_failed");
        expect(result.step).toBe("upload");
      }
      expect(signTypedData).not.toHaveBeenCalled();
      expect(publishMock).not.toHaveBeenCalled();
    });

    it("reports a signature rejection and does not publish, keeping the context", async () => {
      mockSaveOk();
      uploadMock.mockResolvedValue(RECEIPT);
      const signTypedData: ProfileCmsSignTypedData = async () => ({
        ok: false,
        rejected: true,
      });

      const result = await runProfileCmsPublish({
        cmsPackage: buildPackage(),
        profileId: "profile-1",
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("signature_rejected");
        expect(result.step).toBe("sign");
        expect(result.context).toBeDefined();
      }
      expect(publishMock).not.toHaveBeenCalled();
    });

    it("maps a publish 4xx into a publish_failed result", async () => {
      mockSaveOk();
      uploadMock.mockResolvedValue(RECEIPT);
      const error = Object.assign(new Error("wrong owner"), { status: 403 });
      publishMock.mockRejectedValue(error);

      const result = await runProfileCmsPublish({
        cmsPackage: buildPackage(),
        profileId: "profile-1",
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData: okSign(),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("publish_failed");
        expect(result.step).toBe("publish");
      }
    });

    it("detects a deadline-expiry 400 and allows re-signing with a fresh deadline", async () => {
      const context: ProfileCmsPublishContext = {
        draftId: "draft-1",
        profileId: "profile-1",
        handle: "punk6529",
        packageId: "pkg-punk6529-builder-mvp",
        version: 1,
        payloadHash: `sha256:${"1".repeat(64)}`,
        packageHash: `sha256:${"2".repeat(64)}`,
        primaryPath: "/punk6529/index.html",
        receipt: RECEIPT,
      };
      const deadlineError = Object.assign(
        new Error("publish deadline is in the past"),
        { status: 400 }
      );
      publishMock.mockRejectedValueOnce(deadlineError);

      const first = await signAndPublishProfileCms({
        context,
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData: okSign(),
        now: () => 1_000,
      });
      expect(first.ok).toBe(false);
      if (!first.ok) {
        expect(first.code).toBe("deadline_expired");
        expect(first.context).toBeDefined();
      }

      // Re-sign with a fresh (later) deadline and succeed.
      publishMock.mockResolvedValueOnce(publishedRecord);
      const second = await signAndPublishProfileCms({
        context,
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData: okSign(),
        now: () => 2_000_000,
      });
      expect(second.ok).toBe(true);
      expect(publishMock.mock.calls[1][1].deadline).toBe(
        2_000_000 + PROFILE_CMS_PUBLISH_DEADLINE_MS
      );
    });

    it("reports save failure before validating", async () => {
      runActionMock.mockResolvedValue({
        ok: false,
        action: "save_draft",
        code: "request_failed",
        expectedEndpoint: "profile-cms/packages",
      });

      const result = await runProfileCmsPublish({
        cmsPackage: buildPackage(),
        profileId: "profile-1",
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData: okSign(),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("save_failed");
      }
      expect(uploadMock).not.toHaveBeenCalled();
    });
  });

  describe("published url", () => {
    it.each([
      "/punk6529/../identity/index.html",
      "/punk6529/%2e%2e/identity/index.html",
      "/punk6529/..\\identity/index.html",
    ])("keeps a normalized visitor URL inside the profile for %s", (path) => {
      expect(
        getProfileCmsPublishedUrl("punk6529", "https://6529.io", path)
      ).toBe("https://6529.io/punk6529/index.html");
    });
    it("builds the canonical /{handle}/index.html url", () => {
      expect(getProfileCmsPublishedUrl("punk6529")).toBe(
        "https://6529.io/punk6529/index.html"
      );
      expect(
        getProfileCmsPublishedUrl("punk6529", "https://staging.6529.io")
      ).toBe("https://staging.6529.io/punk6529/index.html");
    });

    it("uses the canonical saved site's readable path without changing the signed root", async () => {
      const cmsPackage = buildPackage();
      const studioPackage = {
        ...cmsPackage,
        site: { ...cmsPackage.site, base_path: "/punk6529/studio/index.html" },
        payload: {
          ...cmsPackage.payload,
          pages: cmsPackage.payload.pages.map((page) => ({
            ...page,
            path: "/punk6529/studio/index.html",
          })),
          routes: [
            {
              path: "/punk6529/index.html",
              kind: "alias" as const,
              target: "/punk6529/studio/index.html",
            },
            {
              path: "/punk6529/studio/index.html",
              kind: "page" as const,
              page_id: "page-home",
            },
          ],
        },
        storage: [RECEIPT],
      };
      mockSaveOk();
      (getProfileCmsPackageById as jest.Mock).mockResolvedValue({
        ...publishedRecord,
        cmsPackage: studioPackage,
      });
      uploadMock.mockResolvedValue(RECEIPT);
      publishMock.mockResolvedValue(publishedRecord);
      const signTypedData = jest.fn(okSign());
      const result = await runProfileCmsPublish({
        cmsPackage,
        profileId: "profile-1",
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData,
      });
      expect(result).toMatchObject({
        ok: true,
        publishedUrl: "https://6529.io/punk6529/studio",
      });
      expect(signTypedData.mock.calls[0]?.[0].message.primaryPath).toBe(
        "/punk6529/index.html"
      );
    });
  });

  it.each([
    [503, "cms_storage_pending", "storage_pending"],
    [409, "cms_upload_in_progress", "storage_pending"],
    [502, "cms_storage_upload_failed", "publish_failed"],
  ])(
    "retains the exact signature and current-primary guard after %s %s",
    async (status, message, code) => {
      mockSaveOk();
      (listProfileCmsPackagesForProfile as jest.Mock).mockResolvedValue([
        { ...publishedRecord, id: "previous-db-id", isPrimary: true },
      ]);
      uploadMock.mockResolvedValue(RECEIPT);
      publishMock.mockRejectedValueOnce(
        Object.assign(new Error(message), { status })
      );
      const sign = jest.fn(okSign());
      const first = await runProfileCmsPublish({
        cmsPackage: buildPackage(),
        profileId: "profile-1",
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData: sign,
        now: () => 1_000,
      });
      expect(first.ok).toBe(false);
      if (first.ok || !first.context) throw new Error("expected retry context");
      expect(first.code).toBe(code);
      expect(first.signedRequest).toEqual(
        expect.objectContaining({
          expected_current_package_id: "previous-db-id",
          expected_current_package_hash: publishedRecord.packageHash,
        })
      );
      publishMock.mockResolvedValueOnce(publishedRecord);
      const second = await signAndPublishProfileCms({
        context: first.context,
        signedRequest: first.signedRequest,
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData: sign,
        now: () => 2_000,
      });
      expect(second.ok).toBe(true);
      expect(sign).toHaveBeenCalledTimes(1);
      expect(uploadMock).toHaveBeenCalledTimes(1);
      expect(
        runActionMock.mock.calls.filter(
          ([input]) => input.action === "save_draft"
        )
      ).toHaveLength(1);
      expect(publishMock.mock.calls[1][1]).toBe(publishMock.mock.calls[0][1]);
    }
  );

  it.each(["cms_primary_changed", "cms_profile_changed"])(
    "requires fresh preparation after a genuine 409 %s",
    async (message) => {
      mockSaveOk();
      uploadMock.mockResolvedValue(RECEIPT);
      publishMock.mockRejectedValueOnce(
        Object.assign(new Error(message), { status: 409 })
      );
      const result = await runProfileCmsPublish({
        cmsPackage: buildPackage(),
        profileId: "profile-1",
        chainId: 1,
        signerAddress: "0xabc",
        signTypedData: okSign(),
      });
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected a publication conflict");
      expect(result.code).toBe("publish_conflict");
      expect(result.context).toBeUndefined();
      expect(result.signedRequest).toBeUndefined();
    }
  );

  it("stops before publishing if the wallet context changes while signing", async () => {
    mockSaveOk();
    uploadMock.mockResolvedValue(RECEIPT);
    let current = true;
    const sign: ProfileCmsSignTypedData = async () => {
      current = false;
      return { ok: true, signature: "0xsig" };
    };
    const result = await runProfileCmsPublish({
      cmsPackage: buildPackage(),
      profileId: "profile-1",
      chainId: 1,
      signerAddress: "0xabc",
      signTypedData: sign,
      isCurrent: () => current,
    });
    expect(result.ok).toBe(false);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it("reports a completed replay honestly when its publication is no longer primary", async () => {
    mockSaveOk();
    uploadMock.mockResolvedValue(RECEIPT);
    publishMock.mockResolvedValue({
      ...publishedRecord,
      status: "superseded",
      isPrimary: false,
    });
    const result = await runProfileCmsPublish({
      cmsPackage: buildPackage(),
      profileId: "profile-1",
      chainId: 1,
      signerAddress: "0xabc",
      signTypedData: okSign(),
    });
    expect(result).toEqual(
      expect.objectContaining({ ok: true, isCurrent: false })
    );
  });

  it("rejects a mismatched persisted storage receipt before requesting a wallet signature", async () => {
    mockSaveOk();
    uploadMock.mockResolvedValue({ ...RECEIPT, uri: "ar://different" });
    const sign = jest.fn(okSign());
    const result = await runProfileCmsPublish({
      cmsPackage: buildPackage(),
      profileId: "profile-1",
      chainId: 1,
      signerAddress: "0xabc",
      signTypedData: sign,
    });
    expect(result).toEqual(
      expect.objectContaining({ ok: false, code: "upload_failed" })
    );
    expect(sign).not.toHaveBeenCalled();
    expect(publishMock).not.toHaveBeenCalled();
  });
});
