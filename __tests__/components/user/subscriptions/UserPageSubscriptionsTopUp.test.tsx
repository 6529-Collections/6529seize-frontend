import UserPageSubscriptionsTopUp from "@/components/user/subscriptions/UserPageSubscriptionsTopUp";
import {
  MEMES_MINT_PRICE,
  SUBSCRIPTIONS_ADDRESS,
  SUBSCRIPTIONS_CHAIN,
} from "@/constants";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseEther } from "viem";

const sendTransaction = {
  data: undefined,
  sendTransaction: jest.fn(),
  reset: jest.fn(),
  isPending: false,
  error: undefined,
};
const waitSendTransaction = {
  isLoading: false,
  isSuccess: false,
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
    jest.clearAllMocks();
  });

  it("sends transaction when 1 Card option is selected and Send is clicked", async () => {
    const user = userEvent.setup();
    render(<UserPageSubscriptionsTopUp />);

    const oneCardButton = screen.getByRole("button", { name: /1 Card/i });
    await user.click(oneCardButton);

    const sendButton = screen.getByRole("button", { name: "Send top up" });
    expect(sendButton).not.toBeDisabled();
    await user.click(sendButton);

    expect(sendTransaction.sendTransaction).toHaveBeenCalledWith({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther(MEMES_MINT_PRICE.toString()),
    });
  });

  it("shows success message when transaction succeeded", async () => {
    sendTransaction.data = "0x123" as any;
    waitSendTransaction.isSuccess = true;

    render(<UserPageSubscriptionsTopUp />);

    await waitFor(() => {
      expect(screen.getByText("Top Up Successful!")).toBeInTheDocument();
    });
  });

  it("submits custom count when Other option is selected", async () => {
    const user = userEvent.setup();
    render(<UserPageSubscriptionsTopUp />);

    const otherButton = screen.getByRole("button", { name: /Other/i });
    await user.click(otherButton);

    const countInput = screen.getByPlaceholderText("count");
    await user.type(countInput, "2");

    const sendButton = screen.getByRole("button", { name: "Send top up" });
    expect(sendButton).not.toBeDisabled();
    await user.click(sendButton);

    expect(sendTransaction.sendTransaction).toHaveBeenCalledWith({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther((2 * MEMES_MINT_PRICE).toString()),
    });
  });
});
