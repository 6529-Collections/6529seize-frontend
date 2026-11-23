// Copied from 6529-Collections/6529-provenance-app src/config/builds.ts at commit 512b6629470e06981905f3a94cff3f381d181478.
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
  {
    // Comments and NatSpec only: the same code and ABI as rc.1, with a different metadata hash.
    tag: "v1.0.0-rc.2",
    commit: "2cf5c7b017fed8504dea0d4225e8fac775c3ebd9",
    runtimeCodeHash: "0xcda6420e706dcdcea09342b20168921b35f50ca3d87413665b700370f9fc50a9",
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
