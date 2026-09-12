import CollectPageClient from "@/components/collect/CollectPageClient";
import type CollectPageView from "@/components/collect/CollectPageView";
import type CollectBatchController from "@/components/collect/CollectBatchController";
import type CollectOfferWorkspace from "@/components/collect/CollectOfferWorkspace";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
} from "@/components/collect/market-validation";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

let mockParams = new URLSearchParams("intent=lowest&collection=memes");
let mockProfile: ApiIdentity | null = null;
let mockEntries: Array<{ asset: ApiCollectAsset; order: ApiMarketTradeOrder }> =
  [];
const mockBatch = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockParams,
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: mockProfile, requestAuth: jest.fn() }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnect: jest.fn() }),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { COLLECT_CATALOG: "catalog", COLLECT_CAPABILITIES: "caps" },
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectCatalog: jest.fn(),
  fetchCollectCapabilities: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: undefined }),
}));
jest.mock("@/components/collect/useCollectCatalog", () => ({
  collectCatalogEntryId: (entry: { order: ApiMarketTradeOrder }) =>
    entry.order.identity.order_hash,
  useCollectCatalog: () => ({
    entries: mockEntries,
    pending: false,
    failed: false,
    hasMore: false,
    loadingMore: false,
    retry: jest.fn(),
    loadMore: jest.fn(),
  }),
}));
jest.mock("@/components/collect/collect-catalog.adapters", () => ({
  collectCatalogArtwork: (entry: {
    asset: ApiCollectAsset;
    order: ApiMarketTradeOrder;
  }) => ({ id: entry.order.identity.order_hash, title: entry.asset.name }),
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
  default: (props: ComponentProps<typeof CollectPageView>) => (
    <div>
      {props.catalog.status === "ready" &&
        props.catalog.items.map((item) => {
          const selection = props.selectionFor?.(item.id);
          return (
            <button
              key={item.id}
              aria-pressed={selection?.selected}
              disabled={Boolean(selection?.disabledReason)}
              onClick={selection?.onToggle}
            >
              {item.title}
            </button>
          );
        })}
      {props.selectionSummary}
      {props.workspaceContent}
    </div>
  ),
}));
jest.mock("@/components/collect/CollectOfferWorkspace", () => ({
  __esModule: true,
  default: ({
    active,
    onBack,
  }: ComponentProps<typeof CollectOfferWorkspace>) => (
    <div hidden={!active}>
      <button onClick={onBack}>Back to collecting</button>
    </div>
  ),
}));
jest.mock("@/components/collect/CollectBatchController", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectBatchController>) => {
    mockBatch(props);
    return <button onClick={props.onClose}>Close batch</button>;
  },
}));
jest.mock("@/components/collect/CollectTradeController", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectPlanBasket", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectGoalsController", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectTdhTargetController", () => ({
  __esModule: true,
  default: () => null,
}));

function listing(id: string, suffix = "a") {
  const asset: ApiCollectAsset = {
    asset_key: `1:0x33fd426905f149f8376e227d0c9d3340aad17af1:${id}`,
    chain_id: 1,
    contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
    token_id: id,
    family: ApiCollectFamily.Memes,
    name: `Artwork ${id}`,
    image_url: null,
    artist_ids: [],
    season: 1,
    traits: [],
    hodl_rate: 1,
    tdh_eligible: true,
  };
  const order: ApiMarketTradeOrder = {
    identity: {
      protocol_address: MARKET_SEAPORT,
      order_hash: `0x${suffix.repeat(64)}`,
    },
    asset_key: asset.asset_key,
    maker: "0x1111111111111111111111111111111111111111",
    side: ApiMarketTradeOrderSideEnum.Listing,
    quantity: "1",
    purchase_quantity: "1",
    quantity_step: "1",
    available_quantity: "1",
    currency: MARKET_ZERO,
    total_wei: "100000000000000000",
    net_wei: "100000000000000000",
    fees: [],
    start_time: "1",
    end_time: "9999999999",
    recipient: MARKET_ZERO,
  };
  return { asset, order };
}
beforeEach(() => {
  jest.clearAllMocks();
  mockProfile = null;
  mockParams = new URLSearchParams("intent=lowest&collection=memes");
  mockEntries = [listing("1")];
});
it("adds directly without opening a trade and preserves exact selection through URL/collection/page changes", () => {
  const { rerender } = render(<CollectPageClient />);
  fireEvent.click(screen.getByRole("button", { name: "Artwork 1" }));
  expect(screen.getByRole("button", { name: "Artwork 1" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  expect(mockBatch).not.toHaveBeenCalled();
  mockParams = new URLSearchParams(
    "intent=season&collection=memes&definition=2&page=3"
  );
  mockEntries = [];
  rerender(<CollectPageClient />);
  expect(screen.getByText("1 selected")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Review purchase" }));
  const props = mockBatch.mock.calls.at(-1)?.[0] as ComponentProps<
    typeof CollectBatchController
  >;
  expect(props.items[0]?.order.identity.order_hash).toBe(`0x${"a".repeat(64)}`);
});
it("never substitutes a newly fetched listing for an already selected one", () => {
  const { rerender } = render(<CollectPageClient />);
  fireEvent.click(screen.getByRole("button", { name: "Artwork 1" }));
  mockEntries = [listing("1", "b")];
  rerender(<CollectPageClient />);
  fireEvent.click(screen.getByRole("button", { name: "Review purchase" }));
  const props = mockBatch.mock.calls.at(-1)?.[0] as ComponentProps<
    typeof CollectBatchController
  >;
  expect(props.items[0]?.order.identity.order_hash).toBe(`0x${"a".repeat(64)}`);
});
it("discards unsigned selection when profile membership changes", () => {
  const { rerender } = render(<CollectPageClient />);
  fireEvent.click(screen.getByRole("button", { name: "Artwork 1" }));
  mockProfile = {
    id: "profile",
    primary_wallet: "0x2222222222222222222222222222222222222222",
    wallets: [],
  } as unknown as ApiIdentity;
  rerender(<CollectPageClient />);
  expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Artwork 1" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
});

it("returns focus to the remounted selection offer trigger after each workspace visit", async () => {
  const user = userEvent.setup();
  render(<CollectPageClient />);
  await user.click(screen.getByRole("button", { name: "Artwork 1" }));
  for (let visit = 0; visit < 2; visit++) {
    const original = screen.getByRole("button", {
      name: "Plan offers",
    });
    await user.click(original);
    expect(original).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Back to collecting" })
    );
    const replacement = screen.getByRole("button", {
      name: "Plan offers",
    });
    expect(replacement).not.toBe(original);
    expect(replacement).toHaveFocus();
    expect(screen.getByText("1 selected")).toBeVisible();
  }
});

it("discards offer return focus when the collecting account changes", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<CollectPageClient />);
  await user.click(screen.getByRole("button", { name: "Artwork 1" }));
  await user.click(screen.getByRole("button", { name: "Plan offers" }));
  mockProfile = {
    id: "other-profile",
    primary_wallet: "0x2222222222222222222222222222222222222222",
    wallets: [],
  } as unknown as ApiIdentity;
  rerender(<CollectPageClient />);
  expect(
    screen.queryByRole("button", { name: "Back to collecting" })
  ).not.toBeInTheDocument();
  const add = screen.getByRole("button", { name: "Artwork 1" });
  await user.click(add);
  expect(add).toHaveFocus();
  expect(screen.getByRole("button", { name: "Plan offers" })).not.toHaveFocus();
});
