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
import { marketBatchProfileLock } from "@/components/collect/market-batch-resume";
import { batchFixture, PAYER, FREN, NOW } from "./market-batch.fixture";

const mockFetch = jest.fn();
const mockPrepare = jest.fn();
const mockLock = jest.fn();
jest.mock("@/services/api/market-batch-api", () => ({
  fetchMarketBatch: (...args: unknown[]) => mockFetch(...args),
  prepareMarketBatch: (...args: unknown[]) => mockPrepare(...args),
}));
jest.mock("@/components/collect/market-operation-lock", () => ({
  withMarketOperationLock: (key: string, action: () => unknown) =>
    mockLock(key, action),
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
  const originalItems = value.operation.items;
  const indices = request.items.map((item) => {
    const index = originalItems.findIndex(
      (original) =>
        original.asset_key === item.asset_key &&
        original.order.order_hash === item.order.order_hash
    );
    if (index < 0) throw new Error("Unknown fixture order");
    return index;
  });
  value.operation.items = request.items.map((item, index) => ({
    ...originalItems[indices[index]!]!,
    allocations: item.allocations.map((allocation) => ({
      ...allocation,
      recipient_in_profile: [PAYER, OWN].includes(allocation.recipient),
    })),
  }));
  const mirror = value.orders[2]!;
  const original = mirror.parameters.consideration;
  mirror.parameters.consideration = request.items.flatMap((item, index) =>
    item.allocations.map((allocation) => ({
      ...original[indices[index] === 0 ? 0 : 1]!,
      startAmount: BigInt(allocation.quantity),
      endAmount: BigInt(allocation.quantity),
      recipient: allocation.recipient as `0x${string}`,
    }))
  );
  mirror.parameters.totalOriginalConsiderationItems = BigInt(
    mirror.parameters.consideration.length
  );
  mirror.parameters.offer[0]!.startAmount = BigInt(request.amount_wei);
  mirror.parameters.offer[0]!.endAmount = BigInt(request.amount_wei);
  const sellerOrders = indices.map((index) => value.orders[index]!);
  value.orders.splice(0, value.orders.length, ...sellerOrders, mirror);
  const mirrorIndex = BigInt(sellerOrders.length);
  let destination = 0;
  const nftLinks = request.items.flatMap((item, index) =>
    item.allocations.map(() => ({
      offerComponents: [{ orderIndex: BigInt(index), itemIndex: 0n }],
      considerationComponents: [
        { orderIndex: mirrorIndex, itemIndex: BigInt(destination++) },
      ],
    }))
  );
  value.fulfillments.splice(
    0,
    value.fulfillments.length,
    ...nftLinks,
    ...sellerOrders.flatMap((order, orderIndex) =>
      order.parameters.consideration.map((_, itemIndex) => ({
        offerComponents: [{ orderIndex: mirrorIndex, itemIndex: 0n }],
        considerationComponents: [
          { orderIndex: BigInt(orderIndex), itemIndex: BigInt(itemIndex) },
        ],
      }))
    )
  );
  value.operation.total_wei = request.amount_wei;
  value.operation.potential_liability_wei = request.amount_wei;
  value.reencode();
  value.operation.transaction!.value = request.amount_wei;
  validateMarketBatchOperation(value.operation, request, [PAYER, OWN]);
  return value.operation;
}
function options(
  value: Pick<ReturnType<typeof fixture>, "request" | "operation"> = fixture()
) {
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
  mockLock.mockImplementation((_key: string, action: () => unknown) =>
    action()
  );
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
  expect(readMarketBatch("profile", input.operation.id)?.discardedReview).toBe(
    true
  );
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

test("rejects a changed operation revision after acquiring the replacement lock without publishing or changing either journal", async () => {
  const input = options();
  let replacementId = "";
  mockPrepare.mockImplementation((request: ApiMarketBatchPrepareRequest) => {
    const operation = prepared(request);
    replacementId = operation.id;
    return Promise.resolve(operation);
  });
  let locks = 0;
  let complete!: () => void;
  mockLock.mockImplementation((_key: string, action: () => unknown) => {
    if (++locks !== 3) return action();
    return new Promise((resolve, reject) => {
      complete = () => {
        try {
          resolve(action());
        } catch (failure) {
          reject(failure);
        }
      };
    });
  });
  const { result, rerender } = renderHook(
    (props) => useCollectBatchRecipientUpdate(props),
    { initialProps: input }
  );
  let update!: Promise<boolean>;
  await act(async () => {
    update = result.current.update(0, 0, OWN, false);
  });
  expect(mockLock).toHaveBeenLastCalledWith(
    replacementId,
    expect.any(Function)
  );
  rerender({ ...input, operation: { ...input.operation, revision: "2" } });
  await act(async () => {
    complete();
    expect(await update).toBe(false);
  });
  expect(input.onUpdated).not.toHaveBeenCalled();
  expect(readMarketBatch("profile", input.operation.id)?.request).toEqual(
    input.expected
  );
  expect(readMarketBatch("profile", replacementId)).toBeNull();
});

test.each([0, 1])(
  "removes item %s while retaining exact signed orders, split allocations, fees and total",
  async (itemIndex) => {
    const input = options();
    const original = JSON.parse(
      JSON.stringify(input.expected)
    ) as ApiMarketBatchPrepareRequest;
    const retained = original.items.filter((_, index) => index !== itemIndex);
    const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
    await act(async () => {
      expect(await result.current.remove(itemIndex)).toBe(true);
    });
    const [operation, request] = input.onUpdated.mock.calls[0]!;
    expect(request).toEqual({
      ...original,
      items: retained,
      amount_wei: retained
        .reduce((total, item) => total + BigInt(item.amount_wei), 0n)
        .toString(),
    });
    expect(operation.items[0].fees).toEqual(
      input.operation.items[1 - itemIndex]!.fees
    );
    expect(() =>
      validateMarketBatchOperation(operation, request, [PAYER, OWN])
    ).not.toThrow();
    expect(mockLock.mock.calls.map(([key]) => key)).toEqual([
      marketBatchProfileLock("profile"),
      input.operation.id,
      operation.id,
    ]);
    expect(readMarketBatch("profile", input.operation.id)?.request).toEqual(
      original
    );
    expect(readMarketBatch("profile", operation.id)?.request).toEqual(request);
    expect(input.expected).toEqual(original);
  }
);

test.each([OWN, OUTSIDE])(
  "updates every delivery to %s without changing orders, quantities or amounts",
  async (recipient) => {
    const input = options();
    const original = JSON.parse(
      JSON.stringify(input.expected)
    ) as ApiMarketBatchPrepareRequest;
    const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
    await act(async () => {
      expect(
        await result.current.updateAll(recipient, recipient === OUTSIDE)
      ).toBe(true);
    });
    const [operation, request] = input.onUpdated.mock.calls[0]!;
    expect(request).toEqual({
      ...original,
      items: original.items.map((item) => ({
        ...item,
        allocations: [
          {
            recipient,
            quantity: item.quantity,
            acknowledge_external_recipient: recipient === OUTSIDE,
          },
        ],
      })),
    });
    expect(() =>
      validateMarketBatchOperation(operation, request, [PAYER, OWN])
    ).not.toThrow();
    expect(input.expected).toEqual(original);
  }
);

test("requires explicit external acknowledgement for changing all destinations", async () => {
  const input = options();
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  await act(async () => {
    expect(await result.current.updateAll(OUTSIDE, false)).toBe(false);
  });
  expect(input.onError).toHaveBeenCalledWith(
    new Error("RECIPIENT_NOT_ACKNOWLEDGED")
  );
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockPrepare).not.toHaveBeenCalled();
});

type BatchEdit = "remove" | "updateAll";
function applyEdit(
  hook: ReturnType<typeof useCollectBatchRecipientUpdate>,
  edit: BatchEdit
) {
  return edit === "remove" ? hook.remove(0) : hook.updateAll(OWN, false);
}

test.each<BatchEdit>(["remove", "updateAll"])(
  "%s preparation failure preserves the original review and reuses only the identical retry key",
  async (edit) => {
    const input = options();
    mockPrepare.mockRejectedValueOnce(new Error("NETWORK"));
    const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
    await act(async () => {
      expect(await applyEdit(result.current, edit)).toBe(false);
    });
    expect(input.onUpdated).not.toHaveBeenCalled();
    expect(readMarketBatch("profile", input.operation.id)?.request).toEqual(
      input.expected
    );
    expect(result.current.pending).toBe(false);
    expect(result.current.canEdit).toBe(true);
    expect(() => result.current.assertIdle()).not.toThrow();
    await act(async () => {
      expect(await applyEdit(result.current, edit)).toBe(true);
    });
    expect(mockPrepare.mock.calls[1]).toEqual(mockPrepare.mock.calls[0]);
  }
);

function lastItemOptions() {
  const value = fixture();
  const expected = {
    ...value.request,
    items: [value.request.items[1]!],
    amount_wei: "40",
  };
  return {
    ...options({ request: expected, operation: prepared(expected) }),
    onEmpty: jest.fn(),
  };
}

test("removing the last item discards its unsigned review only after the original locks and server checks", async () => {
  const input = lastItemOptions();
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  await act(async () => {
    expect(await result.current.remove(0)).toBe(true);
  });
  expect(mockLock.mock.calls.map(([key]) => key)).toEqual([
    marketBatchProfileLock("profile"),
    input.operation.id,
  ]);
  expect(mockFetch).toHaveBeenCalledWith(input.operation.id);
  expect(input.onEmpty).toHaveBeenCalledTimes(1);
  expect(readMarketBatch("profile", input.operation.id)?.discardedReview).toBe(
    true
  );
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(input.onUpdated).not.toHaveBeenCalled();
  expect(readMarketBatch("profile", input.operation.id)?.request).toEqual(
    input.expected
  );
});

test("last-item removal without a close callback preserves the original review", async () => {
  const { onEmpty: _onEmpty, ...input } = lastItemOptions();
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  await act(async () => {
    expect(await result.current.remove(0)).toBe(false);
  });
  expect(input.onError).toHaveBeenCalledWith(
    new Error("MARKET_REVIEW_MISMATCH")
  );
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(readMarketBatch("profile", input.operation.id)?.request).toEqual(
    input.expected
  );
});

test("last-item removal cannot close an operation that became submitted on another device", async () => {
  const input = lastItemOptions();
  mockFetch.mockResolvedValue({ ...input.operation, state: State.Submitted });
  const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
  await act(async () => {
    expect(await result.current.remove(0)).toBe(false);
  });
  expect(input.onEmpty).not.toHaveBeenCalled();
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(readMarketBatch("profile", input.operation.id)?.request).toEqual(
    input.expected
  );
});

test.each<BatchEdit>(["remove", "updateAll"])(
  "%s rechecks a saved send after acquiring the original operation lock",
  async (edit) => {
    const input = options();
    const transactionHash = `0x${"a".repeat(64)}` as const;
    mockLock.mockImplementation((key: string, action: () => unknown) => {
      if (key === input.operation.id)
        saveMarketBatch("profile", input.operation.id, {
          request: input.expected,
          transactionHash,
        });
      return action();
    });
    const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
    await act(async () => {
      expect(await applyEdit(result.current, edit)).toBe(false);
    });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(input.onUpdated).not.toHaveBeenCalled();
    expect(
      readMarketBatch("profile", input.operation.id)?.transactionHash
    ).toBe(transactionHash);
  }
);

test.each<BatchEdit>(["remove", "updateAll"])(
  "%s discards a prepared response after an actor change and return",
  async (edit) => {
    const input = options();
    let complete!: () => void;
    let replacementId = "";
    mockPrepare.mockImplementation(
      (request: ApiMarketBatchPrepareRequest) =>
        new Promise((resolve) => {
          const operation = prepared(request);
          replacementId = operation.id;
          complete = () => resolve(operation);
        })
    );
    const { result, rerender } = renderHook(
      (props) => useCollectBatchRecipientUpdate(props),
      { initialProps: input }
    );
    let update!: Promise<boolean>;
    await act(async () => {
      update = applyEdit(result.current, edit);
    });
    expect(result.current.pending).toBe(true);
    expect(() => result.current.assertIdle()).toThrow(
      "MARKET_CONNECTION_CHANGED"
    );
    rerender({ ...input, wallet: OWN });
    rerender(input);
    await act(async () => {
      complete();
      expect(await update).toBe(false);
    });
    expect(input.onUpdated).not.toHaveBeenCalled();
    expect(input.onError).not.toHaveBeenCalled();
    expect(readMarketBatch("profile", replacementId)).toBeNull();
  }
);

test.each<BatchEdit>(["remove", "updateAll"])(
  "%s cannot replace the review when its original operation advances during preparation",
  async (edit) => {
    const input = options();
    let replacementId = "";
    mockPrepare.mockImplementation((request: ApiMarketBatchPrepareRequest) => {
      const operation = prepared(request);
      replacementId = operation.id;
      return Promise.resolve(operation);
    });
    mockFetch
      .mockResolvedValueOnce(input.operation)
      .mockResolvedValueOnce({ ...input.operation, state: State.Submitted });
    const { result } = renderHook(() => useCollectBatchRecipientUpdate(input));
    await act(async () => {
      expect(await applyEdit(result.current, edit)).toBe(false);
    });
    expect(input.onUpdated).not.toHaveBeenCalled();
    expect(readMarketBatch("profile", replacementId)).toBeNull();
    expect(readMarketBatch("profile", input.operation.id)?.request).toEqual(
      input.expected
    );
  }
);
