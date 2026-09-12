import CollectTdhTargetController from "@/components/collect/CollectTdhTargetController";
import type CollectTdhTargetDelivery from "@/components/collect/CollectTdhTargetDelivery";
import { createCollectTdhTargetPlan } from "@/services/api/collect-tdh-target-api";
import type { ApiCollectTdhTargetPlan } from "@/generated/models/ApiCollectTdhTargetPlan";
import { ApiCollectTdhTargetPlanStatusEnum } from "@/generated/models/ApiCollectTdhTargetPlan";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import {
  TARGET_NOW,
  TARGET_PRIMARY,
  TARGET_CUSTODY,
  targetPlan,
  targetProfile,
} from "./collect-tdh-target.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/collect-tdh-target-api", () => ({
  createCollectTdhTargetPlan: jest.fn(),
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectTdhTargetDelivery", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectTdhTargetDelivery>) => (
    <select
      aria-label="Delivery wallet"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    >
      <option value={TARGET_PRIMARY}>Primary</option>
      <option value={TARGET_CUSTODY}>Custody</option>
    </select>
  ),
}));

const api = jest.mocked(createCollectTdhTargetPlan);
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, "now").mockReturnValue(TARGET_NOW);
  api.mockImplementation(async (request) => targetPlan(request));
});
afterEach(() => jest.restoreAllMocks());
function mount(
  patch: Partial<ComponentProps<typeof CollectTdhTargetController>> = {}
) {
  const props = {
    profile: targetProfile,
    payingWallet: TARGET_PRIMARY,
    onConnect: jest.fn(),
    onReviewPurchase: jest.fn(),
    onPlanOffers: jest.fn(),
    ...patch,
  };
  return { ...render(<CollectTdhTargetController {...props} />), props };
}
function submit(value = "150") {
  fireEvent.change(screen.getByLabelText("Target TDH"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Find a purchase plan" }));
}
it("defaults total target/Memes/30 days without requiring a budget, then forwards exact selection only on review", async () => {
  const { props } = mount();
  submit();
  expect(
    await screen.findByRole("heading", { name: "Best purchase plan found" })
  ).toBeVisible();
  expect(api).toHaveBeenCalledWith(
    expect.objectContaining({
      target_tdh: "150",
      target_mode: "TOTAL_AT_DEADLINE",
      horizon_days: 30,
      families: ["memes"],
      recipient: TARGET_PRIMARY,
    }),
    expect.any(AbortSignal)
  );
  expect(api.mock.calls[0]![0]).not.toHaveProperty("budget_wei");
  expect(screen.getByText("Quoted at purchase review")).toBeVisible();
  expect(screen.getByText(/not a proven market-wide minimum/)).toBeVisible();
  expect(props.onReviewPurchase).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Review purchase" }));
  expect(props.onReviewPurchase).toHaveBeenCalledWith(
    [
      {
        asset: targetPlan().items[0]!.asset,
        order: targetPlan().items[0]!.order,
        quantity: "2",
      },
    ],
    TARGET_PRIMARY
  );
});
it("validates target input and lets a guest connect without creating an analysis", () => {
  const { props, unmount } = mount({ profile: null });
  fireEvent.click(screen.getByRole("button", { name: /connect/i }));
  expect(props.onConnect).toHaveBeenCalled();
  expect(api).not.toHaveBeenCalled();
  unmount();
  mount();
  submit("1.2");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Enter a valid target TDH amount."
  );
  expect(api).not.toHaveBeenCalled();
});
it("aborts and ignores older results when the target changes, even if the request ignores abort", async () => {
  let finish: ((value: ApiCollectTdhTargetPlan) => void) | undefined;
  api.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  mount();
  submit();
  const signal = api.mock.calls[0]![1];
  fireEvent.change(screen.getByLabelText("Target TDH"), {
    target: { value: "200" },
  });
  expect(signal.aborted).toBe(true);
  await act(async () => {
    finish?.(targetPlan());
  });
  expect(
    screen.queryByRole("heading", { name: "Best purchase plan found" })
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("Target TDH")).toHaveValue("200");
});
it("clears analysis after destination or timeframe changes", async () => {
  mount();
  submit();
  await screen.findByRole("button", { name: "Review purchase" });
  fireEvent.change(screen.getByLabelText("Delivery wallet"), {
    target: { value: TARGET_CUSTODY },
  });
  expect(
    screen.queryByRole("button", { name: "Review purchase" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Find a purchase plan" }));
  await screen.findByRole("button", { name: "Review purchase" });
  fireEvent.change(screen.getByLabelText("Timeframe"), {
    target: { value: "90" },
  });
  expect(
    screen.queryByRole("button", { name: "Review purchase" })
  ).not.toBeInTheDocument();
});
it("discards in-flight analysis on account membership change", async () => {
  let finish: ((value: ApiCollectTdhTargetPlan) => void) | undefined;
  api.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const { props, rerender } = mount();
  submit();
  const signal = api.mock.calls[0]![1];
  rerender(
    <CollectTdhTargetController
      {...props}
      profile={{ ...targetProfile, wallets: [targetProfile.wallets![0]!] }}
    />
  );
  await act(async () => {
    finish?.(targetPlan());
  });
  expect(signal.aborted).toBe(true);
  expect(
    screen.queryByRole("button", { name: "Review purchase" })
  ).not.toBeInTheDocument();
});
it("rejects a mismatched response and supports explicit retry", async () => {
  const wrong = targetPlan();
  wrong.projection.account.profile_id = "another-profile";
  api.mockResolvedValueOnce(wrong);
  mount();
  submit();
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This target could not be checked."
    )
  );
  expect(
    screen.queryByRole("button", { name: "Review purchase" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Find a purchase plan" }));
  expect(
    await screen.findByRole("button", { name: "Review purchase" })
  ).toBeEnabled();
});
it("keeps baseline success prominent and does not offer a purchase for an already-met target", async () => {
  const plan = targetPlan();
  plan.status = ApiCollectTdhTargetPlanStatusEnum.NoPurchaseNeeded;
  plan.request.target_tdh = plan.target_total_tdh = "90";
  plan.items = [];
  plan.projection.recipient_allocations = [];
  plan.projection.proposed = plan.projection.baseline;
  plan.purchase_cost_wei =
    plan.signed_fees_wei =
    plan.gas_estimate_wei =
    plan.funding_estimate_wei =
      "0";
  api.mockResolvedValueOnce(plan);
  mount();
  submit("90");
  expect(
    await screen.findByRole("heading", { name: "No purchases needed" })
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Review purchase" })
  ).not.toBeInTheDocument();
});
it("blocks expired plans and offers to a destination different from the paying wallet", async () => {
  const { props } = mount();
  submit();
  await screen.findByRole("button", { name: "Review purchase" });
  jest.spyOn(Date, "now").mockReturnValue(TARGET_NOW + 60_000);
  fireEvent.click(screen.getByRole("button", { name: "Review purchase" }));
  expect(props.onReviewPurchase).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("changed or expired");
  jest.spyOn(Date, "now").mockReturnValue(TARGET_NOW);
  fireEvent.change(screen.getByLabelText("Delivery wallet"), {
    target: { value: TARGET_CUSTODY },
  });
  fireEvent.click(screen.getByRole("button", { name: "Find a purchase plan" }));
  expect(
    await screen.findByRole("button", {
      name: "Plan offers for these artworks",
    })
  ).toBeDisabled();
  expect(screen.getByText(/Offers deliver to the paying wallet/)).toBeVisible();
  expect(props.onPlanOffers).not.toHaveBeenCalled();
});
