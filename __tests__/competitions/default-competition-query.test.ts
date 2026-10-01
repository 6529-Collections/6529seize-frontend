import { renderHook } from "@testing-library/react";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useDefaultCompetition } from "@/hooks/competitions/useCompetitionQueries";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { invalidateCompetitionWave } from "@/services/api/competitions-api";

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(() => ({})),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "alice" },
    activeProfileProxy: { id: "proxy" },
  }),
}));

it("partitions selection by viewer and keeps disabled queries disabled", () => {
  renderHook(() => useDefaultCompetition("wave", false));
  expect(useQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({
      queryKey: [
        QueryKey.DEFAULT_COMPETITION,
        { wave_id: "wave", viewer: "alice:proxy" },
      ],
      enabled: false,
      retry: false,
      staleTime: 0,
    })
  );
});

it("invalidates the actual viewer-partitioned selection key for its wave only", async () => {
  renderHook(() => useDefaultCompetition("wave"));
  const key = jest.mocked(useQuery).mock.calls.at(-1)![0].queryKey;
  const otherKey = [
    QueryKey.DEFAULT_COMPETITION,
    { wave_id: "elsewhere", viewer: "alice:proxy" },
  ];
  const client = new QueryClient();
  client.setQueryData(key, {});
  client.setQueryData(otherKey, {});
  await invalidateCompetitionWave(client, "wave");
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(client.getQueryState(otherKey)?.isInvalidated).toBe(false);
});

it.each([
  [null, 30_000],
  [101_000, 1_000],
  [300_000, 30_000],
  [99_000, 30_000],
  [100_000, 30_000],
  [100_001, 250],
])(
  "uses server durations and bounded lifecycle polling (%s)",
  (nextRefresh, delay) => {
    renderHook(() => useDefaultCompetition("wave"));
    const options = jest.mocked(useQuery).mock.calls.at(-1)![0];
    const interval = options.refetchInterval;
    if (typeof interval !== "function")
      throw new Error("Missing selection refresh interval");
    expect(
      interval({
        state: {
          data: {
            competition_id: "one",
            evaluated_at: 100_000,
            next_refresh_at: nextRefresh,
          },
        },
      } as never)
    ).toBe(delay);
    expect(interval({ state: { data: undefined } } as never)).toBe(30_000);
  }
);
