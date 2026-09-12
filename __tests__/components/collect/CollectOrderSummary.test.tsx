import CollectOrderSummary from "@/components/collect/CollectOrderSummary";
import type { CollectTradeReview } from "@/components/collect/collect.types";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import {
  ApiMarketOperationStateEnum,
  type ApiMarketOperation,
} from "@/generated/models/ApiMarketOperation";
import { ApiMarketTransactionPurposeEnum } from "@/generated/models/ApiMarketTransaction";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { getAddress } from "viem";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const wallet = "0x1111111111111111111111111111111111111111";
const exchange = "0x0000000000000068f116a894984e2db1123eb395";
const operation: ApiMarketOperation = {
  id: "review",
  revision: "1",
  profile_id: "profile",
  state: ApiMarketOperationStateEnum.Review,
  kind: ApiMarketKind.Offer,
  wallet,
  recipient: wallet,
  recipient_in_profile: true,
  asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:545",
  quantity: "2",
  currency: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  total_wei: "40000000000000000",
  net_wei: "39600000000000000",
  fees: [
    {
      recipient: "0x2222222222222222222222222222222222222222",
      amount_wei: "400000000000000",
    },
  ],
  approval_transactions: [],
  potential_liability_wei: "80000000000000000",
  expires_at: 0,
  updated_at: 0,
};
function show(
  overrides: Partial<ApiMarketOperation> = {},
  action: CollectTradeReview["action"] = "offer"
) {
  const review: CollectTradeReview = {
    id: "review",
    revision: "1",
    action,
    title: "Age of Memes",
    facts: [],
    technicalFacts: [{ label: "Approval scope", value: "Currency amount" }],
    warnings: [],
    totalLabel: "0.04 WETH",
    totalDescription: "Offer amount",
    expiresAt: null,
    orderReview: {
      operation: { ...operation, ...overrides },
      walletName: "collector.eth",
    },
  };
  return render(
    <CollectOrderSummary
      review={review}
      actionSlot={<button>Continue in wallet</button>}
    />
  );
}
it("keeps offer payment, delivery and full liability inspectable before signing", () => {
  show();
  expect(screen.getByText("Pay with")).toBeVisible();
  expect(screen.getByText("Deliver to")).toBeVisible();
  expect(screen.getByText(/Quantity: 2/)).toBeVisible();
  const breakdown = screen.getByText("Price breakdown");
  expect(
    screen
      .getByRole("button", { name: "Continue in wallet" })
      .compareDocumentPosition(breakdown)
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  fireEvent.click(breakdown);
  expect(screen.getByText("0.08")).toBeInTheDocument();
  expect(screen.queryByText("Network fee cap")).not.toBeInTheDocument();
});
it("shows the accepted NFT destination separately from the seller's payment wallet", () => {
  const recipient = "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0";
  show({ kind: ApiMarketKind.Accept, nft_recipient: recipient }, "accept");

  const delivery = screen.getByText("Deliver to").closest("details")!;
  expect(within(delivery).queryByText("collector.eth")).not.toBeInTheDocument();
  const address = within(delivery).getByText(getAddress(recipient));
  expect(address).not.toBeVisible();
  fireEvent.click(within(delivery).getByText("Deliver to"));
  expect(address).toBeVisible();
  expect(
    within(delivery).getByRole("button", { name: "Copy wallet address" })
  ).toHaveAccessibleDescription(`Deliver to ${getAddress(recipient)}`);

  const payment = screen.getByText("Receive payment").closest("details")!;
  expect(within(payment).getByText("collector.eth")).toBeVisible();
  fireEvent.click(within(payment).getByText("Receive payment"));
  expect(within(payment).getByText(wallet)).toBeVisible();
});
it("retains exact gas while the summary rounds the cap upward", () => {
  show({
    transaction: {
      chain_id: 1,
      to: exchange,
      sender: wallet,
      value: "0",
      data: "0x",
      purpose: ApiMarketTransactionPurposeEnum.Fulfill,
      gas_reserve_wei: "18292083808592",
    },
  });
  const cap = screen.getByText("Network fee cap").parentElement!;
  expect(within(cap).getByText(/0.0000183/)).toBeInTheDocument();
  fireEvent.click(screen.getByText("Price breakdown"));
  fireEvent.click(screen.getByText("Exact amounts"));
  expect(screen.getByText(/0.000018292083808592/)).toBeInTheDocument();
});
it("does not brand an unknown fee recipient as OpenSea and retains approval terms", () => {
  show();
  fireEvent.click(screen.getByText("Contract details"));
  expect(screen.getByText("Unknown recipient")).toBeInTheDocument();
  expect(screen.queryByText("OpenSea fee")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Order details"));
  expect(screen.getByText("Currency amount")).toBeInTheDocument();
});
