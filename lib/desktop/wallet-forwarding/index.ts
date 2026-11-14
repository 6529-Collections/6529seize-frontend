/**
 * Wallet forwarding for 6529 Desktop: the shared contract.
 *
 * A Desktop profile that signed in with a browser wallet has no wallet in
 * the app. Its wallet requests travel to the user's browser instead:
 *
 * 1. The app page asks the desktop shell for a wallet request
 *    (`{ method, params, address, chainId }`). The shell validates it with
 *    the same rules as `parseWalletRequest`, binds it to a signed-in
 *    address, gives it a one-time id that it keeps to itself, signs an
 *    envelope with a key it makes at start-up, and opens the browser page.
 * 2. The browser page (`/browser-connector#w=...&s=...`) acts only on an
 *    envelope signed by that key, shows what will be signed, and returns
 *    the wallet's answer through `<scheme>://wallet?data=...`.
 * 3. The shell consumes that link itself (once, before expiry), checks the
 *    signature, and answers the app page with a `WalletBridgeResponse`.
 *    While a request is open the shell reports a `WalletBridgeStatus` with
 *    the short code the browser page also shows.
 *
 * Version 1 forwards signatures only: `personal_sign` and
 * `eth_signTypedData_v4`. Nothing that sends a transaction is forwarded.
 *
 * This module holds only types and pure helpers for those three hops. Every
 * value that crosses a hop is untrusted and is validated here.
 */

export {
  WALLET_REQUEST_TTL_MS,
  type WalletForwardingMethod,
  type WalletRequest,
  type WalletRequestInput,
} from "./shared";
export { parseWalletRequest } from "./request";
export { fitsWalletRequestFragment } from "./size";
export { readWalletMessageText } from "./messageText";
export * from "./envelope";
export { walletRequestCode } from "./requestCode";
export {
  buildWalletResultDeepLink,
  parseWalletResult,
  type WalletResult,
} from "./results";
export * from "./bridge";
