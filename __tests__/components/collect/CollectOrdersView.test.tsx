import CollectOrdersView from "@/components/collect/CollectOrdersView";
import type { CollectOrderView } from "@/components/collect/collect.types";
import { fireEvent, render, screen, within } from "@testing-library/react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const order: CollectOrderView = {
  id: "order-1",
  title: "Age of Memes",
  tokenLabel: "The Memes #545",
  action: "offer",
  statusLabel: "Live",
  amountLabel: "0.0125 WETH",
  detail: "2 copies",
  makerLabel: "0x1111111111111111111111111111111111111111",
  updatedLabel: "Today at 12:00 PM",
  cancellable: true,
};

function props() {
  return {
    orders: [order],
    loading: false,
    authenticated: true,
    onConnect: jest.fn(),
    onRetry: jest.fn(),
    onInspect: jest.fn(),
    onCancel: jest.fn(),
  };
}

it("keeps artwork, exact amount and status visible while order wallet details are disclosed", () => {
  const p = props();
  render(<CollectOrdersView {...p} />);
  const row = screen.getByRole("listitem");
  expect(within(row).getByRole("heading", { name: order.title })).toBeVisible();
  expect(within(row).getByText(order.amountLabel)).toBeVisible();
  expect(within(row).getByText("Live")).toBeVisible();
  expect(within(row).getByText(order.detail)).toBeVisible();
  const wallet = within(row).getByText(`Wallet: ${order.makerLabel}`);
  expect(wallet).not.toBeVisible();
  fireEvent.click(within(row).getByText("Order details"));
  expect(wallet).toBeVisible();
  expect(p.onInspect).not.toHaveBeenCalled();
  expect(p.onCancel).not.toHaveBeenCalled();
  fireEvent.click(within(row).getByRole("button", { name: "View order" }));
  expect(p.onInspect).toHaveBeenCalledWith(order.id);
  fireEvent.click(within(row).getByRole("button", { name: "Cancel order" }));
  expect(p.onCancel).toHaveBeenCalledWith(order.id);
});

it("preserves cancellation gating and never exposes private rows to a guest", () => {
  const p = props();
  const { rerender } = render(
    <CollectOrdersView
      {...p}
      orders={[{ ...order, cancelDisabledReason: "Use the signing wallet." }]}
    />
  );
  expect(screen.getByRole("button", { name: "Cancel order" })).toBeDisabled();
  expect(screen.getByText("Use the signing wallet.")).toBeVisible();
  rerender(<CollectOrdersView {...p} authenticated={false} />);
  expect(screen.queryByText(order.title)).not.toBeInTheDocument();
  expect(screen.queryByText(order.amountLabel)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
  expect(p.onConnect).toHaveBeenCalledTimes(1);
  expect(p.onCancel).not.toHaveBeenCalled();
});
