// Profile CMS publish orchestration.
//
// Sequences the full signed-storage publish flow end to end:
//   1. save draft   -> get server-authoritative id/version/hashes
//   2. validate     -> server must report the package valid
//   3. storage      -> upload canonical JSON, get the persisted receipt
//   4. sign         -> build EIP-712 typed data and request a wallet signature
//   5. publish      -> POST the signature + chain metadata
//
// The typed data is constructed field-for-field to match the backend domain and
// `ProfileCmsPublish` type in
// 6529seize-backend/src/profile-cms/profile-cms-signing.ts. All hashes, handle,
// version, package id and draft id come from server responses (never fabricated
// client-side); the storage receipt comes from the backend upload endpoint.
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import {
  publishProfileCmsPackage,
  runProfileCmsBuilderAction,
  uploadProfileCmsPackageStorage,
  type ProfileCmsPackageRecord,
  type ProfileCmsPublishRequest,
  type ProfileCmsStorageReceipt,
} from "@/lib/profile-cms/builder/api";

// EIP-712 domain — must match PROFILE_CMS_PUBLISH_EIP712_DOMAIN_NAME/VERSION.
export const PROFILE_CMS_PUBLISH_DOMAIN_NAME = "6529 Profile CMS";
export const PROFILE_CMS_PUBLISH_DOMAIN_VERSION = "1";
export const PROFILE_CMS_PUBLISH_PRIMARY_TYPE = "ProfileCmsPublish";

// Deadline window: the backend rejects deadlines more than 15 minutes ahead
// (PROFILE_CMS_PUBLISH_MAX_DEADLINE_MS). Sign for 10 minutes, comfortably under.
export const PROFILE_CMS_PUBLISH_DEADLINE_MS = 10 * 60 * 1000;

// EIP-712 type definition — field order and types must match
// PROFILE_CMS_PUBLISH_EIP712_TYPES exactly.
export const PROFILE_CMS_PUBLISH_EIP712_TYPES = {
  ProfileCmsPublish: [
    { name: "action", type: "string" },
    { name: "profileId", type: "string" },
    { name: "handle", type: "string" },
    { name: "packageId", type: "string" },
    { name: "version", type: "uint256" },
    { name: "draftId", type: "string" },
    { name: "payloadHash", type: "string" },
    { name: "packageHash", type: "string" },
    { name: "primaryPath", type: "string" },
    { name: "storageProvider", type: "string" },
    { name: "storageUri", type: "string" },
    { name: "storageContentHash", type: "string" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export type ProfileCmsPublishDomain = {
  readonly name: string;
  readonly version: string;
  readonly chainId: number;
  readonly verifyingContract?: string | undefined;
};

export type ProfileCmsPublishMessage = {
  readonly action: "publish";
  readonly profileId: string;
  readonly handle: string;
  readonly packageId: string;
  readonly version: number;
  readonly draftId: string;
  readonly payloadHash: string;
  readonly packageHash: string;
  readonly primaryPath: string;
  readonly storageProvider: string;
  readonly storageUri: string;
  readonly storageContentHash: string;
  readonly deadline: number;
};

export type ProfileCmsPublishTypedData = {
  readonly domain: ProfileCmsPublishDomain;
  readonly types: typeof PROFILE_CMS_PUBLISH_EIP712_TYPES;
  readonly primaryType: typeof PROFILE_CMS_PUBLISH_PRIMARY_TYPE;
  readonly message: ProfileCmsPublishMessage;
};

export type ProfileCmsPublishStep = "validate" | "upload" | "sign" | "publish";

type ProfileCmsPublishErrorCode =
  | "server_validation_invalid"
  | "save_failed"
  | "validate_failed"
  | "upload_failed"
  | "signature_rejected"
  | "signature_failed"
  | "deadline_expired"
  | "publish_conflict"
  | "publish_failed";

/**
 * Context prepared once (save + validate + upload) and reused across
 * sign/publish attempts so a deadline-expiry retry only re-signs and re-posts.
 */
export type ProfileCmsPublishContext = {
  readonly draftId: string;
  readonly profileId: string;
  readonly handle: string;
  readonly packageId: string;
  readonly version: number;
  readonly payloadHash: string;
  readonly packageHash: string;
  readonly primaryPath: string;
  readonly receipt: ProfileCmsStorageReceipt;
};

export type ProfileCmsPublishSuccess = {
  readonly ok: true;
  readonly published: ProfileCmsPackageRecord;
  readonly publishedUrl: string;
};

export type ProfileCmsPublishFailure = {
  readonly ok: false;
  readonly step: ProfileCmsPublishStep;
  readonly code: ProfileCmsPublishErrorCode;
  readonly message: string;
  // Present once save+validate+upload have succeeded, so the caller can retry
  // just the sign/publish tail (e.g. after a deadline_expired rejection).
  readonly context?: ProfileCmsPublishContext | undefined;
};

export type ProfileCmsPublishResult =
  | ProfileCmsPublishSuccess
  | ProfileCmsPublishFailure;

export type ProfileCmsSignTypedDataResult =
  | { readonly ok: true; readonly signature: string }
  | { readonly ok: false; readonly rejected: boolean };

export type ProfileCmsSignTypedData = (
  typedData: ProfileCmsPublishTypedData
) => Promise<ProfileCmsSignTypedDataResult>;

type RunProfileCmsPublishInput = {
  readonly cmsPackage: CmsPackageV1;
  readonly profileId: string;
  readonly chainId: number;
  readonly signerAddress: string;
  readonly signTypedData: ProfileCmsSignTypedData;
  readonly isSafe?: boolean | undefined;
  readonly verifyingContract?: string | null | undefined;
  readonly now?: () => number;
  readonly baseUrl?: string | undefined;
};

const DEFAULT_PUBLISHED_BASE_URL = "https://6529.io";

/**
 * Build the EIP-712 typed data for a publish. Pure and deterministic given the
 * context + signing metadata; exported for direct unit testing against the
 * backend fixture.
 */
export function buildProfileCmsPublishTypedData(params: {
  readonly context: ProfileCmsPublishContext;
  readonly chainId: number;
  readonly deadline: number;
  readonly verifyingContract?: string | null | undefined;
}): ProfileCmsPublishTypedData {
  const { context, chainId, deadline, verifyingContract } = params;
  const domain: ProfileCmsPublishDomain = {
    name: PROFILE_CMS_PUBLISH_DOMAIN_NAME,
    version: PROFILE_CMS_PUBLISH_DOMAIN_VERSION,
    chainId,
    ...(verifyingContract ? { verifyingContract } : {}),
  };
  const message: ProfileCmsPublishMessage = {
    action: "publish",
    profileId: context.profileId,
    handle: context.handle,
    packageId: context.packageId,
    version: context.version,
    draftId: context.draftId,
    payloadHash: context.payloadHash,
    packageHash: context.packageHash,
    primaryPath: context.primaryPath,
    storageProvider: context.receipt.provider,
    storageUri: context.receipt.uri,
    storageContentHash: context.receipt.content_hash,
    deadline,
  };
  return {
    domain,
    types: PROFILE_CMS_PUBLISH_EIP712_TYPES,
    primaryType: PROFILE_CMS_PUBLISH_PRIMARY_TYPE,
    message,
  };
}

export function getProfileCmsPublishedUrl(
  handle: string,
  baseUrl: string = DEFAULT_PUBLISHED_BASE_URL
): string {
  return `${baseUrl}/${handle}/index.html`;
}

/**
 * Prepare the publish context: save the draft, server-validate, and upload to
 * storage. Returns a reusable context on success so the sign/publish tail can
 * be retried without re-uploading.
 */
export async function prepareProfileCmsPublish(
  input: RunProfileCmsPublishInput
): Promise<
  | ProfileCmsPublishFailure
  | { readonly ok: true; readonly context: ProfileCmsPublishContext }
> {
  const { cmsPackage, profileId } = input;

  const saved = await runProfileCmsBuilderAction({
    action: "save_draft",
    cmsPackage,
    profileId,
  });
  if (!saved.ok || !saved.draftId) {
    return {
      ok: false,
      step: "validate",
      code: "save_failed",
      message: "Could not save the draft before publishing.",
    };
  }
  const draftId = saved.draftId;

  const validated = await runProfileCmsBuilderAction({
    action: "validate",
    cmsPackage,
    profileId,
  });
  if (!validated.ok) {
    // A rejected server validation is a completed request whose outcome is
    // "not valid" — abort before upload and surface it as a validation
    // failure, distinct from a transport error.
    if (validated.code === "server_validation_invalid") {
      return {
        ok: false,
        step: "validate",
        code: "server_validation_invalid",
        message: "Server rejected the package as invalid.",
      };
    }
    return {
      ok: false,
      step: "validate",
      code: "validate_failed",
      message: "Server validation request failed.",
    };
  }

  let receipt: ProfileCmsStorageReceipt;
  try {
    receipt = await uploadProfileCmsPackageStorage(draftId);
  } catch (error) {
    return {
      ok: false,
      step: "upload",
      code: "upload_failed",
      message: getErrorMessage(error, "Storage upload failed."),
    };
  }

  const context: ProfileCmsPublishContext = {
    draftId,
    profileId,
    handle: cmsPackage.profile.handle,
    packageId: cmsPackage.package_id,
    version: saved.version ?? 1,
    payloadHash: saved.payloadHash ?? cmsPackage.integrity.payload_hash,
    packageHash: saved.packageHash ?? cmsPackage.integrity.package_hash,
    primaryPath: `/${cmsPackage.profile.handle}/index.html`,
    receipt,
  };

  return { ok: true, context };
}

/**
 * Sign + publish given a prepared context. Reusable for the deadline-expiry
 * retry path (re-sign with a fresh deadline, then re-post).
 */
export async function signAndPublishProfileCms(params: {
  readonly context: ProfileCmsPublishContext;
  readonly chainId: number;
  readonly signerAddress: string;
  readonly signTypedData: ProfileCmsSignTypedData;
  readonly isSafe?: boolean | undefined;
  readonly verifyingContract?: string | null | undefined;
  readonly now?: () => number;
  readonly baseUrl?: string | undefined;
}): Promise<ProfileCmsPublishResult> {
  const {
    context,
    chainId,
    signerAddress,
    signTypedData,
    isSafe,
    verifyingContract,
    now = Date.now,
    baseUrl,
  } = params;

  const deadline = now() + PROFILE_CMS_PUBLISH_DEADLINE_MS;
  const typedData = buildProfileCmsPublishTypedData({
    context,
    chainId,
    deadline,
    verifyingContract,
  });

  let signatureResult: ProfileCmsSignTypedDataResult;
  try {
    signatureResult = await signTypedData(typedData);
  } catch (error) {
    return {
      ok: false,
      step: "sign",
      code: "signature_failed",
      message: getErrorMessage(error, "Wallet signing failed."),
      context,
    };
  }
  if (!signatureResult.ok) {
    return {
      ok: false,
      step: "sign",
      code: signatureResult.rejected
        ? "signature_rejected"
        : "signature_failed",
      message: signatureResult.rejected
        ? "The signature request was canceled in your wallet."
        : "Wallet signing failed.",
      context,
    };
  }

  const request: ProfileCmsPublishRequest = {
    signer_address: signerAddress,
    signature: signatureResult.signature,
    chain_id: chainId,
    deadline,
    expected_package_hash: context.packageHash,
    expected_payload_hash: context.payloadHash,
    ...(isSafe ? { is_safe_signature: true } : {}),
    ...(verifyingContract ? { verifying_contract: verifyingContract } : {}),
  };

  try {
    const published = await publishProfileCmsPackage(context.draftId, request);
    return {
      ok: true,
      published,
      publishedUrl: getProfileCmsPublishedUrl(published.profileHandle, baseUrl),
    };
  } catch (error) {
    const status = getErrorStatus(error);
    if (isDeadlineError(error, status)) {
      return {
        ok: false,
        step: "sign",
        code: "deadline_expired",
        message:
          "The signature deadline expired before publishing. Please sign again.",
        context,
      };
    }
    if (status === 409) {
      return {
        ok: false,
        step: "publish",
        code: "publish_conflict",
        message:
          "The draft changed on the server since it was signed. Please retry.",
        context,
      };
    }
    return {
      ok: false,
      step: "publish",
      code: "publish_failed",
      message: getErrorMessage(error, "Publishing failed."),
      context,
    };
  }
}

/**
 * Full publish flow: prepare (save + validate + upload), then sign + publish.
 */
export async function runProfileCmsPublish(
  input: RunProfileCmsPublishInput
): Promise<ProfileCmsPublishResult> {
  const prepared = await prepareProfileCmsPublish(input);
  if (!prepared.ok) {
    return prepared;
  }

  return signAndPublishProfileCms({
    context: prepared.context,
    chainId: input.chainId,
    signerAddress: input.signerAddress,
    signTypedData: input.signTypedData,
    ...(input.isSafe === undefined ? {} : { isSafe: input.isSafe }),
    ...(input.verifyingContract === undefined
      ? {}
      : { verifyingContract: input.verifyingContract }),
    ...(input.now === undefined ? {} : { now: input.now }),
    ...(input.baseUrl === undefined ? {} : { baseUrl: input.baseUrl }),
  });
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") {
      return status;
    }
  }
  return undefined;
}

function isDeadlineError(error: unknown, status: number | undefined): boolean {
  if (status !== 400) {
    return false;
  }
  const message = getRawErrorMessage(error).toLowerCase();
  return message.includes("deadline");
}

function getRawErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  if (typeof error === "string") {
    return error;
  }
  return "";
}

function getErrorMessage(error: unknown, fallback: string): string {
  const message = getRawErrorMessage(error);
  return message.length > 0 ? message : fallback;
}
