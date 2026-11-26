import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReadonlyURLSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { PhoneNavigationScreenContext } from "@/contexts/PhoneNavigationScreenContext";
import { useActiveWaveVotes } from "@/hooks/useActiveWaveVotes";
import { useWaveDiscoveryViewer } from "@/hooks/useWaveDiscoveryViewer";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/hooks/useWaveDiscoveryViewer");
jest.mock("@/services/api/common-api");
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { ACTIVE_WAVE_VOTES: "ACTIVE_WAVE_VOTES" },
}));

let client: QueryClient;
let screenActive: boolean;
const searchParams = new ReadonlyURLSearchParams("");
const page = { count: 0, data: [], page: 1, next: false };

function Wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <PhoneNavigationScreenContext.Provider
        value={{ pathname: "/waves", searchParams, active: screenActive }}
      >
        {children}
      </PhoneNavigationScreenContext.Provider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  screenActive = true;
  jest.mocked(useWaveDiscoveryViewer).mockReturnValue({
    key: "guest",
    enabled: true,
    canUseCollections: false,
  });
  jest.mocked(commonApiFetch).mockResolvedValue(page);
});

afterEach(() => {
  client.clear();
  jest.useRealTimers();
});

it("pauses hidden-list polling, retains cached rows, and refreshes on return", async () => {
  const { result, rerender } = renderHook(() => useActiveWaveVotes(), {
    wrapper: Wrapper,
  });
  await waitFor(() => expect(result.current.data?.pages).toEqual([page]));
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(commonApiFetch).toHaveBeenCalledTimes(2);

  screenActive = false;
  rerender();
  const cached = result.current.data;
  await act(async () => jest.advanceTimersByTimeAsync(180_000));
  expect(commonApiFetch).toHaveBeenCalledTimes(2);
  expect(result.current.data).toBe(cached);

  screenActive = true;
  rerender();
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(3));
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(commonApiFetch).toHaveBeenCalledTimes(4);
});

it("does not fetch for a retained list that starts inactive", async () => {
  screenActive = false;
  const { rerender } = renderHook(() => useActiveWaveVotes(), {
    wrapper: Wrapper,
  });
  await act(async () => jest.advanceTimersByTimeAsync(180_000));
  expect(commonApiFetch).not.toHaveBeenCalled();
  screenActive = true;
  rerender();
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(1));
});

it("keeps discovery polling enabled outside a retained navigation screen", async () => {
  renderHook(() => useActiveWaveVotes(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(1));
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(commonApiFetch).toHaveBeenCalledTimes(2);
});

it("preserves viewer authorization when the list becomes active", async () => {
  jest.mocked(useWaveDiscoveryViewer).mockReturnValue({
    key: "guest",
    enabled: false,
    canUseCollections: false,
  });
  screenActive = false;
  const { rerender } = renderHook(() => useActiveWaveVotes(), {
    wrapper: Wrapper,
  });
  screenActive = true;
  rerender();
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(commonApiFetch).not.toHaveBeenCalled();
});
