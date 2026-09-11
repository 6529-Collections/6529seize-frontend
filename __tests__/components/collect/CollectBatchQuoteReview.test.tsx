import CollectBatchQuoteReview from "@/components/collect/CollectBatchQuoteReview";
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

it("shows exact per-NFT prices, full allocated wallets and maximum total with gas", () => {
  const p = props();
  render(<CollectBatchQuoteReview {...p} />);
  expect(
    screen.getByText("Purchase total, including fees").parentElement
  ).toHaveTextContent(`${formatEther(BigInt(p.operation.total_wei))} ETH`);
  const gas = BigInt(p.operation.transaction!.gas_reserve_wei!);
  expect(
    screen.getByText("Maximum total with gas").parentElement
  ).toHaveTextContent(
    `${formatEther(BigInt(p.operation.total_wei) + gas)} ETH`
  );
  const list = screen.getAllByRole("listitem");
  expect(list).toHaveLength(2);
  expect(within(list[0]!).getByText(FREN)).toBeVisible();
  expect(within(list[1]!).getByText(PAYER)).toBeVisible();
  expect(within(list[1]!).getByText(FREN)).toBeVisible();
  expect(
    within(list[1]!).getByText(
      `${formatEther(BigInt(p.operation.items[1]!.amount_wei))} ETH`
    )
  ).toBeVisible();
  expect(
    screen.getByText(
      "Unused gas is not charged. A failed transaction can still use gas."
    )
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: /^Buy / }));
  expect(p.onConfirm).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Edit purchase" }));
  expect(p.onEdit).toHaveBeenCalledTimes(1);
});

it("cannot confirm without a reviewed gas cap, while busy, or with a controller blocker", () => {
  const p = props();
  const rendered = render(<CollectBatchQuoteReview {...p} busy />);
  fireEvent.click(screen.getByRole("button", { name: /^Buy / }));
  expect(p.onConfirm).not.toHaveBeenCalled();
  rendered.rerender(
    <CollectBatchQuoteReview {...p} disabledReason="Review changed" />
  );
  expect(screen.getByRole("status")).toHaveTextContent("Review changed");
  expect(screen.getByRole("button", { name: /^Buy / })).toBeDisabled();
  rendered.rerender(<CollectBatchQuoteReview {...p} canEdit={false} />);
  expect(
    screen.queryByRole("button", { name: "Edit purchase" })
  ).not.toBeInTheDocument();
  const operation = { ...p.operation };
  delete operation.transaction;
  rendered.rerender(<CollectBatchQuoteReview {...p} operation={operation} />);
  expect(screen.getByText("Gas quote unavailable")).toBeVisible();
  expect(screen.getByRole("button", { name: /^Buy / })).toBeDisabled();
  rendered.rerender(
    <CollectBatchQuoteReview
      {...p}
      operation={{
        ...p.operation,
        state: ApiMarketBatchOperationStateEnum.Submitted,
      }}
    />
  );
  expect(screen.getByRole("button", { name: /^Buy / })).toBeDisabled();
});
