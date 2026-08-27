import { fireEvent, render, screen } from "@testing-library/react";
import CapacitorConnectDialog from "@/components/auth/CapacitorConnectDialog";

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    isOpen,
    title,
    onBack,
    children,
  }: {
    readonly isOpen: boolean;
    readonly title: string;
    readonly onBack?: (() => void) | undefined;
    readonly children: React.ReactNode;
  }) =>
    isOpen ? (
      <section aria-label={title}>
        <h1>{title}</h1>
        {onBack && <button onClick={onBack}>Back</button>}
        {children}
      </section>
    ) : null,
}));

const defaultProps = {
  view: "options" as const,
  locale: "en-US" as const,
  appWallets: [],
  appWalletsSupported: true,
  fetchingAppWallets: false,
  busyWalletAddress: null,
  errorMessage: null,
  onClose: jest.fn(),
  onBack: jest.fn(),
  onOpenAppWallets: jest.fn(),
  onOpenExternalWallets: jest.fn(),
  onScanConnectionQr: jest.fn(),
  onCreateAppWallet: jest.fn(),
  onImportAppWallet: jest.fn(),
  onViewAppWallets: jest.fn(),
  onConnectAppWallet: jest.fn(),
  onAfterLeave: jest.fn(),
};

const appWallet = {
  name: "Phoebe",
  address: "0x00000000000000000000000000000000000000AA",
  address_hashed: "encrypted",
  mnemonic: "encrypted",
  private_key: "encrypted",
  imported: false,
  created_at: 1,
};

describe("CapacitorConnectDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the minimal initial chooser", () => {
    render(<CapacitorConnectDialog {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: "Connect" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "App Wallets" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "App Wallets" }).parentElement
    ).toHaveClass("tw-pt-3");
    expect(
      screen.getByRole("button", { name: "External Wallets" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Scan Connection QR" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/encrypted and stored securely/i)
    ).not.toBeInTheDocument();
  });

  it("shows app-wallet guidance, creation, wallets, and back navigation", () => {
    render(
      <CapacitorConnectDialog
        {...defaultProps}
        view="app-wallets"
        appWallets={[appWallet]}
      />
    );

    expect(
      screen.getByText(/encrypted and stored securely on this device/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create Wallet" }));
    expect(defaultProps.onCreateAppWallet).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Import Wallet" }));
    expect(defaultProps.onImportAppWallet).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Connect with Phoebe, wallet 0x0000…00AA",
      })
    );
    expect(
      screen.getByRole("button", {
        name: "Connect with Phoebe, wallet 0x0000…00AA",
      }).parentElement
    ).toHaveClass("tw-max-h-[40svh]", "tw-overflow-y-auto");
    expect(defaultProps.onConnectAppWallet).toHaveBeenCalledWith(
      "0x00000000000000000000000000000000000000AA"
    );

    fireEvent.click(
      screen.getByRole("button", { name: "View All App Wallets" })
    );
    expect(defaultProps.onViewAppWallets).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it("announces the empty app-wallet state with semantic output", () => {
    render(<CapacitorConnectDialog {...defaultProps} view="app-wallets" />);

    const status = screen.getByRole("status");
    expect(status.tagName).toBe("OUTPUT");
    expect(status).toHaveTextContent("No App Wallets yet.");
  });

  it("keeps errors announced and disables wallets while connecting", () => {
    render(
      <CapacitorConnectDialog
        {...defaultProps}
        view="app-wallets"
        appWallets={[appWallet]}
        busyWalletAddress={appWallet.address}
        errorMessage="Wallet connection failed. Please try again."
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Wallet connection failed. Please try again."
    );
    expect(
      screen.getByRole("button", {
        name: "Connect with Phoebe, wallet 0x0000…00AA",
      })
    ).toBeDisabled();
  });
});
