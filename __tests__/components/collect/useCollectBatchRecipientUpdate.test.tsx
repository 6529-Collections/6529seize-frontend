import { act, renderHook } from "@testing-library/react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import { ApiMarketBatchOperationStateEnum as State } from "@/generated/models/ApiMarketBatchOperation";
import { useCollectBatchRecipientUpdate } from "@/components/collect/useCollectBatchRecipientUpdate";
import {
  readMarketBatch,
  saveMarketBatch,
} from "@/components/collect/market-batch-storage";
import { validateMarketBatchOperation } from "@/components/collect/market-batch-validation";
import { batchFixture, PAYER, FREN, NOW } from "./market-batch.fixture";

const mockFetch = jest.fn();
const mockPrepare = jest.fn();
jest.mock("@/services/api/market-batch-api", () => ({
  fetchMarketBatch: (...args: unknown[]) => mockFetch(...args),
  prepareMarketBatch: (...args: unknown[]) => mockPrepare(...args),
}));
jest.mock("@/components/collect/market-operation-lock", () => ({
  withMarketOperationLock: (_key: string, action: () => unknown) => action(),
}));
const OWN = "0x5555555555555555555555555555555555555555";
const OUTSIDE = "0x6666666666666666666666666666666666666666";
const profile: ApiIdentity = {
  id: "profile",
  handle: null,
  normalised_handle: null,
  pfp: null,
  cic: 0,
  rep: 0,
  level: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  consolidation_key: "profile",
  display: "profile",
  primary_wallet: PAYER,
  banner1: null,
  banner2: null,
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
  wallets: [PAYER, OWN].map((wallet) => ({
    wallet,
    display: wallet,
    tdh: 0,
  })),
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
};
let sequence = 0;
function fixture() {
  const value = batchFixture();
  value.operation.id = "batch-" + ++sequence;
  return value;
}
function prepared(request: ApiMarketBatchPrepareRequest) {
  const value = fixture();
  value.operation.items = value.operation.items.map((item, index) => ({
    ...item,
    allocations: request.items[index]!.allocations.map((allocation) => ({
      ...allocation,
      recipient_in_profile: [PAYER, OWN].includes(allocation.recipient),
    })),
  }));
  const mirror = value.orders[2]!;
  const original = mirror.parameters.consideration;
  mirror.parameters.consideration = request.items.flatMap((item, index) =>
    item.allocations.map((allocation) => ({
      ...original[index === 0 ? 0 : 1]!,
      startAmount: BigInt(allocation.quantity),
      endAmount: BigInt(allocation.quantity),
      recipient: allocation.recipient as `0x${string}`,
    }))
  );
  mirror.parameters.totalOriginalConsiderationItems = BigInt(
    mirror.parameters.consideration.length
  );
  let destination = 0;
  const nftLinks = request.items.flatMap((item, index) =>
    item.allocations.map(() => ({
      offerComponents: [{ orderIndex: BigInt(index), itemIndex: 0n }],
      considerationComponents: [
        { orderIndex: 2n, itemIndex: BigInt(destination++) },
      ],
    }))
  );
  value.fulfillments.splice(
    0,
    value.fulfillments.length,
    ...nftLinks,
    ...value.fulfillments.slice(-4)
  );
  value.reencode();
  validateMarketBatchOperation(value.operation, request, [PAYER, OWN]);
  return value.operation;
}
function options(value = fixture()) {
  saveMarketBatch("profile", value.operation.id, { request: value.request });
  mockFetch.mockResolvedValue(value.operation);
  mockPrepare.mockImplementation((request: ApiMarketBatchPrepareRequest) =>
    Promise.resolve(prepared(request))
  );
  return {
    operation: value.operation,
    expected: value.request,
    profile,
    wallet: PAYER,
    enabled: true,
    onUpdated: jest.fn(),
    onError: jest.fn(),
  };
}
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.spyOn(Date, "now").mockReturnValue(NOW);
});
afterEach(() => jest.restoreAllMocks());

test("changes a destination and validates complete batch calldata without changing selected orders or copies", async () => {
  const input = options();
  const original = JSON.parse(
    JSON.stringify(input.expected)
  ) as ApiMarketBatchPrepareRequest;
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  let success = false;
  await act(async () => {
    success = await result.current.update(1, 0, OWN, false);
  });
  expect(success).toBe(true);
  const [operation, request] = input.onUpdated.mock.calls[0]!;
  expect(request.items[0]).toEqual(original.items[0]);
  expect(request.items[1]).toEqual({
    ...original.items[1],
    allocations: [
      { ...original.items[1]!.allocations[0], recipient: OWN },
      original.items[1]!.allocations[1],
    ],
  });
  expect(request.amount_wei).toBe(original.amount_wei);
  expect(readMarketBatch("profile", input.operation.id)?.request).toEqual(
    original
  );
  expect(readMarketBatch("profile", operation.id)?.request).toEqual(request);
  expect(input.expected).toEqual(original);
});

test("combines copies when a split is changed to the other existing destination", async () => {
  const input = options();
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  await act(async () => {
    expect(await result.current.update(1, 0, FREN, true)).toBe(true);
  });
  expect(input.onUpdated.mock.calls[0]![1].items[1].allocations).toEqual([
    { recipient: FREN, quantity: "2", acknowledge_external_recipient: true },
  ]);
});

test("requires acknowledgement for a new external recipient", async () => {
  const input = options();
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  await act(async () => {
    expect(await result.current.update(0, 0, OUTSIDE, false)).toBe(false);
  });
  expect(mockPrepare).not.toHaveBeenCalled();
  await act(async () => {
    expect(await result.current.update(0, 0, OUTSIDE, true)).toBe(true);
  });
  expect(
    input.onUpdated.mock.calls[0]![1].items[0].allocations[0].recipient
  ).toBe(OUTSIDE);
});

test.each([-1, 2, 0.5])("rejects an invalid item index %s", async (index) => {
  const input = options();
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  await act(async () => {
    expect(await result.current.update(index, 0, OWN, false)).toBe(false);
  });
  expect(mockFetch).not.toHaveBeenCalled();
});

test.each(["", "not-an-address", "0x0000000000000000000000000000000000000000"])(
  "rejects invalid destination %s",
  async (address) => {
    const input = options();
    const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
    await act(async () => {
      expect(await result.current.update(0, 0, address, true)).toBe(false);
    });
    expect(mockPrepare).not.toHaveBeenCalled();
  }
);

test("does not replace a batch with a persisted transaction hash", async () => {
  const input = options();
  saveMarketBatch("profile", input.operation.id, {
    request: input.expected,
    transactionHash: `0x${"a".repeat(64)}`,
  });
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  expect(result.current.canEdit).toBe(false);
  await act(async () => {
    expect(await result.current.update(0, 0, OWN, false)).toBe(false);
  });
  expect(mockFetch).not.toHaveBeenCalled();
});

test("refuses an operation that advanced on another device during preparation", async () => {
  const input = options();
  mockFetch
    .mockResolvedValueOnce(input.operation)
    .mockResolvedValueOnce({ ...input.operation, state: State.Submitted });
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  await act(async () => {
    expect(await result.current.update(0, 0, OWN, false)).toBe(false);
  });
  expect(input.onUpdated).not.toHaveBeenCalled();
});

test("rejects prepared calldata still delivering to the old recipient", async () => {
  const input = options();
  mockPrepare.mockResolvedValue(fixture().operation);
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  await act(async () => {
    expect(await result.current.update(0, 0, OWN, false)).toBe(false);
  });
  expect(input.onUpdated).not.toHaveBeenCalled();
});

test("preserves the retry idempotency key after a failed preparation", async () => {
  const input = options();
  mockPrepare.mockRejectedValueOnce(new Error("NETWORK"));
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  await act(async () => {
    expect(await result.current.update(0, 0, OWN, false)).toBe(false);
  });
  await act(async () => {
    expect(await result.current.update(0, 0, OWN, false)).toBe(true);
  });
  expect(mockPrepare.mock.calls[1]![1]).toBe(mockPrepare.mock.calls[0]![1]);
});

test("blocks confirmation and duplicate apply synchronously while preparing", async () => {
  const input = options();
  let complete!: () => void;
  mockPrepare.mockImplementation(
    (request: ApiMarketBatchPrepareRequest) =>
      new Promise((resolve) => {
        complete = () => resolve(prepared(request));
      })
  );
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  let update!: Promise<boolean>;
  await act(async () => {
    update = result.current.update(0, 0, OWN, false);
  });
  expect(result.current.pending).toBe(true);
  expect(() => result.current.assertIdle()).toThrow(
    "MARKET_CONNECTION_CHANGED"
  );
  await act(async () => {
    expect(await result.current.update(0, 0, OWN, false)).toBe(false);
    complete();
    expect(await update).toBe(true);
  });
  expect(mockPrepare).toHaveBeenCalledTimes(1);
});

test("discards an old actor response even after switching back to that actor", async () => {
  const input = options();
  let complete!: () => void;
  mockPrepare.mockImplementation(
    (request: ApiMarketBatchPrepareRequest) =>
      new Promise((resolve) => {
        complete = () => resolve(prepared(request));
      })
  );
  const { result, rerender } = renderHook(
    (props) => useCollectBatchRecipientUpdate(props),
    { initialProps: input }
  );
  let update!: Promise<boolean>;
  await act(async () => {
    update = result.current.update(0, 0, OWN, false);
  });
  rerender({ ...input, wallet: OWN });
  rerender(input);
  await act(async () => {
    complete();
    expect(await update).toBe(false);
  });
  expect(input.onUpdated).not.toHaveBeenCalled();
});
