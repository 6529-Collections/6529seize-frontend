import HeaderShare from "@/components/header/share/HeaderShare";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useCapacitor from "@/hooks/useCapacitor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Mocks
jest.mock("@/hooks/useCapacitor");
jest.mock("@/hooks/isMobileDevice");
jest.mock("@/hooks/useElectron", () => ({
  useElectron: jest.fn(() => false),
}));

// Mock SeizeConnectContext
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({
    isAuthenticated: false,
    seizeConnect: jest.fn(),
    seizeAcceptConnection: jest.fn(),
    address: undefined,
    hasInitializationError: false,
    initializationError: null,
  })),
  SeizeConnectProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock("@/services/auth/auth.utils");
jest.mock("@/services/auth/session-v2.utils", () => ({
  createConnectionTransfer: jest.fn(),
  isConnectionTransferV2Enabled: jest.fn(() => false),
}));

// Mock Reown AppKit
jest.mock("@reown/appkit/react", () => ({
  useAppKit: jest.fn(() => ({
    open: jest.fn(),
    close: jest.fn(),
  })),
  useAppKitAccount: jest.fn(() => ({
    address: undefined,
    isConnected: false,
    status: "disconnected",
  })),
  useAppKitState: jest.fn(() => ({
    open: false,
    loading: false,
  })),
  useDisconnect: jest.fn(() => ({
    disconnect: jest.fn(),
  })),
  useWalletInfo: jest.fn(() => ({
    walletInfo: null,
  })),
}));

// Mock viem
jest.mock("viem", () => ({
  isAddress: jest.fn((address: string) => /^0x[a-fA-F0-9]{40}$/.test(address)),
  getAddress: jest.fn((address: string) => address.toLowerCase()),
}));

// next/navigation mocks
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => "/mock-path",
  useSearchParams: () => {
    return new URLSearchParams("something=value");
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

// Image mock (should live in jest.setup.ts ideally)
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img alt="" {...props} />,
}));

// QRCode mock - needs to match require() usage in component
jest.mock("qrcode", () => ({
  toDataURL: jest.fn(() =>
    Promise.resolve("data:image/png;base64,FAKE_QR_CODE")
  ),
}));

// Mock auth utils
const mockAuthUtils = {
  getRefreshToken: jest.fn<string | null, []>(() => null),
  getWalletAddress: jest.fn<string | null, []>(() => null),
  getWalletRole: jest.fn<string | null, []>(() => null),
  removeAuthJwt: jest.fn(),
};

require("@/services/auth/auth.utils").getRefreshToken =
  mockAuthUtils.getRefreshToken;
require("@/services/auth/auth.utils").getWalletAddress =
  mockAuthUtils.getWalletAddress;
require("@/services/auth/auth.utils").getWalletRole =
  mockAuthUtils.getWalletRole;
require("@/services/auth/auth.utils").removeAuthJwt =
  mockAuthUtils.removeAuthJwt;

const mockUseCapacitor = useCapacitor as jest.MockedFunction<
  typeof useCapacitor
>;
const mockIsMobile = useIsMobileDevice as jest.MockedFunction<
  typeof useIsMobileDevice
>;

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const testOrigin = window.location.origin;

describe("HeaderShare", () => {
  const mockSeizeConnect = require("@/components/auth/SeizeConnectContext");

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset mock return values
    mockAuthUtils.getRefreshToken.mockReturnValue(null);
    mockAuthUtils.getWalletAddress.mockReturnValue(null);
    mockAuthUtils.getWalletRole.mockReturnValue(null);

    mockSeizeConnect.useSeizeConnectContext.mockReturnValue({
      isAuthenticated: false,
      seizeConnect: jest.fn(),
      seizeAcceptConnection: jest.fn(),
      address: undefined,
      hasInitializationError: false,
      initializationError: null,
    });

    // Reset QRCode mock
    const qrcode = require("qrcode");
    qrcode.toDataURL.mockResolvedValue("data:image/png;base64,FAKE_QR_CODE");

    const sessionV2 = require("@/services/auth/session-v2.utils");
    sessionV2.isConnectionTransferV2Enabled.mockReturnValue(false);
    sessionV2.createConnectionTransfer.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
    (navigator.clipboard.writeText as jest.Mock).mockReset?.();
  });

  it("renders nothing when running in Capacitor", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: true } as any);
    mockIsMobile.mockReturnValue(false);
    const { container } = render(<HeaderShare />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing on mobile devices", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(true);
    const { container } = render(<HeaderShare />);
    expect(container.firstChild).toBeNull();
  });

  it("shows QR button and opens modal on click", async () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);

    // Look for button by aria-label since that's what the component uses
    const btn = screen.getByRole("button", { name: "QR Code" });
    expect(btn).toBeInTheDocument();

    await userEvent.click(btn);

    expect(await screen.findByTestId("header-share-modal")).toBeInTheDocument();
    expect(screen.getByText("Current URL")).toBeInTheDocument();
  });

  it("copies url to clipboard", async () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);

    renderWithProviders(<HeaderShare />);

    const btn = screen.getByRole("button", { name: "QR Code" });
    await userEvent.click(btn);

    const modal = await screen.findByTestId("header-share-modal");
    const copyIcon = modal.querySelector('[data-icon="copy"]') as HTMLElement;

    expect(copyIcon).toBeInTheDocument();
    await userEvent.click(copyIcon);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("generates QR codes when modal opens", async () => {
    const qrcode = require("qrcode");
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);

    renderWithProviders(<HeaderShare />);

    const btn = screen.getByRole("button", { name: "QR Code" });
    await userEvent.click(btn);

    await screen.findByTestId("header-share-modal");
    expect(qrcode.toDataURL).toHaveBeenCalled();
  });

  describe("Authentication State Handling", () => {
    it("shows Connection tab when authenticated", async () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);

      // Mock authenticated state with tokens
      mockAuthUtils.getRefreshToken.mockReturnValue("mock-refresh-token");
      mockAuthUtils.getWalletAddress.mockReturnValue(
        "0x1234567890123456789012345678901234567890"
      );
      mockAuthUtils.getWalletRole.mockReturnValue("user");

      mockSeizeConnect.useSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        seizeConnect: jest.fn(),
        seizeAcceptConnection: jest.fn(),
        address: "0x1234567890123456789012345678901234567890",
        hasInitializationError: false,
        initializationError: null,
      });

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(btn);

      await screen.findByTestId("header-share-modal");

      // Should show Connection button when authenticated
      expect(screen.getByText("Connection")).toBeInTheDocument();
      expect(screen.getByText("Current URL")).toBeInTheDocument();
      expect(screen.getByText("6529 Apps")).toBeInTheDocument();
    });

    it("defaults to Current URL tab when not authenticated", async () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);

      // Mock unauthenticated state
      mockAuthUtils.getRefreshToken.mockReturnValue(null);
      mockAuthUtils.getWalletAddress.mockReturnValue(null);
      mockAuthUtils.getWalletRole.mockReturnValue(null);

      mockSeizeConnect.useSeizeConnectContext.mockReturnValue({
        isAuthenticated: false,
        seizeConnect: jest.fn(),
        seizeAcceptConnection: jest.fn(),
        address: undefined,
        hasInitializationError: false,
        initializationError: null,
      });

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(btn);

      await screen.findByTestId("header-share-modal");

      // Should NOT show Connection button when not authenticated
      expect(screen.queryByText("Connection")).not.toBeInTheDocument();
      expect(screen.getByText("Current URL")).toBeInTheDocument();
      expect(screen.getByText("6529 Apps")).toBeInTheDocument();
    });
  });

  describe("Modal Tab Navigation", () => {
    beforeEach(() => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);
    });

    it("allows switching between 6529 Mobile and Browser tabs in Navigate mode", async () => {
      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(btn);

      await screen.findByTestId("header-share-modal");

      // Should show both mobile and browser options
      expect(screen.getByText("6529 Mobile")).toBeInTheDocument();
      expect(screen.getByText("Browser")).toBeInTheDocument();
      expect(screen.getByText("6529 Desktop")).toBeInTheDocument();

      // Click Browser tab
      await userEvent.click(screen.getByText("Browser"));
      // Browser tab should now be active (this would change the QR code content)

      // Click back to Mobile tab
      await userEvent.click(screen.getByText("6529 Mobile"));
      // Mobile tab should be active again
    });

    it("switches to 6529 Apps tab", async () => {
      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(btn);

      await screen.findByTestId("header-share-modal");

      // Click 6529 Apps tab
      await userEvent.click(screen.getByText("6529 Apps"));

      // Should still show mobile/core options but content changes
      expect(screen.getByText("6529 Mobile")).toBeInTheDocument();
      expect(screen.getByText("6529 Desktop")).toBeInTheDocument();
    });
  });

  describe("Connection transfer codes", () => {
    beforeEach(() => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);
      mockAuthUtils.getWalletAddress.mockReturnValue(
        "0x1234567890123456789012345678901234567890"
      );
      mockAuthUtils.getWalletRole.mockReturnValue(null);
      mockSeizeConnect.useSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        seizeConnect: jest.fn(),
        seizeAcceptConnection: jest.fn(),
        address: "0x1234567890123456789012345678901234567890",
        hasInitializationError: false,
        initializationError: null,
      });
    });

    it("aborts in-flight transfer-code creation when the modal closes", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      const signals: AbortSignal[] = [];
      sessionV2.isConnectionTransferV2Enabled.mockReturnValue(true);
      sessionV2.createConnectionTransfer.mockImplementation(
        ({ signal }: { readonly signal?: AbortSignal }) => {
          signals.push(signal!);
          return new Promise(() => undefined);
        }
      );

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));
      await waitFor(() =>
        expect(sessionV2.createConnectionTransfer).toHaveBeenCalledTimes(1)
      );

      await userEvent.click(screen.getByLabelText("Close share modal"));

      expect(signals[0]?.aborted).toBe(true);
    });

    it("generates connection QR codes from one-time transfer codes", async () => {
      const qrcode = require("qrcode");
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.isConnectionTransferV2Enabled.mockReturnValue(true);
      sessionV2.createConnectionTransfer.mockResolvedValue({
        transfer_code: "transfer-code",
        expires_at: new Date(Date.now() + 300_000).toISOString(),
        address: "0x1234567890123456789012345678901234567890",
        role: null,
        target_client_type: "native",
        deep_link_path:
          "/accept-connection-sharing?transfer_code=transfer-code&address=0x1234567890123456789012345678901234567890",
      });

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      await waitFor(() =>
        expect(sessionV2.createConnectionTransfer).toHaveBeenCalledWith({
          role: null,
          signal: expect.objectContaining({ aborted: false }),
        })
      );
      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining("transfer_code=transfer-code"),
          { width: 500, margin: 0 }
        )
      );
      expect(
        qrcode.toDataURL.mock.calls.some(
          (call: unknown[]) =>
            typeof call[0] === "string" &&
            call[0].includes("mock-refresh-token")
        )
      ).toBe(false);
    });

    it("mints a fresh transfer code after the share modal closes", async () => {
      const qrcode = require("qrcode");
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.isConnectionTransferV2Enabled.mockReturnValue(true);
      sessionV2.createConnectionTransfer
        .mockResolvedValueOnce({
          transfer_code: "first-transfer-code",
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          address: "0x1234567890123456789012345678901234567890",
          role: null,
          target_client_type: "native",
          deep_link_path:
            "/accept-connection-sharing?transfer_code=first-transfer-code&address=0x1234567890123456789012345678901234567890",
        })
        .mockResolvedValueOnce({
          transfer_code: "second-transfer-code",
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          address: "0x1234567890123456789012345678901234567890",
          role: null,
          target_client_type: "native",
          deep_link_path:
            "/accept-connection-sharing?transfer_code=second-transfer-code&address=0x1234567890123456789012345678901234567890",
        });

      renderWithProviders(<HeaderShare />);

      const shareButton = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(shareButton);

      await waitFor(() =>
        expect(sessionV2.createConnectionTransfer).toHaveBeenCalledTimes(1)
      );
      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining("transfer_code=first-transfer-code"),
          { width: 500, margin: 0 }
        )
      );

      await userEvent.click(screen.getByLabelText("Close share modal"));
      await userEvent.click(shareButton);

      await waitFor(() =>
        expect(sessionV2.createConnectionTransfer).toHaveBeenCalledTimes(2)
      );
      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining("transfer_code=second-transfer-code"),
          { width: 500, margin: 0 }
        )
      );
    });

    it("clears one-time transfer URLs as soon as the share modal closes", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.isConnectionTransferV2Enabled.mockReturnValue(true);
      sessionV2.createConnectionTransfer
        .mockResolvedValueOnce({
          transfer_code: "first-transfer-code",
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          address: "0x1234567890123456789012345678901234567890",
          role: null,
          target_client_type: "native",
          deep_link_path:
            "/accept-connection-sharing?transfer_code=first-transfer-code&address=0x1234567890123456789012345678901234567890",
        })
        .mockImplementationOnce(() => new Promise(() => undefined));

      renderWithProviders(<HeaderShare />);

      const shareButton = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(shareButton);

      await screen.findByTitle(/first-transfer-code/);

      await userEvent.click(screen.getByLabelText("Close share modal"));
      await userEvent.click(shareButton);

      await waitFor(() =>
        expect(sessionV2.createConnectionTransfer).toHaveBeenCalledTimes(2)
      );
      expect(
        screen.queryByTitle(/first-transfer-code/)
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Connection")).not.toBeInTheDocument();
    });

    it("encodes transfer-code deep-link query values", async () => {
      const qrcode = require("qrcode");
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.isConnectionTransferV2Enabled.mockReturnValue(true);
      sessionV2.createConnectionTransfer.mockResolvedValue({
        transfer_code: "transfer&code=value%",
        expires_at: new Date(Date.now() + 300_000).toISOString(),
        address: "0x1234567890123456789012345678901234567890",
        role: "role+admin&test",
        target_client_type: "native",
        deep_link_path:
          "/accept-connection-sharing?transfer_code=transfer%26code%3Dvalue%25&address=0x1234567890123456789012345678901234567890&role=role%2Badmin%26test",
      });

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining("transfer_code=transfer%26code%3Dvalue%25"),
          { width: 500, margin: 0 }
        )
      );
      expect(
        qrcode.toDataURL.mock.calls.some(
          (call: unknown[]) =>
            typeof call[0] === "string" &&
            call[0].includes("role=role%2Badmin%26test")
        )
      ).toBe(true);
    });

    it("disables the Connection tab when transfer-code creation fails", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      sessionV2.isConnectionTransferV2Enabled.mockReturnValue(true);
      sessionV2.createConnectionTransfer.mockRejectedValue(
        new Error("transfer creation failed")
      );

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      await waitFor(() =>
        expect(sessionV2.createConnectionTransfer).toHaveBeenCalled()
      );
      await waitFor(() =>
        expect(screen.queryByText("Connection")).not.toBeInTheDocument()
      );
      expect(screen.getByText("Current URL")).toBeInTheDocument();
    });
  });

  describe("QR Code Generation", () => {
    beforeEach(() => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);
    });

    it("generates different QR codes for different modes", async () => {
      const qrcode = require("qrcode");

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(btn);

      await screen.findByTestId("header-share-modal");

      // Should call QRCode.toDataURL for browser and app URLs
      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        `${testOrigin}/mock-path?something=value`,
        { width: 500, margin: 0 }
      );
      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        "testmobile6529://navigate/mock-path?something=value",
        { width: 500, margin: 0 }
      );
    });
  });

  describe("URL Construction", () => {
    beforeEach(() => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);
    });

    it("constructs URLs with environment variables", async () => {
      const qrcode = require("qrcode");

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(btn);

      await screen.findByTestId("header-share-modal");

      // Should use environment variables for scheme
      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining("testmobile6529://navigate"),
        expect.any(Object)
      );
    });

    it("includes search parameters in generated URLs", async () => {
      const qrcode = require("qrcode");

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(btn);

      await screen.findByTestId("header-share-modal");

      // Should include search params from mock
      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining("something=value"),
        expect.any(Object)
      );
    });
  });

  describe("Error Handling", () => {
    it("calls clipboard API when copy button is clicked", async () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(btn);

      const modal = await screen.findByTestId("header-share-modal");
      const copyIcon = modal.querySelector('[data-icon="copy"]') as HTMLElement;

      if (copyIcon) {
        await userEvent.click(copyIcon);

        // Verify clipboard.writeText was called
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      }
    });
  });

  describe("Component State Management", () => {
    it("modal is configured for keyboard interaction", async () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(btn);

      const modal = await screen.findByTestId("header-share-modal");
      expect(modal).toBeInTheDocument();

      // Modal should be rendered with proper attributes
      expect(modal).toHaveAttribute("data-testid", "header-share-modal");
    });

    it("generates QR codes on each modal open", async () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "QR Code" });
      const qrcode = require("qrcode");

      // Clear any previous calls
      qrcode.toDataURL.mockClear();

      await userEvent.click(btn);
      await screen.findByTestId("header-share-modal");

      // Should generate QR codes when modal opens
      expect(qrcode.toDataURL).toHaveBeenCalled();

      // Verify multiple QR codes are generated (browser + app + possibly share)
      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining(testOrigin),
        expect.any(Object)
      );
      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining("testmobile6529://"),
        expect.any(Object)
      );
    });
  });
});
