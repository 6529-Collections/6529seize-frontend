import CollectPageClient from "@/components/collect/CollectPageClient";
import type CollectPageView from "@/components/collect/CollectPageView";
import type CollectGoalsController from "@/components/collect/CollectGoalsController";
import type CollectOfferWorkspace from "@/components/collect/CollectOfferWorkspace";
import type CollectPlanBasket from "@/components/collect/CollectPlanBasket";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ComponentProps } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { scenarioPlan } from "./collect-plan-scenarios.fixture";
import { OFFER_PAYER, OFFER_PROFILE } from "./offer-plan.fixture";

let mockProfile: ApiIdentity | null = OFFER_PROFILE;
let mockQuery = new URLSearchParams("intent=full_set&collection=memes");
let mockGoals: ComponentProps<typeof CollectGoalsController> | undefined;
let mockView: ComponentProps<typeof CollectPageView> | undefined;
let mockWorkspace: ComponentProps<typeof CollectOfferWorkspace> | undefined;
let mockBasket: ComponentProps<typeof CollectPlanBasket> | undefined;

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockQuery,
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: mockProfile, requestAuth: jest.fn() }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: OFFER_PAYER,
    seizeConnect: jest.fn(),
  }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: {
    COLLECT_CATALOG: "catalog",
    COLLECT_CAPABILITIES: "capabilities",
  },
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: undefined,
    isError: false,
    isFetching: false,
    refetch: jest.fn(),
  }),
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectCatalog: jest.fn(),
  fetchCollectCapabilities: jest.fn(),
}));
jest.mock("@/components/collect/useCollectCatalog", () => ({
  useCollectCatalog: () => ({
    entries: [],
    pending: false,
    failed: false,
    hasMore: false,
    loadingMore: false,
    retry: jest.fn(),
    loadMore: jest.fn(),
  }),
  collectCatalogEntryId: jest.fn(),
}));
jest.mock("@/components/collect/CollectPageView", () => ({
  __esModule: true,
  COLLECT_INTENTS: [
    "lowest",
    "season",
    "full_set",
    "artist",
    "pebbles_set",
    "tdh",
  ],
  default: (props: ComponentProps<typeof CollectPageView>) => {
    mockView = props;
    return (
      <div>
        {props.recoveryContent}
        {props.goalContent}
        {props.workspaceContent}
      </div>
    );
  },
}));
jest.mock("@/components/collect/CollectGoalsController", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectGoalsController>) => {
    mockGoals = props;
    return null;
  },
}));
jest.mock("@/components/collect/CollectOfferWorkspace", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectOfferWorkspace>) => {
    mockWorkspace = props;
    return <div data-testid="offer-workspace" />;
  },
}));
jest.mock("@/components/collect/CollectPlanBasket", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectPlanBasket>) => {
    mockBasket = props;
    return <div role="dialog" hidden={props.open === false} />;
  },
}));
jest.mock("@/components/collect/CollectTradeController", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectBatchController", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectTdhWorkspace", () => ({
  __esModule: true,
  default: () => null,
}));

function goals() {
  if (!mockGoals) throw new Error("Expected goals controller");
  return mockGoals;
}
function view() {
  if (!mockView) throw new Error("Expected page view");
  return mockView;
}
function workspace() {
  if (!mockWorkspace) throw new Error("Expected offer workspace");
  return mockWorkspace;
}
function basket() {
  if (!mockBasket) throw new Error("Expected purchase basket");
  return mockBasket;
}
function start() {
  const rendered = render(<CollectPageClient />);
  const plan = scenarioPlan();
  act(() => goals().onPlan(plan));
  act(() => view().onPlanStrategyChange?.("blended"));
  return { ...rendered, plan };
}

beforeEach(() => {
  mockProfile = OFFER_PROFILE;
  mockQuery = new URLSearchParams("intent=full_set&collection=memes");
  mockGoals = undefined;
  mockView = undefined;
  mockWorkspace = undefined;
  mockBasket = undefined;
});

it("initializes all plan offer strategies with the clicked method and a distinct explicit session", () => {
  start();
  expect(workspace().initialMethod).toBe("goal");
  expect(workspace().blended).toBe(true);
  const session = workspace().strategySessionKey;
  act(() => view().onPlanStrategyChange?.("match_bid"));
  expect(workspace().initialMethod).toBe("match_bid");
  expect(workspace().strategySessionKey).not.toBe(session);
  act(() => view().onPlanStrategyChange?.("improve_bid"));
  expect(workspace().initialMethod).toBe("improve_bid");
  act(() => view().onPlanStrategyChange?.("discount_ask"));
  expect(workspace().initialMethod).toBe("discount_ask");
});

it("passes a reviewed subset separately from the intact source plan and retains its locks after closing", () => {
  const { plan } = start();
  const selected = [plan.result.legs[0]!];
  act(() => workspace().onReviewBuys?.(selected));
  const dialog = screen.getByRole("dialog");
  expect(basket().plan).toBe(plan);
  expect(basket().reviewLegs).toEqual(selected);
  expect(workspace().buyLockedAssetKeys).toContain(selected[0]!.asset_key);
  act(() => basket().onClose());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Resume purchase review" })
  ).toHaveFocus();
  expect(workspace().onReviewBuys).toBeUndefined();
  act(() => view().onPlanStrategyChange?.("match_bid"));
  expect(workspace().buyLockedAssetKeys).toContain(selected[0]!.asset_key);
  fireEvent.click(
    screen.getByRole("button", { name: "Resume purchase review" })
  );
  expect(screen.getByRole("dialog")).toBe(dialog);
  expect(basket().reviewLegs).toEqual(selected);
  expect(basket().plan).toBe(plan);
});

it("rejects a captured second review callback while retaining the first review", () => {
  const { plan } = start();
  const previous = workspace();
  act(() => {
    previous.onReviewBuys?.(plan.result.legs);
    previous.onReviewBuys?.(plan.result.legs);
  });
  const firstReview = basket().reviewLegs;
  act(() => basket().onClose());
  act(() => previous.onReviewBuys?.(plan.result.legs));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(basket().reviewLegs).toBe(firstReview);
  expect(workspace().onReviewBuys).toBeUndefined();
});

it("does not expose uncapped listings until the available plan scenario is selected", () => {
  const { plan } = start();
  expect(workspace().buyOptions).toEqual(plan.result.legs);
  act(() => workspace().onBack());
  act(() => view().onPlanScenarioChange?.("available"));
  act(() => view().onPlanStrategyChange?.("blended"));
  expect(workspace().buyOptions).toEqual(plan.available_result?.legs);
});

it.each(["goal", "recipient", "plan", "scenario"] as const)(
  "rejects a captured buy callback after the %s changes",
  (change) => {
    const { plan } = start();
    const previous = workspace();
    if (change === "goal")
      act(() => goals().onChange({ ...goals().draft, targetCount: "2" }));
    else if (change === "scenario")
      act(() => view().onPlanScenarioChange?.("available"));
    else
      act(() =>
        goals().onPlan({
          ...plan,
          ...(change === "plan" ? { id: "new-plan" } : {}),
          result: {
            ...plan.result,
            ...(change === "recipient"
              ? { recipient: `0x${"3".repeat(40)}` }
              : {}),
          },
        })
      );
    act(() => previous.onReviewBuys?.(plan.result.legs));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  }
);

it("retains the frozen purchase source after its current collecting plan is invalidated", () => {
  const { plan } = start();
  act(() => workspace().onReviewBuys?.(plan.result.legs));
  const dialog = screen.getByRole("dialog");
  act(() => goals().onPlan(null));
  expect(screen.getByRole("dialog")).toBe(dialog);
  expect(basket().plan).toBe(plan);
  expect(basket().reviewLegs).toEqual(plan.result.legs);
  expect(workspace().onReviewBuys).toBeUndefined();
});

it.each(["goal", "recipient", "plan", "scenario"] as const)(
  "resumes the same frozen purchase after the %s changes without replacing its terms",
  (change) => {
    const { plan } = start();
    act(() => workspace().onReviewBuys?.(plan.result.legs));
    const dialog = screen.getByRole("dialog");
    const reviewed = basket().reviewLegs;
    act(() => basket().onClose());
    if (change === "goal")
      act(() => goals().onChange({ ...goals().draft, targetCount: "2" }));
    else if (change === "scenario")
      act(() => view().onPlanScenarioChange?.("available"));
    else
      act(() =>
        goals().onPlan({
          ...plan,
          id: "new-plan",
          result: { ...plan.result, recipient: `0x${"3".repeat(40)}` },
        })
      );
    expect(workspace().onReviewBuys).toBeUndefined();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Resume prior plan/ }));
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(basket().plan).toBe(plan);
    expect(basket().plan.result.recipient).toBe(plan.result.recipient);
    expect(basket().reviewLegs).toBe(reviewed);
    expect(workspace().buyLockedAssetKeys).toContain(
      plan.result.legs[0]!.asset_key
    );
  }
);

it("releases a pre-batch discarded draft and its locks so a new review can be chosen", () => {
  const { plan } = start();
  act(() => workspace().onReviewBuys?.(plan.result.legs));
  expect(basket().onDiscard).toBeDefined();
  act(() => basket().onDiscard?.());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(workspace().buyLockedAssetKeys).toEqual([]);
  expect(workspace().onReviewBuys).toBeDefined();
  act(() => workspace().onReviewBuys?.(plan.result.legs));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

it("releases purchase locks only after the retained review reports settlement", () => {
  const { plan } = start();
  act(() => workspace().onReviewBuys?.(plan.result.legs));
  act(() => basket().onClose());
  expect(workspace().buyLockedAssetKeys).toContain(
    plan.result.legs[0]!.asset_key
  );
  act(() => basket().onSettled?.());
  expect(workspace().buyLockedAssetKeys).toEqual([]);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("does not let stale discard or settlement callbacks clear a newer review of the same source plan", () => {
  const { plan } = start();
  act(() => workspace().onReviewBuys?.(plan.result.legs));
  const discarded = basket();
  act(() => discarded.onDiscard?.());
  act(() => workspace().onReviewBuys?.(plan.result.legs));
  const currentLegs = basket().reviewLegs;
  act(() => {
    discarded.onDiscard?.();
    discarded.onSettled?.();
  });
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(basket().reviewLegs).toBe(currentLegs);
  expect(workspace().buyLockedAssetKeys).toContain(
    plan.result.legs[0]!.asset_key
  );
  expect(workspace().onReviewBuys).toBeUndefined();
});

it.each(["profile", "membership"] as const)(
  "clears the old basket and ignores stale callbacks after %s changes",
  (change) => {
    const { plan, rerender } = start();
    const previous = workspace();
    act(() => previous.onReviewBuys?.(plan.result.legs));
    mockProfile =
      change === "profile"
        ? { ...OFFER_PROFILE, id: "other-profile" }
        : {
            ...OFFER_PROFILE,
            wallets: [
              ...(OFFER_PROFILE.wallets ?? []),
              { wallet: `0x${"4".repeat(40)}`, display: "another", tdh: 0 },
            ],
          };
    rerender(<CollectPageClient />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => previous.onReviewBuys?.(plan.result.legs));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("offer-workspace")).not.toBeInTheDocument();
  }
);
