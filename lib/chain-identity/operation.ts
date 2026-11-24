import { hashTypedData, type Hex } from "viem";
import { publicEnv } from "@/config/env";
import {
  chainGateway,
  ChainGatewayError,
  type ChainDraft,
  type ChainDraftRequest,
  type ChainSignatureEntry,
  type ChainTxStatus,
  type ChainTypedData,
} from "./gateway";
import { pinnedTypes, type PinnedTypes } from "./typedDataTypes";

/**
 * One operation on the 6529 Network: the gateway drafts it, this file checks
 * the draft says what was asked, the wallet or the session key signs it, the
 * gateway relays it, and the result is read back once it is final.
 */

const ZERO_WORD: Hex = `0x${"00".repeat(32)}`;
const SECP256K1_N =
  0xfffffffffffffffffffffffffffffffebaae6dc5c63e1aaa5c56d1d7f6b49ee1n;
const HALF_N = SECP256K1_N >> 1n;
const POLL_MS = 3_000;
const POLL_LIMIT = 60;

export class ChainOperationError extends Error {
  constructor(
    readonly reason:
      | "draft_mismatch"
      | "signer_mismatch"
      | "rejected"
      | "failed"
      | "timeout"
      | "stated",
    message: string,
    /** The chain's result name when it refused the change, e.g. STALE_VERSION. */
    readonly resultName: string | null = null,
    /** Values for the plain sentence the page shows for this error. */
    readonly values: Readonly<Record<string, string>> = {}
  ) {
    super(message);
    this.name = "ChainOperationError";
  }
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isZeroLike = (value: unknown): boolean => {
  if (value === null || value === undefined || value === "" || value === 0) {
    return true;
  }
  if (typeof value === "string") {
    return value === "0" || /^0x0*$/i.test(value);
  }
  if (typeof value === "bigint") {
    return value === 0n;
  }
  return Array.isArray(value) && value.length === 0;
};

const canonical = (value: unknown): string => {
  if (typeof value === "bigint" || typeof value === "number") {
    return BigInt(value).toString();
  }
  if (typeof value === "string") {
    return value.startsWith("0x") ? value.toLowerCase() : value;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return JSON.stringify(value);
};

/** Whether `actual` carries `expected`: null in `expected` means zero. */
function sameValue(expected: unknown, actual: unknown): boolean {
  if (expected === null || expected === undefined) {
    return isZeroLike(actual);
  }
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((item, index) => sameValue(item, actual[index]))
    );
  }
  if (isRecord(expected)) {
    return (
      isRecord(actual) &&
      Object.entries(expected).every(([name, item]) =>
        sameValue(item, actual[name])
      )
    );
  }
  return canonical(expected) === canonical(actual);
}

const INT_TYPE = /^u?int\d*$/;

/** The typed data's message with every integer as a bigint, as viem hashes it. */
function messageForHashing(
  types: PinnedTypes,
  typeName: string,
  value: unknown
): unknown {
  if (typeName.endsWith("[]")) {
    const item = typeName.slice(0, -2);
    return Array.isArray(value)
      ? value.map((entry) => messageForHashing(types, item, entry))
      : value;
  }
  if (INT_TYPE.test(typeName)) {
    return typeof value === "string" || typeof value === "number"
      ? BigInt(value)
      : value;
  }
  const fields = types[typeName];
  if (fields && isRecord(value)) {
    return Object.fromEntries(
      fields.map(({ name, type }) => [
        name,
        messageForHashing(types, type, value[name]),
      ])
    );
  }
  return value;
}

const typesFor = (primaryType: string): PinnedTypes => {
  const types = pinnedTypes(primaryType);
  if (types === null) {
    throw new ChainOperationError(
      "draft_mismatch",
      "This site doesn't sign that kind of change."
    );
  }
  return types;
};

/**
 * The typed data as viem's signers and hashers take it, with this site's
 * pinned types for the operation: the gateway's own `types` are never used.
 */
export function typedDataForSigning(typedData: ChainTypedData) {
  const types = typesFor(typedData.primaryType);
  return {
    domain: typedData.domain,
    types,
    primaryType: typedData.primaryType,
    message: messageForHashing(
      types,
      typedData.primaryType,
      typedData.message
    ) as Record<string, unknown>,
  };
}

/** The EIP-712 digest of the draft's message under the pinned types. */
export function digestOf(typedData: ChainTypedData): Hex {
  return hashTypedData(typedDataForSigning(typedData));
}

const digestMatches = (draft: ChainDraft): boolean => {
  try {
    return digestOf(draft.typedData) === draft.txId.toLowerCase();
  } catch {
    return false;
  }
};

/** The network the build expects drafts for, when it names one. */
export const expectedNetworkId = (): string | null => {
  const value = publicEnv.NEXT_PUBLIC_CHAIN_NETWORK_ID?.trim().toLowerCase();
  return value === undefined || value === "" ? null : value;
};

/**
 * Throws unless the draft is the operation that was asked for: its body,
 * principal and key, and a txId equal to the digest of what will be signed.
 */
export function verifyDraft(
  draft: ChainDraft,
  request: ChainDraftRequest,
  primaryType: string
): void {
  const { typedData } = draft;
  const header = isRecord(typedData.message["header"])
    ? typedData.message["header"]
    : {};
  const expectedKeyType = request.keyType ?? 1;
  const walletKeyId =
    request.signer === undefined
      ? null
      : `0x${request.signer.slice(2).toLowerCase().padStart(64, "0")}`;
  const network = expectedNetworkId();
  const checks = [
    typedData.primaryType === primaryType,
    typedData.domain.name === "6529 Network",
    typedData.domain.version === "1",
    network === null || typedData.domain.salt.toLowerCase() === network,
    // The fee shown before signing is the fee the signature allows.
    canonical(header["maxFee"]) === draft.fee.maxFee,
    // The work limit signed is the gateway's (the bound plus its margin),
    // never one this site set or lowered: below it the chain fails the
    // change and still takes the fee.
    canonical(header["maxWork"]) === draft.fee.maxWork,
    sameValue(request.body, typedData.message["body"]),
    sameValue(request.principal ?? ZERO_WORD, header["principal"]),
    canonical(header["keyType"]) === String(expectedKeyType),
    canonical(header["nonceLane"] ?? 0) === String(request.nonceLane ?? 0),
    expectedKeyType === 2
      ? sameValue(request.keyId, header["keyId"]) &&
        sameValue(request.authRef, header["authRef"])
      : walletKeyId === null || sameValue(walletKeyId, header["keyId"]),
    digestMatches(draft),
  ];
  if (checks.some((ok) => !ok)) {
    throw new ChainOperationError(
      "draft_mismatch",
      "The gateway's draft doesn't match this change. Nothing was signed."
    );
  }
}

/**
 * A wallet signature as the chain takes it: 65 bytes `r || s || v`, v 27 or
 * 28, s in the lower half of the curve order.
 */
export function normalizeWalletSignature(signature: Hex): Hex {
  const hex = signature.slice(2);
  if (hex.length !== 130) {
    throw new ChainOperationError(
      "rejected",
      "The wallet returned a signature the 6529 Network can't use.",
      "BAD_WALLET_SIGNATURE"
    );
  }
  const r = hex.slice(0, 64);
  let s = BigInt(`0x${hex.slice(64, 128)}`);
  let v = Number.parseInt(hex.slice(128, 130), 16);
  if (v < 27) {
    v += 27;
  }
  if (s > HALF_N) {
    s = SECP256K1_N - s;
    v = v === 27 ? 28 : 27;
  }
  return `0x${r}${s.toString(16).padStart(64, "0")}${v.toString(16)}`;
}

export interface ChainSigner {
  /** keyType 1 (a wallet) or 2 (this browser's session key). */
  readonly keyType: 1 | 2;
  /** Signs the draft; the digest is already checked against its txId. */
  readonly sign: (draft: ChainDraft) => Promise<Hex>;
}

/** Drafts and checks an operation, ready for its signatures. */
export async function draftOperation(
  request: ChainDraftRequest,
  primaryType: string,
  signal?: AbortSignal
): Promise<ChainDraft> {
  const draft = await chainGateway.draft(request, signal);
  verifyDraft(draft, request, primaryType);
  return draft;
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new ChainOperationError("timeout", "Stopped waiting."));
      },
      { once: true }
    );
  });

/**
 * How long a write waits: until its block is final, or until a block holds
 * it with its result known (votes and ratings, which a later write replaces).
 */
export type ChainWait = "final" | "included";

/**
 * Waits until the operation is final (or, with `until` "included", until a
 * block holds it), and throws when the chain refused it. A read that fails
 * (a network blip, a busy gateway) is tried again: the change may still land.
 */
export async function awaitFinal(
  txId: Hex,
  signal?: AbortSignal,
  limit: number = POLL_LIMIT,
  until: ChainWait = "final"
): Promise<ChainTxStatus> {
  for (let attempt = 0; attempt < limit; attempt += 1) {
    let status: ChainTxStatus | null = null;
    try {
      status = await chainGateway.getTx(txId, signal);
    } catch (error) {
      if (!(error instanceof ChainGatewayError) || signal?.aborted === true) {
        throw error;
      }
    }
    if (status?.status === "failed") {
      const name = status.result?.name ?? "an unknown reason";
      throw new ChainOperationError(
        "failed",
        `The 6529 Network refused this change: ${name}.`,
        status.result?.name ?? null
      );
    }
    if (
      status?.status === "final" ||
      (until === "included" && status?.status === "in_block")
    ) {
      return status;
    }
    await sleep(POLL_MS, signal);
  }
  throw new ChainOperationError(
    "timeout",
    "The change was sent but isn't final yet. Check again in a few minutes."
  );
}

/** Polls for a change whose submit got no answer, for about half a minute. */
const UNANSWERED_POLLS = 10;

/**
 * Submits signed entries and waits until the change is final. When the
 * submit itself gets no answer, the change may still have been taken: the
 * page looks for it before it says anything, and never calls it unsent.
 */
export async function submitAndAwait(
  draft: ChainDraft,
  signatures: readonly ChainSignatureEntry[],
  signal?: AbortSignal,
  until: ChainWait = "final"
): Promise<ChainTxStatus> {
  try {
    await chainGateway.submit(draft.unsigned, signatures, signal);
  } catch (error) {
    const unanswered =
      error instanceof ChainGatewayError &&
      (error.status === 0 || error.status >= 502) &&
      signal?.aborted !== true;
    if (!unanswered) {
      throw error;
    }
    try {
      return await awaitFinal(draft.txId, signal, UNANSWERED_POLLS, until);
    } catch (waited) {
      if (
        waited instanceof ChainOperationError &&
        waited.reason === "timeout"
      ) {
        throw new ChainOperationError(
          "timeout",
          "The 6529 Network may not have the change. Wait a few minutes and check before you try again.",
          "UNCONFIRMED"
        );
      }
      throw waited;
    }
  }
  return awaitFinal(draft.txId, signal, POLL_LIMIT, until);
}

/** Signs a checked draft with one signer, submits it, waits until final. */
async function signAndSubmit(
  draft: ChainDraft,
  signer: ChainSigner,
  signal?: AbortSignal,
  until: ChainWait = "final"
): Promise<ChainTxStatus> {
  const sig = await signer.sign(draft);
  return submitAndAwait(
    draft,
    [{ role: 0, keyType: signer.keyType, sig }],
    signal,
    until
  );
}

/**
 * The whole path for an operation with one signature: draft, check, sign,
 * submit, wait until final. Returns the draft (its txId names the objects
 * the operation creates) and the final status.
 */
export async function runOperation(
  request: ChainDraftRequest,
  primaryType: string,
  signer: ChainSigner,
  signal?: AbortSignal,
  until: ChainWait = "final"
): Promise<{ readonly draft: ChainDraft; readonly status: ChainTxStatus }> {
  const draft = await draftOperation(request, primaryType, signal);
  const status = await signAndSubmit(draft, signer, signal, until);
  return { draft, status };
}
