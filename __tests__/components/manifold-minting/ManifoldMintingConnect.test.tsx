import { AuthContext } from "@/components/auth/Auth";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import ManifoldMintingConnect from "@/components/manifold-minting/ManifoldMintingConnect";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  __esModule: true,
  CookieConsentProvider: ({ children }: any) => <>{children}</>,
  useCookieConsent: jest.fn(() => ({ country: "US" })),
}));

jest.mock("@/components/header/user/HeaderUserConnect", () => () => (
  <div data-testid="header-connect" />
));

jest.mock("react-bootstrap", () => {
  return {
    Container: (p: any) => <div data-testid="container" {...p} />,
    Row: (p: any) => <div data-testid="row" {...p} />,
    Col: (p: any) => <div data-testid="col" {...p} />,
  };
});

jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => <div data-testid="user-cic" />,
  UserCICAndLevelSize: { XLARGE: "XLARGE" },
}));

jest.mock("@/components/nft-transfer/TransferModalPfp", () => ({
  __esModule: true,
  default: () => <div data-testid="transfer-pfp" />,
}));

let mockOnProfileSelect: ((profile: any) => void) | null = null;
let mockOnWalletSelect: ((wallet: string | null) => void) | null = null;

jest.mock("@/components/common/RecipientSelector", () => ({
  __esModule: true,
  default: (props: any) => {
    mockOnProfileSelect = props.onProfileSelect;
    mockOnWalletSelect = props.onWalletSelect;
    return (
      <div data-testid="recipient-selector">
        <span data-testid="selector-label">{props.label}</span>
        {props.selectedProfile && (
          <span data-testid="selected-profile">
            {props.selectedProfile.handle}
          </span>
        )}
        {props.selectedWallet && (
          <span data-testid="selected-wallet">{props.selectedWallet}</span>
        )}
      </div>
    );
  },
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const {
  useSeizeConnectContext: mockedConnect,
} = require("@/components/auth/SeizeConnectContext");

function renderConnected(onMintFor = jest.fn()) {
  const seizeCtx = {
    address: "0xabc000000000000000000000000000000000abcd",
    isConnected: true,
  };
  (mockedConnect as jest.Mock).mockReturnValue(seizeCtx);
  const auth = {
    connectedProfile: {
      handle: "bob",
      display: "bob",
      level: 1,
      cic: 1,
      wallets: [
        { wallet: seizeCtx.address, display: "Primary" },
        { wallet: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", display: "Alt" },
      ],
    },
  } as any;
  render(
    <CookieConsentProvider>
      <AuthContext.Provider value={auth}>
        <ManifoldMintingConnect onMintFor={onMintFor} />
      </AuthContext.Provider>
    </CookieConsentProvider>
  );
  return { onMintFor, seizeCtx };
}

describe("ManifoldMintingConnect", () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockOnProfileSelect = null;
    mockOnWalletSelect = null;
  });

  it("shows connect prompt when not connected", () => {
    (mockedConnect as jest.Mock).mockReturnValue({ isConnected: false });
    render(
      <CookieConsentProvider>
        <ManifoldMintingConnect onMintFor={jest.fn()} />
      </CookieConsentProvider>
    );
    expect(screen.getByTestId("header-connect")).toBeInTheDocument();
  });

  it("calls onMintFor with account address on mount", () => {
    const { onMintFor, seizeCtx } = renderConnected();
    expect(onMintFor).toHaveBeenCalledWith(seizeCtx.address);
  });

  it("lets mint for me switch wallet inside connected profile", async () => {
    const { onMintFor } = renderConnected();
    const alternateWallet = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    expect(mockOnWalletSelect).toBeTruthy();
    mockOnWalletSelect!(alternateWallet);

    await waitFor(() =>
      expect(onMintFor).toHaveBeenLastCalledWith(alternateWallet)
    );
  });

  it("reselects connected wallet when switching back to mint for me", async () => {
    const { onMintFor, seizeCtx } = renderConnected();
    const alternateWallet = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const frenWallet = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    expect(mockOnWalletSelect).toBeTruthy();
    mockOnWalletSelect!(alternateWallet);
    await waitFor(() =>
      expect(onMintFor).toHaveBeenLastCalledWith(alternateWallet)
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Mint for fren/i })
    );
    expect(mockOnProfileSelect).toBeTruthy();
    expect(mockOnWalletSelect).toBeTruthy();
    mockOnProfileSelect!({ handle: "fren", wallet: frenWallet });
    mockOnWalletSelect!(frenWallet);
    await waitFor(() => expect(onMintFor).toHaveBeenLastCalledWith(frenWallet));

    await userEvent.click(screen.getByRole("button", { name: /Mint for me/i }));
    await waitFor(() =>
      expect(onMintFor).toHaveBeenLastCalledWith(seizeCtx.address)
    );
  });

  it("shows RecipientSelector when mint for fren is clicked", async () => {
    renderConnected();
    await userEvent.click(
      screen.getByRole("button", { name: /Mint for fren/i })
    );
    expect(screen.getByTestId("recipient-selector")).toBeInTheDocument();
    expect(screen.getByTestId("selector-label")).toHaveTextContent("Mint For");
  });

  it("calls onMintFor with selected wallet when wallet is selected", async () => {
    const { onMintFor } = renderConnected();
    await userEvent.click(
      screen.getByRole("button", { name: /Mint for fren/i })
    );

    const frenWallet = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    expect(mockOnProfileSelect).toBeTruthy();
    expect(mockOnWalletSelect).toBeTruthy();
    mockOnProfileSelect!({ handle: "fren", wallet: frenWallet });
    mockOnWalletSelect!(frenWallet);

    await waitFor(() => expect(onMintFor).toHaveBeenLastCalledWith(frenWallet));
  });

  it("reverts to own address when switching back to mint for me", async () => {
    const { onMintFor, seizeCtx } = renderConnected();
    await userEvent.click(
      screen.getByRole("button", { name: /Mint for fren/i })
    );

    const frenWallet = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    expect(mockOnProfileSelect).toBeTruthy();
    expect(mockOnWalletSelect).toBeTruthy();
    mockOnProfileSelect!({ handle: "fren", wallet: frenWallet });
    mockOnWalletSelect!(frenWallet);

    await waitFor(() => expect(onMintFor).toHaveBeenLastCalledWith(frenWallet));

    await userEvent.click(screen.getByRole("button", { name: /Mint for me/i }));
    await waitFor(() =>
      expect(onMintFor).toHaveBeenLastCalledWith(seizeCtx.address)
    );
  });
});
