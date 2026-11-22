// Copied from 6529-Collections/6529-provenance-app src/config/chains.ts at commit 117e850026f6e1d754e76a687e526f51cceca4a0.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import { defineChain, type Chain } from "viem";
import { mainnet, sepolia } from "viem/chains";

/** A local Anvil node, usually a fork of Sepolia started with --chain-id 31337. */
export const anvil = defineChain({
  id: 31337,
  name: "Anvil (local)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
  testnet: true,
});

export const supportedChains = [sepolia, mainnet, anvil] as const satisfies readonly Chain[];
export type SupportedChainId = (typeof supportedChains)[number]["id"];

/**
 * Public endpoints that need no key. A consumer passes its own client or endpoint; these are
 * defaults for scripts and tests.
 */
export const publicRpc: Record<SupportedChainId, string> = {
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
  1: "https://ethereum-rpc.publicnode.com",
  31337: "http://127.0.0.1:8545",
};

/** Safe Transaction Service base URLs. Some hosts need an API key, which the caller supplies. */
export const defaultTxServices: Partial<Record<SupportedChainId, string>> = {
  11155111: "https://safe-transaction-sepolia.safe.global",
  1: "https://safe-transaction-mainnet.safe.global",
};

export function chainById(id: number): Chain | undefined {
  return supportedChains.find((c) => c.id === id);
}

export function isSupportedChainId(id: number): id is SupportedChainId {
  return supportedChains.some((c) => c.id === id);
}
