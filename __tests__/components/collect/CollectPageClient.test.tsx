import CollectPageClient from "@/components/collect/CollectPageClient";
import type CollectGoalsController from "@/components/collect/CollectGoalsController";
import type CollectBatchController from "@/components/collect/CollectBatchController";
import type CollectTdhTargetController from "@/components/collect/CollectTdhTargetController";
import type CollectTdhDailyWorkspace from "@/components/collect/CollectTdhDailyWorkspace";
import CollectCompletionControls from "@/components/collect/CollectCompletionControls";
import { useState, type ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { targetPlan } from "./collect-tdh-target.fixture";
import { batchFixture } from "./market-batch.fixture";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";

const mockTarget = targetPlan();
const mockPurchaseItems = mockTarget.items.map((item) => ({
  asset: item.asset,
  order: item.order,
  quantity: item.quantity,
}));

let mockSearchParams = new URLSearchParams();
const mockReplace = jest.fn();
const mockDiscovery = jest.fn();
const mockCatalogRefetch = jest.fn();
let mockCatalogQuery = {
  data: undefined,
  isError: false,
  isFetching: true,
  refetch: mockCatalogRefetch,
};

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null, requestAuth: jest.fn() }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnect: jest.fn() }),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: {
    COLLECT_CATALOG: "collect-catalog",
    COLLECT_CAPABILITIES: "collect-capabilities",
  },
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectCapabilities: jest.fn(),
  fetchCollectCatalog: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: (options: { queryKey: readonly unknown[] }) =>
    options.queryKey.includes("plan-metadata")
      ? { data: [] }
      : mockCatalogQuery,
}));
jest.mock("@/components/collect/useCollectCatalog", () => ({
  useCollectCatalog: (...args: unknown[]) => mockDiscovery(...args),
  collectCatalogEntryId: jest.fn(),
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectGoalsController", () => ({
  __esModule: true,
  default: ({
    draft,
    onChange,
    completion,
    catalogFailed,
    onRetryCatalog,
  }: ComponentProps<typeof CollectGoalsController>) => (
    <div>
      <output aria-label="Catalog failed">{String(catalogFailed)}</output>
      <button onClick={onRetryCatalog}>Retry catalog</button>
      {completion && (
        <CollectCompletionControls
          {...completion}
          intent={draft.intent}
          disabled={false}
          locale="en-US"
        />
      )}
      <output aria-label="Goal definition">{draft.definitionId}</output>
      <label>
        Goal budget
        <input
          value={draft.budgetEth}
          onChange={(event) =>
            onChange({ ...draft, budgetEth: event.target.value })
          }
        />
      </label>
    </div>
  ),
}));
jest.mock("@/components/collect/CollectTdhTargetController", () => ({
  __esModule: true,
  default: function MockTarget({
    onReviewPurchase,
  }: ComponentProps<typeof CollectTdhTargetController>) {
    const [calculated, setCalculated] = useState(false);
    return (
      <div data-testid="profile-tdh-projection">
        <button onClick={() => setCalculated(true)}>
          Calculate projection
        </button>
        {calculated && (
          <>
            <output>Calculated TDH benefit</output>
            <button
              onClick={() =>
                onReviewPurchase(
                  mockPurchaseItems,
                  mockTarget.request.recipient
                )
              }
            >
              Review planned NFTs
            </button>
          </>
        )}
      </div>
    );
  },
}));
jest.mock("@/components/collect/CollectTdhDailyWorkspace", () => ({
  __esModule: true,
  default: function MockDaily({
    onReviewPurchase,
  }: ComponentProps<typeof CollectTdhDailyWorkspace>) {
    const [calculated, setCalculated] = useState(false);
    return (
      <div>
        <button onClick={() => setCalculated(true)}>
          Calculate projection
        </button>
        {calculated && (
          <>
            <output>Calculated TDH benefit</output>
            <button
              onClick={() =>
                onReviewPurchase(
                  mockPurchaseItems,
                  mockTarget.request.recipient
                )
              }
            >
              Review planned NFTs
            </button>
          </>
        )}
      </div>
    );
  },
}));
jest.mock("@/components/collect/CollectPlanBasket", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectTradeController", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectBatchController", () => ({
  __esModule: true,
  default: function MockBatch({
    items,
    onSettled,
  }: ComponentProps<typeof CollectBatchController>) {
    const [gift, setGift] = useState(false);
    return (
      <div data-testid="active-purchase-review">
        <output>{items.length} reserved selections</output>
        <button onClick={() => setGift(true)}>Change delivery to a fren</button>
        {gift && <output>Gift delivery selected</output>}
        <button
          onClick={() =>
            onSettled?.({
              ...batchFixture().operation,
              state: ApiMarketBatchOperationStateEnum.Confirmed,
            })
          }
        >
          Purchase confirmed
        </button>
      </div>
    );
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams();
  mockCatalogQuery = {
    data: undefined,
    isError: false,
    isFetching: true,
    refetch: mockCatalogRefetch,
  };
  mockDiscovery.mockReturnValue({
    entries: [],
    pending: false,
    failed: false,
    hasMore: false,
    loadingMore: false,
    retry: jest.fn(),
    loadMore: jest.fn(),
  });
});

it("wires catalog retry and replaces a failed initial read with a pending retry", () => {
  mockSearchParams = new URLSearchParams("intent=full_set");
  mockCatalogQuery = { ...mockCatalogQuery, isError: true, isFetching: false };
  const { rerender } = render(<CollectPageClient />);
  expect(screen.getByLabelText("Catalog failed")).toHaveTextContent("true");
  fireEvent.click(screen.getByRole("button", { name: "Retry catalog" }));
  expect(mockCatalogRefetch).toHaveBeenCalledTimes(1);
  mockCatalogQuery = { ...mockCatalogQuery, isFetching: true };
  rerender(<CollectPageClient />);
  expect(screen.getByLabelText("Catalog failed")).toHaveTextContent("false");
});

it("opens a Gradient full set from listing comparison with no leftover search", () => {
  mockSearchParams = new URLSearchParams(
    "collection=gradients&intent=lowest&token=0&q=old&definition=old"
  );
  const { rerender } = render(<CollectPageClient />);
  fireEvent.click(screen.getByRole("button", { name: "Complete a set" }));
  expect(mockReplace).toHaveBeenCalledWith(
    "/collect?collection=gradients&intent=full_set",
    { scroll: false }
  );

  mockSearchParams = new URLSearchParams(
    "collection=gradients&intent=full_set"
  );
  rerender(<CollectPageClient />);
  expect(screen.getByLabelText("Goal definition")).toHaveTextContent(
    "gradients"
  );
  expect(mockDiscovery).toHaveBeenLastCalledWith("gradients", "full_set");
  expect(
    screen.queryByRole("region", { name: "Lowest listings" })
  ).not.toBeInTheDocument();
});

it("honors an explicit full-set definition and retains edited drafts on rerender", () => {
  const query = "collection=gradients&intent=full_set&definition=memes";
  mockSearchParams = new URLSearchParams(query);
  const { rerender } = render(<CollectPageClient />);
  expect(screen.getByLabelText("Goal definition")).toHaveTextContent("memes");
  fireEvent.change(screen.getByLabelText("Goal budget"), {
    target: { value: "1.25" },
  });

  mockSearchParams = new URLSearchParams(query);
  rerender(<CollectPageClient />);
  expect(screen.getByLabelText("Goal budget")).toHaveValue("1.25");
  expect(screen.getByLabelText("Goal definition")).toHaveTextContent("memes");
  expect(mockReplace).not.toHaveBeenCalled();
});

it("preserves the focused goal controls and budget across URL filters and goal changes", () => {
  mockSearchParams = new URLSearchParams("collection=memes&intent=full_set");
  const { rerender } = render(<CollectPageClient />);
  const budget = screen.getByLabelText("Goal budget");
  fireEvent.change(budget, { target: { value: "2.5" } });
  budget.focus();
  mockSearchParams = new URLSearchParams(
    "collection=memes&intent=full_set&q=artwork&page=2"
  );
  rerender(<CollectPageClient />);
  expect(screen.getByLabelText("Goal budget")).toBe(budget);
  expect(budget).toHaveFocus();
  mockSearchParams = new URLSearchParams(
    "collection=memes&intent=season&definition=1"
  );
  rerender(<CollectPageClient />);
  expect(screen.getByLabelText("Goal budget")).toBe(budget);
  expect(budget).toHaveFocus();
  expect(budget).toHaveValue("2.5");
  expect(screen.getByLabelText("Goal definition")).toHaveTextContent("1");
});

it.each(["Season", "Artist"])(
  "opens the Memes %s goal and clears artwork filters",
  (goal) => {
    mockSearchParams = new URLSearchParams(
      "collection=memes&intent=full_set&definition=memes&token=8&q=old"
    );
    render(<CollectPageClient />);
    fireEvent.click(screen.getByRole("radio", { name: goal }));
    expect(mockReplace).toHaveBeenCalledWith(
      `/collect?collection=memes&intent=${goal.toLowerCase()}`,
      { scroll: false }
    );
  }
);

it.each([
  ["memes", "artist", "gradients", "full_set"],
  ["memes", "season", "pebbles", "pebbles_set"],
  ["pebbles", "pebbles_set", "memes", "full_set"],
  ["gradients", "full_set", "memes", "full_set"],
])(
  "switches %s %s to a valid %s %s goal",
  (before, intent, after, nextIntent) => {
    mockSearchParams = new URLSearchParams(
      `collection=${before}&intent=${intent}&definition=old&token=8&q=old`
    );
    render(<CollectPageClient />);
    fireEvent.keyDown(screen.getByRole("button", { name: /^Collection\b/ }), {
      key: "Enter",
    });
    const labels: Readonly<Record<string, string>> = {
      memes: "The Memes",
      gradients: "Gradients",
      pebbles: "Pebbles",
    };
    fireEvent.click(
      screen.getByRole("option", { name: labels[after] ?? after })
    );
    expect(mockReplace).toHaveBeenCalledWith(
      `/collect?collection=${after}&intent=${nextIntent}`,
      { scroll: false }
    );
  }
);

it.each(["gradients", "pebbles"])(
  "does not show Memes-only goal choices for %s",
  (collection) => {
    mockSearchParams = new URLSearchParams(
      `collection=${collection}&intent=${collection === "pebbles" ? "pebbles_set" : "full_set"}`
    );
    render(<CollectPageClient />);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Collection\b/ })
    ).toHaveTextContent(collection === "gradients" ? "Gradients" : "Pebbles");
  }
);

it("defaults to a set planner and links to its native artwork collection", () => {
  render(<CollectPageClient />);
  expect(screen.getByLabelText("Goal definition")).toHaveTextContent("memes");
  expect(
    screen.getByRole("button", { name: "Complete a set", pressed: true })
  ).toBeVisible();
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Explore" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "Lowest listings" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("group", { name: "Collections" })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View The Memes" })).toHaveAttribute(
    "href",
    "/the-memes"
  );
});

it("shows collection choice and recoverable listing errors only in lowest mode", () => {
  mockSearchParams = new URLSearchParams("collection=gradients&intent=lowest");
  const retry = jest.fn();
  mockDiscovery.mockReturnValue({
    entries: [],
    pending: false,
    failed: true,
    hasMore: false,
    loadingMore: false,
    retry,
    loadMore: jest.fn(),
  });
  render(<CollectPageClient />);
  expect(screen.getByRole("region", { name: "Lowest listings" })).toBeVisible();
  expect(screen.getByRole("group", { name: "Collections" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText("Goal definition")).not.toBeInTheDocument();
});

it("starts a fresh TDH visit with The Memes", () => {
  mockSearchParams = new URLSearchParams("intent=tdh");
  render(<CollectPageClient />);
  expect(
    screen.getByRole("button", { name: "The Memes", pressed: true })
  ).toBeVisible();
  expect(screen.getByRole("region", { name: "Lowest cost TDH" })).toBeVisible();
  expect(
    screen.queryByTestId("profile-tdh-projection")
  ).not.toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("starts TDH with The Memes when switching from Pebbles listings", () => {
  mockSearchParams = new URLSearchParams(
    "collection=pebbles&intent=lowest&token=8&q=old&definition=old"
  );
  render(<CollectPageClient />);
  fireEvent.click(screen.getByRole("button", { name: "TDH" }));
  expect(mockReplace).toHaveBeenCalledWith(
    "/collect?collection=memes&intent=tdh",
    { scroll: false }
  );
});

it("preserves explicit TDH collection links and subsequent user selections", () => {
  mockSearchParams = new URLSearchParams("intent=tdh&collection=gradients");
  const { rerender } = render(<CollectPageClient />);
  expect(
    screen.queryByRole("region", { name: "Lowest listings" })
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Gradients", pressed: true })
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Pebbles" }));
  expect(mockReplace).toHaveBeenCalledWith(
    "/collect?intent=tdh&collection=pebbles",
    { scroll: false }
  );

  mockReplace.mockClear();
  mockSearchParams = new URLSearchParams("intent=tdh&collection=pebbles");
  rerender(<CollectPageClient />);
  expect(
    screen.getByRole("button", { name: "Pebbles", pressed: true })
  ).toBeVisible();
  expect(screen.getByRole("link", { name: "View Pebbles" })).toHaveAttribute(
    "href",
    "/nextgen/collection/pebbles"
  );
  expect(mockReplace).not.toHaveBeenCalled();
});

it("keeps time-based profile projection separate from the immediate TDH listings", () => {
  mockSearchParams = new URLSearchParams("intent=tdh&collection=memes");
  const { rerender } = render(<CollectPageClient />);
  fireEvent.click(screen.getByRole("button", { name: "Reach target TDH" }));
  expect(mockReplace).toHaveBeenLastCalledWith(
    "/collect?intent=tdh&collection=memes&view=projection",
    { scroll: false }
  );

  mockSearchParams = new URLSearchParams(
    "intent=tdh&collection=memes&view=projection"
  );
  rerender(<CollectPageClient />);
  expect(screen.getByTestId("profile-tdh-projection")).toBeVisible();
  expect(
    screen.queryByRole("region", { name: "Lowest cost TDH" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Back to TDH listings" }));
  expect(mockReplace).toHaveBeenLastCalledWith(
    "/collect?intent=tdh&collection=memes",
    { scroll: false }
  );
});

it.each(["", "&view=projection"])(
  "invalidates settled TDH results without interrupting delivery edits or the active review: %s",
  (view) => {
    mockSearchParams = new URLSearchParams(
      `intent=tdh&collection=memes${view}`
    );
    const { rerender } = render(<CollectPageClient />);
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate projection" })
    );
    const calculation = screen.getByText("Calculated TDH benefit");
    fireEvent.click(
      screen.getByRole("button", { name: "Review planned NFTs" })
    );
    const review = screen.getByTestId("active-purchase-review");
    fireEvent.click(
      screen.getByRole("button", { name: "Change delivery to a fren" })
    );
    rerender(<CollectPageClient />);
    expect(screen.getByText("Calculated TDH benefit")).toBe(calculation);
    expect(screen.getByTestId("active-purchase-review")).toBe(review);
    expect(screen.getByText("Gift delivery selected")).toBeVisible();
    expect(screen.getByText("1 reserved selections")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Purchase confirmed" }));
    expect(
      screen.queryByText("Calculated TDH benefit")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("active-purchase-review")).toBe(review);
    expect(screen.getByText("Gift delivery selected")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate projection" })
    );
    expect(screen.getByText("Calculated TDH benefit")).not.toBe(calculation);
  }
);
