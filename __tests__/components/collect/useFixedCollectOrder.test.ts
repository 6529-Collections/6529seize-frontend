import { useFixedCollectOrder } from "@/components/collect/useFixedCollectOrder";
import { fixedCollectOrderMatches } from "@/components/collect/collect-fixed-order";
import {
  MARKET_SEAPORT,
  MARKET_WETH,
} from "@/components/collect/market-validation";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { ApiMarketTradeOrderSideEnum } from "@/generated/models/ApiMarketTradeOrder";
import { act, renderHook } from "@testing-library/react";

const mockResolve = jest.fn();
jest.mock("@/services/api/market-api", () => ({
  fetchExactMarketOrder: (...args: unknown[]) => mockResolve(...args),
}));

const seller = "0x1111111111111111111111111111111111111111";
const bidder = "0x2222222222222222222222222222222222222222";
const feeRecipient = "0x3333333333333333333333333333333333333333";
const order: ApiMarketTradeOrder = {
  identity: {
    protocol_address: MARKET_SEAPORT,
    order_hash: `0x${"a".repeat(64)}`,
  },
  asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:8",
  maker: bidder,
  side: ApiMarketTradeOrderSideEnum.Offer,
  quantity: "1",
  currency: MARKET_WETH,
  total_wei: "1000",
  net_wei: "975",
  fees: [{ recipient: feeRecipient, amount_wei: "25" }],
  start_time: "1",
  end_time: "9999999999",
  recipient: bidder,
  purchase_quantity: "1",
  quantity_step: "1",
  available_quantity: "3",
};
const options = {
  fixed: true,
  action: "accept" as const,
  assetKey: order.asset_key,
  initialOrder: order,
  draft: {
    quantity: "2",
    unitPriceEth: "",
    expiryHours: "168" as const,
    recipient: seller,
  },
  profileId: "seller-profile",
  profileWallets: [seller],
  wallet: seller,
  canSign: true,
};

beforeEach(() => {
  mockResolve.mockReset().mockResolvedValue(order);
});

it("refreshes the exact offer and retains the available quantity independently of its quoted basis", async () => {
  const { result } = renderHook(() => useFixedCollectOrder(options));
  await expect(result.current.refresh()).resolves.toEqual(order);
  expect(mockResolve).toHaveBeenCalledWith(
    order.identity.order_hash,
    MARKET_SEAPORT,
    order.asset_key,
    "OFFER",
    expect.any(AbortSignal)
  );
});

it.each([
  { total_wei: "1001" },
  { net_wei: "974" },
  { available_quantity: "2" },
  { quantity_step: "3" },
  { maker: feeRecipient },
  { recipient: feeRecipient },
  { fees: [{ recipient: bidder, amount_wei: "25" }] },
  { identity: { ...order.identity, order_hash: `0x${"b".repeat(64)}` } },
])("rejects changed signed terms or availability: %j", async (patch) => {
  mockResolve.mockResolvedValue({ ...order, ...patch });
  const { result } = renderHook(() => useFixedCollectOrder(options));
  await expect(result.current.refresh()).rejects.toThrow(
    "MARKET_FIXED_ORDER_CHANGED"
  );
});

it("fails closed on resolver failure without using another discovered order", async () => {
  mockResolve.mockRejectedValue(new Error("unavailable"));
  const { result } = renderHook(() => useFixedCollectOrder(options));
  await expect(result.current.refresh()).rejects.toThrow("unavailable");
  expect(mockResolve).toHaveBeenCalledTimes(1);
});

it.each(["unmount", "actor", "draft"])(
  "rejects a pending lookup after %s changes, including returning to the original actor",
  async (change) => {
    let finish!: (value: ApiMarketTradeOrder) => void;
    mockResolve.mockReturnValue(
      new Promise<ApiMarketTradeOrder>((resolve) => {
        finish = resolve;
      })
    );
    const { result, rerender, unmount } = renderHook(
      (props) => useFixedCollectOrder(props),
      { initialProps: options }
    );
    const pending = result.current.refresh();
    const rejected = expect(pending).rejects.toThrow(
      "MARKET_CONNECTION_CHANGED"
    );
    if (change === "unmount") unmount();
    else if (change === "actor") {
      rerender({ ...options, wallet: feeRecipient });
      rerender(options);
    } else rerender({ ...options, draft: { ...options.draft, quantity: "1" } });
    await act(async () => {
      finish(order);
      await rejected;
    });
    expect(mockResolve.mock.calls[0][4].aborted).toBe(true);
  }
);

it("rejects self trades, an expired offer and unsupported fractional fees", () => {
  const matches = (
    patch: Partial<Parameters<typeof fixedCollectOrderMatches>[0]>
  ) =>
    fixedCollectOrderMatches({
      initial: order,
      current: order,
      assetKey: order.asset_key,
      action: "accept",
      quantity: "2",
      profileWallets: [seller],
      nowSeconds: 100,
      ...patch,
    });
  expect(matches({ profileWallets: [seller, bidder] })).toBe(false);
  expect(matches({ maximumQuantity: "1" })).toBe(false);
  expect(matches({ maximumQuantity: "2" })).toBe(true);
  expect(matches({ maximumQuantity: "0" })).toBe(false);
  expect(matches({ maximumQuantity: (1n << 256n).toString() })).toBe(false);
  expect(matches({ nowSeconds: 9999999999 })).toBe(false);
  const fractional = {
    ...order,
    quantity: "3",
    fees: [{ recipient: feeRecipient, amount_wei: "1" }],
  };
  expect(matches({ initial: fractional, current: fractional })).toBe(false);
});
