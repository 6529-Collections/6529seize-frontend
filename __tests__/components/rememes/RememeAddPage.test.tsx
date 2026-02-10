import { TitleProvider } from "@/contexts/TitleContext";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RememeAddPage from "@/components/rememes/RememeAddPage";

// Mock react-bootstrap
jest.mock("react-bootstrap", () => ({
  Container: (props: any) => <div {...props} />,
  Row: (props: any) => <div {...props} />,
  Col: (props: any) => <div {...props} />,
  Button: (props: any) => <button {...props} />,
}));

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => (
    <img {...props} alt={props.alt ?? "rememe-add-page"} />
  ),
}));

// Mock wagmi hooks
jest.mock("wagmi", () => ({
  useSignMessage: jest.fn(),
}));

// Mock components
jest.mock(
  "@/components/rememes/RememeAddComponent",
  () => (props: any) =>
    (
      <div data-testid="rememe-add-component">
        <button
          onClick={() =>
            props.verifiedRememe(
              {
                valid: true,
                contract: { address: "0xtest", contractDeployer: "0xdeployer" },
                nfts: [{ tokenId: "1", name: "Test NFT" }],
              },
              [1, 2]
            )
          }>
          Verify Rememe
        </button>
      </div>
    )
);

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (props: any) => (
    <svg data-testid={props["data-testid"] || props.icon.iconName} />
  ),
}));

// Mock hooks and contexts
jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

// Mock API services
jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
  postData: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/helpers/Helpers", () => ({
  areEqualAddresses: jest.fn((a, b) => a?.toLowerCase() === b?.toLowerCase()),
  numberWithCommas: jest.fn((n) => n.toLocaleString("en-US")),
}));

// Get mocked functions
const mockUseSignMessage = require("wagmi").useSignMessage as jest.Mock;
const mockUseAuth = require("@/components/auth/Auth")
  .useAuth as jest.Mock;
const mockUseSeizeConnectContext =
  require("@/components/auth/SeizeConnectContext")
    .useSeizeConnectContext as jest.Mock;
const mockUseSeizeSettings = require("@/contexts/SeizeSettingsContext")
  .useSeizeSettings as jest.Mock;
const mockFetchUrl = require("@/services/6529api").fetchUrl as jest.Mock;
const mockPostData = require("@/services/6529api").postData as jest.Mock;
const mockCommonApiFetch = require("@/services/api/common-api")
  .commonApiFetch as jest.Mock;

// Mock location.reload
Object.defineProperty(window, "location", {
  writable: true,
  value: { reload: jest.fn() },
});

const renderComponent = () => {
  return render(
    <TitleProvider>
      <RememeAddPage />
    </TitleProvider>
  );
};

describe("RememeAddPage", () => {
  const defaultSignMessage = {
    signMessage: jest.fn(),
    reset: jest.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    data: null,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSignMessage.mockReturnValue(defaultSignMessage);
    mockUseAuth.mockReturnValue({ connectedProfile: null });
    mockUseSeizeConnectContext.mockReturnValue({
      address: "0x123",
      isConnected: true,
      seizeConnect: jest.fn(),
      seizeConnectOpen: false,
    });
    mockUseSeizeSettings.mockReturnValue({
      seizeSettings: { rememes_submission_tdh_threshold: 6942 },
    });
    mockFetchUrl.mockResolvedValue({ data: [] });
    mockCommonApiFetch.mockResolvedValue({ boosted_tdh: 10000 });
  });

  it("renders page with logo and basic content", () => {
    renderComponent();

    expect(screen.getByAltText("re-memes")).toBeInTheDocument();
    expect(
      screen.getByText(/Please use this page to only add ReMemes/)
    ).toBeInTheDocument();
    expect(screen.getByText("view requirements")).toBeInTheDocument();
    expect(screen.getByText("Submission Requirements:")).toBeInTheDocument();
  });

  it("shows connect wallet button when not connected", () => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: null,
      isConnected: false,
      seizeConnect: jest.fn(),
      seizeConnectOpen: false,
    });

    renderComponent();

    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
  });

  it("shows connecting state when wallet connection is pending", () => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: null,
      isConnected: false,
      seizeConnect: jest.fn(),
      seizeConnectOpen: true,
    });

    renderComponent();

    expect(screen.getByText("Connecting...")).toBeInTheDocument();
  });

  it("shows add rememe button when connected", () => {
    renderComponent();

    expect(screen.getByText("Add Rememe")).toBeInTheDocument();
  });

  it("shows TDH requirement check for non-deployer", async () => {
    mockUseAuth.mockReturnValue({
      connectedProfile: { consolidation_key: "test-key" },
    });

    renderComponent();

    // Verify rememe to trigger checklist
    fireEvent.click(screen.getByText("Verify Rememe"));

    await waitFor(() => {
      expect(
        screen.getByText(/You need 6,942 TDH to add this Rememe/)
      ).toBeInTheDocument();
    });
  });

  it("shows deployer privilege when user is contract deployer", async () => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: "0xdeployer",
      isConnected: true,
      seizeConnect: jest.fn(),
      seizeConnectOpen: false,
    });

    renderComponent();

    // Verify rememe to trigger checklist
    fireEvent.click(screen.getByText("Verify Rememe"));

    await waitFor(() => {
      expect(
        screen.getByText("Rememe can be added (Rememe Contract Deployer)")
      ).toBeInTheDocument();
    });
  });

  it("handles successful TDH check", async () => {
    mockUseAuth.mockReturnValue({
      connectedProfile: { consolidation_key: "test-key" },
    });

    mockCommonApiFetch.mockResolvedValue({ boosted_tdh: 10000 });

    renderComponent();

    // Verify rememe to trigger checklist
    fireEvent.click(screen.getByText("Verify Rememe"));

    // Wait for the TDH message to appear first
    await waitFor(
      () => {
        expect(screen.getByText(/you have 10,000 TDH/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Then check for the check-circle icon
    expect(screen.getByTestId("check-circle")).toBeInTheDocument();
  });

  it("handles signing message flow", async () => {
    const mockSignMessage = jest.fn();
    mockUseSignMessage.mockReturnValue({
      ...defaultSignMessage,
      signMessage: mockSignMessage,
    });

    mockUseAuth.mockReturnValue({
      connectedProfile: { consolidation_key: "test-key" },
    });

    renderComponent();

    // Verify rememe first
    fireEvent.click(screen.getByText("Verify Rememe"));

    await waitFor(() => {
      expect(screen.getByText("Add Rememe")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText("Add Rememe"));

    expect(mockSignMessage).toHaveBeenCalledWith({
      message: JSON.stringify({
        contract: "0xtest",
        token_ids: ["1"],
        references: [1, 2],
      }),
    });
  });

  it("shows signing state when message is pending", () => {
    mockUseSignMessage.mockReturnValue({
      ...defaultSignMessage,
      isPending: true,
    });

    renderComponent();

    expect(screen.getByText("Signing Message")).toBeInTheDocument();
  });

  it("shows submitting state during submission", async () => {
    mockUseSignMessage.mockReturnValue({
      ...defaultSignMessage,
      isSuccess: true,
      data: "signature",
    });

    mockPostData.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ status: 201, response: {} }), 100);
        })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Adding Rememe")).toBeInTheDocument();
    });
  });

  it("handles successful submission", async () => {
    mockUseSignMessage.mockReturnValue({
      ...defaultSignMessage,
      isSuccess: true,
      data: "signature",
    });

    mockPostData.mockResolvedValue({
      status: 201,
      response: {
        contract: { address: "0xcontract" },
        nfts: [{ tokenId: "1", name: "Test NFT", raw: {} }],
      },
    });

    renderComponent();

    // First verify rememe to set up the rememe data
    fireEvent.click(screen.getByText("Verify Rememe"));

    await waitFor(() => {
      expect(screen.getByText("Status: Success")).toBeInTheDocument();
      expect(screen.getByText("Rememes Added:")).toBeInTheDocument();
      expect(screen.getByText("#1 - Test NFT")).toBeInTheDocument();
      expect(screen.getByText("Add Another")).toBeInTheDocument();
    });
  });

  it("handles submission errors", async () => {
    mockUseSignMessage.mockReturnValue({
      ...defaultSignMessage,
      isSuccess: true,
      data: "signature",
    });

    mockPostData.mockResolvedValue({
      status: 400,
      response: {
        error: "Invalid rememe",
        nfts: [{ tokenId: "1", raw: { error: "Token error" } }],
      },
    });

    renderComponent();

    // First verify rememe to set up the rememe data
    fireEvent.click(screen.getByText("Verify Rememe"));

    await waitFor(() => {
      expect(screen.getByText("Status: Fail")).toBeInTheDocument();
      expect(screen.getByText("Error: Invalid rememe")).toBeInTheDocument();
    });
  });

  it("handles sign message errors", () => {
    mockUseSignMessage.mockReturnValue({
      ...defaultSignMessage,
      isError: true,
      error: { message: "User rejected. Something else." },
    });

    renderComponent();

    expect(screen.getByText("Error: User rejected")).toBeInTheDocument();
  });

  it("handles add another button click", async () => {
    const signMessageMock = {
      ...defaultSignMessage,
      isSuccess: true,
      data: "signature",
    };
    mockUseSignMessage.mockReturnValue(signMessageMock);

    mockPostData.mockResolvedValue({
      status: 201,
      response: {
        contract: { address: "0xcontract" },
        nfts: [{ tokenId: "1", name: "Test NFT", raw: {} }],
      },
    });

    renderComponent();

    // First trigger the verification to set up the rememe
    fireEvent.click(screen.getByText("Verify Rememe"));

    // Wait for API call to complete and submission to succeed
    await waitFor(() => {
      expect(mockPostData).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(screen.getByText("Add Another")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    fireEvent.click(screen.getByText("Add Another"));
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("fetches memes on component mount", () => {
    renderComponent();

    expect(mockFetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/memes_lite"
    );
  });

  it("clears errors when signing new message", async () => {
    const mockSignMessage = jest.fn();
    const mockReset = jest.fn();

    mockUseSignMessage.mockReturnValue({
      ...defaultSignMessage,
      signMessage: mockSignMessage,
      reset: mockReset,
    });

    mockUseAuth.mockReturnValue({
      connectedProfile: { consolidation_key: "test-key" },
    });

    renderComponent();

    // Verify rememe and click add
    fireEvent.click(screen.getByText("Verify Rememe"));

    await waitFor(() => {
      const addButton = screen.getByText("Add Rememe");
      fireEvent.click(addButton);
    });

    expect(mockReset).toHaveBeenCalled();
  });
});
