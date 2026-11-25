import type { Hex } from "viem";
import type { Config } from "wagmi";
import { chainGateway, ChainGatewayError } from "./gateway";
import { signWalletMessage } from "./signers";

/**
 * The drip: 6529 sends a small amount of $fake6529 for fees, once per wallet
 * and once per identity. The wallet proves itself by signing this exact
 * message; no transaction and no fee.
 */
export const dripMessage = (wallet: Hex): string =>
  `Send $fake6529 for fees to this wallet on the 6529 chain.\n\nWallet: ${wallet.toLowerCase()}`;

export type DripOutcome =
  | { readonly kind: "sent"; readonly txId: Hex | null }
  | { readonly kind: "already" }
  | { readonly kind: "limited" }
  | { readonly kind: "unavailable" };

export async function requestDrip(
  config: Config,
  wallet: Hex,
  signal?: AbortSignal
): Promise<DripOutcome> {
  const signature = await signWalletMessage(config, wallet, dripMessage(wallet));
  try {
    const result = await chainGateway.postDrip(wallet, signature, signal);
    return { kind: "sent", txId: result.tx_id ?? null };
  } catch (error) {
    if (!(error instanceof ChainGatewayError)) {
      throw error;
    }
    if (error.status === 409) {
      return { kind: "already" };
    }
    if (error.status === 429) {
      return { kind: "limited" };
    }
    if (error.status >= 500 || error.status === 0) {
      return { kind: "unavailable" };
    }
    throw error;
  }
}
