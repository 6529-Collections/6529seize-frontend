import { createConfig, createStorage, http, noopStorage } from "wagmi";
import type { Chain } from "viem";
import { CW_PROJECT_ID } from "@/constants/constants";

function publicTransport(chain: Chain) {
  // Match the real adapter's primary read transport. A bare http() instead
  // silently uses viem's chain default before AppKit has even initialized.
  const url = new URL("https://rpc.walletconnect.org/v1/");
  url.searchParams.set("chainId", `eip155:${chain.id}`);
  url.searchParams.set("projectId", CW_PROJECT_ID);
  return http(url.toString(), {
    fetchOptions: { headers: { "Content-Type": "text/plain" } },
  });
}

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
    transports: Object.fromEntries(
      chains.map((chain) => [chain.id, publicTransport(chain)])
    ),
  });
}
