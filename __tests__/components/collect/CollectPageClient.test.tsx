import CollectPageClient from "@/components/collect/CollectPageClient";
import type CollectGoalsController from "@/components/collect/CollectGoalsController";
import CollectCompletionControls from "@/components/collect/CollectCompletionControls";
import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

let mockSearchParams = new URLSearchParams();
const mockReplace = jest.fn();
const mockDiscovery = jest.fn();

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
  useQuery: () => ({ data: undefined }),
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
  }: ComponentProps<typeof CollectGoalsController>) => (
    <div>
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
jest.mock("@/components/collect/CollectTdhController", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectPlanBasket", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectTradeController", () => ({
  __esModule: true,
  default: () => null,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams();
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
      screen.getByRole("option", { name: labels[after] ?? after, exact: true })
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

it("defaults to a set planner and links to the native artwork collections", () => {
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
  expect(screen.getByRole("link", { name: "The Memes" })).toHaveAttribute(
    "href",
    "/the-memes"
  );
  expect(screen.getByRole("link", { name: "Gradients" })).toHaveAttribute(
    "href",
    "/6529-gradient"
  );
  expect(screen.getByRole("link", { name: "Pebbles" })).toHaveAttribute(
    "href",
    "/nextgen/collection/pebbles"
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
  expect(screen.getByRole("combobox", { name: "Collections" })).toHaveValue(
    "memes"
  );
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
  expect(screen.getByRole("combobox", { name: "Collections" })).toHaveValue(
    "gradients"
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Collections" }), {
    target: { value: "pebbles" },
  });
  expect(mockReplace).toHaveBeenCalledWith(
    "/collect?intent=tdh&collection=pebbles",
    { scroll: false }
  );

  mockReplace.mockClear();
  mockSearchParams = new URLSearchParams("intent=tdh&collection=pebbles");
  rerender(<CollectPageClient />);
  expect(screen.getByRole("combobox", { name: "Collections" })).toHaveValue(
    "pebbles"
  );
  expect(mockReplace).not.toHaveBeenCalled();
});
