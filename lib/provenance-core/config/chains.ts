// Copied from 6529-Collections/6529-provenance-app src/config/chains.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import { defineChain, type Chain } from "viem";
import { mainnet, sepolia } from "viem/chains";

/** A local Anvil node, usually a fork of Sepolia started with --chain-id 31337. */
// Annotated so the emitted declaration names only viem's public types.
export const anvil: Chain & { readonly id: 31337 } = defineChain({
  id: 31337,
  name: "Anvil (local)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
  testnet: true,
});

export const supportedChains: readonly [typeof sepolia, typeof mainnet, typeof anvil] = [
  sepolia,
  mainnet,
  anvil,
] as const;
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

/**
 * The largest gas limit a chain accepts for one transaction, where it is below what the planner
 * can ask for. Mainnet enforces EIP-7825's 2^24 cap, live since Fusaka. Sepolia runs the
 * Glamsterdam rules, whose EIP-8037 state gas reservoir lets a transaction's limit exceed 2^24.
 */
export const MAX_TRANSACTION_GAS: Partial<Record<SupportedChainId, bigint>> = {
  1: 2n ** 24n,
};

export function maxTransactionGas(chainId: number): bigint | undefined {
  return isSupportedChainId(chainId) ? MAX_TRANSACTION_GAS[chainId] : undefined;
}

export function chainById(id: number): Chain | undefined {
  return supportedChains.find((c) => c.id === id);
}

export function isSupportedChainId(id: number): id is SupportedChainId {
  return supportedChains.some((c) => c.id === id);
}
