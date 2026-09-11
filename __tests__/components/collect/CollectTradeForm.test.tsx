import CollectTradeForm from "@/components/collect/CollectTradeForm";
import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

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
const own = "0x1111111111111111111111111111111111111111";
const custody = "0x2222222222222222222222222222222222222222";
const gift = "0x3333333333333333333333333333333333333333";
function props(): ComponentProps<typeof CollectTradeForm> {
  return {
    action: "buy",
    draft: {
      quantity: "2",
      unitPriceEth: "",
      expiryHours: "168",
      recipient: custody,
    },
    maxQuantity: "5",
    makerLabel: own,
    currencyLabel: "ETH",
    recipientProfile: {
      id: "profile",
      wallets: [{ wallet: own }, { wallet: custody }],
    } as ApiIdentity,
    loading: false,
    onChange: jest.fn(),
    onPrepare: jest.fn(),
  };
}
it("accepts delivery to another confirmed profile wallet without changing the payer", () => {
  const p = props();
  render(<CollectTradeForm {...p} />);
  fireEvent.click(screen.getByRole("button", { name: "Review exact terms" }));
  expect(p.onPrepare).toHaveBeenCalledWith(
    expect.objectContaining({ recipient: custody, quantity: "2" })
  );
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(screen.getByText(`Wallet: ${own}`)).toBeInTheDocument();
});
it("requires explicit external delivery acknowledgement and clears it on destination changes", () => {
  const base = props();
  const p = { ...base, draft: { ...base.draft, recipient: gift } };
  const { rerender } = render(<CollectTradeForm {...p} />);
  expect(
    screen.getByRole("button", { name: "Review exact terms" })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
    expect.stringContaining("outside")
  );
  expect(p.onChange).toHaveBeenCalledWith(
    expect.objectContaining({ acknowledgeExternalRecipient: true })
  );
  rerender(
    <CollectTradeForm
      {...p}
      draft={{ ...p.draft, acknowledgeExternalRecipient: true }}
    />
  );
  expect(
    screen.getByRole("button", { name: "Review exact terms" })
  ).toBeEnabled();
  fireEvent.change(screen.getByLabelText("Delivery address"), {
    target: { value: own },
  });
  expect(p.onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({
      recipient: own,
      acknowledgeExternalRecipient: false,
    })
  );
});
it("keeps new offers signer-recipient only", () => {
  const p = props();
  render(<CollectTradeForm {...p} action="offer" currencyLabel="WETH" />);
  expect(screen.queryByLabelText("Delivery address")).not.toBeInTheDocument();
  expect(
    screen.getByText(
      "An accepted offer delivers the NFT to the wallet that signs the offer."
    )
  ).toBeInTheDocument();
});

it("labels one day and multiple days correctly", () => {
  render(<CollectTradeForm {...props()} action="offer" currencyLabel="WETH" />);
  expect(screen.getByRole("option", { name: "1 day" })).toHaveValue("24");
  expect(screen.getByRole("option", { name: "7 days" })).toHaveValue("168");
  expect(screen.getByRole("option", { name: "30 days" })).toHaveValue("720");
});
