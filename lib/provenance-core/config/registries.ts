// Copied from 6529-Collections/6529-provenance-app src/config/registries.ts at commit 171ab352f90bb56f3e2248d4fd5b8e69b2a39092.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import type { Address } from "viem";

/**
 * A registry pin: the network, the registry and the Safe that owns it. Governance SafeTxs are
 * built and checked only for a pinned triple, and 6529 Desktop's wallet forwarding generates one
 * signing schema per pin from the same table. Each entry comes from the contract repository's
 * docs/deployments.md; a pin says the maintainers deployed it, not that it is trustworthy.
 */
export interface RegistryPin {
  chainId: number;
  registry: Address;
  safe: Address;
  name: string;
}

/** Safe v1.4.1 test Safe, 2 of 3, that owns both Sepolia registries. */
export const SEPOLIA_TEST_SAFE: Address = "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68";

export const registryPins: readonly RegistryPin[] = [
  {
    chainId: 11155111,
    registry: "0x0e289576c7565D29018134517309668946Ffc912",
    safe: SEPOLIA_TEST_SAFE,
    name: "Sepolia test registry",
  },
  {
    chainId: 11155111,
    registry: "0xee91c45A1893fbb45ce8EeA170eF05d8d85bb850",
    safe: SEPOLIA_TEST_SAFE,
    name: "Sepolia Museum catalog registry",
  },
];

export function findPin(chainId: number, registry: Address): RegistryPin | undefined {
  return registryPins.find(
    (p) => p.chainId === chainId && p.registry.toLowerCase() === registry.toLowerCase(),
  );
}
