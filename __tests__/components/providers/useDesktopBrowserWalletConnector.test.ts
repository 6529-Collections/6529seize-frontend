import { renderHook, waitFor } from "@testing-library/react";
import { toHex } from "viem";
import { parseWalletRequest } from "@/lib/desktop/wallet-forwarding";
import { useDesktopBrowserWalletConnector } from "@/components/providers/useDesktopBrowserWalletConnector";
import { isDesktopShell } from "@/helpers/desktop-shell";
import {
  getDesktopWalletMethods,
  showDesktopWalletRefusal,
  watchDesktopWalletStatus,
} from "@/services/desktop/desktopBrowserWallet";
import { desktopBrowserWalletConnector } from "@/wagmiConfig/desktopBrowserWalletConnector";

jest.mock("@/helpers/desktop-shell", () => ({ isDesktopShell: jest.fn() }));
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: jest.fn(),
}));
jest.mock("@/services/desktop/desktopBrowserWallet", () => ({
  getDesktopWalletMethods: jest.fn(),
  isBrowserWalletProfile: jest.fn(() => false),
  loadBrowserWalletProfiles: jest.fn(async () => undefined),
  runDesktopWalletRequest: jest.fn(),
  showDesktopWalletRefusal: jest.fn(),
  watchDesktopWalletStatus: jest.fn(),
}));
jest.mock("@/wagmiConfig/desktopBrowserWalletConnector", () => ({
  DESKTOP_BROWSER_WALLET_CONNECTOR_ID: "desktopBrowserWallet",
  desktopBrowserWalletConnector: jest.fn(() => "factory"),
}));

const ADDRESS = "0x1111111111111111111111111111111111111111";

function makeAdapter(existing: { id: string }[] = []) {
  let connectors = [...existing];
  const setState = jest.fn(
    (update: (current: unknown[]) => { id: string }[]) => {
      connectors = update(connectors);
    }
  );
  return {
    adapter: {
      wagmiConfig: {
        chains: [{ id: 1 }],
        get connectors() {
          return connectors;
        },
        _internal: {
          connectors: {
            setup: jest.fn(() => ({ id: "desktopBrowserWallet" })),
            setState,
          },
        },
      },
    },
    setState,
  };
}

describe("useDesktopBrowserWalletConnector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isDesktopShell).mockReturnValue(true);
    jest.mocked(getDesktopWalletMethods).mockResolvedValue(["personal_sign"]);
  });

  it("does nothing on the web", async () => {
    jest.mocked(isDesktopShell).mockReturnValue(false);
    const { adapter, setState } = makeAdapter();
    renderHook(() => useDesktopBrowserWalletConnector(adapter as never));
    await Promise.resolve();
    expect(getDesktopWalletMethods).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });

  it("does nothing when the shell does not offer forwarding", async () => {
    jest.mocked(getDesktopWalletMethods).mockResolvedValue([]);
    const { adapter, setState } = makeAdapter();
    renderHook(() => useDesktopBrowserWalletConnector(adapter as never));
    await waitFor(() => expect(getDesktopWalletMethods).toHaveBeenCalled());
    await Promise.resolve();
    expect(setState).not.toHaveBeenCalled();
    expect(watchDesktopWalletStatus).not.toHaveBeenCalled();
  });

  it("installs the connector once and follows the shell's status", async () => {
    const { adapter, setState } = makeAdapter();
    const { rerender } = renderHook(() =>
      useDesktopBrowserWalletConnector(adapter as never)
    );
    await waitFor(() => expect(setState).toHaveBeenCalledTimes(1));
    expect(adapter.wagmiConfig.connectors.map((c) => c.id)).toEqual([
      "desktopBrowserWallet",
    ]);
    expect(watchDesktopWalletStatus).toHaveBeenCalled();
    rerender();
    await Promise.resolve();
    expect(setState).toHaveBeenCalledTimes(1);
  });

  it("refuses in the app what the browser page would refuse", async () => {
    const { adapter, setState } = makeAdapter();
    renderHook(() => useDesktopBrowserWalletConnector(adapter as never));
    await waitFor(() => expect(setState).toHaveBeenCalled());
    const { canForward } = jest.mocked(desktopBrowserWalletConnector).mock
      .calls[0]![0];

    const freeText = parseWalletRequest(
      {
        method: "personal_sign",
        params: [toHex("free text"), ADDRESS],
        address: ADDRESS,
        chainId: 1,
      },
      [1]
    );
    if (!freeText.ok) throw new Error(freeText.problem);
    expect(canForward(freeText.value)).toBe(false);
    expect(showDesktopWalletRefusal).toHaveBeenCalledTimes(1);
  });
});
