import CollectInlineBuyForm from "@/components/collect/CollectInlineBuyForm";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/collect/CollectRecipientPicker", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <label>
      Delivery address
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  ),
}));
const payer = "0x1111111111111111111111111111111111111111";
const fren = "0x2222222222222222222222222222222222222222";
function props(): ComponentProps<typeof CollectInlineBuyForm> {
  return {
    action: "buy",
    draft: {
      quantity: "1",
      recipient: payer,
      unitPriceEth: "",
      expiryHours: "168",
    },
    maxQuantity: "1",
    makerLabel: payer,
    currencyLabel: "ETH",
    recipientProfile: {
      id: "profile",
      primary_wallet: payer,
      wallets: [{ wallet: payer, display: "collector.eth", tdh: 1 }],
    } as ApiIdentity,
    amountWei: "100000000000000000",
    loading: false,
    onChange: jest.fn(),
    onPrepare: jest.fn(),
  };
}
it("shows the bound price and delivery while keeping a single-copy form compact", () => {
  const p = props();
  render(<CollectInlineBuyForm {...p} />);
  expect(screen.getByText("collector.eth")).toHaveAttribute("title", payer);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Buy 0.1 ETH" }));
  expect(p.onPrepare).toHaveBeenCalledWith(p.draft);
});
it("opens the shared recipient control only on Change and clears old external consent", () => {
  const p = props();
  render(
    <CollectInlineBuyForm
      {...p}
      draft={{ ...p.draft, acknowledgeExternalRecipient: true }}
    />
  );
  expect(screen.queryByLabelText("Delivery address")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Change" }));
  fireEvent.change(screen.getByLabelText("Delivery address"), {
    target: { value: fren },
  });
  expect(p.onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      recipient: fren,
      acknowledgeExternalRecipient: false,
    })
  );
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(screen.queryByLabelText("Delivery address")).not.toBeInTheDocument();
});
it("requires explicit acknowledgement for a fren's exact address", () => {
  const p = props();
  const draft = { ...p.draft, recipient: fren };
  const { rerender } = render(<CollectInlineBuyForm {...p} draft={draft} />);
  expect(screen.getByRole("button", { name: "Buy 0.1 ETH" })).toBeDisabled();
  expect(screen.getByText(fren)).toBeVisible();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(p.onChange).toHaveBeenCalledWith(
    expect.objectContaining({ acknowledgeExternalRecipient: true })
  );
  rerender(
    <CollectInlineBuyForm
      {...p}
      draft={{ ...draft, acknowledgeExternalRecipient: true }}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Buy 0.1 ETH" }));
  expect(p.onPrepare).toHaveBeenCalledWith(
    expect.objectContaining({
      recipient: fren,
      acknowledgeExternalRecipient: true,
    })
  );
});
it("does not prepare an absent price or a disabled trading capability", () => {
  const p = props();
  const { rerender } = render(<CollectInlineBuyForm {...p} amountWei={null} />);
  expect(screen.getByRole("button", { name: "Buy" })).toBeDisabled();
  rerender(
    <CollectInlineBuyForm {...p} disabledReason="Trading unavailable" />
  );
  fireEvent.click(screen.getByRole("button", { name: "Buy 0.1 ETH" }));
  expect(p.onPrepare).not.toHaveBeenCalled();
});
it("keeps quantity editable for editions and rejects an excess quantity", () => {
  const p = props();
  render(
    <CollectInlineBuyForm
      {...p}
      maxQuantity="2"
      draft={{ ...p.draft, quantity: "3" }}
    />
  );
  expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("3");
  fireEvent.click(screen.getByRole("button", { name: "Buy 0.1 ETH" }));
  expect(screen.getByRole("alert")).toBeVisible();
  expect(p.onPrepare).not.toHaveBeenCalled();
});
