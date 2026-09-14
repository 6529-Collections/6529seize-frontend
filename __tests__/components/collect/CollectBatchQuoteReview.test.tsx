import CollectBatchQuoteReview from "@/components/collect/CollectBatchQuoteReview";
import { formatCollectReviewCap } from "@/components/collect/collect-review-presentation";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import type CollectReviewRecipient from "@/components/collect/CollectReviewRecipient";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatEther } from "viem";
import { batchFixture, FREN, PAYER } from "./market-batch.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectReviewRecipient", () => ({
  __esModule: true,
  default: ({
    label,
    address,
    disabled,
    onEditingChange,
    onApply,
  }: ComponentProps<typeof CollectReviewRecipient>) => (
    <div>
      <button disabled={disabled} onClick={() => onEditingChange(true)}>
        {label} {address}
      </button>
      <button disabled={disabled} onClick={() => onEditingChange(false)}>
        Cancel {label}
      </button>
      <button disabled={disabled} onClick={() => void onApply(PAYER, false)}>
        Apply {label}
      </button>
    </div>
  ),
}));
function props() {
  const { operation } = batchFixture();
  return {
    operation,
    items: [],
    profile: null,
    busy: false,
    onConfirm: jest.fn(async () => {}),
    onEdit: jest.fn(),
    onClose: jest.fn(),
  };
}
const continueButton = () =>
  screen.getByRole("button", { name: "Continue in wallet" });

it("keeps gas charging explanations in price details and exact changes collapsed beside the summary", () => {
  const notice = {
    summary: "Network fee updated. Your purchase price is unchanged.",
    details: [
      {
        label: "Gas price limit",
        before: "0.083087612 Gwei",
        after: "0.095614148 Gwei",
      },
    ],
  };
  render(
    <CollectBatchQuoteReview
      {...props()}
      message={notice.summary}
      reviewChangeNotice={notice}
    />
  );
  const summary = within(
    screen.getByRole("complementary", { name: "Purchase summary" })
  );
  expect(summary.getByText(notice.summary)).toBeVisible();
  expect(summary.queryByText(/A failed transaction/)).not.toBeInTheDocument();
  expect(screen.getByText(/A failed transaction/)).not.toBeVisible();
  expect(summary.getByText("Updated: 0.095614148 Gwei")).not.toBeVisible();
  fireEvent.click(summary.getByText("View exact changes"));
  expect(summary.getByText("Previous: 0.083087612 Gwei")).toBeVisible();
  expect(summary.getByText("Updated: 0.095614148 Gwei")).toBeVisible();
  fireEvent.click(screen.getByText("Price breakdown"));
  expect(screen.getByText(/A failed transaction/)).toBeVisible();
});

it("keeps every exact allocation reachable with separate payer, one maximum and action above disclosures", () => {
  const p = props();
  render(
    <CollectBatchQuoteReview
      {...p}
      walletNames={{ [PAYER.toLowerCase()]: "payer.eth" }}
    />
  );
  expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  const summary = within(
    screen.getByRole("complementary", { name: "Purchase summary" })
  );
  expect(
    summary.getByText("Purchase total, including fees").parentElement
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
      if (!summary.parentElement?.hasAttribute("open"))
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
  ).not.toBeVisible();
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
  const exact = within(screen.getByText("Exact amounts").parentElement!);
  for (const item of p.operation.items) {
    expect(exact.getByText(item.asset_key).parentElement).toHaveTextContent(
      `${formatEther(BigInt(item.amount_wei))} ETH`
    );
  }
  expect(
    exact.getByText("Purchase total, including fees").parentElement
  ).toHaveTextContent(`${formatEther(BigInt(p.operation.total_wei))} ETH`);
});

it("shows the common delivery once, keeps item exceptions reachable, and fences removal while editing", () => {
  const p = props();
  const operation = {
    ...p.operation,
    items: p.operation.items.map((item) => ({
      ...item,
      allocations: item.allocations.map((allocation) => ({
        ...allocation,
        recipient: PAYER,
        recipient_in_profile: true,
      })),
    })),
  };
  const onRemove = jest.fn(async () => true);
  const onAllRecipientsChange = jest.fn(async () => true);
  const onRecipientChange = jest.fn(async () => true);
  const profile = {
    id: "profile",
    primary_wallet: PAYER,
    wallets: [{ wallet: PAYER, display: "payer.eth", tdh: 0 }],
  } as ApiIdentity;
  const rendered = render(
    <CollectBatchQuoteReview
      {...p}
      operation={operation}
      profile={profile}
      onRemove={onRemove}
      onAllRecipientsChange={onAllRecipientsChange}
      onRecipientChange={onRecipientChange}
    />
  );
  const delivery = screen.getByRole("button", {
    name: `Deliver all to ${PAYER}`,
  });
  expect(delivery).toBeVisible();
  for (const allocation of screen.getAllByRole("button", {
    name: /^Deliver [13] /,
  }))
    expect(allocation).not.toBeVisible();
  const remove = screen.getAllByRole("button", { name: /^Remove / });
  fireEvent.click(remove[1]!);
  expect(onRemove).toHaveBeenCalledWith(1);
  fireEvent.click(delivery);
  expect(remove[0]).toBeDisabled();
  expect(continueButton()).toBeDisabled();
  fireEvent.click(remove[0]!);
  expect(onRemove).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Apply Deliver all to" }));
  expect(onAllRecipientsChange).toHaveBeenCalledWith(PAYER, false);
  expect(onRecipientChange).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Cancel Deliver all to" })
  );
  fireEvent.click(screen.getAllByText("Change delivery for this artwork")[1]!);
  const rows = screen.getAllByRole("listitem");
  expect(
    within(rows[0]!).getByRole("button", { name: /^Deliver 1 / })
  ).not.toBeVisible();
  for (const allocation of within(rows[1]!).getAllByRole("button", {
    name: /^Deliver [12] /,
  }))
    expect(allocation).toBeVisible();
  rendered.rerender(
    <CollectBatchQuoteReview
      {...p}
      operation={operation}
      profile={profile}
      busy
      onRemove={onRemove}
      onAllRecipientsChange={onAllRecipientsChange}
    />
  );
  expect(
    screen
      .getAllByRole("button", { name: /^Remove / })
      .every((button) => button.hasAttribute("disabled"))
  ).toBe(true);
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
