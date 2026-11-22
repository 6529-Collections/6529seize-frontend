import { isAddress } from "viem";
import { getWalletAddress } from "@/services/auth/auth.utils";
import { isChainIdentityEnabled } from "./config";
import { chainGateway } from "./gateway";

const PRINCIPAL = /^0x[0-9a-f]{64}$/;

/**
 * The signed-in wallet's identity on the 6529 Network, `principal` as `0x`
 * and 64 lowercase hex digits, with the finalized height it was read at as
 * `anchor`; null without chain flows, a signed-in wallet or an identity.
 * The shape the mint records' `setMintRecordContextSource` takes.
 * @api
 */
export async function signedInChainContext(
  signal?: AbortSignal
): Promise<{ readonly principal: string; readonly anchor: number } | null> {
  const wallet = getWalletAddress();
  if (!isChainIdentityEnabled() || !wallet || !isAddress(wallet)) {
    return null;
  }
  const answer = await chainGateway.getIdentityByWalletFinalized(
    wallet,
    signal
  );
  const principal = answer?.data?.principalId.toLowerCase();
  const anchor = answer?.read?.height;
  if (
    principal === undefined ||
    !PRINCIPAL.test(principal) ||
    anchor === undefined ||
    !Number.isSafeInteger(anchor)
  ) {
    return null;
  }
  return { principal, anchor };
}
