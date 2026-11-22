/**
 * Safe transactions for 6529 Desktop: the 6529 Provenance governance calls
 * a pinned owner Safe may approve (data only, in the transaction rule
 * format of `@/lib/desktop/wallet-transactions`, one set per registry).
 *
 * Publishing (open, publish, seal) is not here: a publisher key sends it
 * as ordinary transactions. The calls in `SINGLE_CALL_ONLY` change who
 * controls the registry or remove records; a Safe transaction may carry
 * one of them only on its own, never inside a batch.
 */

import type {
  ArgRule,
  RuleArg,
  TransactionRule,
} from "@/lib/desktop/wallet-transactions/types";

const ANY: ArgRule = { any: true };
const NOT_ZERO: ArgRule = { notZero: true };
/** A registered literal: 1-128 printable ASCII characters. */
const LITERAL: ArgRule = { readableAscii: true };
/** A CID or specification CID: at most 128 bytes. */
const CID: ArgRule = { lenMax: 128 };
const ZERO_VALUE = { min: "0", max: "0" } as const;

const hashRef = (name: string): RuleArg => ({
  name,
  type: "(uint16,bytes32,bytes32)",
  rule: ANY,
  components: [
    { name: "algorithm", type: "uint16", rule: { oneOf: ["1", "2"] } },
    { name: "digest", type: "bytes32", rule: NOT_ZERO },
    { name: "canonicalizationId", type: "bytes32", rule: ANY },
  ],
});

/** Calls a Safe transaction may carry only alone (not in a batch). */
export const SINGLE_CALL_ONLY: readonly string[] = [
  "governance.deleteVersion",
  "governance.deleteVersions",
  "governance.deleteSubject",
  "governance.freeze",
  "governance.declareSuccessor",
  "governance.transferOwnership",
  "governance.acceptOwnership",
];

type Call = Pick<TransactionRule, "id" | "selector" | "signature" | "args" | "risk">;

const CALLS: readonly Call[] = [
  {
    id: "governance.registerCanonicalization",
    selector: "0xe2fb0b20",
    signature: "registerCanonicalization(string,bytes)",
    args: [
      { name: "literal", type: "string", rule: LITERAL },
      { name: "specCid", type: "bytes", rule: CID },
    ],
    risk: "normal",
  },
  {
    id: "governance.registerRecordType",
    selector: "0x4725e130",
    signature: "registerRecordType(string)",
    args: [{ name: "literal", type: "string", rule: LITERAL }],
    risk: "normal",
  },
  {
    id: "governance.registerSchema",
    selector: "0xdad47848",
    signature: "registerSchema(string,(uint16,bytes32,bytes32),bytes,bytes)",
    args: [
      { name: "literal", type: "string", rule: LITERAL },
      hashRef("documentHash"),
      { name: "cid", type: "bytes", rule: CID },
      // By hash and CID only: no document stored on chain.
      { name: "document", type: "bytes", rule: { emptyBytes: true } },
    ],
    risk: "normal",
  },
  {
    id: "governance.setPublisher",
    selector: "0x618bb079",
    signature: "setPublisher(address,bool)",
    args: [
      { name: "publisher", type: "address", rule: NOT_ZERO },
      { name: "authorized", type: "bool", rule: ANY },
    ],
    risk: { highIf: [{ arg: "authorized", is: { equals: true } }] },
  },
  {
    id: "governance.deleteVersion",
    selector: "0x9c43494f",
    signature: "deleteVersion(bytes32,uint32,bytes32)",
    args: [
      { name: "subjectId", type: "bytes32", rule: NOT_ZERO },
      { name: "version", type: "uint32", rule: NOT_ZERO },
      { name: "reasonDigest", type: "bytes32", rule: ANY },
    ],
    risk: "high",
  },
  {
    id: "governance.deleteVersions",
    selector: "0x0e9e6c6e",
    signature: "deleteVersions(bytes32,uint32,uint32,bytes32)",
    args: [
      { name: "subjectId", type: "bytes32", rule: NOT_ZERO },
      { name: "fromVersion", type: "uint32", rule: NOT_ZERO },
      { name: "toVersion", type: "uint32", rule: NOT_ZERO },
      { name: "reasonDigest", type: "bytes32", rule: ANY },
    ],
    risk: "high",
  },
  {
    id: "governance.deleteSubject",
    selector: "0xcb1efbf1",
    signature: "deleteSubject(bytes32,bytes32)",
    args: [
      { name: "subjectId", type: "bytes32", rule: NOT_ZERO },
      { name: "reasonDigest", type: "bytes32", rule: ANY },
    ],
    risk: "high",
  },
  {
    id: "governance.freeze",
    selector: "0x62a5af3b",
    signature: "freeze()",
    args: [],
    risk: "high",
  },
  {
    id: "governance.declareSuccessor",
    selector: "0x731fa208",
    signature: "declareSuccessor(address)",
    args: [{ name: "successorRegistry", type: "address", rule: NOT_ZERO }],
    risk: "high",
  },
  {
    id: "governance.transferOwnership",
    selector: "0xf2fde38b",
    signature: "transferOwnership(address)",
    args: [{ name: "newOwner", type: "address", rule: NOT_ZERO }],
    risk: "high",
  },
  {
    id: "governance.acceptOwnership",
    selector: "0x79ba5097",
    signature: "acceptOwnership()",
    args: [],
    risk: "high",
  },
];

/** The governance calls on `registry` (lower case) on `chainId`. */
export function governanceRules(
  chainId: number,
  registry: string
): TransactionRule[] {
  return CALLS.map((call) => ({
    ...call,
    chainId,
    to: registry,
    value: ZERO_VALUE,
  }));
}
