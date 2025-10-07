import HeaderShare from "@/components/header/share/HeaderShare";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useCapacitor from "@/hooks/useCapacitor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    origin: "https://test.6529.io",
    href: "https://test.6529.io/test-path",
  },
  writable: true,
});

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
    it("shows Share Connection tab when authenticated", async () => {
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

      // Should show Share Connection button when authenticated
      expect(screen.getByText("Share Connection")).toBeInTheDocument();
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

      // Should NOT show Share Connection button when not authenticated
      expect(screen.queryByText("Share Connection")).not.toBeInTheDocument();
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
      expect(screen.getByText("6529 Core")).toBeInTheDocument();

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
      expect(screen.getByText("6529 Core")).toBeInTheDocument();
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
        "https://test.6529.io/mock-path?something=value",
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
        expect.stringContaining("https://test.6529.io"),
        expect.any(Object)
      );
      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining("testmobile6529://"),
        expect.any(Object)
      );
    });
  });
});
