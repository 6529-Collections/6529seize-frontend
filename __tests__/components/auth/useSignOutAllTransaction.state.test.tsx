import { act, renderHook } from "@testing-library/react";
import { useSignOutAllTransaction } from "@/components/auth/useSignOutAllTransaction";
import { getSignOutAllState } from "@/services/auth/sign-out-all-state";
import { forgetAllBrowserWalletProfiles } from "@/services/desktop/desktopBrowserWallet";

jest.mock("@/services/desktop/desktopBrowserWallet", () => ({
  forgetAllBrowserWalletProfiles: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/components/auth/seizeConnectErrors", () => ({
  ...jest.requireActual("@/components/auth/seizeConnectErrors"),
  clearAllAuthenticatedProfiles: jest.fn().mockResolvedValue(undefined),
}));

describe("useSignOutAllTransaction shared state", () => {
  it("marks sign-out-all as started at once and finished at the end", async () => {
    let finishDisconnect: () => void = () => undefined;
    const disconnect = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishDisconnect = resolve;
        })
    );
    const { result } = renderHook(() =>
      useSignOutAllTransaction({
        disconnect,
        isMountedRef: { current: true },
        refreshStoredConnectedAccounts: jest.fn(),
        setDisconnected: jest.fn(),
      })
    );
    const before = getSignOutAllState().started;

    let signingOut: Promise<void> = Promise.resolve();
    act(() => {
      signingOut = result.current.seizeDisconnectAndLogoutAll();
    });
    // Synchronous, before any render: other code can read it right away.
    expect(getSignOutAllState()).toEqual({
      started: before + 1,
      running: true,
    });

    await act(async () => {
      finishDisconnect();
      await signingOut;
    });
    expect(getSignOutAllState()).toEqual({
      started: before + 1,
      running: false,
    });
  });

  it("forgets every 6529 Desktop browser-wallet marker", async () => {
    jest.mocked(forgetAllBrowserWalletProfiles).mockClear();
    const { result } = renderHook(() =>
      useSignOutAllTransaction({
        disconnect: jest.fn(() => Promise.resolve()),
        isMountedRef: { current: true },
        refreshStoredConnectedAccounts: jest.fn(),
        setDisconnected: jest.fn(),
      })
    );

    await act(async () => {
      await result.current.seizeDisconnectAndLogoutAll();
    });
    expect(forgetAllBrowserWalletProfiles).toHaveBeenCalledTimes(1);
  });
});
