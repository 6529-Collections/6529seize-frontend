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
  // The answer is the gateway's JSON: check its types, not just its shape.
  const principalId: unknown = answer?.data?.principalId;
  const anchor: unknown = answer?.read?.height;
  if (
    typeof principalId !== "string" ||
    !PRINCIPAL.test(principalId.toLowerCase()) ||
    typeof anchor !== "number" ||
    !Number.isSafeInteger(anchor) ||
    anchor <= 0
  ) {
    return null;
  }
  return { principal: principalId.toLowerCase(), anchor };
}
