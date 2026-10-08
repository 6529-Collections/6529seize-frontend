import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SidebarDiscovery } from "@/components/brain/left-sidebar/waves/SidebarDiscovery";
const mockSetActive = jest.fn();
let mockActiveWaveId: string | null = null;
const mockRefetch = jest.fn();
const mockNext = jest.fn();
const vote = (id: string) => ({
  wave: { id, name: id, pfp: null },
  voting_ends_at: null,
  next_decision_at: null,
});
const makeVotes = () => ({
  data: {
    pages: [
      {
        count: 23,
        data: [
          vote("Rare Pepe acquisition"),
          vote("QUORUM"),
          vote("Third vote"),
        ],
      },
    ],
  } as
    | { pages: { count: number; data: ReturnType<typeof vote>[] }[] }
    | undefined,
  isPending: false,
  isError: false,
  hasNextPage: true,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  refetch: mockRefetch,
  fetchNextPage: mockNext,
});
let mockVotes = makeVotes();
let mockCanUseCollections = false;
jest.mock("@/hooks/useWaveDiscoveryViewer", () => ({
  useWaveDiscoveryViewer: () => ({ canUseCollections: mockCanUseCollections }),
}));
let observerCallback: IntersectionObserverCallback;
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
jest.mock("@/hooks/useActiveWaveVotes", () => ({
  useActiveWaveVotes: () => mockVotes,
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    activeWave: { id: mockActiveWaveId, set: mockSetActive },
  }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/waves/WavePicture", () => ({
  __esModule: true,
  default: () => <span />,
}));
const renderDiscovery = () =>
  render(<SidebarDiscovery previewItems={[]} isTouchPreview={false} />);
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  jest.clearAllMocks();
  mockVotes = makeVotes();
  mockCanUseCollections = false;
  mockActiveWaveId = null;
  window.IntersectionObserver = jest.fn(
    (callback: IntersectionObserverCallback) => {
      observerCallback = callback;
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: jest.fn(),
        takeRecords: () => [],
        root: null,
        rootMargin: "32px",
        thresholds: [0],
      };
    }
  );
});
it("shows both sections in order with both view-all links", () => {
  renderDiscovery();
  const active = screen.getByRole("button", { name: "Collapse Active Votes" });
  const recommendations = screen.getByRole("button", {
    name: "Collapse Worth Checking Out",
  });
  expect(
    recommendations.compareDocumentPosition(active) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(active).toHaveTextContent("23");
  expect(screen.getByText("Rare Pepe acquisition")).toBeVisible();
  expect(screen.getByText("Highly rated waves.")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "View all active votes" })
  ).toHaveAttribute("href", "/discover?view=active-votes");
  expect(
    screen.getByRole("link", { name: "View all recommendations" })
  ).toHaveAttribute("href", "/discover?view=recommendations&sort=QUALITY");
});
it("keeps header navigation separate from disclosure toggles", () => {
  renderDiscovery();
  const active = screen.getByRole("button", { name: "Collapse Active Votes" });
  const link = screen.getByRole("link", { name: "View all active votes" });
  expect(link).toHaveTextContent("View all");
  expect(active).not.toContainElement(link);
  fireEvent.click(link, { ctrlKey: true });
  expect(active).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(active);
  expect(link).toBeVisible();
  fireEvent.click(link, { ctrlKey: true });
  expect(
    screen.getByRole("button", { name: "Expand Active Votes" })
  ).toHaveAttribute("aria-expanded", "false");
});
it("uses personalized recommendations copy only for an authenticated viewer", () => {
  mockCanUseCollections = true;
  renderDiscovery();
  expect(
    screen.getByText("Highly rated waves you don’t follow.")
  ).toBeVisible();
});
it("collapses each section independently and makes its contents inert", () => {
  renderDiscovery();
  const active = screen.getByRole("button", { name: "Collapse Active Votes" });
  const panel = document.getElementById(active.getAttribute("aria-controls")!);
  fireEvent.click(active);
  expect(panel).toHaveAttribute("inert");
  expect(screen.queryByRole("link", { name: /Rare Pepe/ })).toBeNull();
  expect(
    screen.getByRole("link", { name: "View all recommendations" })
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Expand Active Votes" })
  ).toHaveTextContent("23");
  fireEvent.click(
    screen.getByRole("button", { name: "Collapse Worth Checking Out" })
  );
  fireEvent.click(screen.getByRole("button", { name: "Expand Active Votes" }));
  expect(screen.getByRole("link", { name: /Rare Pepe/ })).toBeVisible();
  expect(
    screen.getByRole("link", { name: "View all recommendations" })
  ).toBeVisible();
});
it("persists independent collapse preferences across browser sessions", () => {
  const first = renderDiscovery();
  fireEvent.click(
    screen.getByRole("button", { name: "Collapse Active Votes" })
  );
  first.unmount();
  sessionStorage.clear();
  renderDiscovery();
  expect(
    screen.getByRole("button", { name: "Expand Active Votes" })
  ).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.getByRole("button", { name: "Collapse Worth Checking Out" })
  ).toHaveAttribute("aria-expanded", "true");
});
it("shows compact empty feedback without hiding either section or view-all link", () => {
  mockVotes.data = { pages: [{ count: 0, data: [] }] };
  mockVotes.hasNextPage = false;
  renderDiscovery();
  expect(screen.getByText("No active TDH votes right now.")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "View all active votes" })
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Collapse Worth Checking Out" })
  ).toBeVisible();
});
it.each(["loading", "error"])(
  "does not mistake %s for no active votes",
  (state) => {
    mockVotes.data = undefined;
    mockVotes.isPending = state === "loading";
    mockVotes.isError = state === "error";
    mockVotes.hasNextPage = false;
    renderDiscovery();
    expect(screen.queryByText("No active TDH votes right now.")).toBeNull();
    expect(
      screen.getByRole(state === "error" ? "alert" : "status")
    ).toBeVisible();
    if (state === "error") {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    }
  }
);
it("retains loaded rows and retries a failed next page without refetching from the beginning", () => {
  mockVotes.isError = true;
  mockVotes.isFetchNextPageError = true;
  renderDiscovery();
  expect(screen.getByText("Rare Pepe acquisition")).toBeVisible();
  expect(mockObserve).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mockNext).toHaveBeenCalledTimes(1);
  expect(mockRefetch).not.toHaveBeenCalled();
});
it("uses the vote scroll area for pagination, guards duplicate loads, and renders later pages", () => {
  const { rerender } = renderDiscovery();
  const list = screen.getByRole("region", { name: "Active voting waves" });
  expect(window.IntersectionObserver).toHaveBeenCalledWith(
    expect.any(Function),
    { root: list, rootMargin: "32px" }
  );
  const entry = { isIntersecting: true } as IntersectionObserverEntry;
  act(() => {
    observerCallback([entry], {} as IntersectionObserver);
    observerCallback([entry], {} as IntersectionObserver);
  });
  expect(mockNext).toHaveBeenCalledTimes(1);
  mockVotes.data!.pages.push({ count: 23, data: [vote("Later page vote")] });
  rerender(<SidebarDiscovery previewItems={[]} isTouchPreview={false} />);
  expect(
    within(list).getByRole("link", { name: /Later page vote/ })
  ).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Collapse Active Votes" })
  );
  expect(mockDisconnect).toHaveBeenCalled();
});
it("updates the active-votes fade on scroll without measuring layout for unrelated renders", () => {
  const { rerender } = renderDiscovery();
  const list = screen.getByRole("region", { name: "Active voting waves" });
  let contentHeight = 300;
  const readHeight = jest.fn(() => contentHeight);
  Object.defineProperties(list, {
    scrollHeight: { configurable: true, get: readHeight },
    clientHeight: { configurable: true, get: () => 144 },
    scrollTop: { configurable: true, get: () => 0 },
  });
  const fade = () => list.parentElement?.querySelector('[aria-hidden="true"]');

  fireEvent.scroll(list);
  expect(fade()).toBeInTheDocument();
  readHeight.mockClear();

  mockActiveWaveId = "QUORUM";
  rerender(<SidebarDiscovery previewItems={[]} isTouchPreview={false} />);
  expect(readHeight).not.toHaveBeenCalled();
  expect(fade()).toBeInTheDocument();

  contentHeight = 144;
  fireEvent.scroll(list);
  expect(fade()).toBeNull();
});
it("provides a keyboard-accessible load-more fallback and disables it while fetching", () => {
  const { rerender } = renderDiscovery();
  fireEvent.click(screen.getByRole("button", { name: "Load more" }));
  expect(mockNext).toHaveBeenCalledTimes(1);
  mockVotes.isFetchingNextPage = true;
  rerender(<SidebarDiscovery previewItems={[]} isTouchPreview={false} />);
  expect(screen.getByRole("button", { name: "Loading waves…" })).toBeDisabled();
});
it("opens a vote in the existing navigation but preserves modified clicks", () => {
  renderDiscovery();
  const link = screen.getByRole("link", { name: /Rare Pepe/ });
  fireEvent.click(link, { ctrlKey: true });
  expect(mockSetActive).not.toHaveBeenCalled();
  fireEvent.click(link);
  expect(mockSetActive).toHaveBeenCalledWith("Rare Pepe acquisition", {
    isDirectMessage: false,
  });
});

it("tracks the current wave in Active Votes when selection changes elsewhere", () => {
  mockActiveWaveId = "QUORUM";
  const { rerender } = renderDiscovery();
  const quorum = screen.getByRole("link", { name: /QUORUM/ });
  const rarePepe = screen.getByRole("link", { name: /Rare Pepe/ });
  expect(quorum).toHaveAttribute("aria-current", "page");
  expect(quorum.parentElement).toHaveClass("tw-bg-iron-700/50");
  expect(rarePepe).not.toHaveAttribute("aria-current");

  mockActiveWaveId = "Rare Pepe acquisition";
  rerender(<SidebarDiscovery previewItems={[]} isTouchPreview={false} />);
  expect(rarePepe).toHaveAttribute("aria-current", "page");
  expect(quorum).not.toHaveAttribute("aria-current");
  expect(quorum.parentElement).not.toHaveClass("tw-bg-iron-700/50");

  mockActiveWaveId = null;
  rerender(<SidebarDiscovery previewItems={[]} isTouchPreview={false} />);
  expect(rarePepe).not.toHaveAttribute("aria-current");
  expect(rarePepe.parentElement).not.toHaveClass("tw-bg-iron-700/50");
});
