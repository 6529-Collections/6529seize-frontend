import type { Address, Hex } from "viem";

/**
 * The two EIP-712 messages an artist signs on the curated 6529 Stream path, in
 * the PackageRegistry's domain ("6529 Works Package Registry", version 1). The
 * types are copied from 6529-works `src/interfaces/types/Typehashes.sol`;
 * `PackageRegistry.acceptanceDigest` and `moveDigest` answer the digest the
 * contract expects, and the create flow checks against them before asking the
 * wallet to sign.
 */
function packageRegistryDomain(packageRegistry: Address) {
  return {
    name: "6529 Works Package Registry",
    version: "1",
    chainId: 11_155_111,
    verifyingContract: packageRegistry,
  } as const;
}

export interface PackageAcceptance {
  readonly account: Address;
  readonly profileId: Hex;
  readonly profileDocHash: Hex;
  readonly deadline: bigint;
}

export function acceptanceTypedData(packageRegistry: Address, packageRoot: Hex, acceptance: PackageAcceptance) {
  return {
    domain: packageRegistryDomain(packageRegistry),
    types: {
      PackageAcceptance: [
        { name: "packageRoot", type: "bytes32" },
        { name: "account", type: "address" },
        { name: "profileId", type: "bytes32" },
        { name: "profileDocHash", type: "bytes32" },
        { name: "deadline", type: "uint64" },
      ],
    },
    primaryType: "PackageAcceptance",
    message: { packageRoot, ...acceptance },
  } as const;
}

export function moveTypedData(
  packageRegistry: Address,
  move: { readonly packageRoot: Hex; readonly itemHash: Hex; readonly nonce: bigint; readonly deadline: bigint }
) {
  return {
    domain: packageRegistryDomain(packageRegistry),
    types: {
      MoveToStream: [
        { name: "packageRoot", type: "bytes32" },
        { name: "itemHash", type: "bytes32" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint64" },
      ],
    },
    primaryType: "MoveToStream",
    message: move,
  } as const;
}
