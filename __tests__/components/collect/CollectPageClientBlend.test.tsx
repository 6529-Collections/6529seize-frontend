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
import type {
  ConfirmedMarketPurchase,
  PendingMarketPurchase,
} from "@/components/collect/market-activity-store";
import type { CollectCatalogEntry } from "@/components/collect/useCollectCatalog";
import { targetPlan } from "./collect-tdh-target.fixture";

let mockProfile: ApiIdentity | null = OFFER_PROFILE;
let mockQuery = new URLSearchParams("intent=full_set&collection=memes");
let mockGoals: ComponentProps<typeof CollectGoalsController> | undefined;
let mockView: ComponentProps<typeof CollectPageView> | undefined;
let mockWorkspace: ComponentProps<typeof CollectOfferWorkspace> | undefined;
let mockBasket: ComponentProps<typeof CollectPlanBasket> | undefined;
let mockActualWorkspace = false;
let mockPurchases: readonly ConfirmedMarketPurchase[] = [];
let mockPendingPurchases: readonly PendingMarketPurchase[] = [];
let mockEntries: readonly CollectCatalogEntry[] = [];
jest.mock("@/components/collect/market-activity-store", () => ({
  useConfirmedMarketPurchases: () => mockPurchases,
  usePendingMarketPurchases: () => mockPendingPurchases,
  readPendingMarketPurchases: () => mockPendingPurchases,
}));

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
    entries: mockEntries,
    pending: false,
    failed: false,
    hasMore: false,
    loadingMore: false,
    retry: jest.fn(),
    loadMore: jest.fn(),
  }),
  collectCatalogEntryId: (entry: CollectCatalogEntry) =>
    entry.order?.identity.order_hash ?? entry.asset.asset_key,
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
        <nav data-collect-navigation>
          <button type="button" aria-pressed="true">
            Complete a set
          </button>
        </nav>
        <button
          type="button"
          onClick={() => props.onPlanStrategyChange?.("buy")}
        >
          Collect current listings
        </button>
        {props.recoveryContent}
        {props.goalContent}
        <div hidden={!props.workspaceActive}>{props.workspaceContent}</div>
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
    if (mockActualWorkspace) {
      const Workspace = jest.requireActual<{
        default: typeof CollectOfferWorkspace;
      }>("@/components/collect/CollectOfferWorkspace").default;
      return <Workspace {...props} />;
    }
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
  mockActualWorkspace = false;
  mockPurchases = [];
  mockPendingPurchases = [];
  mockEntries = [];
});

function discoveredSelection() {
  const item = targetPlan().items[0]!;
  const order = {
    ...item.order,
    maker: `0x${"9".repeat(40)}`,
    quantity: "1",
    purchase_quantity: "1",
    quantity_step: "1",
    available_quantity: "3",
    start_time: "1",
    end_time: "9999999999",
  };
  mockEntries = [{ asset: item.asset, order }];
  const purchase: ConfirmedMarketPurchase = {
    operationId: "single-artwork-purchase",
    profileId: OFFER_PROFILE.id!,
    assetKey: item.asset.asset_key,
    protocolAddress: order.identity.protocol_address,
    orderHash: order.identity.order_hash,
    quantity: "1",
    remainingQuantity: "2",
    confirmedAt: Date.now(),
  };
  return { id: order.identity.order_hash, purchase };
}

it("clears an exact selection purchased on another artwork page only once", () => {
  const { id, purchase } = discoveredSelection();
  const { rerender } = render(<CollectPageClient />);
  act(() => view().selectionFor?.(id)?.onToggle());
  expect(view().selectionFor?.(id)?.selected).toBe(true);
  mockPurchases = [{ ...purchase, confirmedAt: Date.now() }];
  rerender(<CollectPageClient />);
  expect(view().selectionFor?.(id)?.selected).toBe(false);
  // A remaining copy selected afterwards is a new intention. Re-rendering the
  // same confirmed receipt must not consume that selection a second time.
  act(() => view().selectionFor?.(id)?.onToggle());
  mockPurchases = [{ ...purchase }];
  rerender(<CollectPageClient />);
  expect(view().selectionFor?.(id)?.selected).toBe(true);
});

it.each(["historical", "unrelated"])(
  "keeps a built goal visible when a %s receipt arrives",
  (kind) => {
    const { purchase } = discoveredSelection();
    const { rerender } = render(<CollectPageClient />);
    act(() => goals().onPlan(scenarioPlan()));
    const goalId = view().plan?.id;
    expect(goalId).toBeDefined();
    mockPurchases = [
      {
        ...purchase,
        confirmedAt: kind === "historical" ? 0 : Date.now(),
        assetKey:
          kind === "unrelated"
            ? "1:0x9999999999999999999999999999999999999999:999"
            : purchase.assetKey,
      },
    ];
    rerender(<CollectPageClient />);
    expect(view().plan?.id).toBe(goalId);
  }
);

it("reserves a pending exact order without clearing it or offering a second checkout", () => {
  const { id, purchase } = discoveredSelection();
  const { rerender } = render(<CollectPageClient />);
  act(() => view().selectionFor?.(id)?.onToggle());
  mockPendingPurchases = [purchase];
  rerender(<CollectPageClient />);
  expect(view().selectionFor?.(id)?.selected).toBe(true);
  expect(view().selectionFor?.(id)?.pending).toBe(true);
  expect(view().selectionSummary).toBeNull();
  act(() => view().selectionFor?.(id)?.onToggle());
  expect(view().selectionFor?.(id)?.selected).toBe(true);
  mockPendingPurchases = [];
  mockPurchases = [{ ...purchase, confirmedAt: Date.now() }];
  rerender(<CollectPageClient />);
  expect(view().selectionFor?.(id)?.selected).toBe(false);
});

it("checks current pending evidence when a selection callback runs before the next render", () => {
  const { id, purchase } = discoveredSelection();
  render(<CollectPageClient />);
  const toggle = view().selectionFor?.(id)?.onToggle;
  mockPendingPurchases = [purchase];
  act(() => toggle?.());
  expect(view().selectionFor?.(id)?.selected).toBe(false);
});

it("keeps focus on the current listing strategy when no offer workspace is open", async () => {
  render(<CollectPageClient />);
  act(() => goals().onPlan(scenarioPlan()));
  const collect = screen.getByRole("button", {
    name: "Collect current listings",
  });
  collect.focus();
  fireEvent.click(collect);
  await act(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  );
  expect(collect).toHaveFocus();
});

it("retains ordinary offer prices in the actual workspace after returning to collecting and reopening", () => {
  mockActualWorkspace = true;
  render(<CollectPageClient />);
  act(() => goals().onPlan(scenarioPlan()));
  act(() => view().onPlanOffers?.());
  const price = screen.getByRole("textbox", {
    name: "WETH price per NFT for NFT #1",
  });
  const initialSession = workspace().strategySessionKey;
  fireEvent.change(price, { target: { value: "0.005" } });
  fireEvent.click(screen.getByRole("button", { name: "Back to collecting" }));
  expect(price).not.toBeVisible();
  act(() => view().onPlanOffers?.());
  expect(workspace().strategySessionKey).toBe(initialSession);
  expect(
    screen.getByRole("textbox", {
      name: "WETH price per NFT for NFT #1",
    })
  ).toBe(price);
  expect(price).toHaveValue("0.005");
});

it("starts ordinary offers in a fresh manual session after a preset, then preserves that session on reopen", () => {
  mockActualWorkspace = true;
  render(<CollectPageClient />);
  act(() => goals().onPlan(scenarioPlan()));
  act(() => view().onPlanStrategyChange?.("improve_bid"));
  const presetSession = workspace().strategySessionKey;
  expect(
    screen.getByRole("button", { name: "Price method" })
  ).toHaveTextContent("Above observed WETH offer");
  act(() => workspace().onBack());
  act(() => view().onPlanOffers?.());
  expect(workspace().strategySessionKey).not.toBe(presetSession);
  const manualSession = workspace().strategySessionKey;
  expect(
    screen.getByRole("button", { name: "Price method" })
  ).toHaveTextContent("Enter each price");
  const price = screen.getByRole("textbox", {
    name: "WETH price per NFT for NFT #1",
  });
  fireEvent.change(price, { target: { value: "0.012" } });
  act(() => workspace().onBack());
  act(() => view().onPlanOffers?.());
  expect(workspace().strategySessionKey).toBe(manualSession);
  expect(price).toHaveValue("0.012");
});

it("initializes all plan offer strategies with the clicked method and a distinct explicit session", () => {
  start();
  expect(workspace().initialMethod).toBe("match_bid");
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

it("retains the ordinary checkout source and receipt after settlement clears the plan", () => {
  render(<CollectPageClient />);
  const plan = scenarioPlan();
  act(() => goals().onPlan(plan));
  act(() => view().onReviewPlan?.(plan.id, plan.revision));
  const dialog = screen.getByRole("dialog");
  act(() => basket().onSettled?.());
  expect(screen.getByRole("dialog")).toBe(dialog);
  expect(basket().plan).toBe(plan);
  act(() => goals().onPlan({ ...plan, id: "updated-plan" }));
  expect(screen.getByRole("dialog")).toBe(dialog);
  expect(basket().plan).toBe(plan);
  act(() => basket().onClose());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("keeps the completed blended receipt open until the collector leaves", () => {
  const { plan } = start();
  act(() => workspace().onReviewBuys?.(plan.result.legs));
  const dialog = screen.getByRole("dialog");
  act(() => basket().onSettled?.());
  expect(screen.getByRole("dialog")).toBe(dialog);
  expect(basket().plan).toBe(plan);
  expect(workspace().buyLockedAssetKeys).toEqual([]);
  act(() => basket().onClose());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Resume purchase review/ })
  ).not.toBeInTheDocument();
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
