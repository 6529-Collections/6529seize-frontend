import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { useDefaultCompetition } from "@/hooks/competitions/useCompetitionQueries";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn(() => ({})) }));
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

it.each([
  [null, 30_000],
  [101_000, 1_000],
  [300_000, 30_000],
  [99_000, 250],
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
