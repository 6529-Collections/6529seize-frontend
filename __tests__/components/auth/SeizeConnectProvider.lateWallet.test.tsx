import { act, render, waitFor } from "@testing-library/react";
import {
  SeizeConnectProvider,
  useSeizeConnectContext,
} from "@/components/auth/SeizeConnectContext";
import type { SeizeConnectContextType } from "@/components/auth/seizeConnectTypes";
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
function Capture() {
  context = useSeizeConnectContext();
  return null;
}

describe("a late wallet update after the desktop restore", () => {
  beforeEach(() => {
    localStorage.clear();
    context = null;
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

  it("gives the old wallet no auth and leaves the restored profiles alone", async () => {
    const tree = (
      <SeizeConnectProvider>
        <Capture />
      </SeizeConnectProvider>
    );
    const { rerender } = render(tree);
    await waitFor(() => expect(context).not.toBeNull());

    // The reconnect from before the restore finishes with the old wallet.
    mockAccount = {
      address: OLD_WALLET,
      isConnected: true,
      status: "connected",
    };
    rerender(tree);
    await act(async () => undefined);

    // The restored profile stays active with its auth; the old wallet is
    // not taken as the active wallet's live connection.
    expect(context?.address?.toLowerCase()).toBe(RESTORED);
    expect(context?.hasValidWalletAuth).toBe(true);
    expect(context?.isConnected).toBe(false);
    expect(
      getConnectedWalletAccounts().map((account) =>
        account.address.toLowerCase()
      )
    ).toEqual([RESTORED]);
    expect(getWalletAddress()?.toLowerCase()).toBe(RESTORED);
  });
});
