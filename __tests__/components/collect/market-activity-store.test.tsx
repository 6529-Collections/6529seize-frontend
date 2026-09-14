import {
  claimMarketCelebration,
  recordMarketActivity,
  readPendingMarketPurchases,
  useConfirmedMarketPurchases,
  useMarketActivities,
  usePendingMarketPurchases,
} from "@/components/collect/market-activity-store";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import {
  ApiMarketOperationStateEnum,
  type ApiMarketOperation,
} from "@/generated/models/ApiMarketOperation";
import { act, renderHook } from "@testing-library/react";
import { reconcileCollectSelection } from "@/components/collect/collect-purchase-reconciliation";
import type { CollectSelectedListing } from "@/components/collect/collect-selection.helpers";
import type { ApiMarketReceiptTransaction } from "@/generated/models/ApiMarketReceiptTransaction";
import { MARKET_SEAPORT } from "@/components/collect/market-validation";
import { targetPlan } from "./collect-tdh-target.fixture";
import { batchFixture } from "./market-batch.fixture";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";

let profileSequence = 0;
function operation(): ApiMarketOperation {
  profileSequence++;
  return {
    id: "11111111-1111-4111-8111-111111111111",
    profile_id: `receipt-store-${profileSequence}`,
    kind: ApiMarketKind.Buy,
    state: ApiMarketOperationStateEnum.Submitted,
    updated_at: 1000,
    asset_key: `1:0x${"1".repeat(40)}:1`,
    order_hash: `0x${"2".repeat(64)}`,
    transaction_hash: `0x${"3".repeat(64)}`,
    quantity: "1",
  } as ApiMarketOperation;
}

function selection(value: ApiMarketOperation): CollectSelectedListing {
  const source = targetPlan().items[0]!;
  return {
    asset: { ...source.asset, asset_key: value.asset_key },
    order: {
      ...source.order,
      asset_key: value.asset_key,
      identity: {
        ...source.order.identity,
        order_hash: value.order_hash!,
        protocol_address: MARKET_SEAPORT,
      },
      quantity: "3",
      available_quantity: "3",
      purchase_quantity: "1",
      quantity_step: "1",
      total_wei: "300",
      net_wei: "300",
      fees: [],
    },
    quantity: "2",
    selectedAt: 2000,
  };
}

function canonicalTransaction(seconds: number): ApiMarketReceiptTransaction {
  return {
    purpose: "TRANSACTION",
    status: "SUCCESS",
    confirmation: "CONFIRMED",
    block_timestamp: seconds,
    block_number: 200,
  } as ApiMarketReceiptTransaction;
}

it("tracks confirmed transaction or settlement blocks, never the preparation snapshot", () => {
  const value = {
    ...operation(),
    state: ApiMarketOperationStateEnum.Confirmed,
    block_number: 10,
  };
  const { result } = renderHook(() =>
    useConfirmedMarketPurchases(value.profile_id)
  );
  act(() => {
    recordMarketActivity(value);
  });
  expect(result.current[0]?.blockNumber).toBeUndefined();
  act(() => {
    recordMarketActivity({
      ...value,
      updated_at: 2000,
      settlement: { block_number: 150 },
    } as ApiMarketOperation);
  });
  expect(result.current[0]?.blockNumber).toBe(150);
  act(() => {
    recordMarketActivity({
      ...value,
      updated_at: 3000,
      receipt: { transactions: [canonicalTransaction(1)] },
    });
  });
  expect(result.current[0]?.blockNumber).toBe(200);
  act(() => {
    recordMarketActivity({ ...value, updated_at: 4000 });
  });
  expect(result.current[0]?.blockNumber).toBe(200);
});

it("does not clear a new remaining-copy selection when old history arrives with a newer metadata timestamp", () => {
  const value = operation();
  const item = selection(value);
  const { result } = renderHook(() =>
    useConfirmedMarketPurchases(value.profile_id)
  );
  act(() => {
    recordMarketActivity({
      ...value,
      state: ApiMarketOperationStateEnum.Confirmed,
      updated_at: 9000,
    });
  });
  expect(result.current[0]?.confirmedAt).toBe(0);
  expect(reconcileCollectSelection([item], result.current)).toEqual([item]);
  expect(reconcileCollectSelection([item], result.current)[0]).toBe(item);
});

it("clears the fulfilled quantity of a fast current purchase after an observed submitted state", () => {
  const value = operation();
  const item = selection(value);
  const { result } = renderHook(() =>
    useConfirmedMarketPurchases(value.profile_id)
  );
  act(() => {
    recordMarketActivity(value);
    recordMarketActivity({
      ...value,
      state: ApiMarketOperationStateEnum.Confirmed,
      updated_at: 3000,
    });
  });
  expect(result.current[0]?.confirmedAt).toBe(3000);
  expect(reconcileCollectSelection([item], result.current)[0]?.quantity).toBe(
    "1"
  );
});

it("upgrades an unknown historical confirmation time only when canonical transaction evidence arrives", () => {
  const value = operation();
  const confirmed = {
    ...value,
    state: ApiMarketOperationStateEnum.Confirmed,
    updated_at: 9000,
  };
  const { result } = renderHook(() =>
    useConfirmedMarketPurchases(value.profile_id)
  );
  act(() => {
    recordMarketActivity(confirmed);
  });
  expect(result.current[0]?.confirmedAt).toBe(0);
  act(() => {
    recordMarketActivity({
      ...confirmed,
      updated_at: 10000,
      receipt: { transactions: [canonicalTransaction(1)] },
    });
  });
  expect(result.current[0]?.confirmedAt).toBe(1000);
  act(() => {
    recordMarketActivity({ ...confirmed, updated_at: 11000 });
  });
  expect(result.current[0]?.confirmedAt).toBe(1000);
  expect(
    reconcileCollectSelection([selection(value)], result.current)[0]?.quantity
  ).toBe("2");
});

it("reserves pending orders across unmounts and releases only after authoritative confirmation", () => {
  const value = operation();
  const first = renderHook(() => usePendingMarketPurchases(value.profile_id));
  act(() => {
    recordMarketActivity(value);
  });
  expect(first.result.current).toHaveLength(1);
  first.unmount();
  const next = renderHook(() => ({
    pending: usePendingMarketPurchases(value.profile_id),
    confirmed: useConfirmedMarketPurchases(value.profile_id),
  }));
  expect(next.result.current.pending).toHaveLength(1);
  expect(next.result.current.confirmed).toHaveLength(0);
  act(() => {
    recordMarketActivity({
      ...value,
      state: ApiMarketOperationStateEnum.Mined,
      updated_at: 2000,
    });
  });
  expect(next.result.current.confirmed).toHaveLength(0);
  act(() => {
    recordMarketActivity({
      ...value,
      state: ApiMarketOperationStateEnum.Confirmed,
      updated_at: 3000,
    });
  });
  expect(next.result.current.pending).toHaveLength(0);
  expect(next.result.current.confirmed).toHaveLength(1);
});

it.each([
  ApiMarketOperationStateEnum.Confirmed,
  ApiMarketOperationStateEnum.Failed,
])(
  "event-time pending reads isolate profiles and release a %s operation",
  (state) => {
    const value = operation();
    act(() => {
      recordMarketActivity(value);
    });
    expect(readPendingMarketPurchases(value.profile_id)).toHaveLength(1);
    expect(readPendingMarketPurchases(`${value.profile_id}-other`)).toEqual([]);
    act(() => {
      recordMarketActivity({ ...value, state, updated_at: 2000 });
    });
    expect(readPendingMarketPurchases(value.profile_id)).toEqual([]);
  }
);

it("hydrates event-time pending evidence before the corresponding React hook mounts", () => {
  const value = operation();
  act(() => {
    recordMarketActivity(value);
  });
  const stored = localStorage.getItem(
    `6529-market-activity:v1:${value.profile_id}`
  )!;
  const restoredProfile = `${value.profile_id}-action-read`;
  localStorage.setItem(
    `6529-market-activity:v1:${restoredProfile}`,
    stored.replaceAll(value.profile_id, restoredProfile)
  );
  expect(readPendingMarketPurchases(restoredProfile)[0]).toMatchObject({
    operationId: value.id,
    profileId: restoredProfile,
  });
});

it("preserves confirmed order evidence and its time when supplemental metadata is temporarily absent", () => {
  const value = operation();
  const confirmed = {
    ...value,
    state: ApiMarketOperationStateEnum.Confirmed,
    settlement: { order_remaining_quantity: "2" },
  } as ApiMarketOperation;
  const { result } = renderHook(() =>
    useConfirmedMarketPurchases(value.profile_id)
  );
  act(() => {
    recordMarketActivity(value);
    recordMarketActivity(confirmed);
  });
  act(() => {
    recordMarketActivity({
      ...value,
      state: ApiMarketOperationStateEnum.Confirmed,
      updated_at: 9000,
    });
  });
  expect(result.current[0]).toMatchObject({
    remainingQuantity: "2",
    confirmedAt: 1000,
  });
  act(() => {
    recordMarketActivity({
      ...confirmed,
      updated_at: 10000,
      settlement: { ...confirmed.settlement!, order_remaining_quantity: "3" },
    });
  });
  expect(result.current[0]?.remainingQuantity).toBe("2");
  act(() => {
    recordMarketActivity({ ...value, updated_at: 2000 });
  });
  expect(result.current).toHaveLength(1);
});

it("recovers public progress from storage without retaining signing data or sharing another profile", () => {
  const value = operation();
  const withPrivatePayload = {
    ...value,
    signedPayload: "must-not-persist",
    calldata: "must-not-persist",
  };
  act(() => {
    recordMarketActivity(withPrivatePayload);
  });
  const stored = localStorage.getItem(
    `6529-market-activity:v1:${value.profile_id}`
  )!;
  expect(stored).not.toContain("must-not-persist");
  const restoredProfile = `${value.profile_id}-restored`;
  localStorage.setItem(
    `6529-market-activity:v1:${restoredProfile}`,
    stored.replaceAll(value.profile_id, restoredProfile)
  );
  const restored = renderHook(() => useMarketActivities(restoredProfile));
  expect(restored.result.current[0]).toMatchObject({
    id: value.id,
    transactionHash: value.transaction_hash,
  });
  const other = renderHook(() =>
    useMarketActivities(`${value.profile_id}-other`)
  );
  expect(other.result.current).toHaveLength(0);
});

it.each([128, 129])(
  "hydrates up to the complete128-order batch cap, supplied %i",
  (count) => {
    const value = operation();
    const batch = batchFixture().operation;
    recordMarketActivity({
      ...batch,
      id: value.id,
      profile_id: value.profile_id,
      state: ApiMarketBatchOperationStateEnum.Submitted,
      items: Array.from({ length: count }, (_, index) => ({
        ...batch.items[0]!,
        asset_key: `1:0x${"1".repeat(40)}:${index}`,
        order: {
          ...batch.items[0]!.order,
          order_hash: `0x${index.toString(16).padStart(64, "0")}`,
        },
      })),
    });
    const persisted = localStorage.getItem(
      `6529-market-activity:v1:${value.profile_id}`
    )!;
    const restoredProfile = `${value.profile_id}-batch-reload`;
    localStorage.setItem(
      `6529-market-activity:v1:${restoredProfile}`,
      persisted.replaceAll(value.profile_id, restoredProfile)
    );
    const restored = readPendingMarketPurchases(restoredProfile);
    expect(restored).toHaveLength(count <= 128 ? count : 0);
    if (count === 128)
      expect(restored.at(-1)?.assetKey).toBe(`1:0x${"1".repeat(40)}:127`);
  }
);

it("deduplicates the receipt celebration per profile and operation", () => {
  const value = operation();
  expect(claimMarketCelebration(value.profile_id, value.id)).toBe(true);
  expect(claimMarketCelebration(value.profile_id, value.id)).toBe(false);
  expect(claimMarketCelebration(`${value.profile_id}-other`, value.id)).toBe(
    true
  );
});
