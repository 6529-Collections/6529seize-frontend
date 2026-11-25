import type { Hex } from "viem";
import { chainGateway } from "./gateway";
import { ChainOperationError, expectedNetworkId } from "./operation";

const NETWORK_ID = /^0x[0-9a-f]{64}$/;

/**
 * The 6529 Network's NETWORK_ID, the EIP-712 domain salt: the build's
 * NEXT_PUBLIC_CHAIN_NETWORK_ID when set, else the network the gateway's
 * node reads.
 */
export async function chainNetworkId(signal?: AbortSignal): Promise<Hex> {
  const network =
    expectedNetworkId() ??
    (await chainGateway
      .getStatus(signal)
      .then((status) => status?.finalized?.network ?? status?.head?.network));
  const value = network?.toLowerCase();
  if (value === undefined || !NETWORK_ID.test(value)) {
    throw new ChainOperationError(
      "rejected",
      "The 6529 Network gateway did not say which network it reads."
    );
  }
  return value as Hex;
}
