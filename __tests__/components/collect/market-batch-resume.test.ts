import { findResumableMarketBatch } from "@/components/collect/market-batch-resume";
import { fetchRecoverableMarketBatch } from "@/components/collect/market-batch-recovery";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";
import { batchFixture } from "./market-batch.fixture";

jest.mock("@/components/collect/market-batch-recovery", () => ({
  ...jest.requireActual("@/components/collect/market-batch-recovery"),
  fetchRecoverableMarketBatch: jest.fn(),
}));
const fetch = jest.mocked(fetchRecoverableMarketBatch);
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});
function saved(state = ApiMarketBatchOperationStateEnum.Unknown) {
  const value = batchFixture();
  value.operation.state = state;
  // Write directly to persistent storage: no controller or module-memory state survives this setup.
  localStorage.setItem(
    `6529-market-batch:${value.request.profile_id}:${value.operation.id}`,
    JSON.stringify({ request: value.request })
  );
  fetch.mockResolvedValue(value.operation);
  return value;
}
it.each([
  ApiMarketBatchOperationStateEnum.Unknown,
  ApiMarketBatchOperationStateEnum.Submitted,
  ApiMarketBatchOperationStateEnum.Review,
])(
  "resumes %s after a reload even without a transaction hash",
  async (state) => {
    const value = saved(state);
    const result = await findResumableMarketBatch(
      value.request.profile_id,
      value.request.items
    );
    expect(result).toEqual({
      operation: value.operation,
      request: value.request,
    });
    expect(fetch).toHaveBeenCalledWith(
      value.operation.id,
      value.request.profile_id,
      undefined
    );
  }
);
it("also finds a pending purchase when quantities or destinations changed but a selected order overlaps", async () => {
  const value = saved();
  expect(
    await findResumableMarketBatch(
      value.request.profile_id,
      value.request.items.slice(1)
    )
  ).not.toBeNull();
});
it("does not guess that a failed recovery request means the earlier purchase failed", async () => {
  const value = saved();
  fetch.mockRejectedValue(new Error("offline"));
  await expect(
    findResumableMarketBatch(value.request.profile_id, value.request.items)
  ).rejects.toThrow("offline");
});
it("ignores another profile, resolved transactions, and unrelated seller orders", async () => {
  const value = saved(ApiMarketBatchOperationStateEnum.Confirmed);
  expect(
    await findResumableMarketBatch("another", value.request.items)
  ).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(
    await findResumableMarketBatch(
      value.request.profile_id,
      value.request.items
    )
  ).toBeNull();
  fetch.mockClear();
  const other = value.request.items.map((item) => ({
    ...item,
    asset_key: `${item.asset_key}9`,
    order: { ...item.order, order_hash: `0x${"e".repeat(64)}` },
  }));
  expect(
    await findResumableMarketBatch(value.request.profile_id, other)
  ).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});
it("resumes an unresolved NFT purchase even when a replacement listing has a different seller hash", async () => {
  const value = saved();
  const replacement = value.request.items.map((item) => ({
    ...item,
    order: { ...item.order, order_hash: `0x${"e".repeat(64)}` },
  }));
  expect(
    (await findResumableMarketBatch(value.request.profile_id, replacement))
      ?.operation.id
  ).toBe(value.operation.id);
  value.operation.state = ApiMarketBatchOperationStateEnum.Review;
  expect(
    await findResumableMarketBatch(value.request.profile_id, replacement)
  ).toBeNull();
});
it("fails closed on a mismatched recovery identity", async () => {
  const value = saved();
  fetch.mockResolvedValue({ ...value.operation, id: "different" });
  await expect(
    findResumableMarketBatch(value.request.profile_id, value.request.items)
  ).rejects.toThrow("MARKET_REVIEW_MISMATCH");
});
it("prefers the newest actionable review after editing without letting it hide an unresolved send", async () => {
  const value = saved(ApiMarketBatchOperationStateEnum.Review);
  const newer = {
    ...value.operation,
    id: "newer-review",
    updated_at: value.operation.updated_at + 100,
  };
  localStorage.setItem(
    `6529-market-batch:${value.request.profile_id}:${newer.id}`,
    JSON.stringify({ request: value.request })
  );
  fetch.mockImplementation(async (id) =>
    id === newer.id ? newer : value.operation
  );
  expect(
    (
      await findResumableMarketBatch(
        value.request.profile_id,
        value.request.items
      )
    )?.operation.id
  ).toBe(newer.id);
  value.operation.state = ApiMarketBatchOperationStateEnum.Unknown;
  expect(
    (
      await findResumableMarketBatch(
        value.request.profile_id,
        value.request.items
      )
    )?.operation.id
  ).toBe(value.operation.id);
});
it("does not resume an expired no-send review", async () => {
  const value = saved(ApiMarketBatchOperationStateEnum.Review);
  value.operation.expires_at = Date.now() - 1;
  expect(
    await findResumableMarketBatch(
      value.request.profile_id,
      value.request.items
    )
  ).toBeNull();
});
it("does not coerce a malformed array state into an actionable review", async () => {
  const value = saved(ApiMarketBatchOperationStateEnum.Review);
  Object.assign(value.operation, { state: ["REVIEW"] });
  expect(
    await findResumableMarketBatch(
      value.request.profile_id,
      value.request.items
    )
  ).toBeNull();
});
it("does not let a long completed purchase history block the current selection", async () => {
  const value = saved(ApiMarketBatchOperationStateEnum.Review);
  for (let index = 0; index < 129; index++)
    localStorage.setItem(
      `6529-market-batch:${value.request.profile_id}:completed-${index}`,
      JSON.stringify({ request: value.request })
    );
  fetch.mockImplementation(async (id) =>
    id === value.operation.id
      ? value.operation
      : {
          ...value.operation,
          id,
          state: ApiMarketBatchOperationStateEnum.Confirmed,
        }
  );
  expect(
    (
      await findResumableMarketBatch(
        value.request.profile_id,
        value.request.items
      )
    )?.operation.id
  ).toBe(value.operation.id);
});
