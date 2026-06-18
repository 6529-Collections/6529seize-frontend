import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWaveRepAllocation } from "@/hooks/useWaveRepAllocation";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const api = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;
const calls = (endpoint: string) =>
  api.mock.calls.filter(([request]) => request.endpoint === endpoint).length;
const auth = {
  activeProfileProxy: null,
  connectedProfile: { handle: "Tester" },
} as any;

beforeEach(() => {
  jest.clearAllMocks();
});

test("Wave REP allocation prefix invalidation refetches rating and credit", async () => {
  api.mockImplementation(async ({ endpoint }) =>
    endpoint === "ratings/credit"
      ? ({ wave_rep_credit: 50 } as any)
      : ({ rating: 7 } as any)
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );

  renderHook(
    () => useWaveRepAllocation({ waveId: "wave-1", category: "quality" }),
    { wrapper }
  );
  await waitFor(() => expect(calls("waves/wave-1/rep/rating")).toBe(1));
  expect(
    queryClient.getQueryData([
      QueryKey.WAVE_REP_RATING,
      { waveId: "wave-1", rater: "tester", category: "quality" },
    ])
  ).toEqual({ rating: 7 });
  expect(api).toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: "waves/wave-1/rep/rating",
      params: {
        category: "quality",
        from_identity: "tester",
      },
    })
  );

  await act(async () => {
    await queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVE_REP_RATING],
    });
  });
  await waitFor(() => expect(calls("waves/wave-1/rep/rating")).toBe(2));
  expect(calls("ratings/credit")).toBe(1);

  await act(async () => {
    await queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVE_REP_CREDIT],
    });
  });
  await waitFor(() => expect(calls("ratings/credit")).toBe(2));
});

test("Wave REP allocation waits for connected profile before fetching rating", async () => {
  let authValue = {
    activeProfileProxy: null,
    connectedProfile: null,
  } as any;
  api.mockImplementation(async ({ endpoint }) =>
    endpoint === "ratings/credit"
      ? ({ wave_rep_credit: 25 } as any)
      : ({ rating: 3 } as any)
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );

  const { rerender } = renderHook(
    () => useWaveRepAllocation({ waveId: "wave-1", category: "quality" }),
    { wrapper }
  );

  expect(api).not.toHaveBeenCalled();

  authValue = {
    activeProfileProxy: null,
    connectedProfile: { handle: " Tester " },
  } as any;
  rerender();

  await waitFor(() => expect(calls("waves/wave-1/rep/rating")).toBe(1));
  expect(api).toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: "waves/wave-1/rep/rating",
      params: {
        category: "quality",
        from_identity: "tester",
      },
    })
  );
});

test("Wave REP allocation does not fetch while acting as proxy", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          activeProfileProxy: { id: "proxy-1" },
          connectedProfile: { handle: "Tester" },
        }}
      >
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  renderHook(
    () => useWaveRepAllocation({ waveId: "wave-1", category: "quality" }),
    { wrapper }
  );

  expect(api).not.toHaveBeenCalled();
});
