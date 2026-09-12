import CollectPurchaseSummary from "@/components/collect/CollectPurchaseSummary";
import CollectTradeSheet from "@/components/collect/CollectTradeSheet";
import type {
  CollectPurchaseReviewView,
  CollectTradeReview,
} from "@/components/collect/collect.types";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { getAddress } from "viem";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: () => null,
}));
const PAYER = "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0";
const RECIPIENT = "0xfdf8bcf56af0584026f9db963381db72c5cc8e3b";
const NFT = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const EXCHANGE = "0x0000000000000068f116a894984e2db1123eb395";
const OPENSEA = "0x0000a26b00c1f0df003000390027140000faa719";
const purchase: CollectPurchaseReviewView = {
  chainId: 1,
  nftContract: NFT,
  exchangeContract: EXCHANGE,
  amounts: {
    purchaseWei: "652900000000000000",
    feesWei: "6529000000000000",
    networkFeeCapWei: "25104378893752",
    maximumTotalWei: "652925104378893752",
  },
  currency: "ETH",
  artworkLabel: "The Memes #545",
  quantity: "1",
  payerAddress: PAYER,
  payerName: "punk6529bot.eth",
  recipientAddress: PAYER,
  recipientName: "punk6529bot.eth",
  recipientInProfile: true,
  netWei: "646371000000000000",
  fees: [{ amountWei: "6529000000000000", recipient: OPENSEA }],
  approvalFeeCaps: [],
  contractFacts: [{ label: "Listing expires", value: "Oct 7, 2026, 8:54 PM" }],
};
function summary(overrides: Partial<CollectPurchaseReviewView> = {}) {
  return render(
    <CollectPurchaseSummary
      purchase={{ ...purchase, ...overrides }}
      title="Open Source"
      actionSlot={<button type="button">Continue in wallet</button>}
    />
  );
}
function fact(label: string) {
  return screen.getByText(label).parentElement;
}

it("rounds the maximum up to five decimals and keeps exact fees and gas in nested collapsed details", () => {
  summary();
  expect(screen.getByRole("heading", { name: "Open Source" })).toBeVisible();
  expect(fact("Purchase price")).toHaveTextContent("0.6529 ETH");
  expect(fact("Network fee cap")).toHaveTextContent("0.00002511 ETH");
  expect(fact("Maximum total")).toHaveTextContent("0.65293 ETH");
  expect(screen.getByText("Exact maximum total")).not.toBeVisible();
  expect(screen.getByText("OpenSea fee")).not.toBeVisible();
  fireEvent.click(screen.getByText("Price breakdown"));
  expect(fact("Seller receives")).toHaveTextContent("0.646371 ETH");
  expect(fact("OpenSea fee")).toHaveTextContent("0.006529 ETH");
  expect(screen.getByText("Fees included")).toBeVisible();
  expect(screen.getByText("Exact maximum total")).not.toBeVisible();
  fireEvent.click(screen.getByText("Exact amounts"));
  expect(fact("Exact maximum total")).toHaveTextContent(
    "0.652925104378893752 ETH"
  );
  expect(fact("Exact network fee cap")).toHaveTextContent(
    "0.000025104378893752 ETH"
  );
});

it("keeps Pay with and Deliver to separate for the same wallet and places the action before disclosures", () => {
  summary();
  expect(screen.getByText("Pay with")).toBeVisible();
  expect(screen.getByText("Deliver to")).toBeVisible();
  expect(screen.getAllByText("punk6529bot.eth")).toHaveLength(2);
  const addresses = screen.getAllByText(getAddress(PAYER));
  expect(addresses).toHaveLength(2);
  addresses.forEach((address) => expect(address).not.toBeVisible());
  fireEvent.click(screen.getByText("Deliver to"));
  expect(addresses[1]).toBeVisible();
  expect(addresses[0]).not.toBeVisible();
  expect(
    within(screen.getByText("Deliver to").closest("details")!).getByRole(
      "button",
      { name: "Copy wallet address" }
    )
  ).toBeVisible();
  const action = screen.getByRole("button", { name: "Continue in wallet" });
  expect(
    screen
      .getByText("Deliver to")
      .compareDocumentPosition(screen.getByText("Maximum total")) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    screen.getByText("Maximum total").compareDocumentPosition(action) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  for (const label of ["Price breakdown", "Contract details"]) {
    expect(
      action.compareDocumentPosition(screen.getByText(label)) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  }
});

it("keeps an external destination marker visible and never borrows the payer name", () => {
  summary({
    recipientAddress: RECIPIENT,
    recipientName: undefined,
    recipientInProfile: false,
  });
  expect(screen.getByText("Outside the collecting profile")).toBeVisible();
  expect(screen.getAllByText("punk6529bot.eth")).toHaveLength(1);
  expect(screen.getByText(getAddress(RECIPIENT))).not.toBeVisible();
  fireEvent.click(screen.getByText("Deliver to"));
  expect(screen.getByText(getAddress(RECIPIENT))).toBeVisible();
});

it("names only exact role and chain identities while every contract address stays reachable", () => {
  summary();
  expect(screen.getByText("The Memes")).not.toBeVisible();
  fireEvent.click(screen.getByText("Contract details"));
  expect(screen.getByText("The Memes")).toBeVisible();
  expect(screen.getByText("Seaport 1.6")).toBeVisible();
  expect(screen.getByText("OpenSea")).toBeVisible();
  expect(screen.getByText(getAddress(NFT))).not.toBeVisible();
  fireEvent.click(screen.getByText("The Memes"));
  expect(screen.getByText(getAddress(NFT))).toBeVisible();
  expect(screen.getByText("Listing expires")).toBeVisible();
});

it.each(["ETH", "WETH"] as const)(
  "never invents a maximum without gas for %s",
  (currency) => {
    summary({
      currency,
      amounts: {
        ...purchase.amounts,
        networkFeeCapWei: null,
        maximumTotalWei: null,
      },
    });
    expect(screen.queryByText("Maximum total")).not.toBeInTheDocument();
    expect(fact("Purchase price")).toHaveTextContent(`0.6529 ${currency}`);
    expect(screen.getByText("Not available yet")).toBeVisible();
    expect(screen.queryByText("At most")).not.toBeInTheDocument();
  }
);

it("keeps WETH price and ETH gas separate even if an inconsistent view supplies a total", () => {
  summary({ currency: "WETH" });
  expect(fact("Purchase price")).toHaveTextContent("0.6529 WETH");
  expect(fact("Network fee cap")).toHaveTextContent("0.00002511 ETH");
  expect(screen.queryByText("Maximum total")).not.toBeInTheDocument();
  expect(screen.queryByText("Exact maximum total")).not.toBeInTheDocument();
});
it.each([null, 0, Number.NaN])(
  "keeps deadline %s out of the presentation and delegates the exact review identity to automatic validation",
  async (expiresAt) => {
    const onConfirm = jest.fn(async () => undefined);
    const onRefresh = jest.fn();
    const review: CollectTradeReview = {
      id: "review",
      revision: "exact-revision",
      action: "buy",
      title: "Open Source",
      facts: [],
      technicalFacts: [],
      totalLabel: "0.6529 ETH",
      totalDescription: "Purchase amount",
      warnings: [],
      expiresAt,
      purchase,
    };
    render(
      <CollectTradeSheet
        open
        compact
        presentation="contents"
        review={review}
        stage="review"
        onClose={jest.fn()}
        onRefresh={onRefresh}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByText("Contract details"));
    expect(
      screen.queryByText(/1970|Quote valid until|quote needs an update/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Refresh quote" })
    ).not.toBeInTheDocument();
    expect(fact("Purchase price")).toHaveTextContent("0.6529 ETH");
    fireEvent.click(screen.getByText("Deliver to"));
    expect(
      within(screen.getByText("Deliver to").closest("details")!).getByText(
        getAddress(PAYER)
      )
    ).toBeVisible();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Continue in wallet" })
      );
    });
    expect(onConfirm).toHaveBeenCalledWith("review", "exact-revision");
    expect(onRefresh).not.toHaveBeenCalled();
  }
);
