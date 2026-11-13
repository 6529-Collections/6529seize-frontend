import { AuthContext } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useContext, type ReactNode } from "react";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
const fetchApi = jest.mocked(commonApiFetch);
const profile = { handle: "target", query: "target" } as ApiIdentity;
const connectedProfile = { handle: "viewer" } as ApiIdentity;
const proxy = {
  created_by: { handle: "grantor" },
  actions: [
    { action_type: "ALLOCATE_REP", credit_amount: 50, credit_spent: 10 },
  ],
} as ApiProfileProxy;

function setup(activeProfileProxy: ApiProfileProxy | null = null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  function Wrapper({ children }: { readonly children: ReactNode }) {
    const defaults = useContext(AuthContext);
    return (
      <QueryClientProvider client={client}>
        <AuthContext.Provider
          value={{ ...defaults, connectedProfile, activeProfileProxy }}
        >
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }
  const snapshots: ReturnType<typeof useRepAllocation>[] = [];
  const hook = renderHook(
    ({ target }) => {
      const state = useRepAllocation({ profile: target, category: "Artist" });
      snapshots.push(state);
      return state;
    },
    { wrapper: Wrapper, initialProps: { target: profile } }
  );
  return { ...hook, client, snapshots };
}

beforeEach(() => jest.resetAllMocks());

it("keeps allowance caches separate for identities without handles", async () => {
  fetchApi.mockResolvedValueOnce({
    rep_rates_left_for_rater: 80,
    rating_stats: [],
  });
  const { result, rerender } = setup();
  await waitFor(() => expect(result.current.heroAvailableRep).toBe(80));
  fetchApi.mockResolvedValueOnce({
    rep_rates_left_for_rater: 30,
    rating_stats: [],
  });
  rerender({ target: { handle: null, query: "0xAbC" } as ApiIdentity });
  await waitFor(() => expect(result.current.heroAvailableRep).toBe(30));
  fetchApi.mockResolvedValueOnce({
    rep_rates_left_for_rater: 50,
    rating_stats: [],
  });
  rerender({ target: { handle: null, display: "0xDeF" } as ApiIdentity });
  await waitFor(() => expect(result.current.heroAvailableRep).toBe(50));
  expect(fetchApi).toHaveBeenLastCalledWith({
    endpoint: "profiles/0xdef/rep/ratings/received",
    params: { rater: "viewer" },
    signal: expect.any(AbortSignal),
  });
});

it.each([20, -20])(
  "preserves non-proxy limits for an existing contribution of %s",
  async (contribution) => {
    fetchApi.mockResolvedValue({
      rep_rates_left_for_rater: 80,
      rating_stats: [{ category: "Artist", rater_contribution: contribution }],
    });
    const { result } = setup();
    await waitFor(() =>
      expect(result.current.minMaxValues).toEqual({ min: -100, max: 100 })
    );
    expect(result.current.repState?.rater_contribution).toBe(contribution);
    expect(result.current.isError).toBe(false);
  }
);

it("uses zero contribution for a category absent from loaded ratings", async () => {
  fetchApi.mockResolvedValue({
    rep_rates_left_for_rater: 80,
    rating_stats: [],
  });
  const { result } = setup();
  await waitFor(() =>
    expect(result.current.minMaxValues).toEqual({ min: -80, max: 80 })
  );
  expect(result.current.repState?.rater_contribution).toBe(0);
});

it("reports the grantor error instead of falling back to the viewer, then retries the grantor", async () => {
  fetchApi.mockImplementation(async ({ params }) => {
    if (
      params &&
      typeof params === "object" &&
      "rater" in params &&
      params.rater === "grantor"
    ) {
      throw new Error("Grantor unavailable");
    }
    return { rep_rates_left_for_rater: 999, rating_stats: [] };
  });
  const { result } = setup(proxy);
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.repState).toBeNull();
  expect(result.current.heroAvailableRep).toBe(0);
  expect(fetchApi).toHaveBeenCalledTimes(1);
  expect(fetchApi).toHaveBeenCalledWith({
    endpoint: "profiles/target/rep/ratings/received",
    params: { rater: "grantor" },
    signal: expect.any(AbortSignal),
  });
  fetchApi.mockResolvedValue({
    rep_rates_left_for_rater: 80,
    rating_stats: [{ category: "Artist", rater_contribution: 20 }],
  });
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.isError).toBe(false));
  await waitFor(() =>
    expect(result.current.minMaxValues).toEqual({ min: -20, max: 60 })
  );
  expect(fetchApi).toHaveBeenLastCalledWith({
    endpoint: "profiles/target/rep/ratings/received",
    params: { rater: "grantor" },
    signal: expect.any(AbortSignal),
  });
});

it("keeps contribution, available credit and limits consistent in every query-update render", async () => {
  fetchApi.mockResolvedValue({
    rep_rates_left_for_rater: 80,
    rating_stats: [{ category: "Artist", rater_contribution: 20 }],
  });
  const { result, client, snapshots } = setup();
  await waitFor(() => expect(result.current.minMaxValues.max).toBe(100));
  snapshots.length = 0;
  await act(async () => {
    client.setQueryData(
      [
        QueryKey.PROFILE_REP_RATINGS,
        { rater: "viewer", handleOrWallet: "target" },
      ],
      {
        rep_rates_left_for_rater: 5,
        rating_stats: [{ category: "Artist", rater_contribution: 100 }],
      }
    );
  });
  await waitFor(() => expect(result.current.heroAvailableRep).toBe(5));
  expect(snapshots.length).toBeGreaterThan(0);
  for (const state of snapshots) {
    expect({
      contribution: state.repState?.rater_contribution,
      available: state.heroAvailableRep,
      limits: state.minMaxValues,
    }).toEqual({
      contribution: 100,
      available: 5,
      limits: { min: -105, max: 105 },
    });
  }
});

it("cancels an in-flight allowance read when its editor unmounts", async () => {
  fetchApi.mockImplementation(() => new Promise(() => {}));
  const { unmount } = setup();
  await waitFor(() => expect(fetchApi).toHaveBeenCalledTimes(1));
  const signal = fetchApi.mock.calls[0]?.[0].signal;
  expect(signal).toBeDefined();
  expect(signal?.aborted).toBe(false);
  unmount();
  expect(signal?.aborted).toBe(true);
});
