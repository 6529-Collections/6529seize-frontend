/**
 * Test networks.
 *
 * `EXAMPLE_DEVNET` is the network of P28 appendix A and P40 §13: chainId
 * "6529-devnet-1" and genesis commitment keccak256("example genesis
 * commitment"). The design marks it as test data, not a deployed network.
 * The mock gateway and the design's vectors use it. A real devnet, testnet
 * or mainnet supplies its own chain ID and genesis commitment.
 */
import type { ChainNetwork } from "./envelope";
import { keccakUtf8, networkId } from "./ids";

export const EXAMPLE_DEVNET_CHAIN_ID = "6529-devnet-1";
export const EXAMPLE_DEVNET_GENESIS = keccakUtf8("example genesis commitment");

export const EXAMPLE_DEVNET: ChainNetwork = {
  chainId: EXAMPLE_DEVNET_CHAIN_ID,
  networkId: networkId(EXAMPLE_DEVNET_CHAIN_ID, EXAMPLE_DEVNET_GENESIS),
};
