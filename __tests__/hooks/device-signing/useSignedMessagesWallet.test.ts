import { useSignedMessagesWallet } from "@/hooks/device-signing/useSignedMessagesWallet";
import { act, renderHook } from "@testing-library/react";

let mockConnector: { id: string; type: string } | undefined;
const mockSwitchChainAsync = jest.fn();
jest.mock("wagmi", () => ({
  useAccount: () => ({ connector: mockConnector }),
  useConfig: () => ({ chains: [{ id: 1, name: "Ethereum" }] }),
  useSwitchChain: () => ({ switchChainAsync: mockSwitchChainAsync }),
}));

let mockChainSupported = false;
jest.mock("@/components/auth/useAuthChainGuard", () => ({
  useAuthChainGuard: () => ({
    isLatestChainSupported: () => mockChainSupported,
  }),
}));

describe("useSignedMessagesWallet", () => {
  beforeEach(() => {
    mockConnector = { id: "io.metamask", type: "injected" };
    mockChainSupported = false;
    mockSwitchChainAsync.mockReset();
  });

  it("tells a WalletConnect wallet from a browser wallet", () => {
    const browser = renderHook(() => useSignedMessagesWallet());
    expect(browser.result.current.isRemoteWallet).toBe(false);

    mockConnector = { id: "walletConnect", type: "walletConnect" };
    const remote = renderHook(() => useSignedMessagesWallet());
    expect(remote.result.current.isRemoteWallet).toBe(true);
    expect(remote.result.current.networkName).toBe("Ethereum");
  });

  it("switches to the first configured network", async () => {
    mockSwitchChainAsync.mockImplementation(async () => {
      mockChainSupported = true;
    });
    const { result } = renderHook(() => useSignedMessagesWallet());

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.switchNetwork();
    });
    expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: 1 });
    expect(outcome).toBe("switched");
  });

  it.each([
    [{ name: "UserRejectedRequestError", code: 4001 }, "rejected"],
    [new Error("Chain not configured"), "failed"],
  ])("reports a switch that throws %p as %s", async (error, expected) => {
    mockSwitchChainAsync.mockRejectedValue(error);
    const { result } = renderHook(() => useSignedMessagesWallet());

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.switchNetwork();
    });
    expect(outcome).toBe(expected);
  });
});
