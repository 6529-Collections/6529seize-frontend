/**
 * The registry hash and rule ID of a rule version (P26 §10; P28 §1, §4.5).
 *
 *   registryHash = H("6529.TdhRegistry.v1", the record's fields in order)
 *   tdhRuleId    = H("6529.TdhRule.v1", keccak256(rule version), registryHash)
 *
 * where `H(name, fields) = keccak256(abi.encode(keccak256(name), fields))`.
 * For TDH v1.4 they are 0x3cfa0e6e…9f36 and 0x772d61ed…ab3f (vector 28), so
 * the pages derive both from the registry instead of typing them.
 */

import {
  encodeAbiParameters,
  keccak256,
  stringToBytes,
  type AbiParameter,
  type Hex,
} from "viem";

import { REGISTRY_FIELDS, registryRecord, type Registry } from "./registry";

function tag(name: string): Hex {
  return keccak256(stringToBytes(name));
}

function sortedList(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  const list: readonly unknown[] = value;
  // The record holds each list ascending (P26 §10).
  return [...list].sort((a: unknown, b: unknown) => {
    if (typeof a === "bigint" && typeof b === "bigint") {
      if (a === b) {
        return 0;
      }
      return a < b ? -1 : 1;
    }
    return String(a) < String(b) ? -1 : 1;
  });
}

/**
 * P26 §10's registry hash. Every field is read at its type first: a
 * registry with a value outside it is malformed and has no hash
 * (`TdhInputInvalid`).
 */
export function registryHash(r: Registry): Hex {
  const record = registryRecord(r);
  const types: AbiParameter[] = [
    { type: "bytes32" },
    ...REGISTRY_FIELDS.map(([, type]) => ({ type })),
  ];
  const values = [
    tag("6529.TdhRegistry.v1"),
    ...REGISTRY_FIELDS.map(([name]) => sortedList(record.get(name))),
  ];
  return keccak256(encodeAbiParameters(types, values));
}

/** P28 §4.5's `tdhRuleId`: binds the rule version's name to its registry. */
export function tdhRuleId(r: Registry): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "bytes32" }, { type: "bytes32" }],
      [tag("6529.TdhRule.v1"), tag(r.rule_version), registryHash(r)]
    )
  );
}
