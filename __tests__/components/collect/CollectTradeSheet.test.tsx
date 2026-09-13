import CollectTradeSheet from "@/components/collect/CollectTradeSheet";
import type { CollectTradeReview } from "@/components/collect/collect.types";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    isOpen,
    children,
    title,
  }: {
    isOpen: boolean;
    children: ReactNode;
    title: string;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));
const review: CollectTradeReview = {
  id: "quote-1",
  revision: "revision-3",
  action: "buy",
  title: "Meme card",
  facts: [
    {
      label: "Receiving wallet",
      value: "0x2222222222222222222222222222222222222222",
    },
  ],
  technicalFacts: [{ label: "Chain", value: "Ethereum" }],
  totalLabel: "0.125 ETH",
  totalDescription: "Maximum purchase amount",
  warnings: [],
  expiresAt: Date.now() + 60_000,
};
it.each([null, 0, Number.NaN, Number.POSITIVE_INFINITY, Date.now() - 1000])(
  "keeps review readable with deadline %s and delegates automatic revalidation to execution",
  async (expiresAt) => {
    const onConfirm = jest.fn(async () => undefined);
    const onRefresh = jest.fn();
    render(
      <CollectTradeSheet
        open
        presentation="contents"
        review={{ ...review, expiresAt }}
        stage="review"
        onClose={jest.fn()}
        onRefresh={onRefresh}
        onConfirm={onConfirm}
      />
    );
    expect(
      screen.queryByText(/1970|valid until|expired/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /refresh/i })
    ).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Continue in wallet" })
      );
    });
    expect(onConfirm).toHaveBeenCalledWith(review.id, review.revision);
    expect(onRefresh).not.toHaveBeenCalled();
  }
);
it.each(["dialog", "contents"] as const)(
  "keeps one confirmation in flight in %s",
  async (presentation) => {
    let finish!: () => void;
    const onConfirm = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(
      <CollectTradeSheet
        open
        presentation={presentation}
        review={{ ...review, action: "offer", expiresAt: 0 }}
        stage="review"
        onClose={jest.fn()}
        onRefresh={jest.fn()}
        onConfirm={onConfirm}
      />
    );
    const button = screen.getByRole("button", { name: "Continue in wallet" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(review.id, review.revision);
    await act(async () => {
      finish();
    });
  }
);
it("keeps recipient inspectable when the signing wallet becomes unavailable", () => {
  render(
    <CollectTradeSheet
      open
      review={{ ...review, disabledReason: "Reconnect the signing wallet" }}
      stage="review"
      onClose={jest.fn()}
      onRefresh={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  expect(screen.getByText(review.facts[0]!.value)).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Continue in wallet" })
  ).toBeDisabled();
});
it.each(["wallet", "reconciling", "awaiting_signatures"] as const)(
  "does not expose a second send in %s",
  (stage) => {
    render(
      <CollectTradeSheet
        open
        review={review}
        stage={stage}
        onClose={jest.fn()}
        onRefresh={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(screen.getByRole("status")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Continue in wallet" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Action confirmed")).not.toBeInTheDocument();
  }
);
it("places the wallet action before expanded technical terms", () => {
  render(
    <CollectTradeSheet
      open
      review={review}
      stage="review"
      onClose={jest.fn()}
      onRefresh={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  const action = screen.getByRole("button", { name: "Continue in wallet" });
  const details = screen.getByText("Transaction details");
  fireEvent.click(details);
  expect(
    action.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

it("shows a recovery failure while the unresolved transaction still blocks another send", () => {
  render(
    <CollectTradeSheet
      open
      review={review}
      stage="reconciling"
      message="This transaction could not be verified. Check the hash and try again."
      onClose={jest.fn()}
      onRefresh={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Check the hash");
  expect(
    screen.queryByRole("button", { name: "Continue in wallet" })
  ).not.toBeInTheDocument();
});
