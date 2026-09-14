import CollectTransactionReceipt from "@/components/collect/CollectTransactionReceipt";
import CollectTradeSheet from "@/components/collect/CollectTradeSheet";
import { marketOperationReview } from "@/components/collect/market.adapters";
import {
  isCollectReceiptOperation,
  type CollectReceiptArtwork,
} from "@/components/collect/collect-receipt.helpers";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import {
  ApiMarketSendAttemptPurposeEnum,
  ApiMarketSendAttemptStatusEnum,
} from "@/generated/models/ApiMarketSendAttempt";
import { ApiMarketTransactionPurposeEnum } from "@/generated/models/ApiMarketTransaction";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";
import {
  ApiMarketReceiptTransactionPurposeEnum,
  ApiMarketReceiptTransactionStatusEnum,
  ApiMarketReceiptTransactionConfirmationEnum,
} from "@/generated/models/ApiMarketReceiptTransaction";
import {
  ApiMarketOperationStateEnum,
  type ApiMarketOperation,
} from "@/generated/models/ApiMarketOperation";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { batchFixture, PAYER, FREN } from "./market-batch.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/collect/useCollectReceiptMetadata", () => ({
  useCollectReceiptMetadata: (artworks: readonly CollectReceiptArtwork[]) =>
    artworks,
}));
const HASH = `0x${"a".repeat(64)}`;
const assetKey = "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:545";
function operation(
  overrides: Partial<ApiMarketOperation> = {}
): ApiMarketOperation {
  return {
    id: "receipt-single",
    revision: "receipt-revision",
    profile_id: "profile",
    kind: ApiMarketKind.Buy,
    state: ApiMarketOperationStateEnum.Confirmed,
    wallet: PAYER,
    recipient: FREN,
    recipient_in_profile: true,
    asset_key: assetKey,
    quantity: "1",
    currency: "0x0000000000000000000000000000000000000000",
    total_wei: "1000000000000000000",
    net_wei: "990000000000000000",
    fees: [{ recipient: FREN, amount_wei: "10000000000000000" }],
    approval_transactions: [],
    potential_liability_wei: "0",
    expires_at: 0,
    updated_at: 0,
    transaction_hash: HASH,
    ...overrides,
  };
}
const artwork: CollectReceiptArtwork = {
  assetKey,
  title: "Age of Memes",
  quantity: "1",
  recipients: [{ address: FREN, quantity: "1" }],
};
function show(value = operation()) {
  const onClose = jest.fn();
  const view = render(
    <CollectTransactionReceipt
      operation={value}
      artworks={[artwork]}
      onClose={onClose}
      walletNames={{ [PAYER]: "payer.eth", [FREN]: "fren.eth" }}
    />
  );
  return { ...view, onClose };
}

it("confirms immediately without pretending a quoted price or gas cap is an actual cost", () => {
  const value = operation();
  const { onClose } = show(value);
  expect(screen.getByRole("heading", { name: "Collected" })).toBeVisible();
  expect(screen.getByText("Not available yet")).toBeVisible();
  expect(screen.queryByText("Maximum total")).not.toBeInTheDocument();
  expect(screen.queryByText("Network fee cap")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Continue in wallet/ })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View in Orders" })).toHaveAttribute(
    "href",
    `/collect/orders?operation=${value.id}&kind=${value.kind}`
  );
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("uses a gift receipt for a confirmed purchase delivered outside the payer profile", () => {
  show(operation({ recipient_in_profile: false }));
  expect(
    screen.getByRole("heading", { name: "Your gift is delivered" })
  ).toBeVisible();
  expect(screen.queryByText("Your collection grows")).not.toBeInTheDocument();
});

it.each([
  ["own", "Your collection grows"],
  ["gift", "Your gift is delivered"],
  ["mixed", "Collected and delivered"],
  ["missing", "Collected and delivered"],
])(
  "uses verified allocation scope for a %s batch receipt",
  (scope, heading) => {
    const value = batchFixture().operation;
    value.state = ApiMarketBatchOperationStateEnum.Confirmed;
    value.items = value.items.map((item, index) => ({
      ...item,
      allocations: item.allocations.map((allocation) => {
        const { recipient_in_profile: _membership, ...rest } = allocation;
        if (scope === "missing") return rest;
        return {
          ...rest,
          recipient_in_profile:
            scope === "own" || (scope === "mixed" && index === 0),
        };
      }),
    }));
    render(
      <CollectTransactionReceipt
        operation={value}
        artworks={[artwork]}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
  }
);

it.each([
  ApiMarketOperationStateEnum.Submitted,
  ApiMarketOperationStateEnum.Mined,
])(
  "permits leaving a known %s transaction and keeps exact recipients inspectable",
  (state) => {
    const value = operation({ state });
    show(value);
    expect(screen.getByText(/You can leave this page/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/collect/orders"
    );
    const recipient = screen.getByText("Deliver 1 to").closest("details")!;
    fireEvent.click(within(recipient).getByText("Deliver 1 to"));
    expect(within(recipient).getByText(FREN)).toBeVisible();
    expect(
      within(recipient).getByRole("button", { name: "Copy wallet address" })
    ).toBeVisible();
    expect(screen.queryByText("Send to a fren")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Collected" })
    ).not.toBeInTheDocument();
  }
);

it.each([
  ApiMarketOperationStateEnum.Review,
  ApiMarketOperationStateEnum.Approval,
  ApiMarketOperationStateEnum.Unknown,
  ApiMarketOperationStateEnum.AwaitingSignature,
  ApiMarketOperationStateEnum.Publishing,
])("does not claim the user has submitted a transaction at %s", (state) => {
  expect(isCollectReceiptOperation(operation({ state }))).toBe(false);
});

it("keeps the single purchase mounted as its receipt while confirmation arrives", () => {
  const value = operation({ state: ApiMarketOperationStateEnum.Submitted });
  const props = {
    open: true,
    presentation: "contents" as const,
    onClose: jest.fn(),
    onRefresh: jest.fn(),
    onConfirm: jest.fn(),
  };
  const view = render(
    <CollectTradeSheet
      {...props}
      stage="submitted"
      review={marketOperationReview(value, "en-US")}
    />
  );
  expect(screen.getByText(/You can leave this page/)).toBeVisible();
  view.rerender(
    <CollectTradeSheet
      {...props}
      stage="confirmed"
      review={marketOperationReview(
        { ...value, state: ApiMarketOperationStateEnum.Confirmed },
        "en-US"
      )}
    />
  );
  expect(screen.getByRole("heading", { name: "Collected" })).toBeVisible();
  expect(screen.queryByText(/You can leave this page/)).not.toBeInTheDocument();
  expect(props.onClose).not.toHaveBeenCalled();
});

it("allows leaving after the wallet returns a hash while the API still reports review, without claiming confirmation", () => {
  const value = operation({ state: ApiMarketOperationStateEnum.Review });
  delete value.transaction_hash;
  const onClose = jest.fn();
  render(
    <CollectTradeSheet
      open
      presentation="contents"
      stage="reconciling"
      review={marketOperationReview(value, "en-US")}
      knownTransactionHash={HASH}
      onClose={onClose}
      onRefresh={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  expect(screen.getByText(/You can leave this page/)).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "Your transaction is on its way" })
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Continue in wallet" })
  ).not.toBeInTheDocument();
  expect(value.state).toBe(ApiMarketOperationStateEnum.Review);
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it.each([
  [ApiMarketOperationStateEnum.Approval, false],
  [ApiMarketOperationStateEnum.Review, false],
  [ApiMarketOperationStateEnum.Review, true],
])(
  "keeps an approval hash separate from trade submission in %s, acknowledged=%s",
  (state, acknowledged) => {
    const value = operation({ state });
    delete value.transaction_hash;
    value.send_attempt = {
      attempt_id: "approval-attempt",
      purpose: ApiMarketSendAttemptPurposeEnum.Approval,
      status: acknowledged
        ? ApiMarketSendAttemptStatusEnum.Resolved
        : ApiMarketSendAttemptStatusEnum.Active,
      transaction_hash: acknowledged ? HASH : null,
      transaction_digest: HASH,
      snapshot_block: 1,
      transaction: {
        chain_id: 1,
        to: PAYER,
        sender: PAYER,
        value: "0",
        data: "0x",
        purpose: ApiMarketTransactionPurposeEnum.ApproveCurrency,
      },
    };
    value.approval_transactions = [value.send_attempt.transaction];
    expect(isCollectReceiptOperation(value, HASH)).toBe(false);
    render(
      <CollectTradeSheet
        open
        presentation="contents"
        stage="reconciling"
        review={marketOperationReview(value, "en-US")}
        knownTransactionHash={acknowledged ? undefined : HASH}
        onClose={jest.fn()}
        onRefresh={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(screen.getByText(/Your approval has been submitted/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/collect/orders"
    );
    expect(
      screen.queryByText("Your transaction is on its way")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Your transaction will continue/)
    ).not.toBeInTheDocument();
  }
);

it("uses approval requests as a conservative fallback and permits a later evidenced fulfillment", () => {
  const value = operation({ state: ApiMarketOperationStateEnum.Review });
  delete value.transaction_hash;
  const transaction = {
    chain_id: 1,
    to: PAYER,
    sender: PAYER,
    value: "0",
    data: "0x",
    purpose: ApiMarketTransactionPurposeEnum.ApproveCurrency,
  };
  value.approval_transactions = [transaction];
  expect(isCollectReceiptOperation(value, HASH)).toBe(false);
  value.send_attempt = {
    attempt_id: "fulfillment-attempt",
    purpose: ApiMarketSendAttemptPurposeEnum.Transaction,
    status: ApiMarketSendAttemptStatusEnum.Active,
    transaction_hash: null,
    transaction_digest: HASH,
    snapshot_block: 1,
    transaction: {
      ...transaction,
      purpose: ApiMarketTransactionPurposeEnum.Fulfill,
    },
  };
  expect(isCollectReceiptOperation(value, HASH)).toBe(true);
  value.transaction_hash = HASH;
  value.state = ApiMarketOperationStateEnum.Submitted;
  expect(isCollectReceiptOperation(value)).toBe(true);
});

it("retains approval identity after refreshed review clears server approval fields", () => {
  const value = operation({
    state: ApiMarketOperationStateEnum.Review,
    approval_transactions: [],
  });
  delete value.transaction_hash;
  expect(isCollectReceiptOperation(value, HASH, "APPROVAL")).toBe(false);
  render(
    <CollectTradeSheet
      open
      presentation="contents"
      stage="review"
      review={marketOperationReview(value, "en-US")}
      knownTransactionHash={HASH}
      knownTransactionPurpose="APPROVAL"
      onClose={jest.fn()}
      onRefresh={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  expect(screen.getByText(/Your approval has been submitted/)).toBeVisible();
  expect(
    screen.queryByText("Your transaction is on its way")
  ).not.toBeInTheDocument();
});

it("labels original signed amounts explicitly when a live listing is partially sold", () => {
  const value = operation({
    kind: ApiMarketKind.List,
    state: ApiMarketOperationStateEnum.Live,
    quantity: "2",
  });
  value.settlement = {
    filled_quantity: "1",
    remaining_quantity: "1",
  } as NonNullable<ApiMarketOperation["settlement"]>;
  show(value);
  expect(screen.getByRole("heading", { name: "Partially sold" })).toBeVisible();
  expect(screen.getByText("Original listing total")).toBeVisible();
  expect(screen.getByText("Original potential proceeds")).toBeVisible();
  expect(
    screen.getByText(/Amounts shown cover the original listing/)
  ).toBeVisible();
  expect(screen.queryByText("You receive if sold")).not.toBeInTheDocument();
});

it("never presents the seller payment wallet as NFT delivery on an older acceptance receipt", () => {
  const value = operation({ kind: ApiMarketKind.Accept, recipient: PAYER });
  const props = {
    open: true,
    presentation: "contents" as const,
    onClose: jest.fn(),
    onRefresh: jest.fn(),
    onConfirm: jest.fn(),
  };
  const view = render(
    <CollectTradeSheet
      {...props}
      stage="confirmed"
      review={marketOperationReview(value, "en-US")}
    />
  );
  expect(screen.getByRole("heading", { name: "Sold" })).toBeVisible();
  expect(screen.queryByText("Delivered 1 to")).not.toBeInTheDocument();
  view.rerender(
    <CollectTradeSheet
      {...props}
      stage="confirmed"
      review={marketOperationReview({ ...value, nft_recipient: FREN }, "en-US")}
    />
  );
  const delivery = screen.getByText("Delivered 1 to").closest("details")!;
  fireEvent.click(within(delivery).getByText("Delivered 1 to"));
  expect(within(delivery).getByText(FREN)).toBeVisible();
  expect(within(delivery).queryByText(PAYER)).not.toBeInTheDocument();
});

it("presents WETH proceeds separately from recorded ETH fees and never charges buyer gas to the seller", () => {
  const value = operation({
    kind: ApiMarketKind.Accept,
    currency: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  });
  value.receipt = {
    payment: {
      currency: value.currency,
      total_wei: value.total_wei,
      net_wei: value.net_wei,
      fees: value.fees,
      payout_wallet: PAYER,
    },
    transactions: [
      {
        purpose: ApiMarketReceiptTransactionPurposeEnum.Transaction,
        transaction_hash: HASH,
        payer_wallet: PAYER,
        block_number: 10,
        block_hash: HASH,
        block_timestamp: 1_800_000_000,
        status: ApiMarketReceiptTransactionStatusEnum.Success,
        confirmation: ApiMarketReceiptTransactionConfirmationEnum.Confirmed,
        network_fee_wei: "1000000000000000",
      },
      {
        purpose: ApiMarketReceiptTransactionPurposeEnum.Approval,
        transaction_hash: `0x${"b".repeat(64)}`,
        payer_wallet: FREN,
        block_number: 9,
        block_hash: HASH,
        block_timestamp: 1_799_999_980,
        status: ApiMarketReceiptTransactionStatusEnum.Success,
        confirmation: ApiMarketReceiptTransactionConfirmationEnum.Confirmed,
        network_fee_wei: "9000000000000000",
      },
    ],
  };
  show(value);
  expect(screen.getByText("You received").parentElement).toHaveTextContent(
    "0.99 WETH"
  );
  expect(
    screen.getByText("Recorded network cost").parentElement
  ).toHaveTextContent("0.001 ETH");
  expect(screen.queryByText("Total paid")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Payment details"));
  fireEvent.click(screen.getByText("Exact amounts"));
  expect(screen.getAllByText("0.01").length).toBeGreaterThan(0);
});

it.each([
  [
    "ETH",
    "0x0000000000000000000000000000000000000000",
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  ],
  [
    "WETH",
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    "0x0000000000000000000000000000000000000000",
  ],
])(
  "uses recorded %s payment currency for compact and exact proceeds even when review currency differs",
  (symbol, paymentCurrency, reviewCurrency) => {
    const value = operation({
      kind: ApiMarketKind.Accept,
      currency: reviewCurrency,
    });
    value.receipt = {
      payment: {
        currency: paymentCurrency,
        total_wei: "2500000000000000000",
        net_wei: "2400000000000000000",
        fees: [{ recipient: FREN, amount_wei: "100000000000000000" }],
        payout_wallet: PAYER,
      },
      transactions: [
        {
          purpose: ApiMarketReceiptTransactionPurposeEnum.Transaction,
          transaction_hash: HASH,
          payer_wallet: PAYER,
          block_number: 10,
          block_hash: HASH,
          block_timestamp: 1_800_000_000,
          status: ApiMarketReceiptTransactionStatusEnum.Success,
          confirmation: ApiMarketReceiptTransactionConfirmationEnum.Confirmed,
          network_fee_wei: "1000000000000000",
        },
      ],
    };
    show(value);
    expect(screen.getByText("You received").parentElement).toHaveTextContent(
      `2.4 ${symbol}`
    );
    expect(
      screen.getByText("Recorded network cost").parentElement
    ).toHaveTextContent("0.001 ETH");
    const summary = screen.getByText("Payment details");
    fireEvent.click(summary);
    const details = within(summary.closest("details")!);
    fireEvent.click(details.getByText("Exact amounts"));
    for (const [label, amount] of [
      ["Purchase price", "2.5"],
      ["Seller receives", "2.4"],
      ["Order fee", "0.1"],
    ] as const) {
      const rows = details.getAllByText(label);
      expect(rows).toHaveLength(2);
      for (const row of rows)
        expect(row.parentElement).toHaveTextContent(`${amount} ${symbol}`);
    }
    expect(
      details.queryAllByText(symbol === "ETH" ? "WETH" : "ETH", { exact: true })
    ).toHaveLength(0);
  }
);

it("uses conditional proceeds for live listings and does not invent a fill transaction link", () => {
  const value = operation({
    kind: ApiMarketKind.List,
    state: ApiMarketOperationStateEnum.Live,
  });
  delete value.transaction_hash;
  show(value);
  expect(
    screen.getByRole("heading", { name: "Your listing is live" })
  ).toBeVisible();
  expect(
    screen.getByText("You receive if sold").parentElement
  ).toHaveTextContent("0.99 ETH");
  expect(
    screen.getByText("Proceeds are paid only when your listing sells.")
  ).toBeVisible();
  expect(
    screen.queryByRole("link", { name: "View transaction" })
  ).not.toBeInTheDocument();
  expect(screen.queryByText("You received")).not.toBeInTheDocument();
});

it("distinguishes a multi-copy listing total from unit price and never rounds an indivisible unit amount", () => {
  const value = operation({
    kind: ApiMarketKind.List,
    state: ApiMarketOperationStateEnum.Live,
    quantity: "3",
    total_wei: "100",
  });
  show(value);
  expect(screen.getByText("Listing total")).toBeVisible();
  expect(screen.queryByText("Price per copy")).not.toBeInTheDocument();
});

it("retains a batch receipt and each split destination without remove or edit controls", () => {
  const { operation: batch } = batchFixture();
  batch.state = ApiMarketBatchOperationStateEnum.Confirmed;
  const onClose = jest.fn();
  render(
    <CollectTransactionReceipt
      operation={batch}
      artworks={batch.items.map((item) => ({
        assetKey: item.asset_key,
        title: "Artwork",
        quantity: item.quantity,
        orderHash: item.order.order_hash,
        recipients: item.allocations.map((allocation) => ({
          address: allocation.recipient,
          quantity: allocation.quantity,
        })),
      }))}
      onClose={onClose}
      spacious
    />
  );
  expect(
    screen.getByRole("heading", { name: "Collected and delivered" })
  ).toBeVisible();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(
    screen.queryByRole("button", { name: /Remove|Edit|Continue in wallet/ })
  ).not.toBeInTheDocument();
  act(() =>
    fireEvent.click(screen.getByRole("button", { name: "Back to browsing" }))
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});
