import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import { useNowMinting } from "@/hooks/useNowMinting";
import { useManifoldClaim } from "@/hooks/useManifoldClaim";
import { renderHook } from "@testing-library/react";

jest.mock("@/hooks/useNowMinting", () => ({ useNowMinting: jest.fn() }));
jest.mock("@/hooks/useManifoldClaim", () => ({
  useManifoldClaim: jest.fn(),
}));

beforeEach(() => {
  (useNowMinting as jest.Mock).mockReturnValue({
    nft: { id: 563 },
    isFetching: false,
    error: null,
    refetch: jest.fn(),
  });
});

it("does not apply the previous card's completion status to a new latest card", () => {
  (useManifoldClaim as jest.Mock).mockReturnValue({
    claim: { identifier: 562, isDropComplete: true, status: "ended" },
    isError: false,
  });
  const { result } = renderHook(useNowMintingStatus);
  expect(result.current.isDropComplete).toBe(false);
  expect(result.current.status).toBeNull();
  expect(result.current.isStatusLoading).toBe(true);
});

it("settles initial status loading when the claim request fails", () => {
  (useManifoldClaim as jest.Mock).mockReturnValue({
    claim: undefined,
    isError: true,
  });
  const { result } = renderHook(useNowMintingStatus);
  expect(result.current.isStatusLoading).toBe(false);
  expect(result.current.isStatusError).toBe(true);
  expect(result.current.isDropComplete).toBe(false);
});

it("holds tentative allowlist completion until the phase has been checked", () => {
  (useManifoldClaim as jest.Mock).mockReturnValue({
    claim: { identifier: 563, isDropComplete: true, status: "ended" },
    isCompletionPending: true,
    isError: false,
  });

  const { result } = renderHook(useNowMintingStatus);
  expect(result.current.isStatusLoading).toBe(true);
  expect(result.current.status).toBeNull();
  expect(result.current.isDropComplete).toBe(false);
});
