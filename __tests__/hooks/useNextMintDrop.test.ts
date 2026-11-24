import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type PropsWithChildren } from "react";
import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useWaveById } from "@/hooks/useWaveById";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecisionsPage } from "@/generated/models/ApiWaveDecisionsPage";
import { fetchWaveDecisionsV2 } from "@/services/api/wave-decisions-v2-api";

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    seizeSettings: { memes_wave_id: "main-stage" },
    isLoaded: true,
    loadError: null,
  }),
}));
jest.mock("@/hooks/useWaveById", () => ({ useWaveById: jest.fn() }));
jest.mock("@/services/api/wave-decisions-v2-api", () => ({
  fetchWaveDecisionsV2: jest.fn(),
}));

const waveMock = jest.mocked(useWaveById);
const fetchDecisionsMock = jest.mocked(fetchWaveDecisionsV2);
const emptyPage: ApiWaveDecisionsPage = {
  page: 1,
  count: 0,
  next: false,
  data: [],
};

function createQueryWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

beforeEach(() => {
  fetchDecisionsMock.mockReset().mockResolvedValue(emptyPage);
});

it.each([
  ["main-stage", 123456, 123456],
  ["main-stage", null, null],
  ["previous-wave", 123456, null],
  [null, null, null],
])(
  "uses only the current wave's existing schedule (%s, %s)",
  (id, time, expected) => {
    waveMock.mockReturnValue({
      wave: id
        ? ({ id, wave: { next_decision_time: time } } as ApiWave)
        : undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    } as ReturnType<typeof useWaveById>);
    const { result } = renderHook(useNextMintDrop, {
      wrapper: createQueryWrapper(),
    });
    expect(result.current.nextDecisionTime).toBe(expected);
    expect(result.current.nextMint).toBeNull();
    expect(result.current.isReady).toBe(true);
  }
);

it("waits for the homepage request even when an older shared request completes", async () => {
  waveMock.mockReturnValue({
    wave: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    isFetching: false,
  });
  const sharedRequest = createDeferredPromise<ApiWaveDecisionsPage>();
  const homepageRequest = createDeferredPromise<ApiWaveDecisionsPage>();
  fetchDecisionsMock
    .mockReturnValueOnce(sharedRequest.promise)
    .mockReturnValueOnce(homepageRequest.promise);
  const wrapper = createQueryWrapper();
  const shared = renderHook(useNextMintDrop, { wrapper });
  await waitFor(() => expect(fetchDecisionsMock).toHaveBeenCalledTimes(1));

  const homepage = renderHook(
    () => useNextMintDrop({ winnerRequestScope: "homepage:536" }),
    { wrapper }
  );
  await waitFor(() => expect(fetchDecisionsMock).toHaveBeenCalledTimes(2));
  expect(fetchDecisionsMock).toHaveBeenLastCalledWith(
    expect.objectContaining({ cache: "no-store" })
  );

  await act(async () => sharedRequest.resolve(emptyPage));
  await waitFor(() =>
    expect(shared.result.current.isFetchedAfterMount).toBe(true)
  );
  expect(homepage.result.current.isFetchedAfterMount).toBe(false);
  expect(homepage.result.current.isLoading).toBe(true);

  await act(async () => homepageRequest.resolve(emptyPage));
  await waitFor(() =>
    expect(homepage.result.current.isFetchedAfterMount).toBe(true)
  );
});
