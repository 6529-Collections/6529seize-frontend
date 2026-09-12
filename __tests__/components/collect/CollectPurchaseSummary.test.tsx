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
const purchase: CollectPurchaseReviewView = {
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
  fees: [{ amountWei: "6529000000000000", recipient: RECIPIENT }],
  approvalFeeCaps: [],
  contractFacts: [{ label: "Listing expires", value: "Oct 7, 2026, 8:54 PM" }],
};

function summary(overrides: Partial<CollectPurchaseReviewView> = {}) {
  return render(
    <CollectPurchaseSummary
      purchase={{ ...purchase, ...overrides }}
      title="Open Source"
    />
  );
}

it("shows included fees once in the price and rounds the maximum upward while keeping exact details", () => {
  summary();
  expect(screen.getByRole("heading", { name: "Open Source" })).toBeVisible();
  expect(screen.getByText("Purchase price")).toBeVisible();
  expect(screen.getByText("0.6529 ETH")).toBeVisible();
  expect(screen.getByText("Includes 0.006529 ETH in order fees")).toBeVisible();
  expect(screen.getByText("Up to 0.00002511 ETH")).toBeVisible();
  expect(screen.getByText("Up to 0.65292511 ETH")).toBeVisible();
  expect(screen.getByText("0.652925104378893752 ETH")).not.toBeVisible();
  fireEvent.click(screen.getByText("Transaction details"));
  expect(screen.getByText("0.652925104378893752 ETH")).toBeVisible();
  expect(screen.getByText("0.000025104378893752 ETH")).toBeVisible();
  expect(screen.getByText("0.646371 ETH")).toBeVisible();
  expect(screen.getByText("0.006529 ETH")).toBeVisible();
});

it("combines identical paying and receiving wallets without hiding the full address", () => {
  summary();
  expect(screen.getByText("Pay with & deliver to")).toBeVisible();
  expect(screen.getAllByText(getAddress(PAYER))).toHaveLength(1);
  expect(screen.getByText("punk6529bot.eth")).toBeVisible();
  expect(screen.getByText("In the collecting profile")).toBeVisible();
  expect(
    screen.getAllByRole("button", { name: "Copy wallet address" })
  ).toHaveLength(1);
});

it("keeps a third-party recipient separate and does not borrow the payer's name", () => {
  summary({
    recipientAddress: RECIPIENT,
    recipientName: undefined,
    recipientInProfile: false,
  });
  expect(screen.getByText("Pay with")).toBeVisible();
  expect(screen.getByText("Deliver to")).toBeVisible();
  expect(screen.getByText("Outside the collecting profile")).toBeVisible();
  expect(screen.getByText(getAddress(RECIPIENT))).toBeVisible();
  expect(screen.getAllByText("punk6529bot.eth")).toHaveLength(1);
  expect(
    screen.getAllByRole("button", { name: "Copy wallet address" })
  ).toHaveLength(2);
});

it.each(["ETH", "WETH"] as const)(
  "does not claim a complete maximum when gas is unknown for %s",
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
    expect(screen.getByText(`0.6529 ${currency}`)).toBeVisible();
    expect(screen.getByText("Not available yet")).toBeVisible();
    expect(screen.queryByText(/Up to/)).not.toBeInTheDocument();
  }
);

it("keeps a WETH price and ETH gas separate instead of adding different currencies", () => {
  summary({
    currency: "WETH",
    amounts: { ...purchase.amounts, maximumTotalWei: null },
  });
  expect(screen.getByText("0.6529 WETH")).toBeVisible();
  expect(screen.getByText("Up to 0.00002511 ETH")).toBeVisible();
  expect(screen.queryByText("Maximum total")).not.toBeInTheDocument();
});

it.each([null, 0, Number.NaN])(
  "presents deadline %s as a refresh requirement without dating it to 1970",
  (expiresAt) => {
    const onConfirm = jest.fn(async () => undefined);
    const onRefresh = jest.fn();
    const review: CollectTradeReview = {
      id: "review",
      revision: "revision",
      action: "buy",
      title: "Open Source",
      facts: [],
      technicalFacts: [],
      totalLabel: "0.6529 ETH",
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
    fireEvent.click(screen.getByText("Transaction details"));
    expect(
      screen.queryByText(/1970|Quote valid until|quote needs an update/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Refresh quote to continue. Your purchase choices are kept."
      )
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Continue to wallet" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh quote" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  }
);

it("refreshes a reset quote without confirming it or discarding its recipient and price", async () => {
  const review: CollectTradeReview = {
    id: "review",
    revision: "exact-revision",
    action: "buy",
    title: "Open Source",
    facts: [],
    technicalFacts: [],
    totalLabel: "0.6529 ETH",
    warnings: [],
    expiresAt: null,
    purchase,
  };
  const onConfirm = jest.fn(async () => undefined);
  const onRefresh = jest.fn();
  const { rerender } = render(
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
  expect(
    screen.queryByRole("button", { name: "Continue to wallet" })
  ).not.toBeInTheDocument();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Refresh quote" }));
  });
  expect(onRefresh).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
  expect(screen.getByText(getAddress(PAYER))).toBeVisible();
  expect(screen.getByText("0.6529 ETH")).toBeVisible();
  rerender(
    <CollectTradeSheet
      open
      compact
      presentation="contents"
      review={{
        ...review,
        revision: "refreshed-revision",
        expiresAt: Date.now() + 60_000,
      }}
      stage="review"
      onClose={jest.fn()}
      onRefresh={onRefresh}
      onConfirm={onConfirm}
    />
  );
  const region = screen.getByRole("region", { name: "Purchase summary" });
  expect(within(region).getByText(getAddress(PAYER))).toBeVisible();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Continue to wallet" }));
  });
  expect(onConfirm).toHaveBeenCalledWith("review", "refreshed-revision");
});
