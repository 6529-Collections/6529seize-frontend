import CollectBatchQuoteReview from "@/components/collect/CollectBatchQuoteReview";
import { formatCollectReviewCap } from "@/components/collect/collect-review-presentation";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { formatEther } from "viem";
import { batchFixture, FREN, PAYER } from "./market-batch.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
}));
function props() {
  const { operation } = batchFixture();
  return {
    operation,
    items: [],
    busy: false,
    onConfirm: jest.fn(async () => {}),
    onEdit: jest.fn(),
    onClose: jest.fn(),
  };
}
const continueButton = () =>
  screen.getByRole("button", { name: "Continue in wallet" });

it("keeps every exact allocation reachable with separate payer, one maximum and action above disclosures", () => {
  const p = props();
  render(
    <CollectBatchQuoteReview
      {...p}
      walletNames={{ [PAYER.toLowerCase()]: "payer.eth" }}
    />
  );
  expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  expect(
    screen.getByText("Purchase total, including fees").parentElement
  ).toHaveTextContent(`${formatEther(BigInt(p.operation.total_wei))} ETH`);
  const gas = BigInt(p.operation.transaction!.gas_reserve_wei!);
  const max = (BigInt(p.operation.total_wei) + gas).toString();
  expect(screen.getByText("Maximum total").parentElement).toHaveTextContent(
    `${formatCollectReviewCap("en-US", max, 5)} ETH`
  );
  const list = screen.getAllByRole("listitem");
  expect(list).toHaveLength(2);
  for (const row of list) {
    for (const summary of row.querySelectorAll("summary"))
      fireEvent.click(summary);
  }
  expect(within(list[0]!).getByText(FREN)).toBeVisible();
  expect(within(list[1]!).getByText(PAYER)).toBeVisible();
  expect(within(list[1]!).getByText(FREN)).toBeVisible();
  expect(within(list[1]!).getByText("payer.eth")).toBeVisible();
  expect(screen.getByText("Pay with")).toBeVisible();
  expect(list[1]).toHaveTextContent(
    `${formatEther(BigInt(p.operation.items[1]!.amount_wei))} ETH`
  );
  expect(
    screen.getByText(
      "Unused gas is not charged. A failed transaction can still use gas."
    )
  ).toBeVisible();
  expect(screen.getByText("Exact maximum total")).not.toBeVisible();
  expect(
    continueButton().compareDocumentPosition(
      screen.getByText("Price breakdown")
    ) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  fireEvent.click(continueButton());
  expect(p.onConfirm).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Edit purchase" }));
  expect(p.onEdit).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText("Price breakdown"));
  expect(screen.getByText("Exact maximum total")).not.toBeVisible();
  fireEvent.click(screen.getByText("Exact amounts"));
  expect(
    screen.getByText("Exact maximum total").parentElement
  ).toHaveTextContent(`${formatEther(BigInt(max))} ETH`);
  expect(
    screen.getByText("Exact network fee cap").parentElement
  ).toHaveTextContent(`${formatEther(gas)} ETH`);
});

it("cannot confirm without a reviewed gas cap, while busy, or with a controller blocker", () => {
  const p = props();
  const rendered = render(<CollectBatchQuoteReview {...p} busy />);
  fireEvent.click(continueButton());
  expect(p.onConfirm).not.toHaveBeenCalled();
  rendered.rerender(
    <CollectBatchQuoteReview {...p} disabledReason="Review changed" />
  );
  expect(screen.getByText("Review changed")).toBeVisible();
  expect(continueButton()).toBeDisabled();
  rendered.rerender(<CollectBatchQuoteReview {...p} canEdit={false} />);
  expect(
    screen.queryByRole("button", { name: "Edit purchase" })
  ).not.toBeInTheDocument();
  const operation = { ...p.operation };
  delete operation.transaction;
  rendered.rerender(<CollectBatchQuoteReview {...p} operation={operation} />);
  expect(screen.getByText("Gas quote unavailable")).toBeVisible();
  expect(continueButton()).toBeDisabled();
  expect(screen.queryByText("Maximum total")).not.toBeInTheDocument();
  rendered.rerender(
    <CollectBatchQuoteReview
      {...p}
      operation={{
        ...p.operation,
        state: ApiMarketBatchOperationStateEnum.Submitted,
      }}
    />
  );
  expect(
    screen.queryByRole("button", { name: "Continue in wallet" })
  ).not.toBeInTheDocument();
});

it.each([0, Date.now() - 60_000])(
  "leaves refresh authority with the controller and does not display deadline %s",
  (expires_at) => {
    const p = props();
    render(
      <CollectBatchQuoteReview
        {...p}
        operation={{ ...p.operation, expires_at }}
      />
    );
    fireEvent.click(screen.getByText("Contract details"));
    expect(
      screen.queryByText(/1970|Review valid until|Quote valid until/)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Price and availability are checked again before your wallet opens."
      )
    ).toBeVisible();
    expect(continueButton()).toBeEnabled();
  }
);
