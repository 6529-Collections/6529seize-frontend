// Copied from 6529-Collections/6529-provenance-app src/abi/legacy.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
// The parts of the ABI that older tags encode differently from the pinned tag. `rc2*` covers
// v1.0.0-rc.1 and v1.0.0-rc.2; `rc3EventsAbi` covers v1.0.0-rc.1 to v1.0.0-rc.3, which emit the
// owner and publisher log indexes as uint32 (v1.0.0-rc.4 widened them to uint256). The Sepolia registries run those builds, so reads and simulations pick these fragments by
// the registry's runtime code hash: `sealedBy` in src/config/builds.ts, read by
// `releaseHasSealedBy` in src/registry.ts. Copied from the generated ABI at v1.0.0-rc.2
// (commit 2cf5c7b017fed8504dea0d4225e8fac775c3ebd9).

export const rc2GetReleaseAbi = [
  {"inputs":[{"internalType":"uint32","name":"releaseId","type":"uint32"}],"name":"getRelease","outputs":[{"components":[{"internalType":"uint32","name":"releaseId","type":"uint32"},{"internalType":"bool","name":"isSealed","type":"bool"},{"internalType":"uint40","name":"openedAt","type":"uint40"},{"internalType":"uint40","name":"sealedAt","type":"uint40"},{"internalType":"uint32","name":"firstSequence","type":"uint32"},{"internalType":"uint32","name":"recordCount","type":"uint32"},{"internalType":"address","name":"openedBy","type":"address"},{"internalType":"bytes","name":"manifestCid","type":"bytes"},{"components":[{"internalType":"uint16","name":"algorithm","type":"uint16"},{"internalType":"bytes32","name":"digest","type":"bytes32"},{"internalType":"bytes32","name":"canonicalizationId","type":"bytes32"}],"internalType":"struct IProvenanceRegistry.HashRef","name":"manifestHash","type":"tuple"},{"internalType":"bytes","name":"rootCid","type":"bytes"},{"internalType":"bytes32","name":"arweaveId","type":"bytes32"},{"internalType":"bytes20","name":"sourceCommit","type":"bytes20"},{"internalType":"string","name":"label","type":"string"}],"internalType":"struct IProvenanceRegistry.Release","name":"release","type":"tuple"}],"signature":"getRelease(uint32)","stateMutability":"view","type":"function"},
] as const;

export const rc2EventsAbi = [
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint32","name":"releaseId","type":"uint32"},{"indexed":false,"internalType":"uint32","name":"recordCount","type":"uint32"},{"indexed":false,"internalType":"uint40","name":"sealedAt","type":"uint40"}],"name":"ReleaseSealed","signature":"ReleaseSealed(uint32,uint32,uint40)","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"successor","type":"address"}],"name":"SuccessorDeclared","signature":"SuccessorDeclared(address)","type":"event"},
] as const;

// Copied from the generated ABI at v1.0.0-rc.3 (commit 2d82413ddb676b9a779c8df659cedba501fa8f66),
// whose two events below are also those of v1.0.0-rc.1 and v1.0.0-rc.2.
export const rc3EventsAbi = [
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"},{"indexed":false,"internalType":"uint32","name":"ownerIndex","type":"uint32"},{"indexed":false,"internalType":"uint40","name":"since","type":"uint40"}],"name":"OwnerChanged","signature":"OwnerChanged(address,address,uint32,uint40)","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"publisher","type":"address"},{"indexed":false,"internalType":"bool","name":"authorized","type":"bool"},{"indexed":false,"internalType":"uint32","name":"changeIndex","type":"uint32"},{"indexed":false,"internalType":"uint40","name":"changedAt","type":"uint40"}],"name":"PublisherSet","signature":"PublisherSet(address,bool,uint32,uint40)","type":"event"},
] as const;
