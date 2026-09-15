import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiCollectAnalysis } from "@/generated/models/ApiCollectAnalysis";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import {
  collectGoalRefreshPurchases,
  refreshCollectGoalAfterPurchase,
  type CollectGoalBuild,
} from "@/components/collect/collect-goal-refresh";
import type { ConfirmedMarketPurchase } from "@/components/collect/market-activity-store";

const mockOwnership = jest.fn();
const mockCreate = jest.fn();
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectAssetOwnership: (...args: unknown[]) => mockOwnership(...args),
  createCollectPlan: (...args: unknown[]) => mockCreate(...args),
}));
const now = 1_800_000_000_000;
const assetKey = `1:${MEMES_CONTRACT}:1`;
const recipient = "0x1111111111111111111111111111111111111111";
const build = {
  scope: "goal-scope",
  generation: 1,
  startedAt: now - 5000,
  request: {
    goal: {
      profile_id: "profile",
      kind: "memes_full_set",
      catalog_version: "v1",
      target_copies: "1",
    },
    options: { recipient, budget_wei: "100000000000000000" },
  },
} as CollectGoalBuild;
const purchase: ConfirmedMarketPurchase = {
  operationId: "operation",
  profileId: "profile",
  assetKey,
  orderHash: "order",
  protocolAddress: "protocol",
  quantity: "1",
  confirmedAt: now,
  blockNumber: 101,
};
const analysis = (block = 100) =>
  ({
    account: { profile_id: "profile" },
    holdings_snapshot: { block_number: block, nextgen_block_number: 0 },
    requirements: [
      { asset_keys: [assetKey], owned_quantity: "0", missing_quantity: "1" },
    ],
    satisfied_count: 0,
    recipient_in_profile: false,
    counts_toward_profile: false,
  }) as ApiCollectAnalysis;
const plan = (block = 100) =>
  ({ id: "plan", state: "READY", analysis: analysis(block) }) as ApiCollectPlan;
const run = (signal = new AbortController().signal, purchases = [purchase]) =>
  refreshCollectGoalAfterPurchase({
    build,
    purchases,
    signal,
    onRebuilding: jest.fn(),
  });

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(now);
  jest.clearAllMocks();
  mockOwnership.mockResolvedValue(analysis(100));
  mockCreate.mockResolvedValue(plan(101));
});
afterEach(() => jest.useRealTimers());

it("selects only new matching goal purchases whose canonical block is not reflected yet", () => {
  expect(collectGoalRefreshPurchases(plan(), build, [purchase])).toEqual([
    purchase,
  ]);
  const ignored = [
    { ...purchase, confirmedAt: 0 },
    { ...purchase, confirmedAt: now - 10000 },
    { ...purchase, assetKey: `1:${MEMES_CONTRACT}:2` },
    { ...purchase, profileId: "other" },
    { ...purchase, blockNumber: 100 },
  ];
  expect(collectGoalRefreshPurchases(plan(), build, ignored)).toEqual([]);
  expect(collectGoalRefreshPurchases(plan(), build, [])).toEqual([]);
});

it("waits for authoritative holdings, then builds exactly once with the existing recipient and budget", async () => {
  const result = run();
  await jest.advanceTimersByTimeAsync(0);
  expect(mockOwnership).toHaveBeenCalledTimes(1);
  expect(mockCreate).not.toHaveBeenCalled();
  mockOwnership.mockResolvedValue(analysis(101));
  await jest.advanceTimersByTimeAsync(29999);
  expect(mockOwnership).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(1);
  expect(await result).toEqual(plan(101));
  expect(mockCreate).toHaveBeenCalledTimes(1);
  expect(mockCreate).toHaveBeenCalledWith(
    build.request,
    expect.any(AbortSignal)
  );
  await jest.advanceTimersByTimeAsync(60000);
  expect(mockCreate).toHaveBeenCalledTimes(1);
});

it("uses the actual rebuilt counts for a gift outside the profile", async () => {
  mockOwnership.mockResolvedValue(analysis(101));
  const result = await run();
  expect(result?.analysis.satisfied_count).toBe(0);
  expect(result?.analysis.counts_toward_profile).toBe(false);
  expect(result?.analysis.requirements[0]?.owned_quantity).toBe("0");
});

it("waits for every purchase in the goal before rebuilding", async () => {
  mockOwnership.mockResolvedValue(analysis(101));
  const result = run(new AbortController().signal, [
    purchase,
    { ...purchase, operationId: "later", blockNumber: 102 },
  ]);
  await jest.advanceTimersByTimeAsync(0);
  expect(mockCreate).not.toHaveBeenCalled();
  mockOwnership.mockResolvedValue(analysis(102));
  mockCreate.mockResolvedValue(plan(102));
  await jest.advanceTimersByTimeAsync(30000);
  expect(await result).toEqual(plan(102));
});

it("cancels pending ownership reads without rebuilding when the scope leaves", async () => {
  mockOwnership.mockImplementation(() => new Promise(() => undefined));
  const controller = new AbortController();
  const result = run(controller.signal);
  await jest.advanceTimersByTimeAsync(0);
  controller.abort();
  expect(await result).toBeNull();
  expect(mockCreate).not.toHaveBeenCalled();
});

it("ignores a replacement plan that finishes after cancellation", async () => {
  mockOwnership.mockResolvedValue(analysis(101));
  let finish: (value: ApiCollectPlan) => void = () => undefined;
  mockCreate.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const controller = new AbortController();
  const result = run(controller.signal);
  await jest.advanceTimersByTimeAsync(0);
  controller.abort();
  finish(plan(101));
  expect(await result).toBeNull();
});

it("stops ownership retries after ten minutes without starting full plan scans", async () => {
  const result = run();
  await jest.advanceTimersByTimeAsync(600000);
  expect(await result).toBeNull();
  expect(mockOwnership).toHaveBeenCalledTimes(20);
  expect(mockCreate).not.toHaveBeenCalled();
});

it("bounds hanging ownership requests and does not treat missing receipt evidence as caught up", async () => {
  const incomplete = { ...purchase };
  delete incomplete.blockNumber;
  const result = run(new AbortController().signal, [incomplete]);
  await jest.advanceTimersByTimeAsync(600000);
  expect(await result).toBeNull();
  expect(mockOwnership).not.toHaveBeenCalled();
  expect(mockCreate).not.toHaveBeenCalled();
});

it("does not repeat a full scan when rebuilding fails or returns an older holdings snapshot", async () => {
  mockOwnership.mockResolvedValue(analysis(101));
  mockCreate.mockResolvedValue(plan(100));
  expect(await run()).toBeNull();
  expect(mockCreate).toHaveBeenCalledTimes(1);
  mockCreate.mockRejectedValue(new Error("analysis failed"));
  await expect(run()).rejects.toThrow("analysis failed");
  expect(mockCreate).toHaveBeenCalledTimes(2);
});

it("bounds a stalled replacement plan request and forwards cancellation to its fetch", async () => {
  mockOwnership.mockResolvedValue(analysis(101));
  mockCreate.mockImplementation(() => new Promise(() => undefined));
  const result = run();
  const rejected = expect(result).rejects.toThrow(
    "COLLECT_GOAL_REBUILD_TIMEOUT"
  );
  await jest.advanceTimersByTimeAsync(30000);
  await rejected;
  expect(mockCreate).toHaveBeenCalledTimes(1);
  expect(mockCreate.mock.calls[0][1].aborted).toBe(true);
});
