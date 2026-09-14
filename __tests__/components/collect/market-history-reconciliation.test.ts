import { reconcileMarketHistory } from "@/components/collect/market-history-reconciliation";
import { fetchRecoverableMarketOperation } from "@/components/collect/market-recovery";
import type { ApiMarketOperationResult } from "@/generated/models/ApiMarketOperationResult";
jest.mock("@/components/collect/market-recovery", () => ({
  fetchRecoverableMarketOperation: jest.fn(),
}));
const fetchOperation = jest.mocked(fetchRecoverableMarketOperation);
afterEach(() => jest.useRealTimers());

it("moves past a timed-out first group while retaining its known listing", async () => {
  jest.useFakeTimers();
  fetchOperation.mockImplementation((id) =>
    id === "0"
      ? new Promise(() => {})
      : Promise.resolve({ id, state: "CONFIRMED", kind: "LIST" } as Awaited<
          ReturnType<typeof fetchRecoverableMarketOperation>
        >)
  );
  const live = Array.from(
    { length: 5 },
    (_, id) =>
      ({
        id: String(id),
        state: "LIVE",
        kind: "LIST",
      }) as ApiMarketOperationResult
  );
  const result = reconcileMarketHistory(
    live,
    "profile",
    new AbortController().signal
  );
  await jest.advanceTimersByTimeAsync(10_000);
  const values = await result;
  expect(values[0]).toEqual(live[0]);
  expect(values[4]).toMatchObject({ id: "4", state: "CONFIRMED" });
});

it("checks later sales in bounded groups and retains the known listing on a failed read", async () => {
  let concurrent = 0,
    maximum = 0;
  fetchOperation.mockImplementation(async (id) => {
    concurrent++;
    maximum = Math.max(maximum, concurrent);
    await Promise.resolve();
    concurrent--;
    if (id === "2") throw new Error("Temporarily unavailable");
    return { id, state: "CONFIRMED", kind: "LIST" } as Awaited<
      ReturnType<typeof fetchRecoverableMarketOperation>
    >;
  });
  const live = Array.from(
    { length: 9 },
    (_, id) =>
      ({
        id: String(id),
        state: "LIVE",
        kind: "LIST",
      }) as ApiMarketOperationResult
  );
  const results = await reconcileMarketHistory(
    live,
    "profile",
    new AbortController().signal
  );
  expect(maximum).toBe(4);
  expect(results[2]).toEqual(live[2]);
  expect(
    results.filter((operation) => operation.state === "CONFIRMED")
  ).toHaveLength(8);
});
