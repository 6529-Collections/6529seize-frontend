import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import MarketDepthPanel from "@/components/nft-market-depth/MarketDepthPanel";

const mockFetch = jest.fn();
const mockNoPurchases: readonly never[] = [];
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));
jest.mock("@/components/collect/market-activity-store", () => ({
  useConfirmedMarketPurchases: () => mockNoPurchases,
}));
jest.mock("@/components/collect/useAutomaticMarketRefresh", () => ({
  useAutomaticMarketRefresh: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => mockFetch(...args),
}));
jest.mock("@/components/nft-market-depth/MarketDepthTradeActions", () => ({
  MarketDepthTradeProvider: function Provider({
    children,
  }: {
    children: ReactNode;
  }) {
    const [receipt, setReceipt] = useState(false);
    return (
      <div data-testid="trade-provider">
        <button onClick={() => setReceipt(true)}>Confirm purchase</button>
        {receipt && <p>Retained transaction receipt</p>}
        {children}
      </div>
    );
  },
  MarketDepthOrderAction: () => null,
}));
const data = {
  contract: "0x0000000000000000000000000000000000000001",
  token_id: "7",
  status: "fresh",
  as_of: null,
  snapshots: [],
  books: [],
  orders: [],
  order_count: 0,
  criteria_order_count: 0,
  next: null,
  notes: [],
};
function view(tokenId = "7") {
  return (
    <MarketDepthPanel
      contract={data.contract}
      tokenId={tokenId}
      embedded
      actions={(refresh) => <button onClick={refresh}>Update market</button>}
    />
  );
}
beforeEach(() => mockFetch.mockReset());

it("retains the same provider and completed receipt throughout refresh and failure", async () => {
  let resolve: ((value: typeof data) => void) | undefined;
  mockFetch
    .mockResolvedValueOnce(data)
    .mockReturnValueOnce(
      new Promise<typeof data>((done) => {
        resolve = done;
      })
    )
    .mockRejectedValueOnce(new Error("Offline"));
  render(view());
  fireEvent.click(
    await screen.findByRole("button", { name: "Confirm purchase" })
  );
  const provider = screen.getByTestId("trade-provider");
  fireEvent.click(screen.getByRole("button", { name: "Update market" }));
  expect(screen.getByTestId("trade-provider")).toBe(provider);
  expect(screen.getByText("Retained transaction receipt")).toBeVisible();
  await act(async () => resolve?.(data));
  expect(screen.getByTestId("trade-provider")).toBe(provider);
  fireEvent.click(screen.getByRole("button", { name: "Update market" }));
  await screen.findByRole("alert");
  expect(screen.getByTestId("trade-provider")).toBe(provider);
  expect(screen.getByText("Retained transaction receipt")).toBeVisible();
});

it("does not retain the previous artwork receipt when the asset changes", async () => {
  mockFetch
    .mockResolvedValueOnce(data)
    .mockResolvedValueOnce({ ...data, token_id: "8" });
  const rendered = render(view());
  fireEvent.click(
    await screen.findByRole("button", { name: "Confirm purchase" })
  );
  const provider = screen.getByTestId("trade-provider");
  rendered.rerender(view("8"));
  await screen.findByRole("button", { name: "Confirm purchase" });
  expect(screen.getByTestId("trade-provider")).not.toBe(provider);
  expect(
    screen.queryByText("Retained transaction receipt")
  ).not.toBeInTheDocument();
});
