import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CapacitorConnectFlow from "@/components/auth/CapacitorConnectFlow";
import type { CapacitorConnectDialogView } from "@/components/auth/CapacitorConnectDialog";

const mockAppWalletAddress = "0x00000000000000000000000000000000000000AA";
const mockConnectAsync = jest.fn();
const mockPush = jest.fn();
const mockScanQrCode = jest.fn();

jest.mock("wagmi", () => ({
  useConnect: () => ({
    connectAsync: mockConnectAsync,
    connectors: [{ id: mockAppWalletAddress, type: "app-wallet" }],
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/config/env", () => ({
  publicEnv: { MOBILE_APP_SCHEME: "mobile6529" },
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isAndroid: false }),
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({
    appWallets: [],
    appWalletsSupported: true,
    fetchingAppWallets: false,
  }),
}));

jest.mock("@/components/app-wallets/AppWalletModal", () => ({
  CreateAppWalletModal: () => null,
}));

jest.mock("@/components/header/share/qrScanner.utils", () => ({
  getQRScannerErrorReason: jest.fn(() => null),
  isQRScannerCancellation: jest.fn(() => false),
  scanQrCode: (...args: unknown[]) => mockScanQrCode(...args),
}));

jest.mock("@/utils/security-logger", () => ({
  logError: jest.fn(),
}));

jest.mock("@/components/auth/CapacitorConnectDialog", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({
      view,
      onAfterLeave,
      onOpenExternalWallets,
      onScanConnectionQr,
      onConnectAppWallet,
    }: {
      readonly view: CapacitorConnectDialogView;
      readonly onAfterLeave: () => void;
      readonly onOpenExternalWallets: () => void;
      readonly onScanConnectionQr: () => void;
      readonly onConnectAppWallet: (address: string) => void;
    }) => {
      React.useEffect(() => {
        if (view === "closed") {
          onAfterLeave();
        }
      }, [onAfterLeave, view]);

      if (view === "closed") {
        return null;
      }

      return (
        <>
          <button onClick={onOpenExternalWallets}>External Wallets</button>
          <button onClick={onScanConnectionQr}>Scan Connection QR</button>
          <button onClick={() => onConnectAppWallet(mockAppWalletAddress)}>
            App Wallet
          </button>
        </>
      );
    },
  };
});

function FlowHarness({
  disconnectExternalWallet = jest.fn().mockResolvedValue(undefined),
  openExternalWallets = jest.fn().mockResolvedValue(undefined),
  onHandoffStateChange = jest.fn(),
}: Readonly<{
  disconnectExternalWallet?: (() => Promise<void>) | undefined;
  openExternalWallets?: (() => Promise<void>) | undefined;
  onHandoffStateChange?: ((isPending: boolean) => void) | undefined;
}>) {
  const [view, setView] = useState<CapacitorConnectDialogView>("options");
  return (
    <CapacitorConnectFlow
      view={view}
      setView={setView}
      disconnectExternalWallet={disconnectExternalWallet}
      openExternalWallets={openExternalWallets}
      onHandoffStateChange={onHandoffStateChange}
    />
  );
}

describe("CapacitorConnectFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectAsync.mockResolvedValue(undefined);
  });

  it("hands external-wallet selection to the external-only Reown callback", async () => {
    const disconnectExternalWallet = jest.fn().mockResolvedValue(undefined);
    const openExternalWallets = jest.fn().mockResolvedValue(undefined);
    render(
      <FlowHarness
        disconnectExternalWallet={disconnectExternalWallet}
        openExternalWallets={openExternalWallets}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "External Wallets" })
    );

    await waitFor(() => expect(openExternalWallets).toHaveBeenCalledTimes(1));
    expect(disconnectExternalWallet).toHaveBeenCalledTimes(1);
  });

  it("connects a selected app-wallet connector directly", async () => {
    const disconnectExternalWallet = jest.fn().mockResolvedValue(undefined);
    render(<FlowHarness disconnectExternalWallet={disconnectExternalWallet} />);

    await userEvent.click(screen.getByRole("button", { name: "App Wallet" }));

    await waitFor(() => expect(mockConnectAsync).toHaveBeenCalledTimes(1));
    expect(disconnectExternalWallet).toHaveBeenCalledTimes(1);
    expect(mockConnectAsync).toHaveBeenCalledWith({
      connector: { id: mockAppWalletAddress, type: "app-wallet" },
    });
  });

  it("routes only a valid connection-share scan", async () => {
    mockScanQrCode.mockResolvedValue(
      `mobile6529://share-connection?connection_share_code=code&address=${mockAppWalletAddress}`
    );
    render(<FlowHarness />);

    await userEvent.click(
      screen.getByRole("button", { name: "Scan Connection QR" })
    );

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\/accept-connection-sharing\?connection_share_code=code&address=.*&_t=\d+$/
        )
      )
    );
  });
});
