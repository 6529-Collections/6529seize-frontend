import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CapacitorConnectFlow from "@/components/auth/CapacitorConnectFlow";
import type { CapacitorConnectDialogView } from "@/components/auth/CapacitorConnectDialog";

const mockAppWalletAddress = "0x00000000000000000000000000000000000000AA";
const mockConnectAsync = jest.fn();
const mockPush = jest.fn();
const mockScanQrCode = jest.fn(
  (_options: unknown): Promise<string | null> => Promise.resolve(null)
);
const mockIsQRScannerCancellation = jest.fn((_error: unknown) => false);
let mockConnectors = [{ id: mockAppWalletAddress, type: "app-wallet" }];

jest.mock("wagmi", () => ({
  useConnect: () => ({
    connectAsync: mockConnectAsync,
    connectors: mockConnectors,
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
  isQRScannerCancellation: (error: unknown) =>
    mockIsQRScannerCancellation(error),
  scanQrCode: (options: unknown) => mockScanQrCode(options),
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
      onImportAppWallet,
      onViewAppWallets,
      errorMessage,
    }: {
      readonly view: CapacitorConnectDialogView;
      readonly onAfterLeave: () => void;
      readonly onOpenExternalWallets: () => void;
      readonly onScanConnectionQr: () => void;
      readonly onConnectAppWallet: (address: string) => void;
      readonly onImportAppWallet: () => void;
      readonly onViewAppWallets: () => void;
      readonly errorMessage: string | null;
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
          <button onClick={onImportAppWallet}>Import App Wallet</button>
          <button onClick={onViewAppWallets}>View All App Wallets</button>
          <button onClick={() => onConnectAppWallet(mockAppWalletAddress)}>
            App Wallet
          </button>
          {errorMessage && <div role="alert">{errorMessage}</div>}
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
    mockPush.mockReset();
    mockScanQrCode.mockReset();
    mockScanQrCode.mockResolvedValue(null);
    mockConnectors = [{ id: mockAppWalletAddress, type: "app-wallet" }];
    mockConnectAsync.mockResolvedValue(undefined);
    mockIsQRScannerCancellation.mockReturnValue(false);
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

  it.each([
    ["Import App Wallet", "/tools/app-wallets/import-wallet"],
    ["View All App Wallets", "/tools/app-wallets"],
  ])("routes %s after closing the chooser", async (label, href) => {
    const onHandoffStateChange = jest.fn();
    render(<FlowHarness onHandoffStateChange={onHandoffStateChange} />);

    await userEvent.click(screen.getByRole("button", { name: label }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(href));
    expect(onHandoffStateChange).toHaveBeenNthCalledWith(1, true);
    expect(onHandoffStateChange).toHaveBeenLastCalledWith(false);
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

  it("restores the chooser with a scoped error for an invalid scan", async () => {
    const onHandoffStateChange = jest.fn();
    mockScanQrCode.mockResolvedValue("https://6529.io/profile");
    render(<FlowHarness onHandoffStateChange={onHandoffStateChange} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Scan Connection QR" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This isn't a valid 6529 connection QR code."
    );
    expect(onHandoffStateChange).toHaveBeenNthCalledWith(1, true);
    expect(onHandoffStateChange).toHaveBeenLastCalledWith(false);
  });

  it("restores the chooser without an error when scanning is cancelled", async () => {
    mockScanQrCode.mockRejectedValue(new Error("cancelled"));
    mockIsQRScannerCancellation.mockReturnValue(true);
    render(<FlowHarness />);

    await userEvent.click(
      screen.getByRole("button", { name: "Scan Connection QR" })
    );

    expect(
      await screen.findByRole("button", { name: "Scan Connection QR" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("reports navigation failures separately from scan failures", async () => {
    mockScanQrCode.mockResolvedValue(
      `mobile6529://share-connection?connection_share_code=code&address=${mockAppWalletAddress}`
    );
    mockPush.mockImplementation(() => {
      throw new Error("navigation failed");
    });
    render(<FlowHarness />);

    await userEvent.click(
      screen.getByRole("button", { name: "Scan Connection QR" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to open the shared connection. Please try again."
    );
  });

  it("keeps the app-wallet view open when its connector is unavailable", async () => {
    mockConnectors = [];
    const disconnectExternalWallet = jest.fn().mockResolvedValue(undefined);
    render(<FlowHarness disconnectExternalWallet={disconnectExternalWallet} />);

    await userEvent.click(screen.getByRole("button", { name: "App Wallet" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wallet connection failed. Please try again."
    );
    expect(disconnectExternalWallet).not.toHaveBeenCalled();
  });
});
