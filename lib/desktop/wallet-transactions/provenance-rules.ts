/**
 * Wallet transactions for 6529 Desktop: 6529 Provenance publisher calls
 * (data only).
 *
 * A publisher key (or the registry's owner) opens a release, publishes
 * records into it and seals it, as ordinary transactions to a pinned
 * registry with no value. Governance (registrations, deletions, keys,
 * ownership) is not here: it is signed by the owner Safe's signers as a
 * Safe transaction. The browser page checks before Send that the sender
 * may publish to the registry (`isPublisher` or `owner`).
 *
 * Size: a transaction's data is capped at `MAX_TRANSACTION_DATA_BYTES`
 * (10 KiB) by forwarding. A `publish` record takes 448 to 640 bytes (CID
 * up to 64 bytes, label up to 128), so 15 records of any valid size fit,
 * and up to 20 (the rule's cap) when CIDs and labels are short. Callers
 * size batches by bytes.
 */

import type { ArgRule, RuleArg, TransactionRule } from "./types";

const SEPOLIA = 11_155_111;

/**
 * The pinned registries (Sepolia, source tag v1.0.0-rc.1, both owned by
 * the 2-of-3 test Safe 0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68): the
 * test registry and the Museum catalog registry.
 */
const PROVENANCE_REGISTRIES: readonly (readonly [number, string])[] = [
  [SEPOLIA, "0x0e289576c7565d29018134517309668946ffc912"],
  [SEPOLIA, "0xee91c45a1893fbb45ce8eea170ef05d8d85bb850"],
];

/** Records in one `publish` call (15 of any valid size always fit). */
const MAX_PUBLISH_RECORDS = 20;
/** A binary CIDv1 is at most 64 bytes (the registry's own bound). */
const MAX_CID_BYTES = 64;
/** A label is at most 128 bytes (the registry's own bound). */
const MAX_LABEL_BYTES = 128;
const ZERO_VALUE = { min: "0", max: "0" } as const;

const ANY: ArgRule = { any: true };
const NOT_ZERO: ArgRule = { notZero: true };
const CID: ArgRule = { lenMax: MAX_CID_BYTES };
const LABEL: ArgRule = { readableText: true, lenMax: MAX_LABEL_BYTES };

/** `HashRef(uint16 algorithm, bytes32 digest, bytes32 canonicalizationId)`. */
const hashRef = (name: string): RuleArg => ({
  name,
  type: "(uint16,bytes32,bytes32)",
  rule: ANY,
  components: [
    // 1 Keccak-256, 2 SHA-256.
    { name: "algorithm", type: "uint16", rule: { oneOf: ["1", "2"] } },
    { name: "digest", type: "bytes32", rule: NOT_ZERO },
    { name: "canonicalizationId", type: "bytes32", rule: ANY },
  ],
});

function registryRules(chainId: number, to: string): TransactionRule[] {
  return [
    {
      id: "provenance.openRelease",
      chainId,
      to,
      selector: "0xe2fb5f87",
      signature:
        "openRelease((bytes,(uint16,bytes32,bytes32),bytes,bytes32,bytes20,string))",
      args: [
        {
          name: "header",
          type: "(bytes,(uint16,bytes32,bytes32),bytes,bytes32,bytes20,string)",
          rule: ANY,
          components: [
            { name: "manifestCid", type: "bytes", rule: CID },
            hashRef("manifestHash"),
            { name: "rootCid", type: "bytes", rule: CID },
            { name: "arweaveId", type: "bytes32", rule: ANY },
            { name: "sourceCommit", type: "bytes20", rule: ANY },
            { name: "label", type: "string", rule: LABEL },
          ],
        },
      ],
      value: ZERO_VALUE,
      risk: "normal",
    },
    {
      id: "provenance.publish",
      chainId,
      to,
      selector: "0x19f8e2c2",
      signature:
        "publish(uint32,(bytes32,bytes32,bytes32,(uint16,bytes32,bytes32),uint64,bytes,bytes32,string,uint32)[])",
      args: [
        { name: "releaseId", type: "uint32", rule: NOT_ZERO },
        {
          name: "records",
          type: "(bytes32,bytes32,bytes32,(uint16,bytes32,bytes32),uint64,bytes,bytes32,string,uint32)[]",
          rule: { lenMin: 1, lenMax: MAX_PUBLISH_RECORDS },
          components: [
            { name: "subjectId", type: "bytes32", rule: NOT_ZERO },
            { name: "recordType", type: "bytes32", rule: NOT_ZERO },
            { name: "schemaId", type: "bytes32", rule: NOT_ZERO },
            hashRef("contentHash"),
            { name: "effectiveAt", type: "uint64", rule: NOT_ZERO },
            { name: "cid", type: "bytes", rule: CID },
            { name: "arweaveId", type: "bytes32", rule: ANY },
            { name: "label", type: "string", rule: LABEL },
            { name: "expectedVersion", type: "uint32", rule: ANY },
          ],
        },
      ],
      value: ZERO_VALUE,
      risk: "normal",
    },
    {
      id: "provenance.sealRelease",
      chainId,
      to,
      selector: "0xe672920c",
      signature: "sealRelease(uint32,uint32)",
      args: [
        { name: "releaseId", type: "uint32", rule: NOT_ZERO },
        { name: "expectedRecordCount", type: "uint32", rule: ANY },
      ],
      value: ZERO_VALUE,
      risk: "normal",
    },
  ];
}

export const PROVENANCE_RULES: readonly TransactionRule[] =
  PROVENANCE_REGISTRIES.flatMap(([chainId, to]) => registryRules(chainId, to));
