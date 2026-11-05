import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { useSubscriptionDisclosure } from "@/components/user/subscriptions/useSubscriptionDisclosure";
import UserPageSubscriptionsTopUp from "@/components/user/subscriptions/UserPageSubscriptionsTopUp";
import {
  MEMES_MINT_PRICE,
  SUBSCRIPTIONS_ADDRESS,
  SUBSCRIPTIONS_CHAIN,
} from "@/constants/constants";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import useCapacitor from "@/hooks/useCapacitor";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseEther } from "viem";

const sendTransaction: {
  data: `0x${string}` | undefined;
  sendTransaction: jest.Mock;
  reset: jest.Mock;
  isPending: boolean;
  error: Error | undefined;
} = {
  data: undefined,
  sendTransaction: jest.fn(),
  reset: jest.fn(),
  isPending: false,
  error: undefined,
};
const waitSendTransaction: {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | undefined;
} = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: undefined,
};

jest.mock("wagmi", () => ({
  useSendTransaction: () => sendTransaction,
  useWaitForTransactionReceipt: jest.fn(() => waitSendTransaction),
}));

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  __esModule: true,
  displayedEonNumberFromIndex: jest.fn(() => 1),
  displayedEpochNumberFromIndex: jest.fn(() => 1),
  displayedEraNumberFromIndex: jest.fn(() => 1),
  displayedPeriodNumberFromIndex: jest.fn(() => 1),
  displayedSeasonNumberFromIndex: jest.fn(() => 1),
  displayedYearNumberFromIndex: jest.fn(() => 2024),
  getCardsRemainingUntilEndOf: jest.fn(() => 0),
  getSeasonIndexForDate: jest.fn(() => 0),
  nextMintDateOnOrAfter: jest.fn(() => new Date("2024-01-01T00:00:00Z")),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({ isConnected: true })),
}));

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <span data-testid="circle-loader" />,
  CircleLoaderSize: {
    SMALL: "SMALL",
    MEDIUM: "MEDIUM",
    LARGE: "LARGE",
    XLARGE: "XLARGE",
    XXLARGE: "XXLARGE",
  },
}));

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(() => ({
    showCookieConsent: false,
    country: "US",
    consent: jest.fn(),
    reject: jest.fn(),
  })),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isIos: false })),
}));

describe("UserPageSubscriptionsTopUp", () => {
  beforeEach(() => {
    sendTransaction.data = undefined;
    sendTransaction.isPending = false;
    sendTransaction.error = undefined;
    waitSendTransaction.isLoading = false;
    waitSendTransaction.isSuccess = false;
    waitSendTransaction.isError = false;
    waitSendTransaction.error = undefined;
    jest.clearAllMocks();
    jest
      .mocked(useSeizeConnectContext)
      .mockReturnValue({ isConnected: true } as ReturnType<
        typeof useSeizeConnectContext
      >);
  });

  it("keeps the original radio choices keyboard-selectable without sending ETH", async () => {
    const user = userEvent.setup();
    render(<UserPageSubscriptionsTopUp />);
    const oneCard = screen.getByRole("radio", { name: "1 Card" });
    await user.click(oneCard);
    expect(oneCard).toBeChecked();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Other" })).toBeChecked();
    expect(oneCard).not.toBeChecked();
    expect(
      screen.getByRole("spinbutton", { name: "Other card count" })
    ).toHaveFocus();
    expect(sendTransaction.sendTransaction).not.toHaveBeenCalled();
  });

  it("sends the selected amount from the top-up dialog", async () => {
    const user = userEvent.setup();
    render(<UserPageSubscriptionsTopUp />);

    const oneCardOption = screen.getByRole("radio", {
      name: "1 Card",
    });
    await user.click(oneCardOption);

    const sendButton = screen.getByRole("button", {
      name: "Top up 0.06529 ETH",
    });
    expect(sendButton).not.toBeDisabled();
    await user.click(sendButton);

    expect(sendTransaction.sendTransaction).toHaveBeenCalledWith({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther(MEMES_MINT_PRICE.toString()),
    });
  });

  it("preserves the draft amount when closing and reopening the dialog", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<UserPageSubscriptionsTopUp expanded />);
    await user.type(
      screen.getByRole("spinbutton", { name: "Other card count" }),
      "2"
    );
    expect(
      screen.getByRole("button", { name: "Top up 0.13058 ETH" })
    ).toBeEnabled();
    rerender(<UserPageSubscriptionsTopUp expanded={false} />);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    rerender(<UserPageSubscriptionsTopUp expanded />);
    expect(screen.getByRole("dialog", { name: "Top up" })).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: "Other card count" })
    ).toHaveValue(2);
    expect(screen.getByRole("radio", { name: "Other" })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Top up 0.13058 ETH" })
    ).toBeEnabled();
    expect(sendTransaction.sendTransaction).not.toHaveBeenCalled();
  });

  it("shows success message when transaction succeeded", async () => {
    sendTransaction.data = "0x123";
    waitSendTransaction.isSuccess = true;

    render(<UserPageSubscriptionsTopUp />);

    await waitFor(() => {
      expect(screen.getByText("Top Up Successful!")).toBeInTheDocument();
    });
    expect(screen.getByRole("dialog", { name: "Top up" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Tx" })).toHaveAttribute(
      "href",
      expect.stringContaining("/tx/0x123")
    );
  });

  it("shows the shared non-closable wallet confirmation state", () => {
    sendTransaction.isPending = true;

    render(<UserPageSubscriptionsTopUp />);

    expect(screen.getByRole("dialog", { name: "Top up" })).toBeInTheDocument();
    expect(screen.getByText("Confirm in your wallet")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close modal" })
    ).not.toBeInTheDocument();
  });

  it("normalizes wallet submission failures in the shared error modal", () => {
    sendTransaction.error = new Error(
      "User rejected the request\n\nRequest Arguments:\nfrom: 0xabc"
    );

    render(<UserPageSubscriptionsTopUp />);

    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("Error - User rejected the request");
  });

  it("keeps receipt failures visible in a closable error modal", () => {
    sendTransaction.data = "0x123";
    waitSendTransaction.isError = true;
    waitSendTransaction.error = new Error(
      "Transaction receipt failed\n\nRequest Arguments:\nfrom: 0xabc"
    );

    render(<UserPageSubscriptionsTopUp />);

    expect(screen.getByRole("dialog", { name: "Top up" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("Error - Transaction receipt failed");
    expect(
      screen.getByRole("button", { name: "Close modal" })
    ).toBeInTheDocument();
  });

  it("uses a useful fallback for an empty receipt error", () => {
    sendTransaction.data = "0x123";
    waitSendTransaction.isError = true;
    waitSendTransaction.error = new Error("");

    render(<UserPageSubscriptionsTopUp />);

    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("Transaction failed");
  });

  it("submits custom count when Other option is selected", async () => {
    const user = userEvent.setup();
    render(<UserPageSubscriptionsTopUp />);

    const otherOption = screen.getByRole("spinbutton", {
      name: "Other card count",
    });
    await user.click(otherOption);

    const countInput = screen.getByPlaceholderText("count");
    await user.type(countInput, "2");

    expect(screen.getByRole("status")).toHaveTextContent("0.13058 ETH");
    expect(screen.getByText("0.13058 ETH", { exact: true })).toBeVisible();
    expect(countInput).toHaveAccessibleDescription("0.13058 ETH");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

    const sendButton = screen.getByRole("button", {
      name: "Top up 0.13058 ETH",
    });
    expect(sendButton).not.toBeDisabled();
    await user.click(sendButton);

    expect(sendTransaction.sendTransaction).toHaveBeenCalledWith({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther((2 * MEMES_MINT_PRICE).toString()),
    });
  });

  it("treats a decimal custom count as whole cards without throwing", async () => {
    const user = userEvent.setup();
    render(<UserPageSubscriptionsTopUp />);

    await user.click(
      screen.getByRole("spinbutton", {
        name: "Other card count",
      })
    );
    await user.type(screen.getByPlaceholderText("count"), "1.8");
    await user.click(
      screen.getByRole("button", {
        name: "Top up 0.06529 ETH",
      })
    );

    expect(sendTransaction.sendTransaction).toHaveBeenCalledWith({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther(MEMES_MINT_PRICE.toString()),
    });
  });

  it.each([new Date("2026-11-19T17:00:00Z"), null])(
    "omits the extra deadline paragraph in Top up (deadline: %s)",
    (deadline) => {
      const coverage = {
        next_unfunded: { token_id: 577, top_up_deadline: deadline },
      } as ApiSubscriptionCoverage;
      render(<UserPageSubscriptionsTopUp coverage={coverage} />);
      expect(screen.queryByText(/Top up by/)).not.toBeInTheDocument();
      expect(
        screen.queryByText("No authoritative top-up deadline is available yet.")
      ).not.toBeInTheDocument();
      expect(sendTransaction.sendTransaction).not.toHaveBeenCalled();
    }
  );

  it("uses the exact backend recommendation for the primary top-up", async () => {
    const user = userEvent.setup();
    const coverage = {
      recommended_top_up: {
        target_fully_funded_drops: 7,
        additional_mints: 3,
        amount_eth: "0.17087",
        projected_through: {
          token_id: 560,
          mint_at: new Date("2026-10-12T15:40:00Z"),
        },
      },
      minimum_top_up: {
        additional_mints: 1,
        amount_eth: "0.04029",
        resulting_fully_funded_drops: 1,
        projected_through: {
          token_id: 554,
          mint_at: new Date("2026-09-30T15:40:00Z"),
        },
      },
    } as ApiSubscriptionCoverage;

    render(<UserPageSubscriptionsTopUp coverage={coverage} />);

    const recommendation = screen.getByText(
      "Funds 7 intended drops through The Memes #560"
    );
    const minimum = screen.getByText(
      "Funds 1 intended drop through The Memes #554"
    );
    expect(recommendation).toBeVisible();
    expect(minimum).toBeVisible();
    expect(
      screen.getByRole("radio", { name: /^Recommended/ })
    ).toHaveAccessibleDescription(`0.17087 ETH ${recommendation.textContent}`);
    expect(
      screen.getByRole("radio", { name: /^Minimum for next drop/ })
    ).toHaveAccessibleDescription(`0.04029 ETH ${minimum.textContent}`);
    await user.click(
      screen.getByRole("radio", { name: "Recommended - 3 Cards" })
    );
    expect(minimum).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Top up 0.17087 ETH" })
    );

    expect(
      screen.getByText("Funds 7 intended drops through The Memes #560")
    ).toBeInTheDocument();
    expect(sendTransaction.sendTransaction).toHaveBeenCalledWith({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther("0.17087"),
    });
  });

  it("keeps wallet validation before sending any ETH", async () => {
    jest
      .mocked(useSeizeConnectContext)
      .mockReturnValue({ isConnected: false } as ReturnType<
        typeof useSeizeConnectContext
      >);
    render(<UserPageSubscriptionsTopUp />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: "1 Card" }));
    await user.click(
      screen.getByRole("button", { name: "Top up 0.06529 ETH" })
    );
    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("You must have an active wallet connection to top up");
    expect(sendTransaction.sendTransaction).not.toHaveBeenCalled();
  });

  it("sends the exact minimum for partial funding, and omits a duplicate option", async () => {
    const point = { token_id: 571, mint_at: new Date("2026-11-06T15:40:00Z") };
    const coverage = {
      minimum_top_up: {
        additional_mints: 1,
        amount_eth: "0.01587",
        resulting_fully_funded_drops: 1,
        projected_through: point,
      },
    } as ApiSubscriptionCoverage;
    const { rerender } = render(
      <UserPageSubscriptionsTopUp coverage={coverage} />
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("radio", { name: /^Minimum for next drop/ })
    );
    expect(
      screen.getByText("Funds 1 intended drop through The Memes #571")
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Top up 0.01587 ETH" })
    );
    expect(sendTransaction.sendTransaction).toHaveBeenCalledWith({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther("0.01587"),
    });
    rerender(
      <UserPageSubscriptionsTopUp
        coverage={{
          ...coverage,
          recommended_top_up: {
            amount_eth: "0.01587",
            additional_mints: 1,
            target_fully_funded_drops: 1,
            projected_through: point,
          },
        }}
      />
    );
    expect(
      screen.queryByRole("radio", { name: /^Minimum for next drop/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^Recommended/ })).toBeVisible();
  });

  it("refreshes coverage after the submitted transaction is confirmed", async () => {
    const onTransactionConfirmed = jest.fn();
    sendTransaction.data = "0x123";
    waitSendTransaction.isSuccess = true;

    render(
      <UserPageSubscriptionsTopUp
        onTransactionConfirmed={onTransactionConfirmed}
      />
    );

    await waitFor(() => {
      expect(onTransactionConfirmed).toHaveBeenCalledTimes(1);
    });
  });

  it("hands focus to transaction status and returns to the picker after success", async () => {
    const user = userEvent.setup();
    const onTransactionConfirmed = jest.fn();
    const view = () => (
      <UserPageSubscriptionsTopUp
        onCancel={jest.fn()}
        onTransactionConfirmed={onTransactionConfirmed}
      />
    );
    const { rerender } = render(view());
    await user.click(screen.getByRole("radio", { name: "1 Card" }));
    await user.click(
      screen.getByRole("button", { name: "Top up 0.06529 ETH" })
    );
    sendTransaction.isPending = true;
    rerender(view());
    await waitFor(() =>
      expect(screen.queryByRole("radio")).not.toBeInTheDocument()
    );
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByText("Confirm in your wallet")).toBeVisible();
    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement
    );

    sendTransaction.isPending = false;
    sendTransaction.data = "0x123";
    waitSendTransaction.isSuccess = true;
    rerender(view());
    expect(screen.getByText("Top Up Successful!")).toBeVisible();
    sendTransaction.reset.mockClear();
    await user.click(screen.getByRole("button", { name: "Close modal" }));
    expect(sendTransaction.reset).toHaveBeenCalledTimes(1);
    sendTransaction.data = undefined;
    waitSendTransaction.isSuccess = false;
    rerender(view());
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Top up" })).toHaveFocus()
    );
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Choose a top-up amount" })
    ).toBeDisabled();
    expect(sendTransaction.sendTransaction).toHaveBeenCalledTimes(1);
    expect(onTransactionConfirmed).toHaveBeenCalledTimes(1);
  });
});

describe("UserPageSubscriptionsTopUp hash anchor", () => {
  const TOP_UP_ID = "profile-subscriptions-top-up";
  let scrollIntoView: jest.SpyInstance;

  function setHash(hash: string): void {
    globalThis.history.replaceState(null, "", `/handle/subscriptions${hash}`);
  }

  function setEnvironment({
    isIos,
    country,
    isCountryPending = false,
  }: Readonly<{
    isIos: boolean;
    country: string;
    isCountryPending?: boolean;
  }>): void {
    jest
      .mocked(useCapacitor)
      .mockReturnValue({ isIos } as ReturnType<typeof useCapacitor>);
    jest.mocked(useCookieConsent).mockReturnValue({
      country,
      isCountryPending,
    } as ReturnType<typeof useCookieConsent>);
  }

  function TopUpHarness() {
    const topUp = useSubscriptionDisclosure(TOP_UP_ID);
    return (
      <>
        <button type="button" onClick={() => topUp.setExpanded(true)}>
          Top up
        </button>
        <a href={`#${TOP_UP_ID}`}>Open top-up link</a>
        <UserPageSubscriptionsTopUp
          expanded={topUp.expanded}
          onCancel={() => topUp.setExpanded(false)}
        />
      </>
    );
  }

  function renderGated() {
    return (
      <NftPurchasingGate>
        <TopUpHarness />
      </NftPurchasingGate>
    );
  }

  async function settleFrames(): Promise<void> {
    await act(async () => {
      await new Promise<void>((resolve) => {
        globalThis.requestAnimationFrame(() => {
          globalThis.requestAnimationFrame(() => resolve());
        });
      });
    });
  }

  beforeEach(() => {
    sendTransaction.data = undefined;
    sendTransaction.isPending = false;
    sendTransaction.error = undefined;
    waitSendTransaction.isLoading = false;
    waitSendTransaction.isSuccess = false;
    waitSendTransaction.isError = false;
    waitSendTransaction.error = undefined;
    jest.clearAllMocks();
    scrollIntoView = jest
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => undefined);
    setEnvironment({ isIos: false, country: "US" });
    setHash("");
  });

  afterEach(() => {
    scrollIntoView.mockRestore();
    setHash("");
  });

  it("opens the notification hash as a focused dialog without scrolling the page", async () => {
    setHash(`#${TOP_UP_ID}`);
    render(renderGated());
    const dialog = await screen.findByRole("dialog", { name: "Top up" });
    expect(dialog).toHaveAttribute("id", TOP_UP_ID);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Top up" })).toHaveFocus()
    );
    await settleFrames();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it.each(["", "#profile-subscriptions-history"])(
    "keeps the dialog closed and focus unchanged for an unrelated hash %s",
    async (hash) => {
      setHash(hash);
      render(renderGated());
      await settleFrames();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(document.body).toHaveFocus();
    }
  );

  it("retains the custom amount and restores the opener after Close and Escape", async () => {
    render(renderGated());
    const user = userEvent.setup();
    const opener = screen.getByRole("button", { name: "Top up", exact: true });
    await user.click(opener);
    await user.type(
      screen.getByRole("spinbutton", { name: "Other card count" }),
      "2"
    );
    await user.click(
      screen.getByRole("button", { name: "Close", exact: true })
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(opener).toHaveFocus();
    await user.click(opener);
    expect(
      screen.getByRole("spinbutton", { name: "Other card count" })
    ).toHaveValue(2);
    expect(
      screen.getByRole("button", { name: "Top up 0.13058 ETH" })
    ).toBeEnabled();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(opener).toHaveFocus();
    expect(sendTransaction.sendTransaction).not.toHaveBeenCalled();
  });

  it("opens repeated same-page hash links without scrolling or sending ETH", async () => {
    render(renderGated());
    const user = userEvent.setup();
    const link = screen.getByRole("link", { name: "Open top-up link" });
    for (let attempt = 0; attempt < 2; attempt++) {
      await user.click(link);
      expect(
        await screen.findByRole("dialog", { name: "Top up" })
      ).toBeVisible();
      expect(window.location.hash).toBe(`#${TOP_UP_ID}`);
      await user.click(
        screen.getByRole("button", { name: "Close", exact: true })
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      expect(link).toHaveFocus();
    }
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(sendTransaction.sendTransaction).not.toHaveBeenCalled();
  });

  it("never scrolls to or reveals the section on restricted iOS", async () => {
    setEnvironment({ isIos: true, country: "FR" });
    setHash(`#${TOP_UP_ID}`);
    render(<UserPageSubscriptionsTopUp />);
    await settleFrames();

    expect(document.getElementById(TOP_UP_ID)).toBeNull();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.body).toHaveFocus();
  });

  it("keeps the gated page unmounted and unscrolled until iOS proves a US country", async () => {
    setEnvironment({ isIos: true, country: "", isCountryPending: true });
    setHash(`#${TOP_UP_ID}`);
    const { rerender } = render(renderGated());
    await settleFrames();

    expect(document.getElementById(TOP_UP_ID)).toBeNull();
    expect(scrollIntoView).not.toHaveBeenCalled();

    setEnvironment({ isIos: true, country: "FR" });
    rerender(renderGated());
    await settleFrames();

    expect(document.getElementById(TOP_UP_ID)).toBeNull();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.body).toHaveFocus();
  });

  it("opens the dialog once the country check resolves to US on iOS", async () => {
    setEnvironment({ isIos: true, country: "", isCountryPending: true });
    setHash(`#${TOP_UP_ID}`);
    const { rerender } = render(renderGated());
    await settleFrames();
    expect(scrollIntoView).not.toHaveBeenCalled();

    setEnvironment({ isIos: true, country: "US" });
    rerender(renderGated());

    expect(await screen.findByRole("dialog", { name: "Top up" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Top-up on 6529.io" })
    ).toBeVisible();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it.each(["US", "FR", ""])(
    "preserves the recommendation without exposing iOS amount controls (country: %s)",
    async (country) => {
      setEnvironment({ isIos: true, country });
      const coverage = {
        recommended_top_up: {
          amount_eth: "0.78348",
          additional_mints: 12,
          target_fully_funded_drops: 7,
          projected_through: {
            token_id: 577,
            mint_at: new Date("2026-11-20T17:00:00Z"),
          },
        },
      } as ApiSubscriptionCoverage;
      render(
        <NftPurchasingGate>
          <UserPageSubscriptionsTopUp expanded coverage={coverage} />
        </NftPurchasingGate>
      );
      if (country === "US") {
        expect(
          await screen.findByText(
            "Recommended: add 0.78348 ETH for 7 funded drops through The Memes #577."
          )
        ).toBeVisible();
        expect(
          screen.getByRole("link", { name: "Top-up on 6529.io" })
        ).toBeVisible();
      } else {
        expect(screen.queryByText(/Recommended:/)).not.toBeInTheDocument();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      }
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
      expect(sendTransaction.sendTransaction).not.toHaveBeenCalled();
    }
  );

  it("opens the dialog for a late-mounting section on Android and web", async () => {
    setHash(`#${TOP_UP_ID}`);
    const { rerender } = render(<p>Loading profile</p>);
    await settleFrames();
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(renderGated());

    expect(await screen.findByRole("dialog", { name: "Top up" })).toBeVisible();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
