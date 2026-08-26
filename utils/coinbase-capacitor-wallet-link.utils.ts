// Wallet SDK v3 does not export its mobile relay UI publicly. This import is
// intentionally coupled to the exact-pinned cbw-sdk 3.9.3 alias in package.json;
// re-check the subpath and lifecycle behavior before changing that version.
import { MobileRelayUI } from "cbw-sdk/dist/relay/mobile/MobileRelayUI";
import type { RelayUIOptions } from "cbw-sdk/dist/relay/RelayUI";

export const COINBASE_WALLET_RETURN_SCOPE = "coinbase-wallet-return";
export const ETHEREUM_MAINNET_CHAIN_ID = 1;

const COINBASE_MOBILE_WALLET_LINK_URL = "https://go.cb-w.com/walletlink";
const COINBASE_REDIRECT_DELAY_MS = 99;
const APP_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*$/;

type CoinbaseMobileWalletLinkOptions = {
  readonly appScheme: string;
  readonly walletLinkUrl?: string | undefined;
};

function getWalletLinkChainId(walletLinkUrl: string): number | null {
  const parsedWalletLinkUrl = new URL(walletLinkUrl);
  const queryStart = parsedWalletLinkUrl.hash.indexOf("?");
  if (queryStart === -1) {
    return null;
  }

  const chainId = new URLSearchParams(
    parsedWalletLinkUrl.hash.slice(queryStart + 1)
  ).get("chainId");
  if (!chainId) {
    return null;
  }

  const parsedChainId = Number(chainId);
  return Number.isSafeInteger(parsedChainId) ? parsedChainId : null;
}

function getCoinbaseWalletReturnUrl(appScheme: string): string {
  const normalizedScheme = appScheme.trim();
  if (!APP_SCHEME_PATTERN.test(normalizedScheme)) {
    throw new Error(
      "Coinbase wallet return requires a valid mobile app scheme"
    );
  }

  return `${normalizedScheme}://${COINBASE_WALLET_RETURN_SCOPE}`;
}

export function buildCoinbaseMobileWalletLink({
  appScheme,
  walletLinkUrl,
}: CoinbaseMobileWalletLinkOptions): string {
  if (
    walletLinkUrl &&
    getWalletLinkChainId(walletLinkUrl) !== ETHEREUM_MAINNET_CHAIN_ID
  ) {
    throw new Error(
      "Coinbase WalletLink connection must request Ethereum Mainnet"
    );
  }

  const url = new URL(COINBASE_MOBILE_WALLET_LINK_URL);
  url.searchParams.set("redirect_url", getCoinbaseWalletReturnUrl(appScheme));
  if (walletLinkUrl) {
    url.searchParams.set("wl_url", walletLinkUrl);
  }

  return url.toString();
}

class CapacitorCoinbaseMobileRelayUI extends MobileRelayUI {
  constructor(
    options: Readonly<RelayUIOptions>,
    private readonly appScheme: string
  ) {
    super(options);
  }

  override openCoinbaseWalletDeeplink(walletLinkUrl?: string): void {
    const handoffUrl = buildCoinbaseMobileWalletLink({
      appScheme: this.appScheme,
      walletLinkUrl,
    });

    // MobileRelay 3.9.3 installs its blur/focus response listener immediately
    // after this void method returns. Keep its 99 ms delay so the listener
    // exists before Capacitor leaves the WebView, then emit deterministic
    // lifecycle events for WebViews that do not forward them themselves.
    setTimeout(() => {
      window.dispatchEvent(new Event("blur"));

      // Match the pinned SDK's detached-anchor handoff behavior.
      const anchor = document.createElement("a");
      anchor.target = "cbw-opener";
      anchor.href = handoffUrl;
      anchor.rel = "noreferrer noopener";
      anchor.click();
    }, COINBASE_REDIRECT_DELAY_MS);
  }
}

export function createCapacitorCoinbaseMobileUiConstructor(appScheme: string) {
  return (options: Readonly<RelayUIOptions>): MobileRelayUI =>
    new CapacitorCoinbaseMobileRelayUI(options, appScheme);
}
