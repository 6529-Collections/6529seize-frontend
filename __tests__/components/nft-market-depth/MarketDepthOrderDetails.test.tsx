import MarketDepthOrderDetails from "@/components/nft-market-depth/MarketDepthOrderDetails";
import {
  ApiMarketOrderApplicabilityEnum,
  ApiMarketOrderScopeEnum,
  ApiMarketOrderSideEnum,
  type ApiMarketOrder,
} from "@/generated/models/ApiMarketOrder";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/components/nft-market-depth/MarketDepthTradeActions", () => ({
  MarketDepthOrderAction: () => null,
}));

function order(index: number): ApiMarketOrder {
  return {
    order_key: `listing-${index}`,
    order_id: `exact-order-${index}`,
    source: "opensea",
    protocol: "seaport",
    collection_slug: "collection",
    side: ApiMarketOrderSideEnum.Ask,
    scope: ApiMarketOrderScopeEnum.Token,
    maker: "0x1111111111111111111111111111111111111111",
    token_id: "1",
    original_quantity: "1",
    remaining_quantity: "1",
    currency: {
      address: "0x0000000000000000000000000000000000000000",
      symbol: "ETH",
      decimals: 18,
    },
    total_price_raw: "100000000000000000",
    unit_price: "0.1",
    starts_at: new Date("2026-09-10T00:00:00.000Z"),
    expires_at: new Date("2026-09-30T00:00:00.000Z"),
    observed_at: new Date("2026-09-13T00:00:00.000Z"),
    applicability: ApiMarketOrderApplicabilityEnum.Token,
    liquidity_group: `liquidity-${index}`,
    caveats: [],
  };
}

it("shows ten exact orders initially and exposes the remaining orders without replacing the first ten", () => {
  const orders = Array.from({ length: 12 }, (_, index) => order(index + 1));
  render(
    <MarketDepthOrderDetails
      orders={orders}
      expectedCount={12}
      locale="en-US"
      isLoading={false}
      error={null}
      onRetry={jest.fn()}
      onRefresh={jest.fn()}
    />
  );
  const firstOrder = screen.getAllByRole("listitem")[0];
  expect(screen.getAllByRole("listitem")).toHaveLength(10);
  expect(screen.queryByText("exact-order-11")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Show all/ }));
  expect(screen.getAllByRole("listitem")).toHaveLength(12);
  expect(screen.getByText("exact-order-12")).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")[0]).toBe(firstOrder);
  fireEvent.click(screen.getByRole("button", { name: /Show fewer/ }));
  expect(screen.getAllByRole("listitem")).toHaveLength(10);
  expect(screen.queryByText("exact-order-11")).not.toBeInTheDocument();
});
