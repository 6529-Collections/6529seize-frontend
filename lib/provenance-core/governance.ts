// Copied from 6529-Collections/6529-provenance-app src/governance.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  decodeFunctionData,
  encodeFunctionData,
  getAddress,
  isAddressEqual,
  keccak256,
  size,
  zeroAddress,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { provenanceRegistryAbi as abi } from "./abi/provenanceRegistry";
import { decodeAction, describeAction, encodeAction, literalProblem, type Action } from "./actions";
import { cidProblem } from "./cid";
import { buildForCodeHash } from "./config/builds";
import { assertChain } from "./registry";
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
 * The rules match the SafeTx schema 6529 Desktop's wallet forwarding enforces:
 * - the deletes, freeze, declareSuccessor, transferOwnership and acceptOwnership are single-call
 *   SafeTxs, operation 0 to the registry;
 * - other calls go 2 to 16 at a time through MultiSendCallOnly, operation 1;
 * - value, safeTxGas, baseGas and gasPrice are 0, and gasToken and refundReceiver are the zero
 *   address;
 * - the nonce fits in 2^53 - 1, and the typed data is at most 16 Ki characters of JSON.
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
      return literalProblem(a.literal) ?? specCidProblem(a.specCid);
    case "registerRecordType":
      return literalProblem(a.literal);
    case "registerSchema":
      if (literalProblem(a.literal)) return literalProblem(a.literal);
      if (a.documentHash.algorithm !== 1 && a.documentHash.algorithm !== 2)
        return "The document hash algorithm is 1 or 2.";
      if (a.documentHash.digest.toLowerCase() === ZERO32) return "The document digest is zero.";
      // REG-4 needs a CID or a stored document, and a SafeTx never carries the document.
      if (size(a.cid) === 0) return "A schema registered from a SafeTx needs its CID.";
      if (cidProblem(a.cid)) return `Schema CID: ${cidProblem(a.cid)}`;
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
    default:
      return undefined;
  }
}

function specCidProblem(cid: Hex): string | undefined {
  const p = cidProblem(cid);
  return p ? `Specification CID: ${p}` : undefined;
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
  if (nonce < 0n || nonce > MAX_NONCE) throw new Error(`The nonce ${nonce} is outside 0 to 2^53 - 1.`);
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
  if (nonce + BigInt(groups.length) - 1n > MAX_NONCE)
    throw new Error(`${groups.length} SafeTxs from nonce ${nonce} pass the largest nonce, 2^53 - 1.`);
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
  if (encodeFunctionData({ abi: multiSendAbi, functionName, args }).toLowerCase() !== tx.data.toLowerCase())
    throw new Error("the multiSend calldata is not in canonical ABI encoding");
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

/**
 * Asks an EIP-1193 wallet (browser, WalletConnect, Desktop forwarding) for the owner's SafeTx
 * signature. It checks nothing: use `signCheckedSafeTx`, which runs `checkBeforeSigning` on the
 * same SafeTx first, unless the caller has just run those checks itself.
 */
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
  /** The chain the client's endpoint answered with. */
  chainId: number;
  /** The block every read was made at. */
  block: bigint;
  /**
   * The calls `g.tx` makes, decoded from its calldata, or empty when it does not decode. A signing
   * screen shows these, never `g.actions`, which the caller supplies and the hash does not cover.
   */
  decoded: DecodedCall[];
  /** The risk of the decoded calls. */
  risk: GovernanceRisk;
  /** The registry's runtime code matches a build in `knownBuilds`. */
  knownBuild: boolean;
  /** The Safe's VERSION(), or undefined when the call reverted. */
  safeVersion?: string | undefined;
  ownerIsPinnedSafe: boolean;
  signerIsSafeOwner: boolean;
  safeNonce: bigint;
  nonce: "current" | "queued" | "used";
  pendingOwnerIsSafe?: boolean;
  problems: string[];
}

/** Whether a Safe VERSION() string such as "1.4.1" is at least 1.3.0. */
export function safeVersionAtLeast130(version: string | undefined): boolean {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? "");
  if (!m) return false;
  const [major, minor] = [Number(m[1]), Number(m[2])];
  return major > 1 || (major === 1 && minor >= 3);
}

/**
 * The checks before a signer signs. Any RPC failure throws: governance is not urgent, so the page
 * blocks instead of signing unchecked. The client must be on the pin's chain, since a Safe and a
 * registry can sit at the same addresses on two chains; on another chain this throws
 * ChainMismatchError before reading anything else.
 *
 * Everything is decided from `g.tx`, the SafeTx whose hash is signed: its calls are decoded from
 * its calldata, and whether it accepts ownership, its risk and the calls a screen shows come from
 * that decoding. `g.actions` and `g.risk` are only compared with it: when they differ, `problems`
 * says so. For acceptOwnership the registry's pendingOwner must be the Safe in place of its owner.
 *
 * `problems` also lists: a SafeTx hash that is not the hash of `g.tx` for the pin, registry code
 * that matches no known build, and a Safe whose VERSION() is below 1.3.0, the first version whose
 * EIP-712 domain is {chainId, verifyingContract}, the domain the typed data uses.
 */
export async function checkBeforeSigning(
  client: PublicClient,
  pin: RegistryPin,
  signer: Address,
  g: GovernanceSafeTx,
): Promise<GovernanceCheck> {
  await assertChain(client, pin.chainId);
  let decoded: DecodedCall[] = [];
  try {
    decoded = decodeGovernanceSafeTx(pin, g.tx);
  } catch {
    // checkGovernanceSafeTx below reports why it does not decode.
  }
  const accepting = decoded.some((c) => c.action.kind === "acceptOwnership");
  const risk: GovernanceRisk = decoded.some((c) => c.risk === "high") ? "high" : "normal";
  const block = await client.getBlockNumber({ cacheTime: 0 });
  const read = { blockNumber: block } as const;
  const [owner, pendingOwner, owners, safeNonce, code, safeVersion] = await Promise.all([
    client.readContract({ address: pin.registry, abi, functionName: "owner", ...read }),
    client.readContract({ address: pin.registry, abi, functionName: "pendingOwner", ...read }),
    client.readContract({ address: pin.safe, abi: safeAbi, functionName: "getOwners", ...read }),
    client.readContract({ address: pin.safe, abi: safeAbi, functionName: "nonce", ...read }),
    client.getCode({ address: pin.registry, ...read }),
    client
      .readContract({ address: pin.safe, abi: safeAbi, functionName: "VERSION", ...read })
      .catch((e: unknown) => {
        if (isRevert(e)) return undefined;
        throw e;
      }),
  ]);
  const knownBuild = Boolean(code && code !== "0x" && buildForCodeHash(keccak256(code)));
  const ownerIsPinnedSafe = isAddressEqual(owner as Address, pin.safe);
  const pendingOwnerIsSafe = isAddressEqual(pendingOwner as Address, pin.safe);
  const signerIsSafeOwner = (owners as readonly Address[]).some((o) => isAddressEqual(o, signer));
  const nonce = g.tx.nonce < (safeNonce as bigint) ? "used" : g.tx.nonce === safeNonce ? "current" : "queued";
  const problems: string[] = [...checkGovernanceSafeTx(pin, g.tx)];
  if (decoded.length) {
    const said = g.actions.map((a) => encodeAction(a).toLowerCase());
    const real = decoded.map((c) => encodeAction(c.action).toLowerCase());
    if (said.length !== real.length || said.some((d, i) => d !== real[i]))
      problems.push("The calls listed with the SafeTx are not the calls its calldata makes.");
    if (g.risk !== risk) problems.push(`The SafeTx is marked ${g.risk} risk; its calls are ${risk} risk.`);
  }
  const hash = safeTxHash(pin.chainId, pin.safe, g.tx);
  if (hash.toLowerCase() !== g.hash.toLowerCase())
    problems.push(`The SafeTx hash ${g.hash} is not the hash of this SafeTx, ${hash}.`);
  if (!knownBuild) problems.push("The registry's code matches no known ProvenanceRegistry build.");
  if (!safeVersionAtLeast130(safeVersion))
    problems.push(
      `The Safe's version is ${safeVersion ?? "unreadable"}; the typed data needs 1.3.0 or later.`,
    );
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
    chainId: pin.chainId,
    block,
    decoded,
    risk,
    knownBuild,
    safeVersion,
    ownerIsPinnedSafe,
    signerIsSafeOwner,
    safeNonce: safeNonce as bigint,
    nonce,
    pendingOwnerIsSafe,
    problems,
  };
}

/** Thrown by `signCheckedSafeTx` when the checks before signing find a problem. */
export class GovernanceCheckError extends Error {
  constructor(readonly check: GovernanceCheck) {
    super(`Not signing: ${check.problems.join("; ")}`);
    this.name = "GovernanceCheckError";
  }
}

/**
 * Signs a governance SafeTx only after `checkBeforeSigning` passes for the same pin, signer and
 * SafeTx, and only the SafeTx that was checked: the typed data comes from `g.tx` and the pin, the
 * same values the checks read. A nonce already used, or any other problem, throws
 * GovernanceCheckError with the full check, and nothing reaches the wallet.
 */
export async function signCheckedSafeTx(
  client: PublicClient,
  provider: Eip1193Provider,
  pin: RegistryPin,
  signer: Address,
  g: GovernanceSafeTx,
): Promise<{ signature: Hex; check: GovernanceCheck }> {
  const check = await checkBeforeSigning(client, pin, signer, g);
  if (check.problems.length) throw new GovernanceCheckError(check);
  const signature = await signSafeTx(provider, signer, pin.chainId, pin.safe, g.tx);
  return { signature, check };
}

function isRevert(e: unknown): boolean {
  return (
    e instanceof ContractFunctionExecutionError &&
    (e.cause instanceof ContractFunctionRevertedError || e.cause instanceof ContractFunctionZeroDataError)
  );
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
  const hash = safeTxHash(p.pin.chainId, p.pin.safe, p.g.tx);
  if (hash.toLowerCase() !== p.g.hash.toLowerCase())
    problems.push(`the hash ${p.g.hash} is not the SafeTx's hash, ${hash}`);
  if (problems.length) throw new Error(`Not a valid governance SafeTx: ${problems.join("; ")}`);
  const f = p.fetchImpl ?? fetch;
  const res = await f(proposalUrl(p.serviceUrl, p.pin.safe), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(p.apiKey ? { authorization: `Bearer ${p.apiKey}` } : {}),
    },
    body: JSON.stringify(proposalBody(p.g.tx, hash, p.sender, p.signature, p.origin ?? "6529 Provenance")),
  });
  if (!res.ok)
    throw new Error(
      `The Safe Transaction Service answered HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`,
    );
}
