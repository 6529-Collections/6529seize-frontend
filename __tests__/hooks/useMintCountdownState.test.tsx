import { renderHook } from "@testing-library/react";
import { useMintCountdownState } from "@/hooks/useMintCountdownState";
import { Time } from "@/helpers/time";

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: "US" }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: false }),
}));

jest.mock("@/hooks/useManifoldClaim", () => ({
  ManifoldClaimStatus: {
    UPCOMING: "upcoming",
    ACTIVE: "active",
    ENDED: "ended",
  },
  ManifoldPhase: {
    ALLOWLIST: "Allowlist",
    PUBLIC: "Public Phase",
  },
  useManifoldClaim: jest.fn(),
}));

const { useManifoldClaim, ManifoldClaimStatus, ManifoldPhase } = jest.requireMock(
  "@/hooks/useManifoldClaim"
) as {
  useManifoldClaim: jest.Mock;
  ManifoldClaimStatus: {
    UPCOMING: "upcoming";
    ACTIVE: "active";
    ENDED: "ended";
  };
  ManifoldPhase: {
    ALLOWLIST: "Allowlist";
    PUBLIC: "Public Phase";
  };
};

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(150 * 1000);
});

afterEach(() => {
  jest.restoreAllMocks();
  useManifoldClaim.mockReset();
});

test("shows the next meme phase countdown after an allowlist phase ends", () => {
  useManifoldClaim.mockReturnValue({
    claim: {
      status: ManifoldClaimStatus.ENDED,
      phase: ManifoldPhase.ALLOWLIST,
      startDate: 100,
      endDate: 140,
      isSoldOut: false,
      isFinalized: true,
      isDropComplete: false,
      nextMemePhase: {
        id: "1",
        name: "Phase 1 (Allowlist)",
        type: ManifoldPhase.ALLOWLIST,
        start: Time.seconds(200),
        end: Time.seconds(300),
      },
    },
  });

  const { result } = renderHook(() =>
    useMintCountdownState(1, {
      contract: "0x1",
      chainId: 1,
    })
  );

  expect(result.current).toEqual({
    type: "countdown",
    countdown: {
      title: "Phase 1 (Allowlist) Starts In",
      targetDate: 200,
      showAllowlistInfo: true,
      showMintBtn: true,
      isActive: false,
    },
  });
});
