import CollectOfferWorkspace from "@/components/collect/CollectOfferWorkspace";
import type OfferPlanPanel from "@/components/collect/OfferPlanPanel";
import type { OfferPlanReview } from "@/components/collect/collect-offer-plan.types";
import { MARKET_WETH } from "@/components/collect/market-validation";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import {
  ApiMarketOperationStateEnum,
  type ApiMarketOperation,
} from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { offerAsset, OFFER_PAYER, OFFER_PROFILE } from "./offer-plan.fixture";

type OfferPlanPanelProps = ComponentProps<typeof OfferPlanPanel>;

interface TradeBoundary {
  readonly initialOperation?: ApiMarketOperation;
  readonly initialQuantity?: string;
  readonly initialUnitPriceEth?: string;
  readonly maximumOfferAmountWei?: string;
  readonly onCommitment: (
    operation: ApiMarketOperation,
    expected: ApiMarketPrepareRequest
  ) => void;
  readonly onPublished: (operation: ApiMarketOperation) => void;
  readonly onClose: () => void;
}
let mockTrade: TradeBoundary | undefined;
let mockPanel: OfferPlanPanelProps | undefined;
let mockProfile: ApiIdentity | null = OFFER_PROFILE;
let mockPayer = OFFER_PAYER;
let mockAuthenticated = true;
let mockProxy = false;
let mockRealPanel = false;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockProfile,
    isAuthenticated: mockAuthenticated,
    activeProfileProxy: mockProxy ? {} : null,
    requestAuth: jest.fn(),
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: mockPayer,
    seizeConnect: jest.fn(),
  }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/collect/analyze-collect-offers", () => ({
  analyzeCollectOffers: jest.fn(),
}));
jest.mock("@/components/collect/OfferPlanPanel", () => ({
  __esModule: true,
  default: (props: OfferPlanPanelProps) => {
    mockPanel = props;
    if (mockRealPanel) {
      const ActualPanel = jest.requireActual<
        typeof import("@/components/collect/OfferPlanPanel")
      >("@/components/collect/OfferPlanPanel").default;
      return <ActualPanel {...props} />;
    }
    return (
      <div>
        <output aria-label="Pending operations">
          {JSON.stringify(props.pendingOffers)}
        </output>
        <output aria-label="Published offers">
          {JSON.stringify(props.publishedOffers)}
        </output>
        {props.pendingOffers?.map((offer) => (
          <button
            key={offer.operationId}
            onClick={() => props.onReviewPending?.(offer)}
          >
            Resume {offer.operationId}
          </button>
        ))}
      </div>
    );
  },
}));
jest.mock("@/components/collect/CollectTradeController", () => ({
  __esModule: true,
  default: (props: TradeBoundary) => {
    mockTrade = props;
    return (
      <div role="dialog">
        <button onClick={props.onClose}>Close offer</button>
      </div>
    );
  },
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
}));

const total = "200000000000000000";
function review(): OfferPlanReview {
  return {
    asset: offerAsset(1),
    quantity: "2",
    unitPriceEth: "0.1",
    expiryHours: "168",
    maximumOfferAmountWei: total,
  };
}
function expected(): ApiMarketPrepareRequest {
  return {
    profile_id: "profile",
    wallet: OFFER_PAYER,
    recipient: OFFER_PAYER,
    asset_key: offerAsset(1).asset_key,
    kind: ApiMarketKind.Offer,
    quantity: "2",
    currency: MARKET_WETH,
    amount_wei: total,
    acknowledge_external_recipient: false,
  };
}
function operation(
  patch: Partial<ApiMarketOperation> = {}
): ApiMarketOperation {
  return {
    id: "pending-one",
    profile_id: "profile",
    wallet: OFFER_PAYER,
    recipient: OFFER_PAYER,
    asset_key: offerAsset(1).asset_key,
    kind: ApiMarketKind.Offer,
    quantity: "2",
    currency: MARKET_WETH,
    total_wei: total,
    state: ApiMarketOperationStateEnum.AwaitingSignature,
    ...patch,
  } as ApiMarketOperation;
}
function trade(): TradeBoundary {
  if (!mockTrade) throw new Error("Expected an open offer review");
  return mockTrade;
}
function panel(): OfferPlanPanelProps {
  if (!mockPanel) throw new Error("Expected the offer workspace");
  return mockPanel;
}
function openReview() {
  act(() => panel().onReviewOffer(review()));
}
function reserve(value = operation(), request = expected()) {
  act(() => trade().onCommitment(value, request));
}
function mount() {
  const props = {
    items: [{ asset: offerAsset(1), quantity: "2" }],
    active: true,
    onBack: jest.fn(),
  };
  return { ...render(<CollectOfferWorkspace {...props} />), props };
}
beforeEach(() => {
  mockTrade = undefined;
  mockPanel = undefined;
  mockProfile = OFFER_PROFILE;
  mockPayer = OFFER_PAYER;
  mockAuthenticated = true;
  mockProxy = false;
  mockRealPanel = false;
});

it("does not reserve a draft and forwards its exact quantity, per-NFT price and row cap to review", () => {
  mount();
  openReview();
  expect(trade()).toMatchObject({
    initialQuantity: "2",
    initialUnitPriceEth: "0.1",
    maximumOfferAmountWei: total,
  });
  expect(panel().pendingOffers).toEqual([]);
  expect(panel().publishedOffers).toEqual([]);
});
it("retains a pre-publication reservation after close and resumes the same operation with its original cap", () => {
  const { props, rerender } = mount();
  openReview();
  reserve();
  expect(panel().pendingOffers).toEqual([
    {
      operationId: "pending-one",
      assetKey: offerAsset(1).asset_key,
      amountWei: total,
    },
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Close offer" }));
  rerender(<CollectOfferWorkspace {...props} active={false} />);
  rerender(<CollectOfferWorkspace {...props} />);
  expect(panel().publishedOffers).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "Resume pending-one" }));
  expect(trade().initialOperation).toEqual(operation());
  expect(trade().maximumOfferAmountWei).toBe(total);
});
it("counts duplicate commitment callbacks once and moves pending to published without releasing its amount", () => {
  mount();
  openReview();
  reserve();
  reserve();
  expect(panel().pendingOffers).toHaveLength(1);
  const live = operation({ state: ApiMarketOperationStateEnum.Live });
  act(() => {
    trade().onPublished(live);
    trade().onPublished(live);
  });
  expect(panel().pendingOffers).toEqual([]);
  expect(panel().publishedOffers).toEqual([
    { assetKey: offerAsset(1).asset_key, amountWei: total },
  ]);
  reserve(live);
  expect(panel().pendingOffers).toEqual([]);
  expect(panel().publishedOffers).toHaveLength(1);
});
it("keeps UNKNOWN publication reserved and does not release it merely on modal close", () => {
  mount();
  openReview();
  reserve(operation({ state: ApiMarketOperationStateEnum.Unknown }));
  fireEvent.click(screen.getByRole("button", { name: "Close offer" }));
  expect(panel().pendingOffers).toHaveLength(1);
  expect(panel().publishedOffers).toEqual([]);
});
it("preserves commitments across strategy entries and forwards exact purchase routing boundaries", () => {
  const { props, rerender } = mount();
  openReview();
  reserve(operation({ state: ApiMarketOperationStateEnum.Unknown }));
  fireEvent.click(screen.getByRole("button", { name: "Close offer" }));
  const buyOptions = [
    {
      candidate_id: "listing",
      order_id: `0x${"2".repeat(64)}`,
      asset_key: offerAsset(2).asset_key,
      quantity: "1",
      unit_price_wei: "100000000000000000",
    },
  ];
  const onReviewBuys = jest.fn();
  const buyLockedAssetKeys = [offerAsset(2).asset_key];
  rerender(
    <CollectOfferWorkspace
      {...props}
      initialMethod="goal"
      strategySessionKey="blend"
      blended
      buyOptions={buyOptions}
      buyLockedAssetKeys={buyLockedAssetKeys}
      onReviewBuys={onReviewBuys}
    />
  );
  expect(panel().pendingOffers).toHaveLength(1);
  expect(panel()).toMatchObject({
    initialMethod: "goal",
    strategySessionKey: "blend",
    blended: true,
    buyLockedAssetKeys,
  });
  expect(panel().buyOptions).toBe(buyOptions);
  act(() => panel().onReviewBuys?.(buyOptions));
  expect(onReviewBuys).toHaveBeenCalledWith(buyOptions);
  rerender(
    <CollectOfferWorkspace
      {...props}
      initialMethod="match_bid"
      strategySessionKey="weth"
      buyLockedAssetKeys={buyLockedAssetKeys}
    />
  );
  expect(panel().pendingOffers).toHaveLength(1);
  expect(panel().buyLockedAssetKeys).toBe(buyLockedAssetKeys);
});
it.each([
  { asset_key: offerAsset(2).asset_key },
  { quantity: "1" },
  { profile_id: "different-profile" },
  { wallet: "0x2222222222222222222222222222222222222222" },
  { amount_wei: "1" },
])("rejects a commitment from a mismatched reviewed request %j", (patch) => {
  mount();
  openReview();
  expect(() => reserve(operation(), { ...expected(), ...patch })).toThrow(
    "OFFER_COMMITMENT_MISMATCH"
  );
  expect(panel().pendingOffers).toEqual([]);
});
it("resets private review state when profile or payer changes and ignores old callbacks in the new scope", () => {
  const { props, rerender } = mount();
  openReview();
  reserve();
  const oldTrade = trade();
  mockProfile = { ...OFFER_PROFILE, id: "other-profile" };
  mockPayer = "0x2222222222222222222222222222222222222222";
  rerender(<CollectOfferWorkspace {...props} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(panel().pendingOffers).toEqual([]);
  act(() =>
    oldTrade.onPublished(operation({ state: ApiMarketOperationStateEnum.Live }))
  );
  expect(panel().publishedOffers).toEqual([]);
});
it("drops private drafts on membership change and disables publication for signed-out or proxy actors", () => {
  const { props, rerender } = mount();
  openReview();
  mockProfile = {
    ...OFFER_PROFILE,
    wallets: [
      ...(OFFER_PROFILE.wallets ?? []),
      {
        wallet: "0x2222222222222222222222222222222222222222",
        display: "custody",
        tdh: 0,
      },
    ],
  };
  rerender(<CollectOfferWorkspace {...props} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  mockAuthenticated = false;
  rerender(<CollectOfferWorkspace {...props} />);
  expect(panel().disabledReason).toBeTruthy();
  mockAuthenticated = true;
  mockProxy = true;
  rerender(<CollectOfferWorkspace {...props} />);
  expect(panel().disabledReason).toBeTruthy();
});

it("retains unresolved actor commitments when the selected NFT set changes", () => {
  const { props, rerender } = mount();
  openReview();
  reserve();
  fireEvent.click(screen.getByRole("button", { name: "Close offer" }));
  const changed: ComponentProps<typeof CollectOfferWorkspace> = {
    ...props,
    items: [{ asset: offerAsset(2), quantity: "1" }],
  };
  rerender(<CollectOfferWorkspace {...changed} />);
  expect(panel().pendingOffers).toEqual([
    {
      operationId: "pending-one",
      assetKey: offerAsset(1).asset_key,
      amountWei: total,
    },
  ]);
});

it("keeps pending offer recovery accessible after changing the selection and filtering out its NFT", () => {
  mockRealPanel = true;
  const { props, rerender } = mount();
  openReview();
  reserve(operation({ state: ApiMarketOperationStateEnum.Unknown }));
  fireEvent.click(screen.getByRole("button", { name: "Close offer" }));
  rerender(
    <CollectOfferWorkspace
      {...props}
      items={[{ asset: offerAsset(2), quantity: "1" }]}
    />
  );
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "no matching artwork" },
  });
  const summary = screen.getByText("Awaiting offer status (1)");
  const disclosure = summary.closest("details");
  if (!disclosure) throw new Error("Expected the pending offer disclosure");
  const status = within(disclosure).getByRole("button", {
    name: "Check offer status · NFT #1",
  });
  expect(status).not.toBeVisible();
  fireEvent.click(summary);
  expect(status).toBeVisible();
  expect(within(disclosure).getByText("Artwork 1")).toBeVisible();
  expect(within(disclosure).getByText("Quantity: 2 · 0.2 WETH")).toBeVisible();
  fireEvent.click(status);
  expect(trade().initialOperation).toEqual(
    operation({ state: ApiMarketOperationStateEnum.Unknown })
  );
  expect(trade().initialQuantity).toBe("2");
  expect(trade().maximumOfferAmountWei).toBe(total);
  expect(panel().pendingOffers).toHaveLength(1);
  expect(panel().publishedOffers).toEqual([]);
});

it("bounds the pending disclosure and keeps every operation reachable by page", () => {
  mount();
  openReview();
  for (let index = 1; index <= 9; index++)
    reserve(operation({ id: `pending-${index}` }));
  fireEvent.click(screen.getByRole("button", { name: "Close offer" }));
  const summary = screen.getByText("Awaiting offer status (9)");
  const disclosure = summary.closest("details");
  if (!disclosure) throw new Error("Expected the pending offer disclosure");
  fireEvent.click(summary);
  expect(within(disclosure).getAllByRole("listitem")).toHaveLength(8);
  fireEvent.click(within(disclosure).getByRole("button", { name: "Next" }));
  expect(within(disclosure).getAllByRole("listitem")).toHaveLength(1);
  fireEvent.click(
    within(disclosure).getByRole("button", {
      name: "Check offer status · NFT #1",
    })
  );
  expect(trade().initialOperation?.id).toBe("pending-9");
  expect(panel().pendingOffers).toHaveLength(9);
  expect(panel().publishedOffers).toEqual([]);
});

it("subtracts a pending offer from the next selection's budget and binds only the remaining row cap", () => {
  mockRealPanel = true;
  const { props, rerender } = mount();
  fireEvent.change(
    screen.getByRole("textbox", { name: "WETH price per NFT for Artwork 1" }),
    { target: { value: "0.1" } }
  );
  fireEvent.click(screen.getByRole("button", { name: "Price method" }));
  fireEvent.click(
    screen.getByRole("option", { name: "Conservative allocation" })
  );
  fireEvent.change(
    screen.getByRole("textbox", { name: "Offer budget (WETH)" }),
    { target: { value: "0.5" } }
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Review offer for Artwork 1" })
  );
  reserve();
  fireEvent.click(screen.getByRole("button", { name: "Close offer" }));
  rerender(
    <CollectOfferWorkspace
      {...props}
      items={[{ asset: offerAsset(2), quantity: "1" }]}
    />
  );
  const input = screen.getByRole("textbox", {
    name: "WETH price per NFT for Artwork 2",
  });
  fireEvent.change(input, { target: { value: "0.4" } });
  fireEvent.click(screen.getByRole("button", { name: "Price method" }));
  fireEvent.click(
    screen.getByRole("option", { name: "Conservative allocation" })
  );
  fireEvent.change(
    screen.getByRole("textbox", { name: "Offer budget (WETH)" }),
    { target: { value: "0.5" } }
  );
  expect(
    screen.getByRole("button", { name: "Review offer for Artwork 2" })
  ).toBeDisabled();
  fireEvent.change(input, { target: { value: "0.3" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Review offer for Artwork 2" })
  );
  expect(trade().maximumOfferAmountWei).toBe("300000000000000000");
  expect(panel().pendingOffers).toHaveLength(1);
});
