import { createConfig, createStorage, http, noopStorage } from "wagmi";
import type { Chain } from "viem";

/** Wallet-free context for server HTML and the matching hydration render. */
export function createPublicWagmiConfig(chains: readonly [Chain, ...Chain[]]) {
  return createConfig({
    chains,
    connectors: [],
    multiInjectedProviderDiscovery: false,
    ssr: true,
    // Wagmi's SSR hydrator requires a persistence interface. Its no-op storage
    // supplies that interface without reading or overwriting saved connections.
    storage: createStorage({ storage: noopStorage }),
    transports: Object.fromEntries(chains.map((chain) => [chain.id, http()])),
  });
}
