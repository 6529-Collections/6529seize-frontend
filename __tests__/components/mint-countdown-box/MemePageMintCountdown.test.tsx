import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import MemePageMintCountdown from "@/components/mint-countdown-box/MemePageMintCountdown";
import { Time } from "@/helpers/time";
import useCapacitor from "@/hooks/useCapacitor";
import type {
  ManifoldClaim} from "@/hooks/useManifoldClaim";
import {
  ManifoldClaimStatus,
  ManifoldPhase,
  useMemesManifoldClaim,
} from "@/hooks/useManifoldClaim";
import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/useManifoldClaim");
jest.mock("@/hooks/useCapacitor");
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(),
}));

jest.mock("@/components/mint-countdown-box/MintCountdownBox", () => {
  return function MockMintCountdownBox(props: any) {
    const canShowMint =
      !props.small &&
      !props.hideMintBtn &&
      Boolean(props.mintInfo) &&
      Boolean(props.linkInfo);

    return (
      <div
        data-testid="mint-countdown-box"
        data-mint-title={props.mintInfo?.title ?? ""}
        data-mint-date={props.mintInfo?.date ?? ""}
        data-show-allowlist-info={
          props.mintInfo?.showAllowlistInfo ? "true" : "false"
        }
        data-is-finalized={props.mintInfo?.isFinalized ? "true" : "false"}
        data-is-ended={props.mintInfo?.isEnded ? "true" : "false"}
        data-hide-mint-btn={props.hideMintBtn ? "true" : "false"}
        data-small={props.small ? "true" : "false"}>
        {canShowMint && <button data-testid="mint-button">Mint</button>}
        {!props.mintInfo && (
          <button data-testid="skeleton" disabled>
            Skeleton
          </button>
        )}
      </div>
    );
  };
});

const mockUseMemesManifoldClaim = useMemesManifoldClaim as jest.MockedFunction<
  typeof useMemesManifoldClaim
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
  describe("Loading / Skeleton state", () => {
    it("renders MintCountdownBox with skeleton button when claim is undefined", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue(undefined);

      render(<MemePageMintCountdown nft_id={1} />);

      // MintCountdownBox is rendered
      expect(screen.getByTestId("mint-countdown-box")).toBeInTheDocument();
      // Skeleton button shows when no mintInfo
      expect(screen.getByTestId("skeleton")).toBeDisabled();
    });

    it("does not render Mint button when claim is undefined (skeleton only)", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue(undefined);

      render(<MemePageMintCountdown nft_id={1} />);

      expect(screen.queryByTestId("mint-button")).not.toBeInTheDocument();
    });
  });

  describe("Ended / Finalized flags propagation", () => {
    it("sets isEnded=true when status is ENDED", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ENDED,
        endDate: 200,
      });

      const { getByTestId } = render(<MemePageMintCountdown nft_id={1} />);

      const box = getByTestId("mint-countdown-box");
      expect(box).toHaveAttribute("data-is-ended", "true");
      // Title is still computed even if ended — current code uses "... Ends In"
      expect(box.dataset["mintTitle"]).toMatch(/Ends In$/);
      expect(box).toHaveAttribute("data-mint-date", "200");
    });

    it("sets isFinalized=true when claim is finalized", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
        isFinalized: true,
        endDate: 300,
      });

      const { getByTestId } = render(<MemePageMintCountdown nft_id={1} />);

      const box = getByTestId("mint-countdown-box");
      expect(box).toHaveAttribute("data-is-finalized", "true");
    });
  });

  describe("Active Countdown Display", () => {
    it("builds 'Starts In' title when UPCOMING", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        startDate: 90,
        endDate: 200,
        status: ManifoldClaimStatus.UPCOMING,
        phase: ManifoldPhase.PUBLIC,
      });

      const { getByTestId } = render(<MemePageMintCountdown nft_id={1} />);

      const box = getByTestId("mint-countdown-box");
      expect(box).toHaveAttribute("data-mint-title", "Public Phase Starts In");
      expect(box).toHaveAttribute("data-mint-date", "90");
    });

    it("builds 'Ends In' title when ACTIVE", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        startDate: 90,
        endDate: 200,
        status: ManifoldClaimStatus.ACTIVE,
        phase: ManifoldPhase.PUBLIC,
      });

      const { getByTestId } = render(<MemePageMintCountdown nft_id={1} />);

      const box = getByTestId("mint-countdown-box");
      expect(box).toHaveAttribute("data-mint-title", "Public Phase Ends In");
      expect(box).toHaveAttribute("data-mint-date", "200");
    });
  });

  describe("Phase Name Display", () => {
    it("uses custom meme phase name during allowlist", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      const start = Time.now();
      const end = start.plusSeconds(100);
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        phase: ManifoldPhase.ALLOWLIST,
        memePhase: {
          id: "0",
          type: ManifoldPhase.ALLOWLIST,
          start,
          end,
          name: "Custom Phase Name",
        },
        status: ManifoldClaimStatus.UPCOMING,
        startDate: 90,
      });

      const { getByTestId } = render(<MemePageMintCountdown nft_id={1} />);

      const box = getByTestId("mint-countdown-box");
      expect(box).toHaveAttribute(
        "data-mint-title",
        "Custom Phase Name Starts In"
      );
    });

    it("falls back to enum string when no custom memePhase name", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        phase: ManifoldPhase.ALLOWLIST,
        memePhase: undefined,
        status: ManifoldClaimStatus.UPCOMING,
        startDate: 90,
      });

      const { getByTestId } = render(<MemePageMintCountdown nft_id={1} />);

      const box = getByTestId("mint-countdown-box");
      expect(box).toHaveAttribute(
        "data-mint-title",
        `${ManifoldPhase.ALLOWLIST} Starts In`
      );
    });
  });

  describe("Mint Button Logic", () => {
    it("hides Mint button on iOS (non-US)", () => {
      mockUseCapacitor.mockReturnValue({ isIos: true } as any);
      mockUseCookieConsent.mockReturnValue({
        showCookieConsent: false,
        country: "CA",
        consent: jest.fn(),
        reject: jest.fn(),
      });
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
        endDate: 200,
      });

      render(<MemePageMintCountdown nft_id={1} />);

      expect(screen.queryByTestId("mint-button")).not.toBeInTheDocument();
      // also verify hide flag passed
      expect(screen.getByTestId("mint-countdown-box")).toHaveAttribute(
        "data-hide-mint-btn",
        "true"
      );
    });

    it("shows Mint button on iOS when country is US", () => {
      mockUseCapacitor.mockReturnValue({ isIos: true } as any);
      mockUseCookieConsent.mockReturnValue({
        showCookieConsent: false,
        country: "US",
        consent: jest.fn(),
        reject: jest.fn(),
      });
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
        endDate: 200,
      });

      render(<MemePageMintCountdown nft_id={1} />);

      expect(screen.getByTestId("mint-button")).toBeInTheDocument();
    });

    it("shows Mint button on non-iOS platforms", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
        endDate: 200,
      });

      render(<MemePageMintCountdown nft_id={1} />);

      expect(screen.getByTestId("mint-button")).toBeInTheDocument();
    });

    it("hides Mint button when hide_mint_btn prop is true (also sets small)", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        status: ManifoldClaimStatus.ACTIVE,
        endDate: 200,
      });

      render(<MemePageMintCountdown nft_id={1} hide_mint_btn={true} />);

      const box = screen.getByTestId("mint-countdown-box");
      expect(box).toHaveAttribute("data-hide-mint-btn", "true");
      expect(box).toHaveAttribute("data-small", "true");
      expect(screen.queryByTestId("mint-button")).not.toBeInTheDocument();
    });
  });

  describe("Allowlist Info flag", () => {
    it("sets showAllowlistInfo=true when in allowlist phase", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        phase: ManifoldPhase.ALLOWLIST,
        status: ManifoldClaimStatus.ACTIVE,
        endDate: 200,
      });

      const { getByTestId } = render(<MemePageMintCountdown nft_id={1} />);

      expect(getByTestId("mint-countdown-box")).toHaveAttribute(
        "data-show-allowlist-info",
        "true"
      );
    });

    it("sets showAllowlistInfo=false when not in allowlist phase", () => {
      mockUseCapacitor.mockReturnValue({ isIos: false } as any);
      mockUseMemesManifoldClaim.mockReturnValue({
        ...baseClaim,
        phase: ManifoldPhase.PUBLIC,
        status: ManifoldClaimStatus.ACTIVE,
        endDate: 200,
      });

      const { getByTestId } = render(<MemePageMintCountdown nft_id={1} />);

      expect(getByTestId("mint-countdown-box")).toHaveAttribute(
        "data-show-allowlist-info",
        "false"
      );
    });
  });
});
