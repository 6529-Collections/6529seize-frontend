import { act, render, waitFor } from "@testing-library/react";
import {
  SeizeConnectProvider,
  useSeizeConnectContext,
} from "@/components/auth/SeizeConnectContext";
import type { SeizeConnectContextType } from "@/components/auth/seizeConnectTypes";
import type { AppKitModalBridgeStore } from "@/components/auth/AppKitModalBridge";
import { AppKitBootstrapContext } from "@/components/providers/AppKitBootstrapContext";
import {
  getConnectedWalletAccounts,
  getWalletAddress,
  setAuthJwt,
} from "@/services/auth/auth.utils";
import { fakeJwt } from "@/__tests__/helpers/fakeJwt";

/*
 * After a 6529 Desktop restore, the page storage holds the restored profile.
 * A wallet reconnect that started before the restore can still finish
 * afterwards and report another wallet. Here the real SeizeConnectProvider
 * runs over the real page storage; only the wallet hooks are replaced, so
 * that late account update can be delivered.
 */
type Account = {
  address: string | undefined;
  isConnected: boolean;
  status: string;
};
let mockAccount: Account = {
  address: undefined,
  isConnected: false,
  status: "disconnected",
};
jest.mock("@reown/appkit/react", () => ({
  useAppKit: () => ({ open: jest.fn(), close: jest.fn() }),
  useAppKitAccount: () => mockAccount,
  useAppKitState: () => ({ open: false }),
  useDisconnect: () => ({ disconnect: jest.fn() }),
  useWalletInfo: () => ({ walletInfo: null }),
}));
// Keep the provider's real bridge store, captured so the test can check
// that the late account really reached it.
const mockStores: AppKitModalBridgeStore[] = [];
jest.mock("@/components/auth/AppKitModalBridge", () => {
  const actual = jest.requireActual("@/components/auth/AppKitModalBridge");
  return {
    ...actual,
    createAppKitModalBridgeStore: () => {
      const store = actual.createAppKitModalBridgeStore();
      mockStores.push(store);
      return store;
    },
  };
});
jest.mock("wagmi", () => ({
  useAccount: () => ({
    address: mockAccount.address,
    isConnected: mockAccount.isConnected,
    status: mockAccount.status,
  }),
}));
jest.mock("@/hooks/useConnectedAccountsUnreadNotifications", () => ({
  useConnectedAccountsUnreadNotifications: jest.fn(() => ({})),
}));
jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: jest.fn(() => ({
    notifications: { unread_count: 0 },
    haveUnreadNotifications: false,
  })),
}));

const RESTORED = "0x5555555555555555555555555555555555555555";
const OLD_WALLET = "0x4444444444444444444444444444444444444444";

let context: SeizeConnectContextType | null = null;
function Capture({ update }: { readonly update: number }) {
  context = useSeizeConnectContext();
  return <span data-update={update} />;
}

// AppKit created and ready, so the provider mounts its account bridge.
const bootstrap = {
  status: "ready" as const,
  hasTerminalError: false,
  isCreated: true,
  isReady: true,
  isWaiting: false,
  waitForReady: () => Promise.resolve(),
};

describe("a late wallet update after the desktop restore", () => {
  beforeEach(() => {
    localStorage.clear();
    context = null;
    mockStores.length = 0;
    mockAccount = {
      address: undefined,
      isConnected: false,
      status: "disconnected",
    };
    // What the restore wrote: one profile, active.
    setAuthJwt(RESTORED, fakeJwt({ sub: RESTORED }), null, undefined, {
      authSessionVersion: "v2",
    });
  });

  it("receives the late wallet through the AppKit bridge without touching stored profiles", async () => {
    const tree = (update: number) => (
      <AppKitBootstrapContext.Provider value={bootstrap}>
        <SeizeConnectProvider>
          <Capture update={update} />
        </SeizeConnectProvider>
      </AppKitBootstrapContext.Provider>
    );
    const { rerender } = render(tree(1));
    await waitFor(() => expect(context?.address?.toLowerCase()).toBe(RESTORED));
    expect(context?.hasValidWalletAuth).toBe(true);

    // The reconnect from before the restore finishes with the old wallet:
    // a new render, so the AppKit account hook reports it to the bridge.
    mockAccount = {
      address: OLD_WALLET,
      isConnected: true,
      status: "connected",
    };
    rerender(tree(2));
    await waitFor(() =>
      expect(mockStores[0]?.getAccountSnapshot().address).toBe(OLD_WALLET)
    );
    // Let the provider's 50 ms wallet-state sync run.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    // Same as on the web and in the Electron app: a connected wallet with no
    // stored profile becomes the active wallet, unsigned, so it has no auth.
    // The restored profile stays stored, untouched.
    expect(context?.address?.toLowerCase()).toBe(OLD_WALLET);
    expect(context?.hasValidWalletAuth).toBe(false);
    expect(
      getConnectedWalletAccounts().map((account) =>
        account.address.toLowerCase()
      )
    ).toEqual([RESTORED]);
    expect(getWalletAddress()?.toLowerCase()).toBe(RESTORED);
  });
});
