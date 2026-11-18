import "server-only";
import { getAddress, isAddress } from "viem";
import { getDesktopWalletRequestSignerEnv } from "./serverEnv";

/**
 * The address of the key this run of 6529 Desktop signs wallet requests
 * with. The desktop shell creates the key when it starts and passes only
 * its address to the local web server it runs. Unset everywhere else, so
 * the website on the web has no request signer.
 */
export function getDesktopWalletRequestSigner(
  env?: NodeJS.ProcessEnv
): `0x${string}` | null {
  const value = (
    env === undefined
      ? getDesktopWalletRequestSignerEnv()
      : env["DESKTOP_WALLET_REQUEST_SIGNER"]
  )?.trim();
  return value && isAddress(value, { strict: false })
    ? getAddress(value)
    : null;
}
