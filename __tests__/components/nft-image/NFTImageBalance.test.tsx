import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock the hooks
jest.mock("@/hooks/useNftBalance");
jest.mock("@/components/auth/Auth");

// Mock the SCSS module
jest.mock("@/components/nft-image/NFTImage.module.scss", () => ({
  balance: "balance",
  balanceBigger: "balanceBigger",
}));

import { useAuth } from "@/components/auth/Auth";
import { useNftBalance } from "@/hooks/useNftBalance";

const mockUseNftBalance = useNftBalance as jest.MockedFunction<
  typeof useNftBalance
>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("NFTImageBalance", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mocks
    mockUseNftBalance.mockReset();
    mockUseAuth.mockReset();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  const defaultProps = {
    contract: "0x1234567890123456789012345678901234567890",
    tokenId: 123,
    height: 300 as const,
  };

  describe("When user is not logged in", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null,
      } as any);

      mockUseNftBalance.mockReturnValue({
        balance: 0,
        isLoading: false,
        error: null,
      });
    });

    it("renders nothing when user is not connected", () => {
      const { container } = renderWithProviders(
        <NFTImageBalance {...defaultProps} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("calls useNftBalance with null consolidationKey when user is not connected", () => {
      renderWithProviders(<NFTImageBalance {...defaultProps} />);
      expect(mockUseNftBalance).toHaveBeenCalledWith({
        consolidationKey: null,
        contract: defaultProps.contract,
        tokenId: defaultProps.tokenId,
      });
    });
  });

  describe("When user is logged in", () => {
    const mockProfile = {
      consolidation_key: "test-consolidation-key-123",
      handle: "testuser",
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        connectedProfile: mockProfile,
      } as any);
    });

    describe("SEIZED state rendering", () => {
      it("renders SEIZED with quantity when balance is positive", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 5,
          isLoading: false,
          error: null,
        });
        renderWithProviders(<NFTImageBalance {...defaultProps} />);
        expect(screen.getByText("SEIZED x5")).toBeInTheDocument();
      });

      it("renders with correct CSS classes for different heights", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 1,
          isLoading: false,
          error: null,
        });

        const { rerender, container } = renderWithProviders(
          <NFTImageBalance {...defaultProps} height={300} />
        );

        let outerSpan = container.querySelector("span");
        expect(outerSpan).toHaveClass("balance");
        expect(outerSpan).not.toHaveClass("balanceBigger");

        rerender(
          <QueryClientProvider client={queryClient}>
            <NFTImageBalance {...defaultProps} height={650} />
          </QueryClientProvider>
        );

        outerSpan = container.querySelector("span");
        expect(outerSpan).toHaveClass("balance");
        expect(outerSpan).toHaveClass("balanceBigger");

        rerender(
          <QueryClientProvider client={queryClient}>
            <NFTImageBalance {...defaultProps} height="full" />
          </QueryClientProvider>
        );

        outerSpan = container.querySelector("span");
        expect(outerSpan).toHaveClass("balance");
        expect(outerSpan).not.toHaveClass("balanceBigger");
      });

      it("handles large balance numbers correctly", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 999999,
          isLoading: false,
          error: null,
        });
        renderWithProviders(<NFTImageBalance {...defaultProps} />);
        expect(screen.getByText("SEIZED x999999")).toBeInTheDocument();
      });
    });

    describe("UNSEIZED state rendering", () => {
      it("renders UNSEIZED when balance is 0", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: null,
        });
        renderWithProviders(<NFTImageBalance {...defaultProps} />);
        expect(screen.getByText("UNSEIZED")).toBeInTheDocument();
        expect(screen.queryByText("SEIZED")).not.toBeInTheDocument();
      });

      it("renders UNSEIZED with correct CSS classes", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: null,
        });
        const { container } = renderWithProviders(
          <NFTImageBalance {...defaultProps} />
        );
        const unseizedElement = container.querySelector("span");
        expect(unseizedElement).toHaveClass("balance");
        expect(unseizedElement).not.toHaveClass("balanceBigger");
        expect(screen.getByText("UNSEIZED")).toBeInTheDocument();
      });
    });

    describe("Loading state rendering", () => {
      it("renders loading dots when isLoading is true", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: true,
          error: null,
        });
        renderWithProviders(<NFTImageBalance {...defaultProps} />);
        expect(screen.getByText("...")).toBeInTheDocument();
        expect(screen.queryByText("SEIZED")).not.toBeInTheDocument();
        expect(screen.queryByText("UNSEIZED")).not.toBeInTheDocument();
      });

      it("renders loading dots with correct CSS classes", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: true,
          error: null,
        });
        const { container } = renderWithProviders(
          <NFTImageBalance {...defaultProps} />
        );
        const loadingElement = container.querySelector("span");
        expect(loadingElement).toHaveClass("balance");
        expect(loadingElement).not.toHaveClass("balanceBigger");
        expect(screen.getByText("...")).toBeInTheDocument();
      });
    });

    describe("Error handling", () => {
      it("logs error and renders N/A when useNftBalance has error", () => {
        const consoleSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const mockError = new Error("Failed to fetch balance");

        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: mockError,
        });
        renderWithProviders(<NFTImageBalance {...defaultProps} />);

        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to fetch NFT balance:",
          mockError
        );
        expect(screen.getByText("N/A")).toBeInTheDocument();

        consoleSpy.mockRestore();
      });
    });

    describe("Priority logic", () => {
      it("prioritizes SEIZED when balance is positive", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 1,
          isLoading: false,
          error: null,
        });
        renderWithProviders(<NFTImageBalance {...defaultProps} />);
        expect(screen.getByText("SEIZED x1")).toBeInTheDocument();
        expect(screen.queryByText("UNSEIZED")).not.toBeInTheDocument();
      });
    });

    describe("Hook integration", () => {
      it("calls useNftBalance with correct parameters", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: null,
        });

        renderWithProviders(<NFTImageBalance {...defaultProps} />);

        expect(mockUseNftBalance).toHaveBeenCalledWith({
          consolidationKey: mockProfile.consolidation_key,
          contract: defaultProps.contract,
          tokenId: defaultProps.tokenId,
        });
      });

      it("handles undefined consolidation_key gracefully", () => {
        mockUseAuth.mockReturnValue({
          connectedProfile: { ...mockProfile, consolidation_key: undefined },
        } as any);

        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: null,
        });

        renderWithProviders(<NFTImageBalance {...defaultProps} />);

        expect(mockUseNftBalance).toHaveBeenCalledWith({
          consolidationKey: null,
          contract: defaultProps.contract,
          tokenId: defaultProps.tokenId,
        });
      });
    });

    describe("Component structure", () => {
      it("renders a single span for SEIZED state", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 5,
          isLoading: false,
          error: null,
        });
        const { container } = renderWithProviders(
          <NFTImageBalance {...defaultProps} />
        );
        const spans = container.querySelectorAll("span");
        expect(spans).toHaveLength(1);
        const outerSpan = spans[0];
        expect(outerSpan).toHaveClass("balance");
        expect(outerSpan).toHaveTextContent("SEIZED x5");
      });

      it("applies balanceBigger class when height is 650", () => {
        mockUseNftBalance.mockReturnValue({
          balance: 3,
          isLoading: false,
          error: null,
        });
        const { container } = renderWithProviders(
          <NFTImageBalance {...defaultProps} height={650} />
        );
        const outerSpan = container.querySelector("span.balance.balanceBigger");
        expect(outerSpan).toBeInTheDocument();
        expect(outerSpan).toHaveTextContent("SEIZED x3");
      });
    });
  });
});
