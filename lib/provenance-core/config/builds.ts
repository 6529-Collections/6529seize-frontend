// Copied from 6529-Collections/6529-provenance-app src/config/builds.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
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
  /**
   * Whether `getRelease` and `ReleaseSealed` carry `sealedBy`, as from v1.0.0-rc.3 on. Builds
   * without it are read with the fragments in src/abi/legacy.ts.
   */
  readonly sealedBy: boolean;
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
    sealedBy: false,
  },
  {
    // Comments and NatSpec only: the same code and ABI as rc.1, with a different metadata hash.
    tag: "v1.0.0-rc.2",
    commit: "2cf5c7b017fed8504dea0d4225e8fac775c3ebd9",
    runtimeCodeHash: "0xcda6420e706dcdcea09342b20168921b35f50ca3d87413665b700370f9fc50a9",
    runtimeCodeBytes: 22656,
    interfaceId: "0x5d79f565",
    sealedBy: false,
  },
  {
    // Owner-only restore of a deleted subject, sealedBy, and a successor after a freeze. Changes the
    // ABI of getRelease, ReleaseSealed and SuccessorDeclared, and adds successorDeclaredAt.
    tag: "v1.0.0-rc.3",
    commit: "2d82413ddb676b9a779c8df659cedba501fa8f66",
    runtimeCodeHash: "0x289d0f912d04c9f31bc285e1a8683dd03a4de46e4ab649d906309722aa78e957",
    runtimeCodeBytes: 22944,
    interfaceId: "0x6b8147c2",
    sealedBy: true,
  },
  {
    // Adds findCurrent and emits the owner and publisher log indexes as uint256; older builds'
    // events are parsed with rc3EventsAbi in src/abi/legacy.ts.
    tag: "v1.0.0-rc.4",
    commit: "c6b91cee52c7d0fcec53ceae5a1be08dfa74f9d3",
    runtimeCodeHash: "0xcb3d55665a7e9385d97c0bcbf69f0b0b8f8aaa0285aeadb19dfaa5f2705a1bd5",
    runtimeCodeBytes: 23406,
    interfaceId: "0xbaf53c64",
    sealedBy: true,
  },
];

export const ERC165_ID = "0x01ffc9a7" as const;
export const ERC165_INVALID_ID = "0xffffffff" as const;

export function buildForCodeHash(hash: Hex | undefined): KnownBuild | undefined {
  if (!hash) return undefined;
  return knownBuilds.find((b) => b.runtimeCodeHash.toLowerCase() === hash.toLowerCase());
}
