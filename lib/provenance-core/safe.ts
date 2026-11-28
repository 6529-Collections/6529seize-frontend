// Copied from 6529-Collections/6529-provenance-app src/safe.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import {
  concat,
  encodeFunctionData,
  encodePacked,
  hashTypedData,
  keccak256,
  pad,
  parseAbi,
  size,
  toHex,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";
import type { Call } from "./actions";
import { compareCodeUnits } from "./jcs";

/** Safe v1.4.1 MultiSendCallOnly, deployed at the same address on every chain Safe supports. */
export const MULTISEND_CALL_ONLY_141: Address = "0x9641d764fc13c8B624c04430C7356C1C7C8102e2";

export const safeAbi = parseAbi([
  "function nonce() view returns (uint256)",
  "function getThreshold() view returns (uint256)",
  "function getOwners() view returns (address[])",
  "function VERSION() view returns (string)",
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) payable returns (bool success)",
  "event ExecutionSuccess(bytes32 indexed txHash, uint256 payment)",
  "event ExecutionFailure(bytes32 indexed txHash, uint256 payment)",
]);

export const multiSendAbi = parseAbi(["function multiSend(bytes transactions) payable"]);

/** Storage slot of Safe's threshold in v1.3.0 and v1.4.1 (OwnerManager's third variable). */
export const SAFE_THRESHOLD_SLOT: Hex = pad("0x04", { size: 32 });

export interface SafeTx {
  to: Address;
  value: bigint;
  data: Hex;
  operation: 0 | 1;
  /** Always 0 for registry batches: see docs/publishing.md in the contract repository. */
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: Address;
  refundReceiver: Address;
  nonce: bigint;
}

/** MultiSend's packed encoding: operation (1 byte), to (20), value (32), data length (32), data. */
export function encodeMultiSendTransactions(calls: readonly Call[]): Hex {
  return concat(
    calls.map((c) =>
      encodePacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [0, c.to, c.value, BigInt(size(c.data)), c.data],
      ),
    ),
  );
}

export function encodeMultiSend(calls: readonly Call[]): Hex {
  return encodeFunctionData({
    abi: multiSendAbi,
    functionName: "multiSend",
    args: [encodeMultiSendTransactions(calls)],
  });
}

/**
 * The Safe transaction for a list of calls. One call goes directly (operation 0). Several go
 * through MultiSendCallOnly by delegatecall (operation 1), so each inner call has the Safe as
 * msg.sender and the batch reverts as a whole when any call reverts. safeTxGas and gasPrice are 0.
 */
export function safeTxFor(
  calls: readonly Call[],
  nonce: bigint,
  multiSend: Address = MULTISEND_CALL_ONLY_141,
): SafeTx {
  const base = {
    safeTxGas: 0n,
    baseGas: 0n,
    gasPrice: 0n,
    gasToken: zeroAddress,
    refundReceiver: zeroAddress,
    nonce,
  };
  if (calls.length === 0) throw new Error("A Safe transaction needs at least one call.");
  if (calls.length === 1) {
    const c = calls[0]!;
    return { to: c.to, value: c.value, data: c.data, operation: 0, ...base };
  }
  return { to: multiSend, value: 0n, data: encodeMultiSend(calls), operation: 1, ...base };
}

export const SAFE_TX_TYPES = {
  SafeTx: [
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "data", type: "bytes" },
    { name: "operation", type: "uint8" },
    { name: "safeTxGas", type: "uint256" },
    { name: "baseGas", type: "uint256" },
    { name: "gasPrice", type: "uint256" },
    { name: "gasToken", type: "address" },
    { name: "refundReceiver", type: "address" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export function safeTypedData(chainId: number, safe: Address, tx: SafeTx) {
  return {
    domain: { chainId, verifyingContract: safe },
    types: SAFE_TX_TYPES,
    primaryType: "SafeTx" as const,
    message: tx,
  };
}

/** The hash Safe signers sign (EIP-712, Safe v1.3.0 and later). Safe{Wallet} shows it as "safeTxHash". */
export function safeTxHash(chainId: number, safe: Address, tx: SafeTx): Hex {
  return hashTypedData(safeTypedData(chainId, safe, tx));
}

/**
 * A signature that Safe accepts without ECDSA when msg.sender is that owner (v = 1, r = owner).
 * The dry run uses it, with the threshold overridden to 1, to run the real execTransaction.
 */
export function approvedHashSignature(owner: Address): Hex {
  return concat([pad(owner, { size: 32 }), pad("0x00", { size: 32 }), "0x01"]);
}

/** Signatures for execTransaction, sorted by owner address as Safe requires. */
export function approvedHashSignatures(owners: readonly Address[]): Hex {
  const sorted = [...owners].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));
  return concat(sorted.map(approvedHashSignature));
}

export function encodeExecTransaction(tx: SafeTx, signatures: Hex): Hex {
  return encodeFunctionData({
    abi: safeAbi,
    functionName: "execTransaction",
    args: [
      tx.to,
      tx.value,
      tx.data,
      tx.operation,
      tx.safeTxGas,
      tx.baseGas,
      tx.gasPrice,
      tx.gasToken,
      tx.refundReceiver,
      signatures,
    ],
  });
}

// ---------------------------------------------------------------------------------------------
// Safe Transaction Builder batch files
// ---------------------------------------------------------------------------------------------

export interface BuilderBatch {
  version: "1.0";
  chainId: string;
  createdAt: number;
  meta: {
    name: string | null;
    description: string;
    txBuilderVersion: string;
    createdFromSafeAddress: string;
    createdFromOwnerAddress: string;
    checksum?: string;
  };
  transactions: {
    to: string;
    value: string;
    data: string;
    contractMethod: null;
    contractInputsValues: null;
  }[];
}

// The Transaction Builder's own serialization for its checksum: keys sorted, each object written
// as the JSON array of its keys followed by each value and a comma.
function serializeForChecksum(json: unknown): string {
  if (Array.isArray(json)) return `[${json.map(serializeForChecksum).join(",")}]`;
  if (typeof json === "object" && json !== null) {
    const keys = Object.keys(json).sort(compareCodeUnits);
    let acc = `{${JSON.stringify(keys)}`;
    for (const k of keys) acc += `${serializeForChecksum((json as Record<string, unknown>)[k])},`;
    return `${acc}}`;
  }
  return JSON.stringify(json === undefined ? null : json);
}

export function builderChecksum(batch: BuilderBatch): Hex {
  const { checksum: _c, ...meta } = batch.meta;
  return keccak256(toHex(serializeForChecksum({ ...batch, meta: { ...meta, name: null } })));
}

export function builderBatch(
  chainId: number,
  safe: Address,
  calls: readonly Call[],
  name: string,
  description: string,
  createdAt = Date.now(),
): BuilderBatch {
  const batch: BuilderBatch = {
    version: "1.0",
    chainId: String(chainId),
    createdAt,
    meta: {
      name,
      description,
      txBuilderVersion: "1.18.0",
      createdFromSafeAddress: safe,
      createdFromOwnerAddress: "",
    },
    transactions: calls.map((c) => ({
      to: c.to,
      value: c.value.toString(),
      data: c.data,
      contractMethod: null,
      contractInputsValues: null,
    })),
  };
  batch.meta.checksum = builderChecksum(batch);
  return batch;
}

// ---------------------------------------------------------------------------------------------
// Safe Transaction Service proposals
// ---------------------------------------------------------------------------------------------

export interface ProposalBody {
  to: Address;
  value: string;
  data: Hex;
  operation: number;
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  gasToken: Address;
  refundReceiver: Address;
  nonce: string;
  contractTransactionHash: Hex;
  sender: Address;
  signature: Hex;
  origin: string;
}

export function proposalBody(
  tx: SafeTx,
  hash: Hex,
  sender: Address,
  signature: Hex,
  origin: string,
): ProposalBody {
  return {
    to: tx.to,
    value: tx.value.toString(),
    data: tx.data,
    operation: tx.operation,
    safeTxGas: tx.safeTxGas.toString(),
    baseGas: tx.baseGas.toString(),
    gasPrice: tx.gasPrice.toString(),
    gasToken: tx.gasToken,
    refundReceiver: tx.refundReceiver,
    nonce: tx.nonce.toString(),
    contractTransactionHash: hash,
    sender,
    signature,
    origin,
  };
}

export function proposalUrl(serviceBase: string, safe: Address): string {
  return `${serviceBase.replace(/\/+$/, "")}/api/v1/safes/${safe}/multisig-transactions/`;
}

/** Splits MultiSend's packed transactions back into calls, for display and for checking a batch. */
export function decodeMultiSendTransactions(packed: Hex): (Call & { operation: number })[] {
  const out: (Call & { operation: number })[] = [];
  const b = packed.slice(2);
  if (b.length % 2 !== 0)
    throw new Error("MultiSend: the packed transactions have an odd number of hex digits");
  let i = 0;
  while (i < b.length) {
    // Each transaction starts with an 85-byte header: operation, to, value and data length.
    if (b.length - i < 170)
      throw new Error(
        `MultiSend: ${(b.length - i) / 2} bytes left, too few for an 85-byte transaction header`,
      );
    const operation = Number.parseInt(b.slice(i, i + 2), 16);
    const to = `0x${b.slice(i + 2, i + 42)}` as Address;
    const value = BigInt(`0x${b.slice(i + 42, i + 106)}`);
    const len = Number(BigInt(`0x${b.slice(i + 106, i + 170)}`));
    const data = `0x${b.slice(i + 170, i + 170 + len * 2)}` as Hex;
    if (data.length !== 2 + len * 2) throw new Error("MultiSend: truncated transaction");
    out.push({ operation, to, value, data });
    i += 170 + len * 2;
  }
  return out;
}
