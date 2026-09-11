import CollectBatchReviewForm from "@/components/collect/CollectBatchReviewForm";
import type { CollectSelectedListing } from "@/components/collect/collect-selection.helpers";
import type { CollectBatchDraft } from "@/components/collect/collect-batch.types";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiMarketTradeOrderSideEnum } from "@/generated/models/ApiMarketTradeOrder";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
} from "@/components/collect/market-validation";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
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
const own = "0x2222222222222222222222222222222222222222";
const fren = "0x3333333333333333333333333333333333333333";
const other = "0x4444444444444444444444444444444444444444";
const maker = "0x5555555555555555555555555555555555555555";
function item(id: number, quantity = "1"): CollectSelectedListing {
  const contract = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
  const assetKey = `1:${contract}:${id}`;
  return {
    asset: {
      asset_key: assetKey,
      chain_id: 1,
      contract,
      token_id: String(id),
      name: `Artwork ${id}`,
      family: ApiCollectFamily.Memes,
      image_url: null,
      artist_ids: [],
      season: 1,
      traits: [],
      hodl_rate: 1,
      tdh_eligible: true,
    },
    quantity,
    order: {
      identity: {
        protocol_address: MARKET_SEAPORT,
        order_hash: `0x${String(id).padStart(64, "0")}`,
      },
      asset_key: assetKey,
      maker,
      side: ApiMarketTradeOrderSideEnum.Listing,
      quantity,
      currency: MARKET_ZERO,
      total_wei: "100000000000000000",
      net_wei: "100000000000000000",
      fees: [],
      start_time: "1",
      end_time: "9999999999",
      recipient: MARKET_ZERO,
    },
  };
}
function props(): ComponentProps<typeof CollectBatchReviewForm> & {
  onPrepare: jest.Mock<void, [CollectBatchDraft]>;
} {
  return {
    items: [item(1), item(2)],
    profile: {
      id: "profile",
      primary_wallet: own,
      wallets: [
        { wallet: payer, display: "payer.eth", tdh: 0 },
        { wallet: own, display: "custody.eth", tdh: 1 },
      ],
    } as ApiIdentity,
    payingWallet: payer,
    onPrepare: jest.fn(),
    onClose: jest.fn(),
  };
}
function review() {
  return screen.getByRole("button", { name: "Review live total" });
}
function artwork(number: number) {
  return within(
    screen
      .getByRole("checkbox", { name: `Select Artwork ${number}` })
      .closest("li")!
  );
}
function customize(number: number) {
  fireEvent.click(
    screen.getByRole("button", {
      name: `Change delivery for Artwork ${number}`,
    })
  );
}
function changeDefault(address: string) {
  const group = screen.getByRole("group", { name: "Default delivery" });
  fireEvent.click(within(group).getByRole("button", { name: "Change" }));
  fireEvent.change(within(group).getByLabelText("Delivery address"), {
    target: { value: address },
  });
}

it("starts with all NFTs and the confirmed paying wallet, preserving exact order snapshots", () => {
  const p = props();
  render(<CollectBatchReviewForm {...p} />);
  expect(screen.getByText("payer.eth")).toBeVisible();
  expect(screen.getByText("Estimated total 0.2 ETH")).toBeVisible();
  fireEvent.click(review());
  expect(p.onPrepare).toHaveBeenCalledWith({
    items: p.items.map((entry) => ({
      ...entry,
      allocations: [
        {
          recipient: payer,
          quantity: entry.quantity,
          acknowledgeExternalRecipient: false,
        },
      ],
    })),
  });
});
it("selects some or none without substituting a listing and updates the total", () => {
  const p = props();
  render(<CollectBatchReviewForm {...p} />);
  fireEvent.click(screen.getByRole("checkbox", { name: "Select Artwork 1" }));
  expect(
    screen.getByRole("checkbox", { name: "Select all" })
  ).toBePartiallyChecked();
  expect(screen.getByText("Estimated total 0.1 ETH")).toBeVisible();
  fireEvent.click(review());
  expect(p.onPrepare.mock.calls[0]![0].items).toHaveLength(1);
  expect(p.onPrepare.mock.calls[0]![0].items[0]!.order).toBe(p.items[1]!.order);
  fireEvent.click(screen.getByRole("checkbox", { name: "Select all" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Select all" }));
  expect(review()).toBeDisabled();
});
it("preserves an explicit plan destination and requires consent for that exact external address", () => {
  const p = props();
  render(<CollectBatchReviewForm {...p} initialRecipient={fren} />);
  expect(screen.queryByText("payer.eth")).not.toBeInTheDocument();
  expect(review()).toBeDisabled();
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I have checked this destination/ })
  );
  fireEvent.click(review());
  expect(p.onPrepare.mock.calls[0]![0].items[0]!.allocations[0]).toEqual({
    recipient: fren,
    quantity: "1",
    acknowledgeExternalRecipient: true,
  });
  changeDefault(other);
  expect(review()).toBeDisabled();
  expect(
    screen.getByRole("checkbox", { name: /I have checked this destination/ })
  ).not.toBeChecked();
});
it("keeps a per-NFT override when the default destination changes", () => {
  const p = props();
  render(<CollectBatchReviewForm {...p} />);
  customize(1);
  fireEvent.click(artwork(1).getByRole("button", { name: "Change" }));
  fireEvent.change(artwork(1).getByLabelText("Delivery address"), {
    target: { value: own },
  });
  changeDefault(fren);
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I have checked this destination/ })
  );
  fireEvent.click(review());
  expect(
    p.onPrepare.mock.calls[0]![0].items.map(
      (entry) => entry.allocations[0]!.recipient
    )
  ).toEqual([own, fren]);
  fireEvent.click(
    artwork(1).getByRole("button", { name: "Use default delivery" })
  );
  fireEvent.click(review());
  expect(
    p.onPrepare.mock.calls[1]![0].items.map(
      (entry) => entry.allocations[0]!.recipient
    )
  ).toEqual([fren, fren]);
});
it("distributes an indivisible purchased lot into exact copies without changing its seller fill quantity", () => {
  const p = { ...props(), items: [item(1, "3")] };
  render(<CollectBatchReviewForm {...p} />);
  customize(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Split to another wallet" })
  );
  expect(review()).toBeDisabled();
  const changes = artwork(1).getAllByRole("button", { name: "Change" });
  fireEvent.click(changes[1]!);
  fireEvent.change(artwork(1).getByLabelText("Delivery address"), {
    target: { value: fren },
  });
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I have checked this destination/ })
  );
  fireEvent.click(review());
  expect(p.onPrepare).toHaveBeenCalledWith({
    items: [
      {
        ...p.items[0],
        allocations: [
          {
            recipient: payer,
            quantity: "2",
            acknowledgeExternalRecipient: false,
          },
          {
            recipient: fren,
            quantity: "1",
            acknowledgeExternalRecipient: true,
          },
        ],
      },
    ],
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: "Destination 1 · Copies" }),
    { target: { value: "3" } }
  );
  expect(review()).toBeDisabled();
  expect(artwork(1).getByRole("alert")).toHaveTextContent(
    "add up to the selected quantity"
  );
  fireEvent.change(
    screen.getByRole("textbox", { name: "Destination 1 · Copies" }),
    { target: { value: "2" } }
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Remove last destination" })
  );
  expect(
    screen.queryByRole("textbox", { name: /Copies/ })
  ).not.toBeInTheDocument();
  expect(review()).toBeEnabled();
});
it("rejects duplicate destinations and invalid, zero or unresolved addresses", () => {
  const p = { ...props(), items: [item(1, "2")] };
  render(<CollectBatchReviewForm {...p} />);
  customize(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Split to another wallet" })
  );
  fireEvent.click(artwork(1).getAllByRole("button", { name: "Change" })[1]!);
  const input = artwork(1).getByLabelText("Delivery address");
  for (const value of [payer, "fren.eth", MARKET_ZERO, "not-an-address"]) {
    fireEvent.change(input, { target: { value } });
    expect(review()).toBeDisabled();
    fireEvent.submit(screen.getByRole("form", { name: "Review purchase" }));
    expect(p.onPrepare).not.toHaveBeenCalled();
  }
});
it("resets consent when membership, payer, listing terms, or explicit destination change", () => {
  const p = props();
  const rendered = render(
    <CollectBatchReviewForm {...p} initialRecipient={fren} />
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I have checked this destination/ })
  );
  rendered.rerender(
    <CollectBatchReviewForm
      {...p}
      initialRecipient={fren}
      profile={{
        ...p.profile!,
        wallets: [{ wallet: payer, display: "payer.eth", tdh: 0 }],
      }}
    />
  );
  expect(review()).toBeDisabled();
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I have checked this destination/ })
  );
  rendered.rerender(
    <CollectBatchReviewForm {...p} initialRecipient={fren} payingWallet={own} />
  );
  expect(review()).toBeDisabled();
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I have checked this destination/ })
  );
  rendered.rerender(
    <CollectBatchReviewForm
      {...p}
      initialRecipient={fren}
      items={p.items.map((entry) => ({
        ...entry,
        order: { ...entry.order, total_wei: "200000000000000000" },
      }))}
    />
  );
  expect(review()).toBeDisabled();
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I have checked this destination/ })
  );
  rendered.rerender(<CollectBatchReviewForm {...p} initialRecipient={other} />);
  expect(review()).toBeDisabled();
});
it("preserves consent on an equivalent rerender and clears only the changed NFT destination", () => {
  const p = props();
  const rendered = render(
    <CollectBatchReviewForm {...p} initialRecipient={fren} />
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I have checked this destination/ })
  );
  customize(1);
  rendered.rerender(
    <CollectBatchReviewForm
      {...p}
      initialRecipient={fren}
      profile={{ ...p.profile!, wallets: [...p.profile!.wallets!].reverse() }}
    />
  );
  expect(review()).toBeEnabled();
  fireEvent.click(artwork(1).getByRole("button", { name: "Change" }));
  fireEvent.change(artwork(1).getByLabelText("Delivery address"), {
    target: { value: other },
  });
  expect(review()).toBeDisabled();
  expect(
    artwork(1).getByRole("checkbox", {
      name: /I have checked this destination/,
    })
  ).not.toBeChecked();
  expect(
    within(screen.getByRole("group", { name: "Default delivery" })).getByRole(
      "checkbox",
      { name: /I have checked this destination/ }
    )
  ).toBeChecked();
});
it("enforces order and allocation limits, allowing selection to be reduced", () => {
  const p = props();
  const rendered = render(<CollectBatchReviewForm {...p} maxItems={1} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Select up to 1");
  expect(review()).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: "Select Artwork 2" }));
  expect(review()).toBeEnabled();
  rendered.rerender(
    <CollectBatchReviewForm {...p} items={[item(1, "2")]} maxAllocations={1} />
  );
  customize(1);
  expect(
    screen.getByRole("button", { name: "Split to another wallet" })
  ).toBeDisabled();
});
it("does not split single copies, prepare while loading, or bypass a disabled trading capability", () => {
  const p = props();
  const rendered = render(<CollectBatchReviewForm {...p} />);
  customize(1);
  expect(
    screen.queryByRole("button", { name: "Split to another wallet" })
  ).not.toBeInTheDocument();
  rendered.rerender(<CollectBatchReviewForm {...p} loading />);
  expect(review()).toBeDisabled();
  fireEvent.submit(screen.getByRole("form", { name: "Review purchase" }));
  rendered.rerender(
    <CollectBatchReviewForm {...p} disabledReason="Trading unavailable" />
  );
  fireEvent.submit(screen.getByRole("form", { name: "Review purchase" }));
  expect(p.onPrepare).not.toHaveBeenCalled();
});
