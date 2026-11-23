// Copied from 6529-Collections/6529-provenance-app src/governance.ts at commit 8496bfbb6347c265ec74c7e361612d97ccdaf731.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import {
  decodeFunctionData,
  getAddress,
  isAddressEqual,
  size,
  zeroAddress,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { provenanceRegistryAbi as abi } from "./abi/provenanceRegistry";
import { decodeAction, describeAction, encodeAction, literalProblem, type Action } from "./actions";
import type { RegistryPin } from "./config/registries";
import {
  decodeMultiSendTransactions,
  encodeMultiSendTransactions,
  multiSendAbi,
  MULTISEND_CALL_ONLY_141,
  proposalBody,
  proposalUrl,
  safeAbi,
  safeTxHash,
  safeTxFor,
  SAFE_TX_TYPES,
  type SafeTx,
} from "./safe";

/**
 * Governance: the calls the owner Safe signs. Publishing (openRelease, publish, sealRelease) is
 * not governance; a publisher key sends it as ordinary transactions (see publish.ts).
 *
 * The rules match the SafeTx schema 6529 Desktop's wallet forwarding enforces: the deletes,
 * freeze, declareSuccessor, transferOwnership and acceptOwnership are single-call SafeTxs
 * (operation 0 to the registry); other calls go 2 to 16 at a time through MultiSendCallOnly
 * (operation 1); value, safeTxGas, baseGas and gasPrice are 0; gasToken and refundReceiver are the
 * zero address; the nonce fits in 2^53 - 1; the typed data is at most 16 Ki characters of JSON.
 */

export type GovernanceRisk = "high" | "normal";

const GOVERNANCE_KINDS = new Set<Action["kind"]>([
  "registerCanonicalization",
  "registerRecordType",
  "registerSchema",
  "setPublisher",
  "deleteVersion",
  "deleteVersions",
  "deleteSubject",
  "freeze",
  "declareSuccessor",
  "transferOwnership",
  "acceptOwnership",
]);

/** Largest eth_signTypedData_v4 JSON, in characters, that the Desktop signing schema accepts. */
export const MAX_TYPED_DATA_CHARS = 16 * 1024;
export const MAX_BATCH_CALLS = 16;
export const MIN_BATCH_CALLS = 2;
const MAX_CID_BYTES = 128;
const MAX_NONCE = 2n ** 53n - 1n;

const ZERO32 = `0x${"00".repeat(32)}`;

/** Calls that must be a SafeTx of their own, never inside a batch. */
export const SINGLE_CALL_ONLY: ReadonlySet<Action["kind"]> = new Set([
  "deleteVersion",
  "deleteVersions",
  "deleteSubject",
  "freeze",
  "declareSuccessor",
  "transferOwnership",
  "acceptOwnership",
]);

/**
 * High impact: deletions, freeze, successor, ownership, and granting a publisher key. Granting a
 * key is high impact but may share a batch; the other high-impact calls are single-call only.
 */
export function riskOf(a: Action): GovernanceRisk {
  if (a.kind === "setPublisher") return a.authorized ? "high" : "normal";
  return a.kind.startsWith("register") ? "normal" : "high";
}

/** Why a call cannot go in a governance SafeTx, or undefined when it can. */
export function governanceCallProblem(a: Action): string | undefined {
  if (!GOVERNANCE_KINDS.has(a.kind)) {
    return `${a.kind} is publishing, not governance: a publisher key sends it as an ordinary transaction.`;
  }
  switch (a.kind) {
    case "registerCanonicalization":
      return (
        literalProblem(a.literal) ??
        (size(a.specCid) > MAX_CID_BYTES ? "The specification CID is over 128 bytes." : undefined)
      );
    case "registerRecordType":
      return literalProblem(a.literal);
    case "registerSchema":
      if (literalProblem(a.literal)) return literalProblem(a.literal);
      if (a.documentHash.algorithm !== 1 && a.documentHash.algorithm !== 2)
        return "The document hash algorithm is 1 or 2.";
      if (a.documentHash.digest.toLowerCase() === ZERO32) return "The document digest is zero.";
      if (size(a.cid) > MAX_CID_BYTES) return "The schema CID is over 128 bytes.";
      if (a.document !== "0x")
        return "Register the schema by hash and CID only; its document is not stored on-chain from a SafeTx.";
      return undefined;
    case "setPublisher":
      return isAddressEqual(a.publisher, zeroAddress) ? "The publisher is the zero address." : undefined;
    case "deleteVersion":
      if (a.subjectId.toLowerCase() === ZERO32) return "The subject ID is zero.";
      return a.version === 0 ? "Versions are numbered from 1." : undefined;
    case "deleteVersions":
      if (a.subjectId.toLowerCase() === ZERO32) return "The subject ID is zero.";
      if (a.fromVersion === 0 || a.toVersion === 0) return "Versions are numbered from 1.";
      return a.fromVersion > a.toVersion ? "The first version is after the last." : undefined;
    case "deleteSubject":
      return a.subjectId.toLowerCase() === ZERO32 ? "The subject ID is zero." : undefined;
    case "declareSuccessor":
      return isAddressEqual(a.successor, zeroAddress) ? "The successor is the zero address." : undefined;
    case "transferOwnership":
      return isAddressEqual(a.newOwner, zeroAddress) ? "The new owner is the zero address." : undefined;
    default:
      return undefined;
  }
}

export interface GovernanceSafeTx {
  tx: SafeTx;
  hash: Hex;
  actions: Action[];
  risk: GovernanceRisk;
}

/**
 * Turns governance calls into SafeTxs for one pinned registry, in order, with consecutive nonces
 * from `nonce`. A single-call-only call always gets a SafeTx of its own. Other consecutive calls
 * share a MultiSendCallOnly batch while it stays within 16 calls and 16 Ki characters of typed
 * data; a lone call goes directly. Throws on a call that is not governance or breaks a rule.
 */
export function buildGovernanceSafeTxs(
  pin: RegistryPin,
  actions: readonly Action[],
  nonce: bigint,
): GovernanceSafeTx[] {
  actions.forEach((a, i) => {
    const p = governanceCallProblem(a);
    if (p) throw new Error(`Call ${i + 1} (${a.kind}): ${p}`);
  });
  const groups: Action[][] = [];
  let batch: Action[] = [];
  const flush = () => {
    if (batch.length) groups.push(batch);
    batch = [];
  };
  for (const a of actions) {
    if (SINGLE_CALL_ONLY.has(a.kind)) {
      flush();
      groups.push([a]);
      continue;
    }
    const next = [...batch, a];
    if (next.length > MAX_BATCH_CALLS || typedDataChars(pin, next) > MAX_TYPED_DATA_CHARS) flush();
    batch.push(a);
    if (typedDataChars(pin, batch) > MAX_TYPED_DATA_CHARS) {
      throw new Error(`${describeAction(a)} alone is over ${MAX_TYPED_DATA_CHARS} characters of typed data.`);
    }
  }
  flush();
  return groups.map((g, i) => {
    const tx = safeTxFor(
      g.map((a) => ({ to: pin.registry, value: 0n, data: encodeAction(a) })),
      nonce + BigInt(i),
    );
    return {
      tx,
      hash: safeTxHash(pin.chainId, pin.safe, tx),
      actions: g,
      risk: g.some((a) => riskOf(a) === "high") ? "high" : "normal",
    };
  });
}

// Measured with the largest nonce the schema allows, so a SafeTx that fits here fits at any nonce.
function typedDataChars(pin: RegistryPin, actions: readonly Action[]): number {
  const tx = safeTxFor(
    actions.map((a) => ({ to: pin.registry, value: 0n, data: encodeAction(a) })),
    MAX_NONCE,
  );
  return safeTxTypedDataJson(pin.chainId, pin.safe, tx).length;
}

export interface DecodedCall {
  action: Action;
  description: string;
  risk: GovernanceRisk;
  functionName: string;
  args: readonly unknown[];
}

/** Every rule of the Desktop SafeTx schema that a SafeTx breaks. Empty when it passes. */
export function checkGovernanceSafeTx(pin: RegistryPin, tx: SafeTx): string[] {
  const out: string[] = [];
  if (tx.value !== 0n) out.push("value is not 0");
  if (tx.safeTxGas !== 0n || tx.baseGas !== 0n || tx.gasPrice !== 0n)
    out.push("safeTxGas, baseGas and gasPrice must be 0");
  if (!isAddressEqual(tx.gasToken, zeroAddress) || !isAddressEqual(tx.refundReceiver, zeroAddress)) {
    out.push("gasToken and refundReceiver must be the zero address");
  }
  if (tx.nonce < 0n || tx.nonce > MAX_NONCE) out.push("nonce is outside 0 to 2^53 - 1");
  const chars = safeTxTypedDataJson(pin.chainId, pin.safe, tx).length;
  if (chars > MAX_TYPED_DATA_CHARS)
    out.push(`the typed data is ${chars} characters, over ${MAX_TYPED_DATA_CHARS}`);
  try {
    decodeGovernanceSafeTx(pin, tx);
  } catch (e) {
    out.push((e as Error).message);
  }
  return out;
}

/**
 * Decodes a governance SafeTx into named registry calls with their arguments, for the signing
 * screen. Throws when the SafeTx is not a well-formed governance SafeTx for the pin.
 */
export function decodeGovernanceSafeTx(pin: RegistryPin, tx: SafeTx): DecodedCall[] {
  const decodeOne = (data: Hex): DecodedCall => {
    const { functionName, args } = decodeFunctionData({ abi, data });
    const action = decodeAction(data);
    const problem = governanceCallProblem(action);
    if (problem) throw new Error(problem);
    if (encodeAction(action).toLowerCase() !== data.toLowerCase())
      throw new Error(`${functionName}: calldata is not in canonical ABI encoding`);
    return {
      action,
      description: describeAction(action),
      risk: riskOf(action),
      functionName,
      args: args ?? [],
    };
  };
  if (tx.operation === 0) {
    if (!isAddressEqual(tx.to, pin.registry)) throw new Error("operation 0 must call the pinned registry");
    return [decodeOne(tx.data)];
  }
  if (tx.operation !== 1) throw new Error(`operation ${tx.operation} is neither call nor delegatecall`);
  if (!isAddressEqual(tx.to, MULTISEND_CALL_ONLY_141))
    throw new Error("operation 1 must delegatecall MultiSendCallOnly v1.4.1");
  const { functionName, args } = decodeFunctionData({ abi: multiSendAbi, data: tx.data });
  if (functionName !== "multiSend") throw new Error("data is not multiSend(bytes)");
  const inner = decodeMultiSendTransactions(args[0]);
  if (inner.length < MIN_BATCH_CALLS || inner.length > MAX_BATCH_CALLS) {
    throw new Error(`a batch holds 2 to 16 calls; this one holds ${inner.length}`);
  }
  if (encodeMultiSendTransactions(inner).toLowerCase() !== args[0].toLowerCase())
    throw new Error("the packed transactions do not re-encode to the same bytes");
  const calls = inner.map((c, i) => {
    if (c.operation !== 0) throw new Error(`inner call ${i + 1} is not a CALL`);
    if (!isAddressEqual(c.to, pin.registry))
      throw new Error(`inner call ${i + 1} does not target the pinned registry`);
    if (c.value !== 0n) throw new Error(`inner call ${i + 1} sends value`);
    return decodeOne(c.data);
  });
  const single = calls.find((c) => SINGLE_CALL_ONLY.has(c.action.kind));
  if (single) throw new Error(`${single.functionName} must be a SafeTx of its own`);
  return calls;
}

/**
 * The typed data a signer's wallet signs with eth_signTypedData_v4, as the JSON string the RPC
 * method takes. The domain is exactly {chainId, verifyingContract} with the Safe's EIP-55 address.
 */
export function safeTxTypedDataJson(chainId: number, safe: Address, tx: SafeTx): string {
  // Built by hand so chainId stays a JSON number and every uint256 in the message is a decimal
  // string, the form the Desktop signing schema matches.
  return JSON.stringify({
    types: {
      EIP712Domain: [
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      SafeTx: SAFE_TX_TYPES.SafeTx,
    },
    primaryType: "SafeTx",
    domain: { chainId, verifyingContract: getAddress(safe) },
    message: {
      to: getAddress(tx.to),
      value: tx.value.toString(),
      data: tx.data,
      operation: tx.operation,
      safeTxGas: tx.safeTxGas.toString(),
      baseGas: tx.baseGas.toString(),
      gasPrice: tx.gasPrice.toString(),
      gasToken: getAddress(tx.gasToken),
      refundReceiver: getAddress(tx.refundReceiver),
      nonce: tx.nonce.toString(),
    },
  });
}

export interface Eip1193Provider {
  request(args: { method: string; params?: readonly unknown[] | object }): Promise<unknown>;
}

/** Asks an EIP-1193 wallet (browser, WalletConnect, Desktop forwarding) for the owner's SafeTx signature. */
export async function signSafeTx(
  provider: Eip1193Provider,
  signer: Address,
  chainId: number,
  safe: Address,
  tx: SafeTx,
): Promise<Hex> {
  return (await provider.request({
    method: "eth_signTypedData_v4",
    params: [signer, safeTxTypedDataJson(chainId, safe, tx)],
  })) as Hex;
}

export interface GovernanceCheck {
  ownerIsPinnedSafe: boolean;
  signerIsSafeOwner: boolean;
  safeNonce: bigint;
  nonce: "current" | "queued" | "used";
  pendingOwnerIsSafe?: boolean;
  problems: string[];
}

/**
 * The checks before a signer signs. Any RPC failure throws: governance is not urgent, so the page
 * blocks instead of signing unchecked. For acceptOwnership the registry's pendingOwner must be the
 * Safe in place of its owner.
 */
export async function checkBeforeSigning(
  client: PublicClient,
  pin: RegistryPin,
  signer: Address,
  g: GovernanceSafeTx,
): Promise<GovernanceCheck> {
  const accepting = g.actions.some((a) => a.kind === "acceptOwnership");
  const [owner, pendingOwner, owners, safeNonce] = await Promise.all([
    client.readContract({ address: pin.registry, abi, functionName: "owner" }),
    client.readContract({ address: pin.registry, abi, functionName: "pendingOwner" }),
    client.readContract({ address: pin.safe, abi: safeAbi, functionName: "getOwners" }),
    client.readContract({ address: pin.safe, abi: safeAbi, functionName: "nonce" }),
  ]);
  const ownerIsPinnedSafe = isAddressEqual(owner as Address, pin.safe);
  const pendingOwnerIsSafe = isAddressEqual(pendingOwner as Address, pin.safe);
  const signerIsSafeOwner = (owners as readonly Address[]).some((o) => isAddressEqual(o, signer));
  const nonce = g.tx.nonce < (safeNonce as bigint) ? "used" : g.tx.nonce === safeNonce ? "current" : "queued";
  const problems: string[] = [...checkGovernanceSafeTx(pin, g.tx)];
  if (accepting ? !pendingOwnerIsSafe : !ownerIsPinnedSafe) {
    problems.push(
      accepting
        ? "The registry's pending owner is not the pinned Safe."
        : "The registry's owner is not the pinned Safe.",
    );
  }
  if (!signerIsSafeOwner) problems.push("You are not a signer of this Safe.");
  if (nonce === "used") problems.push(`Nonce ${g.tx.nonce} is already used; the Safe is at ${safeNonce}.`);
  return {
    ownerIsPinnedSafe,
    signerIsSafeOwner,
    safeNonce: safeNonce as bigint,
    nonce,
    pendingOwnerIsSafe,
    problems,
  };
}

export interface ProposeInput {
  serviceUrl: string;
  pin: RegistryPin;
  g: GovernanceSafeTx;
  sender: Address;
  signature: Hex;
  /** Sent as a bearer token to the service URL only. Some service hosts need one. */
  apiKey?: string;
  origin?: string;
  fetchImpl?: typeof fetch;
}

/** Posts a signed governance SafeTx to the Safe Transaction Service, where the other signers find it. */
export async function proposeToTxService(p: ProposeInput): Promise<void> {
  const problems = checkGovernanceSafeTx(p.pin, p.g.tx);
  if (problems.length) throw new Error(`Not a valid governance SafeTx: ${problems.join("; ")}`);
  const f = p.fetchImpl ?? fetch;
  const res = await f(proposalUrl(p.serviceUrl, p.pin.safe), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(p.apiKey ? { authorization: `Bearer ${p.apiKey}` } : {}),
    },
    body: JSON.stringify(
      proposalBody(p.g.tx, p.g.hash, p.sender, p.signature, p.origin ?? "6529 Provenance"),
    ),
  });
  if (!res.ok)
    throw new Error(
      `The Safe Transaction Service answered HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`,
    );
}
