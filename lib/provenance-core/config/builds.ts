// Copied from 6529-Collections/6529-provenance-app src/config/builds.ts at commit 171ab352f90bb56f3e2248d4fd5b8e69b2a39092.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import type { Hex } from "viem";

/** A tagged build of ProvenanceRegistry, from the contract repository's code snapshot at that tag. */
export interface KnownBuild {
  readonly tag: string;
  readonly commit: string;
  /** keccak256 of the runtime code. The registry has no immutables, so every deployment of a build shares it. */
  readonly runtimeCodeHash: Hex;
  readonly runtimeCodeBytes: number;
  /** ERC-165 interface ID of IProvenanceRegistry in this build. */
  readonly interfaceId: Hex;
}

// One entry per tag. scripts/check-abi.mjs fails when the pinned tag's code hash or interface ID
// is missing here.
export const knownBuilds: readonly KnownBuild[] = [
  {
    tag: "v1.0.0-rc.1",
    commit: "8edf017d9aa711bff726cbda2647c8ef37568ffa",
    runtimeCodeHash: "0x82c7eb55636df0586e996047eb6d92cb49de2181258b49eddad199d261af4842",
    runtimeCodeBytes: 22656,
    interfaceId: "0x5d79f565",
  },
];

export const ERC165_ID = "0x01ffc9a7" as const;
export const ERC165_INVALID_ID = "0xffffffff" as const;

export function buildForCodeHash(hash: Hex | undefined): KnownBuild | undefined {
  if (!hash) return undefined;
  return knownBuilds.find((b) => b.runtimeCodeHash.toLowerCase() === hash.toLowerCase());
}
