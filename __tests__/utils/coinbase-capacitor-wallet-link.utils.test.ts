import {
  buildCoinbaseMobileWalletLink,
  COINBASE_WALLET_RETURN_SCOPE,
  createCapacitorCoinbaseMobileUiConstructor,
  ETHEREUM_MAINNET_CHAIN_ID,
} from "@/utils/coinbase-capacitor-wallet-link.utils";
import { MobileRelayUI } from "cbw-sdk/dist/relay/mobile/MobileRelayUI";
import type { RelayUIOptions } from "cbw-sdk/dist/relay/RelayUI";

function createWalletLinkUrl(chainId?: number): string {
  const params = new URLSearchParams({
    id: "session-id",
    secret: "session-secret",
    server: "https://www.walletlink.org",
    v: "3.9.3",
  });
  if (chainId !== undefined) {
    params.set("chainId", String(chainId));
  }

  return `https://www.walletlink.org/#/link?${params.toString()}`;
}

describe("buildCoinbaseMobileWalletLink", () => {
  it("uses the configured staging scheme and preserves an Ethereum WalletLink request", () => {
    const walletLinkUrl = createWalletLinkUrl(ETHEREUM_MAINNET_CHAIN_ID);
    const handoffUrl = new URL(
      buildCoinbaseMobileWalletLink({
        appScheme: "mobileStaging6529",
        walletLinkUrl,
      })
    );

    expect(handoffUrl.origin).toBe("https://go.cb-w.com");
    expect(handoffUrl.pathname).toBe("/walletlink");
    expect(handoffUrl.searchParams.get("redirect_url")).toBe(
      `mobileStaging6529://${COINBASE_WALLET_RETURN_SCOPE}`
    );
    expect(handoffUrl.searchParams.get("wl_url")).toBe(walletLinkUrl);
  });

  it("uses the app callback without a WalletLink URL for later signing requests", () => {
    const handoffUrl = new URL(
      buildCoinbaseMobileWalletLink({ appScheme: "mobile6529" })
    );

    expect(handoffUrl.searchParams.get("redirect_url")).toBe(
      `mobile6529://${COINBASE_WALLET_RETURN_SCOPE}`
    );
    expect(handoffUrl.searchParams.has("wl_url")).toBe(false);
  });

  it("rejects a WalletLink request for a non-Ethereum chain", () => {
    expect(() =>
      buildCoinbaseMobileWalletLink({
        appScheme: "mobile6529",
        walletLinkUrl: createWalletLinkUrl(8453),
      })
    ).toThrow("must request Ethereum Mainnet");
  });

  it("rejects a WalletLink request without an explicit chain", () => {
    expect(() =>
      buildCoinbaseMobileWalletLink({
        appScheme: "mobile6529",
        walletLinkUrl: createWalletLinkUrl(),
      })
    ).toThrow("must request Ethereum Mainnet");
  });

  it("rejects an invalid app scheme", () => {
    expect(() =>
      buildCoinbaseMobileWalletLink({ appScheme: "https://staging.6529.io" })
    ).toThrow("valid mobile app scheme");
  });
});

describe("createCapacitorCoinbaseMobileUiConstructor", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("retains the Coinbase mobile UI type and opens the configured handoff", () => {
    jest.useFakeTimers();
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const dispatchEvent = jest.spyOn(window, "dispatchEvent");

    try {
      const createUi =
        createCapacitorCoinbaseMobileUiConstructor("mobileStaging6529");
      const ui = createUi({} as RelayUIOptions);

      expect(ui).toBeInstanceOf(MobileRelayUI);
      ui.openCoinbaseWalletDeeplink(
        createWalletLinkUrl(ETHEREUM_MAINNET_CHAIN_ID)
      );
      jest.runOnlyPendingTimers();

      expect(dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: "blur" })
      );
      expect(click).toHaveBeenCalledTimes(1);
    } finally {
      click.mockRestore();
      dispatchEvent.mockRestore();
    }
  });
});
