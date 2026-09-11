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
    { label: "Quantity", value: "2" },
    {
      label: "Receiving wallet",
      value: "0x2222222222222222222222222222222222222222",
    },
  ],
  technicalFacts: [{ label: "Chain", value: "Ethereum" }],
  totalLabel: "0.125 ETH",
  totalDescription: "Maximum purchase amount",
  warnings: [],
  expiresAt: null,
};

describe("Collect immutable review", () => {
  it("submits the reviewed ID and revision exactly once while confirmation is pending", async () => {
    let finish: (() => void) | undefined;
    const onConfirm = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(
      <CollectTradeSheet
        open
        review={review}
        stage="review"
        onClose={jest.fn()}
        onRefresh={jest.fn()}
        onConfirm={onConfirm}
      />
    );
    const button = screen.getByRole("button", { name: "Continue to wallet" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("quote-1", "revision-3");
    expect(button).toBeDisabled();
    await act(async () => {
      finish?.();
    });
  });

  it("blocks stale terms and requests a new review", () => {
    const onConfirm = jest.fn(async () => undefined);
    const onRefresh = jest.fn();
    render(
      <CollectTradeSheet
        open
        review={{ ...review, expiresAt: Date.now() - 1000 }}
        stage="review"
        onClose={jest.fn()}
        onRefresh={onRefresh}
        onConfirm={onConfirm}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Continue to wallet" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh review" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("keeps the immutable recipient visible when a signing wallet becomes unavailable", () => {
    render(
      <CollectTradeSheet
        open
        review={{ ...review, disabledReason: "Reconnect the signing wallet" }}
        stage="review"
        onClose={jest.fn()}
        onRefresh={jest.fn()}
        onConfirm={jest.fn(async () => undefined)}
      />
    );
    expect(
      screen.getByText("0x2222222222222222222222222222222222222222")
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Continue to wallet" })
    ).toBeDisabled();
  });

  it("does not offer duplicate submission while an outcome is unknown", () => {
    render(
      <CollectTradeSheet
        open
        review={review}
        stage="reconciling"
        onClose={jest.fn()}
        onRefresh={jest.fn()}
        onConfirm={jest.fn(async () => undefined)}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking the outcome"
    );
    expect(
      screen.queryByRole("button", { name: "Continue to wallet" })
    ).not.toBeInTheDocument();
  });

  it("does not present a Safe proposal as a completed purchase", () => {
    render(
      <CollectTradeSheet
        open
        review={review}
        stage="awaiting_signatures"
        onClose={jest.fn()}
        onRefresh={jest.fn()}
        onConfirm={jest.fn(async () => undefined)}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Awaiting wallet signatures and execution"
    );
    expect(screen.queryByText("Action confirmed")).not.toBeInTheDocument();
  });
});
