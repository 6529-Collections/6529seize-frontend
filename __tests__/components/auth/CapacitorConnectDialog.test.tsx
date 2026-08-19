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
  onConnectAppWallet: jest.fn(),
  onAfterLeave: jest.fn(),
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
      screen.getByRole("button", { name: "External Wallets" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Scan Connection QR" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/encrypted wallets stored securely/i)
    ).not.toBeInTheDocument();
  });

  it("shows app-wallet guidance, creation, wallets, and back navigation", () => {
    render(
      <CapacitorConnectDialog
        {...defaultProps}
        view="app-wallets"
        appWallets={[
          {
            name: "Phoebe",
            address: "0x00000000000000000000000000000000000000AA",
            address_hashed: "encrypted",
            mnemonic: "encrypted",
            private_key: "encrypted",
            imported: false,
            created_at: 1,
          },
        ]}
      />
    );

    expect(
      screen.getByText(/encrypted wallets stored securely on this device/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create App Wallet" }));
    expect(defaultProps.onCreateAppWallet).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Connect with Phoebe, wallet 0x0000…00AA",
      })
    );
    expect(defaultProps.onConnectAppWallet).toHaveBeenCalledWith(
      "0x00000000000000000000000000000000000000AA"
    );

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it("announces the empty app-wallet state with semantic output", () => {
    render(
      <CapacitorConnectDialog {...defaultProps} view="app-wallets" />
    );

    const status = screen.getByRole("status");
    expect(status.tagName).toBe("OUTPUT");
    expect(status).toHaveTextContent("No App Wallets yet.");
  });
});
