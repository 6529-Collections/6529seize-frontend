/**
 * The P28 signed envelope (`SignedTx v1`) and its txId.
 *
 * Sources: P28 §7.1-§7.2 and §7.8; P40 §2.1-§2.3.
 *
 *   SignedTx v1 = uint16 schemaId 0x4001 || uint16 schemaVersion 1
 *                 || bytes32 NETWORK_ID || TxHeader fields 1-15
 *                 || uint16 opType || uint16 opVersion || body
 *                 || list<Signature> signatures   (1 or 2 entries)
 *   Signature   = (uint8 role, uint8 keyType, bytes sig, bytes proof)
 *
 *   txId = keccak256(0x19 || 0x01 || domainSeparator ||
 *                    hashStruct(<Op>{header: TxHeader, body: <Op>Body}))
 *
 * The domain is EIP712Domain{name "6529 Network", version "1", salt
 * NETWORK_ID}. NETWORK_ID binds the genesis commitment, so this code takes
 * the network as a parameter; production values arrive with genesis (O5).
 */
import type { Hex } from "viem";

import { CeReader, CeWriter, isZeroValue } from "./ce";
import { domainSeparator, hashStruct, typeHash, typedDataDigest } from "./eip712";
import {
  ChainCodecError,
  ChainResultCode,
  HEADER_FIELD_BASE,
  SIGNATURE_LIST_FIELD,
  resultDetail,
} from "./errors";
import { findOperation, isKnownOpType, OpType, type OperationSchema } from "./ops";
import type { StructType, ValueOf } from "./schema";
import { bytes, bytes32, list, optional, struct, u128, u16, u32, u64, u8 } from "./schema";

export const SIGNED_TX_SCHEMA_ID = 0x4001;
export const SIGNED_TX_SCHEMA_VERSION = 1;
export const TX_DOMAIN_NAME = "6529 Network";
export const TX_DOMAIN_VERSION = "1";

/** P40 §5.7 parameters (values marked [E] in the design may change). */
export const MAX_TX_BYTES = 16 * 1024;
export const MAX_TX_WORK = 4_000_000n;
export const MAX_PROOF_BYTES = 12 * 1024;
export const MAX_VALIDITY_MS = 86_400_000n;
export const MAX_NONCE_LANE = 15;

/** The network a transaction is signed for (P28 §3.1). */
export interface ChainNetwork {
  /** Engine chain-ID string, e.g. "6529-devnet-1". */
  readonly chainId: string;
  /** NETWORK_ID: the EIP-712 domain salt. */
  readonly networkId: Hex;
}

/** P28 §7.6 / P40 §2.2: the EIP-712 form of the header, 16 flat fields. */
export const TX_HEADER = struct("TxHeader", [
  ["ruleVersion", u32],
  ["principal", bytes32],
  ["keyType", u8],
  ["keyId", bytes32],
  ["authRef", bytes32],
  ["nonceLane", u32],
  ["nonce", u64],
  ["notBefore", u64],
  ["expiresAt", u64],
  ["ethRefNumber", u64],
  ["ethRefHash", bytes32],
  ["feeMode", u8],
  ["sponsorRef", bytes32],
  ["maxFee", u128],
  ["maxWork", u64],
  ["tipPerRU", u128],
]);

export type TxHeader = ValueOf<typeof TX_HEADER>;

const ETH_REF = struct("EthRef", [
  ["number", u64],
  ["hash", bytes32],
]);

/** P28 §7.1: the CE form, where authRef, ethRef and sponsorRef are optional. */
const TX_HEADER_CE = struct("TxHeaderCe", [
  ["ruleVersion", u32],
  ["principal", bytes32],
  ["keyType", u8],
  ["keyId", bytes32],
  ["authRef", optional(bytes32)],
  ["nonceLane", u32],
  ["nonce", u64],
  ["notBefore", u64],
  ["expiresAt", u64],
  ["ethRef", optional(ETH_REF)],
  ["feeMode", u8],
  ["sponsorRef", optional(bytes32)],
  ["maxFee", u128],
  ["maxWork", u64],
  ["tipPerRU", u128],
]);

type TxHeaderCe = ValueOf<typeof TX_HEADER_CE>;

/** P28 §7.1 field numbers, used in P40 details as 0x100 + n. */
const HEADER_FIELD_NUMBER: Readonly<Record<string, number>> = {
  ruleVersion: 1,
  principal: 2,
  keyType: 3,
  keyId: 4,
  authRef: 5,
  nonceLane: 6,
  nonce: 7,
  notBefore: 8,
  expiresAt: 9,
  ethRef: 10,
  feeMode: 11,
  sponsorRef: 12,
  maxFee: 13,
  maxWork: 14,
  tipPerRU: 15,
};

const SIGNATURE = struct("Signature", [
  ["role", u8],
  ["keyType", u8],
  // The largest Phase 1 signature is keyType 1's 65 bytes (P40 §2.1); the
  // design gives no separate CE maximum for this field.
  ["sig", bytes(65)],
  ["proof", bytes(MAX_PROOF_BYTES)],
]);

const SIGNATURE_LIST = list(SIGNATURE, 2);

export type TxSignature = ValueOf<typeof SIGNATURE>;

export const ZERO32: Hex = `0x${"00".repeat(32)}`;

/** A header with the defaults P40's worked examples use for unset fields. */
export function txHeader(fields: Partial<TxHeader>): TxHeader {
  return {
    ruleVersion: 1,
    principal: ZERO32,
    keyType: 1,
    keyId: ZERO32,
    authRef: ZERO32,
    nonceLane: 0,
    nonce: 0n,
    notBefore: 0n,
    expiresAt: 0n,
    ethRefNumber: 0n,
    ethRefHash: ZERO32,
    feeMode: 0,
    sponsorRef: ZERO32,
    maxFee: 0n,
    maxWork: 0n,
    tipPerRU: 0n,
    ...fields,
  };
}

function toCeHeader(header: TxHeader): TxHeaderCe {
  const { ethRefNumber, ethRefHash, ...rest } = header;
  return { ...rest, ethRef: { number: ethRefNumber, hash: ethRefHash } };
}

function fromCeHeader(header: TxHeaderCe): TxHeader {
  const { ethRef, ...rest } = header;
  return { ...rest, ethRefNumber: ethRef.number, ethRefHash: ethRef.hash };
}

export function encodeTxHeaderCe(header: TxHeader): Uint8Array {
  return new CeWriter().write(TX_HEADER_CE, toCeHeader(header)).bytes();
}

const primaryTypes = new WeakMap<OperationSchema, StructType>();

/** `<Op>(TxHeader header,<Op>Body body)` for one operation. */
export function primaryStruct(op: OperationSchema): StructType {
  const cached = primaryTypes.get(op);
  if (cached !== undefined) {
    return cached;
  }
  const made = struct(op.primaryType, [
    ["header", TX_HEADER],
    ["body", op.body],
  ]);
  primaryTypes.set(op, made);
  return made;
}

export interface TxDigests {
  readonly domainSeparator: Hex;
  readonly typeHash: Hex;
  readonly headerHash: Hex;
  readonly payloadHash: Hex;
  readonly txId: Hex;
}

export function txDomainSeparator(networkIdHex: Hex): Hex {
  return domainSeparator({
    name: TX_DOMAIN_NAME,
    version: TX_DOMAIN_VERSION,
    salt: networkIdHex,
  });
}

/** P28 §7.2: the four hashes of P28 §7.10 and P40 §13, ending in txId. */
export function txDigests<B extends StructType>(
  networkIdHex: Hex,
  header: TxHeader,
  op: OperationSchema<B>,
  body: ValueOf<B>
): TxDigests {
  const primary = primaryStruct(op);
  const separator = txDomainSeparator(networkIdHex);
  return {
    domainSeparator: separator,
    typeHash: typeHash(primary),
    headerHash: hashStruct(TX_HEADER, header),
    payloadHash: hashStruct(op.body, body),
    txId: typedDataDigest(separator, hashStruct(primary, { header, body })),
  };
}

export interface UnsignedTx<B extends StructType = StructType> {
  readonly networkId: Hex;
  readonly header: TxHeader;
  readonly op: OperationSchema<B>;
  readonly body: ValueOf<B>;
}

export interface SignedTx<B extends StructType = StructType> extends UnsignedTx<B> {
  readonly signatures: readonly TxSignature[];
}

function writeUnsigned<B extends StructType>(writer: CeWriter, tx: UnsignedTx<B>): CeWriter {
  return writer
    .write(u16, SIGNED_TX_SCHEMA_ID)
    .write(u16, SIGNED_TX_SCHEMA_VERSION)
    .write(bytes32, tx.networkId)
    .write(TX_HEADER_CE, toCeHeader(tx.header), ["header"])
    .write(u16, tx.op.opType)
    .write(u16, tx.op.opVersion)
    .write(tx.op.body, tx.body, ["body"]);
}

/** The SignedTx bytes up to and including the body ("unsigned" in P40 §13). */
export function encodeUnsignedTx<B extends StructType>(tx: UnsignedTx<B>): Uint8Array {
  return writeUnsigned(new CeWriter(), tx).bytes();
}

export function encodeSignedTx<B extends StructType>(tx: SignedTx<B>): Uint8Array {
  return writeUnsigned(new CeWriter(), tx)
    .write(SIGNATURE_LIST, tx.signatures, ["signatures"])
    .bytes();
}

export function txIdOf<B extends StructType>(tx: UnsignedTx<B>): Hex {
  return txDigests(tx.networkId, tx.header, tx.op, tx.body).txId;
}

export interface DecodeSignedTxOptions {
  /** When set, a different carried NETWORK_ID fails with 0x0104. */
  readonly expectedNetworkId?: Hex;
}

export interface DecodedSignedTx {
  readonly tx: SignedTx;
  readonly txId: Hex;
  readonly size: number;
}

function headerError(error: ChainCodecError): ChainCodecError {
  const field = typeof error.path[0] === "string" ? HEADER_FIELD_NUMBER[error.path[0]] : undefined;
  return error.at(["header"], field === undefined ? 0 : resultDetail(HEADER_FIELD_BASE + field));
}

function bodyError(error: ChainCodecError, body: StructType): ChainCodecError {
  const name = error.path[0];
  const index = body.fields.findIndex(([fieldName]) => fieldName === name);
  const item = typeof error.path[1] === "number" ? error.path[1] + 1 : 0;
  return error.at(["body"], index < 0 ? 0 : resultDetail(index + 1, item));
}

function readLocated<T>(read: () => T, locate: (error: ChainCodecError) => ChainCodecError): T {
  try {
    return read();
  } catch (error) {
    if (error instanceof ChainCodecError) {
      throw locate(error);
    }
    throw error;
  }
}

function readOperation(reader: CeReader): OperationSchema {
  const opType = reader.read(u16);
  const opVersion = reader.read(u16);
  const op = findOperation(opType, opVersion);
  if (op !== null) {
    return op;
  }
  const hex = `0x${opType.toString(16).padStart(4, "0")}`;
  if (!isKnownOpType(opType)) {
    throw new ChainCodecError(ChainResultCode.UNKNOWN_OP, `undefined opType ${hex}`);
  }
  if (findOperation(opType, 1) !== null) {
    throw new ChainCodecError(
      ChainResultCode.UNKNOWN_VERSION,
      `opVersion ${opVersion} of ${hex} is not supported`
    );
  }
  // A P40 operation whose schema this client does not carry yet.
  throw new ChainCodecError(ChainResultCode.UNKNOWN_OP, `no client schema for ${hex}`);
}

/**
 * Decodes and checks a SignedTx. The schema must be known before the body
 * can be read, so 0x0105-0x0107 can surface before a body's 0x0101, while
 * P40 §2.3 lists decoding first; the design does not order these further.
 */
export function decodeSignedTx(
  input: Uint8Array,
  options: DecodeSignedTxOptions = {}
): DecodedSignedTx {
  const reader = new CeReader(input);
  const schemaId = reader.read(u16);
  const schemaVersion = reader.read(u16);
  if (schemaId !== SIGNED_TX_SCHEMA_ID || schemaVersion !== SIGNED_TX_SCHEMA_VERSION) {
    throw new ChainCodecError(ChainResultCode.UNKNOWN_SCHEMA, "not a SignedTx v1");
  }
  const carriedNetwork = reader.read(bytes32);
  const header = fromCeHeader(readLocated(() => reader.read(TX_HEADER_CE), headerError));
  const op = readOperation(reader);
  const body = readLocated(() => reader.read(op.body), (e) => bodyError(e, op.body));
  const signatures = readLocated(
    () => reader.read(SIGNATURE_LIST),
    (e) => e.at(["signatures"], resultDetail(SIGNATURE_LIST_FIELD))
  );
  reader.end();
  if (input.length > MAX_TX_BYTES) {
    throw new ChainCodecError(ChainResultCode.OVERSIZE, `${input.length} bytes`);
  }
  if (options.expectedNetworkId !== undefined && carriedNetwork !== options.expectedNetworkId.toLowerCase()) {
    throw new ChainCodecError(ChainResultCode.WRONG_NETWORK, "carried NETWORK_ID differs");
  }
  const tx: SignedTx = { networkId: carriedNetwork, header, op, body, signatures };
  return { tx, txId: txIdOf(tx), size: input.length };
}

export const KeyType = {
  SECP256K1: 1,
  ED25519: 2,
  CONTRACT_WALLET: 3,
  GROUP_EPOCH: 4,
  P256: 5,
  WEBAUTHN_P256: 6,
} as const;

/** Key types a Phase 1 rule version accepts (P40 §2.1 field 3; 5 and 6 wait on WM1). */
const PHASE1_KEY_TYPES: ReadonlySet<number> = new Set([
  KeyType.SECP256K1,
  KeyType.ED25519,
  KeyType.CONTRACT_WALLET,
]);

function headerRule(code: number, field: number, reason: string): ChainCodecError {
  return new ChainCodecError(code, reason, ["header"], resultDetail(HEADER_FIELD_BASE + field));
}

function isAddressWord(value: Hex): boolean {
  return /^0x0{24}[0-9a-f]{40}$/i.test(value);
}

function identityRules(header: TxHeader, opType: number): ChainCodecError | null {
  const principalZero = isZeroValue(bytes32, header.principal);
  const authRefPresent = !isZeroValue(bytes32, header.authRef);
  if (principalZero !== (opType === OpType.IDENTITY_CREATE)) {
    return headerRule(ChainResultCode.PRE_IDENTITY_OP, 2, "principal is zero only for IDENTITY_CREATE");
  }
  if (!PHASE1_KEY_TYPES.has(header.keyType)) {
    return headerRule(ChainResultCode.KEY_TYPE_NOT_ALLOWED, 3, "key type not enabled");
  }
  if (header.keyType === KeyType.ED25519 && !authRefPresent) {
    return headerRule(ChainResultCode.KEY_TYPE_NOT_ALLOWED, 3, "a session key needs authRef");
  }
  if (header.keyType !== KeyType.ED25519 && !isAddressWord(header.keyId)) {
    return headerRule(ChainResultCode.HEADER_RULE, 4, "keyId must be an address word");
  }
  if (principalZero && authRefPresent) {
    return headerRule(ChainResultCode.HEADER_RULE, 5, "no authRef without a principal");
  }
  return null;
}

function windowAndFeeRules(header: TxHeader): ChainCodecError | null {
  const ethRefPresent = header.ethRefNumber !== 0n || !isZeroValue(bytes32, header.ethRefHash);
  const sponsorPresent = !isZeroValue(bytes32, header.sponsorRef);
  if (header.nonceLane > MAX_NONCE_LANE) {
    return headerRule(ChainResultCode.HEADER_RULE, 6, "nonceLane above 15");
  }
  if (
    header.notBefore >= header.expiresAt ||
    header.expiresAt - header.notBefore > MAX_VALIDITY_MS
  ) {
    return headerRule(ChainResultCode.VALIDITY_TOO_LONG, 9, "bad validity window");
  }
  if (ethRefPresent) {
    return headerRule(ChainResultCode.HEADER_RULE, 10, "no Phase 1 operation carries ethRef");
  }
  if (header.feeMode > 3) {
    return headerRule(ChainResultCode.BAD_ENUM, 11, "feeMode is 0-3");
  }
  if (isZeroValue(bytes32, header.principal) && header.feeMode !== 0 && header.feeMode !== 2) {
    return headerRule(ChainResultCode.FEE_MODE_NOT_ALLOWED, 11, "feeMode 0 or 2 without a principal");
  }
  if (sponsorPresent !== (header.feeMode === 1 || header.feeMode === 2)) {
    return headerRule(ChainResultCode.HEADER_RULE, 12, "sponsorRef iff feeMode 1 or 2");
  }
  if (header.maxWork > MAX_TX_WORK) {
    return headerRule(ChainResultCode.WORK_TOO_HIGH, 14, "maxWork above MAX_TX_WORK");
  }
  return null;
}

/**
 * P40 §2.1's stateless header rules, checked in table order. The design
 * lists them as a table and does not say which code wins when several
 * fail; this returns the first in field order.
 */
export function checkHeaderRules(header: TxHeader, opType: number): ChainCodecError | null {
  return identityRules(header, opType) ?? windowAndFeeRules(header);
}

const SECP256K1_HALF_ORDER =
  0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n;

function signatureLengthFor(keyType: number): number | null {
  if (keyType === KeyType.SECP256K1) {
    return 65;
  }
  if (keyType === KeyType.ED25519) {
    return 64;
  }
  return keyType === KeyType.CONTRACT_WALLET ? 0 : null;
}

function listRule(reason: string, item: number): ChainCodecError {
  return new ChainCodecError(
    ChainResultCode.SIGNATURE_LIST,
    reason,
    ["signatures"],
    resultDetail(SIGNATURE_LIST_FIELD, item)
  );
}

/** P28 §7.8: v in {27, 28} and low s, so each signature has one encoding. */
function secp256k1Canonical(sig: Hex): boolean {
  const s = BigInt(`0x${sig.slice(66, 130)}`);
  const v = Number.parseInt(sig.slice(130, 132), 16);
  return (v === 27 || v === 28) && s <= SECP256K1_HALF_ORDER;
}

function entryRule(entry: TxSignature, index: number): ChainCodecError | null {
  const expected = signatureLengthFor(entry.keyType);
  const sigBytes = (entry.sig.length - 2) / 2;
  if (expected === null || sigBytes !== expected) {
    return listRule("signature length does not fit its key type", index + 1);
  }
  if (entry.keyType !== KeyType.CONTRACT_WALLET && entry.proof !== "0x") {
    return listRule("proof must be empty for this key type", index + 1);
  }
  if (entry.keyType === KeyType.SECP256K1 && !secp256k1Canonical(entry.sig)) {
    return new ChainCodecError(
      ChainResultCode.NONCANONICAL_SIGNATURE,
      "high s or bad v",
      ["signatures", index],
      resultDetail(SIGNATURE_LIST_FIELD, index + 1)
    );
  }
  return null;
}

/** P40 §2.1's signature-list rules (0x010F, and 0x0202 for keyType 1). */
export function checkSignatureList(
  header: TxHeader,
  signatures: readonly TxSignature[]
): ChainCodecError | null {
  const [first, second] = signatures;
  if (first?.role !== 0 || first.keyType !== header.keyType) {
    return listRule("first entry must be role 0 with the header's key type", 1);
  }
  const sponsored = header.feeMode === 2;
  if (sponsored !== (second !== undefined)) {
    return listRule("a role-1 entry is present iff feeMode is 2", 2);
  }
  if (
    second !== undefined &&
    (second.role !== 1 ||
      (second.keyType !== KeyType.SECP256K1 && second.keyType !== KeyType.CONTRACT_WALLET))
  ) {
    return listRule("the sponsor entry is role 1 with key type 1 or 3", 2);
  }
  for (const [index, entry] of signatures.entries()) {
    const problem = entryRule(entry, index);
    if (problem !== null) {
      return problem;
    }
  }
  return null;
}
