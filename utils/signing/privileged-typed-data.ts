import type { TypedDataDomain } from "viem";

export const SEIZE_EIP712_DOMAIN_VERSION = "1";

type TypedDataField = { readonly name: string; readonly type: string };

export type TypedDataPayload = {
  readonly domain: TypedDataDomain;
  readonly types: Record<string, readonly TypedDataField[]>;
  readonly primaryType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly message: Record<string, any>;
};

export const PRIVILEGED_ACTION_TTL_SECONDS = 5 * 60;

export function buildNextGenCreateAllowlistTypedData({
  chainId,
  verifyingContract,
  wallet,
  collectionId,
  allowlistType,
  phase,
  startTime,
  endTime,
  mintPrice,
  nonce,
  expiresAt,
}: {
  readonly chainId: number;
  readonly verifyingContract: `0x${string}`;
  readonly wallet: `0x${string}`;
  readonly collectionId: bigint;
  readonly allowlistType: string;
  readonly phase: string;
  readonly startTime: bigint;
  readonly endTime: bigint;
  readonly mintPrice: string;
  readonly nonce: string;
  readonly expiresAt: bigint;
}): TypedDataPayload {
  return {
    domain: {
      name: "6529 Seize — NextGen",
      version: SEIZE_EIP712_DOMAIN_VERSION,
      chainId,
      verifyingContract,
    },
    primaryType: "NextGenCreateAllowlist",
    types: {
      NextGenCreateAllowlist: [
        { name: "action", type: "string" },
        { name: "wallet", type: "address" },
        { name: "collectionId", type: "uint256" },
        { name: "allowlistType", type: "string" },
        { name: "phase", type: "string" },
        { name: "startTime", type: "uint256" },
        { name: "endTime", type: "uint256" },
        { name: "mintPrice", type: "string" },
        { name: "nonce", type: "string" },
        { name: "expiresAt", type: "uint256" },
      ],
    },
    message: {
      action: "NEXTGEN_CREATE_ALLOWLIST",
      wallet,
      collectionId,
      allowlistType,
      phase,
      startTime,
      endTime,
      mintPrice,
      nonce,
      expiresAt,
    },
  };
}

export function buildNextGenRegisterBurnCollectionTypedData({
  chainId,
  verifyingContract,
  wallet,
  mintCollectionId,
  burnCollection,
  burnCollectionId,
  minTokenIndex,
  maxTokenIndex,
  burnAddress,
  status,
  nonce,
  expiresAt,
}: {
  readonly chainId: number;
  readonly verifyingContract: `0x${string}`;
  readonly wallet: `0x${string}`;
  readonly mintCollectionId: bigint;
  readonly burnCollection: `0x${string}`;
  readonly burnCollectionId: bigint;
  readonly minTokenIndex: bigint;
  readonly maxTokenIndex: bigint;
  readonly burnAddress: `0x${string}`;
  readonly status: boolean;
  readonly nonce: string;
  readonly expiresAt: bigint;
}): TypedDataPayload {
  return {
    domain: {
      name: "6529 Seize — NextGen",
      version: SEIZE_EIP712_DOMAIN_VERSION,
      chainId,
      verifyingContract,
    },
    primaryType: "NextGenRegisterBurnCollection",
    types: {
      NextGenRegisterBurnCollection: [
        { name: "action", type: "string" },
        { name: "wallet", type: "address" },
        { name: "mintCollectionId", type: "uint256" },
        { name: "burnCollection", type: "address" },
        { name: "burnCollectionId", type: "uint256" },
        { name: "minTokenIndex", type: "uint256" },
        { name: "maxTokenIndex", type: "uint256" },
        { name: "burnAddress", type: "address" },
        { name: "status", type: "bool" },
        { name: "nonce", type: "string" },
        { name: "expiresAt", type: "uint256" },
      ],
    },
    message: {
      action: "NEXTGEN_REGISTER_BURN_COLLECTION",
      wallet,
      mintCollectionId,
      burnCollection,
      burnCollectionId,
      minTokenIndex,
      maxTokenIndex,
      burnAddress,
      status,
      nonce,
      expiresAt,
    },
  };
}

export function buildRememeAddTypedData({
  chainId,
  verifyingContract,
  wallet,
  contract,
  tokenIds,
  references,
  nonce,
  expiresAt,
}: {
  readonly chainId: number;
  readonly verifyingContract: `0x${string}`;
  readonly wallet: `0x${string}`;
  readonly contract: `0x${string}`;
  readonly tokenIds: readonly bigint[];
  readonly references: readonly bigint[];
  readonly nonce: string;
  readonly expiresAt: bigint;
}): TypedDataPayload {
  return {
    domain: {
      name: "6529 Seize — ReMemes",
      version: SEIZE_EIP712_DOMAIN_VERSION,
      chainId,
      verifyingContract,
    },
    primaryType: "RememeAdd",
    types: {
      RememeAdd: [
        { name: "action", type: "string" },
        { name: "wallet", type: "address" },
        { name: "contract", type: "address" },
        { name: "tokenIds", type: "uint256[]" },
        { name: "references", type: "uint256[]" },
        { name: "nonce", type: "string" },
        { name: "expiresAt", type: "uint256" },
      ],
    },
    message: {
      action: "REMEMES_ADD",
      wallet,
      contract,
      tokenIds,
      references,
      nonce,
      expiresAt,
    },
  };
}

