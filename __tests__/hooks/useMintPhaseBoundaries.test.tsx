import { act, renderHook } from "@testing-library/react";
import { useReadContract } from "wagmi";
import { MEMES_CONTRACT, NULL_MERKLE } from "@/constants/constants";
import { Time } from "@/helpers/time";
import { buildMemesPhases, useManifoldClaim } from "@/hooks/useManifoldClaim";
import { useMintCountdownState } from "@/hooks/useMintCountdownState";
import { getMemesMintingRoots } from "@/services/api/memes-minting-claims-api";

jest.mock("wagmi", () => ({ useReadContract: jest.fn() }));
jest.mock("@/services/api/memes-minting-claims-api", () => ({
  getMemesMintingRoots: jest.fn(),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: "US" }),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: false }),
}));

const mockRead = useReadContract as jest.Mock;
const mockRoots = jest.mocked(getMemesMintingRoots);
const refetch = jest.fn();
const options = { chainId: 1, contract: "0x1" };

function readData(
  start: number,
  end: number,
  merkleRoot = NULL_MERKLE,
  total = 1n
) {
  return [
    3n,
    {
      startDate: BigInt(start),
      endDate: BigInt(end),
      total,
      totalMax: 10n,
      merkleRoot,
    },
  ] as const;
}

function mockClaim(data: ReturnType<typeof readData>) {
  // Keep the exact same data reference, as unchanged background reads do.
  mockRead.mockReturnValue({ data, isFetching: false, error: null, refetch });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(149_500);
  mockRoots.mockResolvedValue([]);
  refetch.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("switches upcoming to live and then complete at the exact boundaries with unchanged data", () => {
  mockClaim(readData(150, 200));
  const { result } = renderHook(() => useMintCountdownState(1, options));
  expect(result.current).toMatchObject({
    type: "countdown",
    countdown: {
      title: "Public Phase Starts In",
      targetDate: 150,
      isActive: false,
    },
  });

  act(() => jest.advanceTimersByTime(499));
  expect(result.current).toMatchObject({ countdown: { isActive: false } });
  act(() => jest.advanceTimersByTime(1));
  expect(result.current).toMatchObject({
    type: "countdown",
    countdown: {
      title: "Public Phase Ends In",
      targetDate: 200,
      isActive: true,
    },
  });

  act(() => jest.advanceTimersByTime(49_999));
  expect(result.current).toMatchObject({ countdown: { isActive: true } });
  act(() => jest.advanceTimersByTime(1));
  expect(result.current).toEqual({ type: "finalized" });
  expect(refetch).not.toHaveBeenCalled();
});

test("advances an ended allowlist to the next phase and waits for its onchain configuration", async () => {
  const [phase0, phase1] = buildMemesPhases(
    Time.fromString("2024-07-03T00:00:00Z")
  );
  jest.setSystemTime(phase0.start.toMillis() - 500);
  mockClaim(
    readData(
      phase0.start.toSeconds(),
      phase0.end.toSeconds(),
      `0x${"1".repeat(64)}`
    )
  );
  const { result, rerender } = renderHook(() =>
    useMintCountdownState(1, { ...options, contract: MEMES_CONTRACT })
  );
  await act(async () => {
    await Promise.resolve();
  });
  expect(result.current).toMatchObject({
    countdown: { title: "Phase 0 (Allowlist) Starts In", isActive: false },
  });

  act(() => jest.advanceTimersByTime(500));
  expect(result.current).toMatchObject({
    countdown: { title: "Phase 0 (Allowlist) Ends In", isActive: true },
  });
  act(() =>
    jest.advanceTimersByTime(phase0.end.toMillis() - phase0.start.toMillis())
  );
  expect(result.current).toMatchObject({
    countdown: {
      title: "Phase 1 (Allowlist) Starts In",
      targetDate: phase1.start.toSeconds(),
      isActive: false,
      showMintBtn: true,
    },
  });

  act(() =>
    jest.advanceTimersByTime(phase1.start.toMillis() - phase0.end.toMillis())
  );
  expect(result.current).toMatchObject({ countdown: { isActive: false } });
  act(() => jest.advanceTimersByTime(1000));
  expect(result.current).toMatchObject({
    countdown: { isActive: false, showMintBtn: false },
  });
  mockClaim(
    readData(
      phase1.start.toSeconds(),
      phase1.end.toSeconds(),
      `0x${"2".repeat(64)}`
    )
  );
  rerender();
  expect(result.current).toMatchObject({
    countdown: {
      title: "Phase 1 (Allowlist) Ends In",
      targetDate: phase1.end.toSeconds(),
      isActive: true,
      showMintBtn: true,
    },
  });
});

test("catches up after hidden time and cancels boundary timers on unmount", () => {
  let visibility = "visible";
  jest
    .spyOn(document, "visibilityState", "get")
    .mockImplementation(() => visibility as DocumentVisibilityState);
  mockClaim(readData(150, 200));
  const { result, unmount } = renderHook(() =>
    useManifoldClaim({ ...options, proxy: "0x2", abi: [], identifier: 1 })
  );
  expect(jest.getTimerCount()).toBe(1);

  visibility = "hidden";
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(jest.getTimerCount()).toBe(0);
  jest.setSystemTime(175_000);
  visibility = "visible";
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(result.current.claim?.status).toBe("active");
  expect(jest.getTimerCount()).toBe(1);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

test("reschedules when the contract changes its timing and clears the old boundary", () => {
  mockClaim(readData(150, 200));
  const { result, rerender } = renderHook(() =>
    useMintCountdownState(1, options)
  );
  mockClaim(readData(180, 240));
  rerender();
  act(() => jest.advanceTimersByTime(30_499));
  expect(result.current).toMatchObject({
    countdown: { targetDate: 180, isActive: false },
  });
  act(() => jest.advanceTimersByTime(1));
  expect(result.current).toMatchObject({
    countdown: { targetDate: 240, isActive: true },
  });
});

test("sold-out data takes precedence and leaves no phase timer", () => {
  mockClaim(readData(150, 200, NULL_MERKLE, 10n));
  const { result } = renderHook(() =>
    useManifoldClaim({ ...options, proxy: "0x2", abi: [], identifier: 1 })
  );
  expect(result.current.claim?.isSoldOut).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
});
