import { render, screen } from "@testing-library/react";
import MemePageMintCountdown from "@/components/the-memes/MemePageMintCountdown";
import {
  useManifoldClaim,
  ManifoldClaim,
  ManifoldClaimStatus,
  ManifoldPhase,
} from "@/hooks/useManifoldClaim";
import useCapacitor from "@/hooks/useCapacitor";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";

jest.mock("@/hooks/useManifoldClaim");
jest.mock("@/hooks/useCapacitor");
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(),
}));

// Mock MintCountdownBox to isolate MemePageMintCountdown behavior
jest.mock("@/components/mintCountdownBox/MintCountdownBox", () => {
  return function MockMintCountdownBox(props: any) {
    return (
      <div data-testid="mint-countdown-box">
        <div data-testid="countdown-title">{props.title}</div>
        <div data-testid="countdown-date">{props.date}</div>
        {!props.hide_mint_btn && props.buttons?.map((btn: any, index: number) => (
          <button key={index} data-testid="mint-button">
            {btn.label}
          </button>
        ))}
      </div>
    );
  };
});

const mockUseManifoldClaim = useManifoldClaim as jest.MockedFunction<
  typeof useManifoldClaim
>;
const mockUseCapacitor = useCapacitor as jest.MockedFunction<
  typeof useCapacitor
>;
const mockUseCookieConsent = useCookieConsent as jest.MockedFunction<
  typeof useCookieConsent
>;

const baseClaim: ManifoldClaim = {
  instanceId: 1,
  total: 0,
  totalMax: 10,
  remaining: 10,
  cost: 0,
  startDate: 0,
  endDate: 0,
  status: ManifoldClaimStatus.UPCOMING,
  phase: ManifoldPhase.PUBLIC,
  memePhase: undefined,
  isFetching: false,
  isFinalized: false,
};

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(0));
  mockUseCookieConsent.mockReturnValue({
    showCookieConsent: false,
    country: "US",
    consent: jest.fn(),
    reject: jest.fn(),
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("MemePageMintCountdown", () => {
  describe("Loading State", () => {
    it("shows skeleton loading state when manifoldClaim is null", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue(null);

      const { container } = render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(container.querySelector("[class*='loadingState']")).toBeInTheDocument();
      expect(container.querySelector("[class*='skeletonText']")).toBeInTheDocument();
      expect(screen.queryByTestId("mint-countdown-box")).not.toBeInTheDocument();
    });

    it("shows skeleton button when not hiding mint button", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue(null);

      const { container } = render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(container.querySelector("[class*='skeletonButton']")).toBeInTheDocument();
    });

    it("hides skeleton button when hide_mint_btn is true", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue(null);

      const { container } = render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={true}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(container.querySelector("[class*='skeletonButton']")).not.toBeInTheDocument();
    });
  });

  describe("Ended State", () => {
    it("shows mint phase complete message when status is ENDED", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ENDED,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.getByText("Mint Phase Complete")).toBeInTheDocument();
      expect(screen.getByText("This mint phase has ended.")).toBeInTheDocument();
      expect(screen.getByText("Thank you for participating!")).toBeInTheDocument();
      expect(screen.queryByTestId("mint-countdown-box")).not.toBeInTheDocument();
    });
  });

  describe("Finalized State", () => {
    it("shows sold out message when isFinalized is true", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
        isFinalized: true,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.getByText("✅ Mint Complete - Sold Out!")).toBeInTheDocument();
      expect(screen.getByText("All NFTs have been successfully minted.")).toBeInTheDocument();
      expect(screen.getByText("Thank you for participating!")).toBeInTheDocument();
      expect(screen.queryByTestId("mint-countdown-box")).not.toBeInTheDocument();
    });
  });

  describe("Active Countdown Display", () => {
    it("shows start countdown when upcoming", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        startDate: 90,
        endDate: 200,
        status: ManifoldClaimStatus.UPCOMING,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.getByTestId("countdown-title")).toHaveTextContent("Public Phase Starts In");
      expect(screen.getByTestId("countdown-date")).toHaveTextContent("90");
    });

    it("shows end countdown when active", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        startDate: 90,
        endDate: 200,
        status: ManifoldClaimStatus.ACTIVE,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.getByTestId("countdown-title")).toHaveTextContent("Public Phase Ends In");
      expect(screen.getByTestId("countdown-date")).toHaveTextContent("200");
    });
  });

  describe("Phase Name Display", () => {
    it("shows custom meme phase name when in allowlist phase with memePhase", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        phase: ManifoldPhase.ALLOWLIST,
        memePhase: { name: "Custom Phase Name" },
        status: ManifoldClaimStatus.UPCOMING,
        startDate: 90,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.getByTestId("countdown-title")).toHaveTextContent("Custom Phase Name Starts In");
    });

    it("shows phase enum value when no custom memePhase name", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        phase: ManifoldPhase.ALLOWLIST,
        memePhase: undefined,
        status: ManifoldClaimStatus.UPCOMING,
        startDate: 90,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.getByTestId("countdown-title")).toHaveTextContent(`${ManifoldPhase.ALLOWLIST} Starts In`);
    });
  });

  describe("Mint Button Logic", () => {
    it("hides Mint button on iOS (non-US)", () => {
      mockUseCapacitor.mockReturnValue({ isIos: true } as any);
      mockUseCookieConsent.mockReturnValue({
        showCookieConsent: false,
        country: "CA", // Non-US country
        consent: jest.fn(),
        reject: jest.fn(),
      });
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.queryByTestId("mint-button")).not.toBeInTheDocument();
    });

    it("shows Mint button on iOS when country is US", () => {
      mockUseCapacitor.mockReturnValue({ isIos: true } as any);
      mockUseCookieConsent.mockReturnValue({
        showCookieConsent: false,
        country: "US",
        consent: jest.fn(),
        reject: jest.fn(),
      });
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.getByTestId("mint-button")).toBeInTheDocument();
      expect(screen.getByTestId("mint-button")).toHaveTextContent("Mint");
    });

    it("shows Mint button on non-iOS platforms", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.getByTestId("mint-button")).toBeInTheDocument();
      expect(screen.getByTestId("mint-button")).toHaveTextContent("Mint");
    });

    it("hides Mint button when hide_mint_btn prop is true", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={true}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.queryByTestId("mint-button")).not.toBeInTheDocument();
    });
  });

  describe("Allowlist Info Tooltip", () => {
    it("shows info icon with tooltip when in allowlist phase", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        phase: ManifoldPhase.ALLOWLIST,
        status: ManifoldClaimStatus.ACTIVE,
      });

      const { container } = render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      // Check for FontAwesome info icon
      const infoIcon = container.querySelector('[data-icon="circle-info"]');
      expect(infoIcon).toBeInTheDocument();
      expect(infoIcon).toHaveAttribute('data-tooltip-id', 'allowlist-info');
      expect(infoIcon).toHaveAttribute(
        'data-tooltip-content', 
        'The timer displays the current time remaining for a specific phase of the drop. Please refer to the distribution plan to check if you are in the allowlist.'
      );
    });

    it("does not show info icon when not in allowlist phase", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        phase: ManifoldPhase.PUBLIC,
        status: ManifoldClaimStatus.ACTIVE,
      });

      const { container } = render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      const infoIcon = container.querySelector('[data-icon="circle-info"]');
      expect(infoIcon).not.toBeInTheDocument();
    });
  });

  describe("setClaim Callback", () => {
    it("calls setClaim with manifoldClaim when provided", () => {
      const setClaim = jest.fn();
      const mockClaim = {
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
      };
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue(mockClaim);

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
          setClaim={setClaim}
        />
      );

      expect(setClaim).toHaveBeenCalledWith(mockClaim);
    });

    it("does not call setClaim when not provided", () => {
      const mockClaim = {
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
      };
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue(mockClaim);

      expect(() => {
        render(
          <MemePageMintCountdown 
            nft_id={1} 
            hide_mint_btn={false}
            is_full_width={false}
            show_only_if_active={false}
          />
        );
      }).not.toThrow();
    });

    it("does not call setClaim when manifoldClaim is null", () => {
      const setClaim = jest.fn();
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue(null);

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
          setClaim={setClaim}
        />
      );

      expect(setClaim).not.toHaveBeenCalled();
    });
  });

  describe("Show Only If Active Logic", () => {
    it("returns null when show_only_if_active is true and status is not ACTIVE", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.UPCOMING,
      });

      const { container } = render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("returns null when show_only_if_active is true and status is ENDED", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ENDED,
      });

      const { container } = render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders component when show_only_if_active is true and status is ACTIVE", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={true}
        />
      );

      expect(screen.getByTestId("mint-countdown-box")).toBeInTheDocument();
    });

    it("renders component regardless of status when show_only_if_active is false", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.UPCOMING,
      });

      render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );

      expect(screen.getByTestId("mint-countdown-box")).toBeInTheDocument();
    });
  });

  describe("Layout Props", () => {
    it("passes is_full_width prop to MintCountdownBox", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
      });

      const { rerender } = render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );
      expect(screen.getByTestId("mint-countdown-box")).toBeInTheDocument();

      rerender(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={true}
          show_only_if_active={false}
        />
      );
      expect(screen.getByTestId("mint-countdown-box")).toBeInTheDocument();
    });

    it("applies correct Bootstrap column classes based on is_full_width", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseManifoldClaim.mockReturnValue(null);

      const { container, rerender } = render(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={false}
        />
      );
      let colElement = container.querySelector(".col");
      expect(colElement).toBeInTheDocument();

      rerender(
        <MemePageMintCountdown 
          nft_id={1} 
          hide_mint_btn={false}
          is_full_width={true}
          show_only_if_active={false}
        />
      );
      colElement = container.querySelector(".col");
      expect(colElement).toBeInTheDocument();
    });
  });
});
