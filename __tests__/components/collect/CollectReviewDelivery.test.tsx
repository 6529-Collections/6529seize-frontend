import CollectTradeSheet from "@/components/collect/CollectTradeSheet";
import type { CollectTradeReview } from "@/components/collect/collect.types";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
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
    onChange: (address: string) => void;
  }) => (
    <select
      aria-label="Choose a receiving wallet"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="0x1111111111111111111111111111111111111111">
        social.eth
      </option>
      <option value="0x2222222222222222222222222222222222222222">
        vault.eth
      </option>
    </select>
  ),
}));

const PAYER = "0x1111111111111111111111111111111111111111";
const VAULT = "0x2222222222222222222222222222222222222222";
const profile = {
  id: "collector",
  primary_wallet: PAYER,
  wallets: [
    { wallet: PAYER, display: "social.eth", tdh: 0 },
    { wallet: VAULT, display: "vault.eth", tdh: 0 },
  ],
} as ApiIdentity;

const review: CollectTradeReview = {
  id: "purchase",
  revision: "original-review",
  action: "buy",
  title: "Artwork",
  facts: [],
  technicalFacts: [],
  totalLabel: "1 ETH",
  totalDescription: "Purchase price",
  warnings: [],
  expiresAt: null,
  purchase: {
    chainId: 1,
    artworkLabel: "The Memes #545",
    quantity: "1",
    currency: "ETH",
    payerAddress: PAYER,
    payerName: "social.eth",
    recipientAddress: PAYER,
    recipientName: "social.eth",
    recipientInProfile: true,
    netWei: "1000000000000000000",
    fees: [],
    approvalFeeCaps: [],
    contractFacts: [],
    amounts: {
      purchaseWei: "1000000000000000000",
      feesWei: "0",
      networkFeeCapWei: null,
      maximumTotalWei: null,
    },
  },
};

function sheet({
  current = review,
  onApply = jest.fn(async () => true),
  onConfirm = jest.fn(async () => undefined),
}: {
  current?: CollectTradeReview;
  onApply?: (address: string, acknowledge: boolean) => Promise<boolean>;
  onConfirm?: (id: string, revision: string) => Promise<void>;
} = {}) {
  return (
    <CollectTradeSheet
      open
      presentation="contents"
      review={current}
      stage="review"
      onClose={jest.fn()}
      onRefresh={jest.fn()}
      onConfirm={onConfirm}
      recipientEditor={{
        profile,
        payingWallet: PAYER,
        disabled: false,
        onApply,
      }}
    />
  );
}

it("blocks Continue while editing and restores the original review when cancelled", () => {
  const onConfirm = jest.fn(async () => undefined);
  const onApply = jest.fn(async () => true);
  render(sheet({ onConfirm, onApply }));
  fireEvent.click(screen.getByText("Deliver to"));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: VAULT } });
  expect(
    screen.getByRole("button", { name: "Continue in wallet" })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Continue in wallet" }));
  expect(onConfirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(
    screen.getByRole("button", { name: "Continue in wallet" })
  ).toBeEnabled();
  expect(onApply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Deliver to"));
  expect(screen.getByRole("combobox")).toHaveValue(PAYER);
});

it("does not retain an abandoned edit after switching away and back to a review", () => {
  const view = render(sheet());
  fireEvent.click(screen.getByText("Deliver to"));
  expect(
    screen.getByRole("button", { name: "Continue in wallet" })
  ).toBeDisabled();

  view.rerender(sheet({ current: { ...review, id: "another-purchase" } }));
  view.rerender(sheet());

  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Continue in wallet" })
  ).toBeEnabled();
});

it("waits for the recipient review update, then confirms only the new review", async () => {
  let finish!: (updated: boolean) => void;
  const onApply = jest.fn(
    () =>
      new Promise<boolean>((resolve) => {
        finish = resolve;
      })
  );
  const onConfirm = jest.fn(async () => undefined);
  const view = render(sheet({ onApply, onConfirm }));
  fireEvent.click(screen.getByText("Deliver to"));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: VAULT } });
  fireEvent.click(screen.getByRole("button", { name: "Use this address" }));
  expect(onApply).toHaveBeenCalledWith(VAULT, false);
  expect(
    screen.getByRole("button", { name: "Continue in wallet" })
  ).toBeDisabled();
  const next = {
    ...review,
    id: "new-purchase",
    revision: "new-review",
    purchase: {
      ...review.purchase!,
      recipientAddress: VAULT,
      recipientName: "vault.eth",
    },
  };
  await act(async () => {
    view.rerender(sheet({ current: next, onApply, onConfirm }));
    finish(true);
  });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue in wallet" })
    ).toBeEnabled()
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Continue in wallet" }));
  });
  expect(onConfirm).toHaveBeenCalledWith("new-purchase", "new-review");
});

it("prevents starting a recipient edit once confirmation is in flight", async () => {
  let finish!: () => void;
  const onConfirm = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  const onApply = jest.fn(async () => true);
  render(sheet({ onApply, onConfirm }));
  fireEvent.click(screen.getByRole("button", { name: "Continue in wallet" }));
  fireEvent.click(screen.getByText("Deliver to"));
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(onApply).not.toHaveBeenCalled();
  await act(async () => {
    finish();
  });
});
