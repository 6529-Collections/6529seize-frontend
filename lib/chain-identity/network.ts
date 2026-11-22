import type { Hex } from "viem";
import { chainGateway } from "./gateway";
import { ChainOperationError, expectedNetworkId } from "./operation";

/**
 * The 6529 Network's NETWORK_ID, the EIP-712 domain salt: the build's
 * NEXT_PUBLIC_CHAIN_NETWORK_ID when set, else the network the gateway's
 * node reads.
 */
export async function chainNetworkId(signal?: AbortSignal): Promise<Hex> {
  const pinned = expectedNetworkId();
  if (pinned !== null) {
    return pinned as Hex;
  }
  const status = await chainGateway.getStatus(signal);
  const network = status.finalized?.network ?? status.head?.network;
  if (network === undefined) {
    throw new ChainOperationError(
      "rejected",
      "The 6529 Network gateway did not say which network it reads."
    );
  }
  return network;
}
