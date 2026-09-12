import CollectTdhDailyWorkspace from "@/components/collect/CollectTdhDailyWorkspace";
import { createCollectDailyTdhPlan } from "@/services/api/collect-tdh-daily-api";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { dailyPlan } from "./collect-tdh-daily.fixture";
import {
  targetProfile,
  TARGET_CUSTODY,
  TARGET_NOW,
  TARGET_PRIMARY,
} from "./collect-tdh-target.fixture";

jest.mock("@/services/api/collect-tdh-daily-api", () => ({
  createCollectDailyTdhPlan: jest.fn(),
}));
jest.mock("@/components/collect/CollectTdhTargetDelivery", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (value: string) => void }) => (
    <button onClick={() => onChange(TARGET_CUSTODY)}>Use custody wallet</button>
  ),
}));
const api = jest.mocked(createCollectDailyTdhPlan);
const advance = async () => {
  await act(async () => {
    jest.advanceTimersByTime(350);
  });
};
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TARGET_NOW);
  api.mockReset();
  api.mockImplementation(async (request) => {
    const plan = dailyPlan(request);
    plan.request = { ...request, recipient: request.recipient.toLowerCase() };
    plan.items = plan.items.map((item) => ({
      ...item,
      recipient: request.recipient.toLowerCase(),
    }));
    return plan;
  });
});
afterEach(() => jest.useRealTimers());

it("keeps exact quantities and case-insensitive delivery bound when handing off purchase and offers", async () => {
  const buy = jest.fn(),
    offer = jest.fn();
  render(
    <CollectTdhDailyWorkspace
      profile={targetProfile}
      payingWallet={TARGET_PRIMARY}
      collection="memes"
      onConnect={jest.fn()}
      onReviewPurchase={buy}
      onPlanOffers={offer}
    />
  );
  fireEvent.change(screen.getByLabelText("Base TDH per day"), {
    target: { value: "2" },
  });
  await advance();
  expect(screen.getByText("Target artwork")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Review purchase" }));
  expect(buy).toHaveBeenCalledWith(
    dailyPlan().items.map(({ asset, order, quantity }) => ({
      asset,
      order,
      quantity,
    })),
    TARGET_PRIMARY
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Plan offers for these artworks" })
  );
  expect(offer).toHaveBeenCalledWith(
    expect.objectContaining({
      request: expect.objectContaining({
        recipient: TARGET_PRIMARY.toLowerCase(),
      }),
    })
  );
});

it("invalidates the basket on own-wallet change and disables offers to a different custody wallet", async () => {
  render(
    <CollectTdhDailyWorkspace
      profile={targetProfile}
      payingWallet={TARGET_PRIMARY}
      collection="memes"
      onConnect={jest.fn()}
      onReviewPurchase={jest.fn()}
      onPlanOffers={jest.fn()}
    />
  );
  fireEvent.change(screen.getByLabelText("Base TDH per day"), {
    target: { value: "2" },
  });
  await advance();
  fireEvent.click(screen.getByRole("button", { name: "Use custody wallet" }));
  expect(
    screen.queryByRole("button", { name: "Review purchase" })
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Base TDH per day"), {
    target: { value: "2" },
  });
  await advance();
  expect(api).toHaveBeenLastCalledWith(
    expect.objectContaining({ recipient: TARGET_CUSTODY }),
    expect.any(AbortSignal)
  );
  expect(
    screen.getByRole("button", { name: "Plan offers for these artworks" })
  ).toBeDisabled();
});

it("rejects a mismatched response and removes prior results on current profile membership change", async () => {
  const props = {
    payingWallet: TARGET_PRIMARY,
    collection: "memes" as const,
    onConnect: jest.fn(),
    onReviewPurchase: jest.fn(),
  };
  const { rerender } = render(
    <CollectTdhDailyWorkspace profile={targetProfile} {...props} />
  );
  fireEvent.change(screen.getByLabelText("Base TDH per day"), {
    target: { value: "2" },
  });
  await advance();
  rerender(
    <CollectTdhDailyWorkspace
      profile={{ ...targetProfile, wallets: [targetProfile.wallets![0]!] }}
      {...props}
    />
  );
  expect(
    screen.queryByRole("button", { name: "Review purchase" })
  ).not.toBeInTheDocument();
  api.mockResolvedValueOnce({ ...dailyPlan(), purchase_cost_wei: "1" });
  fireEvent.change(screen.getByLabelText("Base TDH per day"), {
    target: { value: "2" },
  });
  await advance();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "This estimate could not be calculated."
  );
  expect(props.onReviewPurchase).not.toHaveBeenCalled();
});
