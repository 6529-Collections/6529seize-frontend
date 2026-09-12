import CollectTradeForm from "@/components/collect/CollectTradeForm";
import { useState, type ComponentProps } from "react";
import { formatCollectCustomExpiryInput } from "@/components/collect/collect-custom-expiry";
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
  expect(screen.getByText(`Paying wallet: ${own}`)).toBeInTheDocument();
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

it("locks a planned offer quantity and exposes the edit hint", () => {
  const p = props();
  render(
    <CollectTradeForm
      {...p}
      action="offer"
      currencyLabel="WETH"
      fixedOfferQuantity="2"
    />
  );

  const quantity = screen.getByRole("textbox", { name: "Quantity" });
  expect(quantity).toHaveAttribute("readonly");
  expect(quantity).toHaveAccessibleDescription("Edit in offer plan");
  fireEvent.change(quantity, { target: { value: "3" } });
  expect(p.onChange).not.toHaveBeenCalled();
});

it.each(["offer", "list"] as const)(
  "keeps a standalone %s quantity editable without a fixed plan",
  (action) => {
    const p = props();
    render(
      <CollectTradeForm
        {...p}
        action={action}
        currencyLabel={action === "offer" ? "WETH" : "ETH"}
      />
    );

    const quantity = screen.getByDisplayValue("2");
    expect(quantity).not.toHaveAttribute("readonly");
    fireEvent.change(quantity, { target: { value: "3" } });
    expect(p.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: "3" })
    );
  }
);

it("offers quick durations and a custom expiry without submitting the form", async () => {
  const p = props();
  render(<CollectTradeForm {...p} action="offer" currencyLabel="WETH" />);
  fireEvent.keyDown(screen.getByRole("button", { name: "Order duration" }), {
    key: "Enter",
  });
  expect(
    await screen.findByRole("option", { name: "1 day" })
  ).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "7 days" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "30 days" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("option", { name: "Custom…" }));
  expect(p.onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      expiryHours: "custom",
      expiryDateTime: expect.any(String),
    })
  );
  expect(p.onPrepare).not.toHaveBeenCalled();
});

it.each(["offer", "list"] as const)(
  "keeps a custom %s date editable and sends the chosen draft",
  (action) => {
    const p = props();
    const custom = formatCollectCustomExpiryInput(Date.now() + 2 * 86_400_000);
    function Form() {
      const [draft, setDraft] = useState({
        ...p.draft,
        unitPriceEth: "0.1",
        expiryHours: "custom",
        expiryDateTime: custom,
      });
      return (
        <CollectTradeForm
          {...p}
          action={action}
          draft={draft}
          onChange={(next) =>
            setDraft({ ...next, expiryDateTime: next.expiryDateTime ?? "" })
          }
        />
      );
    }
    render(<Form />);
    expect(screen.getByLabelText("Expiry date and time")).toHaveValue(custom);
    expect(screen.getByText(/Your timezone:/)).toBeInTheDocument();
    const chosen = formatCollectCustomExpiryInput(Date.now() + 3 * 86_400_000);
    fireEvent.change(screen.getByLabelText("Expiry date and time"), {
      target: { value: chosen },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review exact terms" }));
    expect(p.onPrepare).toHaveBeenCalledWith(
      expect.objectContaining({
        expiryHours: "custom",
        expiryDateTime: chosen,
        quantity: "2",
        unitPriceEth: "0.1",
      })
    );
  }
);

it("blocks a custom expiry that became too soon while the form stayed open", () => {
  const p = props();
  const now = Date.UTC(2026, 8, 12, 12, 0);
  const clock = jest.spyOn(Date, "now").mockReturnValue(now);
  try {
    const expiryDateTime = formatCollectCustomExpiryInput(now + 6 * 60_000);
    render(
      <CollectTradeForm
        {...p}
        action="offer"
        draft={{
          ...p.draft,
          unitPriceEth: "0.1",
          expiryHours: "custom",
          expiryDateTime,
        }}
      />
    );
    clock.mockReturnValue(now + 2 * 60_000);
    fireEvent.click(screen.getByRole("button", { name: "Review exact terms" }));
    expect(p.onPrepare).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Expiry date and time")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(
      screen.getByText("Choose an expiry at least 5 minutes from now.")
    ).toBeInTheDocument();
  } finally {
    clock.mockRestore();
  }
});
