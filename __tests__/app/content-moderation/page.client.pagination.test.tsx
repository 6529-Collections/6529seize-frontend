import BlockActivityFeed from "@/app/content-moderation/BlockActivityFeed";
import ContentModerationPageClient from "@/app/content-moderation/page.client";
import {
  type ApiContentModerationBlockActivityItem,
  ApiContentModerationBlockActivityItemActionEnum,
} from "@/generated/models/ApiContentModerationBlockActivityItem";
import type { ApiContentModerationQueueItem } from "@/generated/models/ApiContentModerationQueueItem";
import { ApiContentModerationRecommendation } from "@/generated/models/ApiContentModerationRecommendation";
import { ApiContentModerationReportReason } from "@/generated/models/ApiContentModerationReportReason";
import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { ApiModeratedProfileStatus } from "@/generated/models/ApiModeratedProfileStatus";
import {
  fetchContentModerationBlockActivity,
  fetchContentModerationQueue,
  fetchSuspendedModerationProfiles,
} from "@/services/api/content-moderation-api";
import { BLOCK_ACTIVITY_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  render as renderUi,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { useEffect, useState, type ReactNode } from "react";

// Supply Next's pathname context and model its native-history integration.
function NavigationTestProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [pathname, setPathname] = useState(globalThis.location.pathname);
  useEffect(() => {
    const updatePathname = () => setPathname(globalThis.location.pathname);
    const originalPushState = globalThis.history.pushState.bind(
      globalThis.history
    );
    const pushState = jest
      .spyOn(globalThis.history, "pushState")
      .mockImplementation((...args) => {
        originalPushState(...args);
        updatePathname();
      });
    globalThis.addEventListener("popstate", updatePathname);
    return () => {
      pushState.mockRestore();
      globalThis.removeEventListener("popstate", updatePathname);
    };
  }, []);
  return (
    <PathnameContext.Provider value={pathname}>
      {children}
    </PathnameContext.Provider>
  );
}

function render(ui: ReactNode) {
  return renderUi(ui, { wrapper: NavigationTestProvider });
}

let mockFetchingProfile = false;
let mockCanModerate = true;
let mockProfileId: string | null = "moderator-1";
let mockActiveProfileProxy: { id: string } | null = null;
let mockBlockActivityIntersection: ((isIntersecting: boolean) => void) | null =
  null;

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockProfileId === null ? null : { id: mockProfileId },
    activeProfileProxy: mockActiveProfileProxy,
    fetchingProfile: mockFetchingProfile,
    setToast: jest.fn(),
  }),
}));

jest.mock("@/hooks/content-moderation/useContentModeratorAccess", () => ({
  useContentModeratorAccess: () => ({
    data: {
      moderator: mockCanModerate,
      has_open_reports: true,
      open_report_count: 51,
      resolved_report_count: 0,
      suspended_profile_count: 0,
    },
    isError: false,
    isLoading: false,
    isSuccess: true,
  }),
}));

jest.mock("@/components/content-moderation/ContentModerationNoAccess", () => ({
  __esModule: true,
  default: () => <p>No moderator access</p>,
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: (callback: (isIntersecting: boolean) => void) => {
    mockBlockActivityIntersection = callback;
    return { current: null };
  },
}));

jest.mock("@/services/api/content-moderation-api", () => ({
  decideModeratedDrop: jest.fn(),
  fetchContentModerationBlockActivity: jest.fn(),
  fetchContentModerationQueue: jest.fn(),
  fetchSuspendedModerationProfiles: jest.fn(),
  setModeratedProfileStatus: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

const mockFetchContentModerationQueue =
  fetchContentModerationQueue as jest.MockedFunction<
    typeof fetchContentModerationQueue
  >;
const mockFetchContentModerationBlockActivity =
  fetchContentModerationBlockActivity as jest.MockedFunction<
    typeof fetchContentModerationBlockActivity
  >;

const createQueueItem = (index: number): ApiContentModerationQueueItem => ({
  id: `report-${index}`,
  drop_id: `drop-${index}`,
  reporter_profile_id: `reporter-${index}`,
  reporter_handle: `reporter${index}`,
  reporter_pfp: null,
  author_profile_id: `author-${index}`,
  author_handle: `author${index}`,
  author_pfp: null,
  author_status: ApiModeratedProfileStatus.Active,
  reason: ApiContentModerationReportReason.Other,
  content_snapshot: { parts: [{ content: `content-${index}` }] },
  status: ApiContentModerationReportStatus.Open,
  created_at: Date.UTC(2026, 7, 24, 10, index % 60),
  report_count: 1,
  cursor: `cursor-${index}`,
  moderation: { status: ApiDropModerationStatus.Visible, can_view: true },
  history: [],
});

const createBlockActivityItem = (
  index: number
): ApiContentModerationBlockActivityItem => ({
  id: `block-${index}`,
  action:
    index % 2 === 0
      ? ApiContentModerationBlockActivityItemActionEnum.Unblocked
      : ApiContentModerationBlockActivityItemActionEnum.Blocked,
  blocker_profile_id: `blocker-${index}`,
  blocker_handle: `blocker${index}`,
  blocker_pfp: null,
  blocked_profile_id: `blocked-${index}`,
  blocked_handle: `blocked${index}`,
  blocked_pfp: null,
  created_at: Date.UTC(2026, 8, 2, 10, index % 60),
  cursor: `block-cursor-${index}`,
});

describe("ContentModerationPageClient pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.history.replaceState(null, "", "/content-moderation");
    jest.mocked(fetchSuspendedModerationProfiles).mockResolvedValue([]);
    mockFetchingProfile = false;
    mockCanModerate = true;
    mockProfileId = "moderator-1";
    mockActiveProfileProxy = null;
    mockBlockActivityIntersection = null;
  });

  describe.each(["proxy", "signed out"])("when %s", (identity) => {
    it.each([
      "open-reports",
      "resolved-reports",
      "suspended-profiles",
      "block-activity",
    ])(
      "hides cached %s despite a stale positive access result",
      async (tab) => {
        globalThis.history.replaceState(null, "", `/content-moderation/${tab}`);
        mockFetchContentModerationQueue.mockResolvedValue([createQueueItem(1)]);
        mockFetchContentModerationBlockActivity.mockResolvedValue([
          createBlockActivityItem(1),
        ]);
        jest.mocked(fetchSuspendedModerationProfiles).mockResolvedValue([
          {
            profile_id: "suspended-1",
            handle: "suspended1",
            pfp: null,
            status: ApiModeratedProfileStatus.Suspended,
            updated_by_profile_id: "moderator-1",
            reason: "private reason",
            updated_at: Date.UTC(2026, 8, 2),
            cursor: "suspended-cursor-1",
          },
        ]);
        const client = new QueryClient();
        const page = () => (
          <QueryClientProvider client={client}>
            <ContentModerationPageClient />
          </QueryClientProvider>
        );
        const { rerender } = render(page());
        await waitFor(() =>
          expect(screen.getAllByRole("link").length).toBeGreaterThan(0)
        );
        if (identity === "proxy") {
          mockActiveProfileProxy = { id: "proxy-1" };
        } else {
          mockProfileId = null;
        }
        rerender(page());
        expect(screen.getByText("No moderator access")).toBeVisible();
        expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
        expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
        jest.clearAllMocks();
        await act(async () => {
          mockBlockActivityIntersection?.(true);
          await client.invalidateQueries();
        });
        expect(mockFetchContentModerationQueue).not.toHaveBeenCalled();
        expect(mockFetchContentModerationBlockActivity).not.toHaveBeenCalled();
        expect(fetchSuspendedModerationProfiles).not.toHaveBeenCalled();
      }
    );
  });

  it("does not fetch a mounted disabled block feed until access is enabled", async () => {
    mockFetchContentModerationBlockActivity.mockResolvedValue([]);
    const client = new QueryClient();
    const feed = (enabled: boolean) => (
      <QueryClientProvider client={client}>
        <BlockActivityFeed enabled={enabled} />
      </QueryClientProvider>
    );
    const { container, rerender } = render(feed(false));
    await act(async () => {
      mockBlockActivityIntersection?.(true);
    });
    expect(container).toBeEmptyDOMElement();
    expect(mockFetchContentModerationBlockActivity).not.toHaveBeenCalled();

    rerender(feed(true));
    expect(
      await screen.findByText("There is no block activity yet.")
    ).toBeVisible();
    expect(mockFetchContentModerationBlockActivity).toHaveBeenCalledTimes(1);
  });

  it("hides cached block activity and prevents pagination after access is disabled", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity } },
    });
    client.setQueryData(BLOCK_ACTIVITY_QUERY_KEY, {
      pages: [
        Array.from({ length: 50 }, (_, index) =>
          createBlockActivityItem(index)
        ),
      ],
      pageParams: [undefined],
    });
    const feed = (enabled: boolean) => (
      <QueryClientProvider client={client}>
        <BlockActivityFeed enabled={enabled} />
      </QueryClientProvider>
    );
    const { container, rerender } = render(feed(true));
    expect(screen.getByRole("button", { name: "Load more" })).toBeVisible();
    rerender(feed(false));
    await act(async () => {
      mockBlockActivityIntersection?.(true);
      await client.invalidateQueries({ queryKey: BLOCK_ACTIVITY_QUERY_KEY });
    });
    expect(container).toBeEmptyDOMElement();
    expect(mockFetchContentModerationBlockActivity).not.toHaveBeenCalled();
  });

  it("waits for the profile to finish loading before requesting block activity", async () => {
    mockFetchingProfile = true;
    mockFetchContentModerationBlockActivity.mockResolvedValue([]);
    globalThis.history.replaceState(
      null,
      "",
      "/content-moderation/block-activity"
    );
    const client = new QueryClient();
    const page = (
      <QueryClientProvider client={client}>
        <ContentModerationPageClient />
      </QueryClientProvider>
    );
    const { rerender } = render(page);
    await act(async () => {
      mockBlockActivityIntersection?.(true);
    });
    expect(mockFetchContentModerationBlockActivity).not.toHaveBeenCalled();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    mockFetchingProfile = false;
    rerender(
      <QueryClientProvider client={client}>
        <ContentModerationPageClient />
      </QueryClientProvider>
    );
    expect(
      await screen.findByText("There is no block activity yet.")
    ).toBeVisible();
    expect(mockFetchContentModerationBlockActivity).toHaveBeenCalledTimes(1);
  });

  it.each([
    "open-reports",
    "resolved-reports",
    "suspended-profiles",
    "block-activity",
  ])(
    "does not request private data without moderator access at %s",
    async (slug) => {
      mockCanModerate = false;
      globalThis.history.replaceState(null, "", `/content-moderation/${slug}`);
      render(
        <QueryClientProvider client={new QueryClient()}>
          <ContentModerationPageClient />
        </QueryClientProvider>
      );
      expect(await screen.findByText("No moderator access")).toBeVisible();
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
      expect(mockFetchContentModerationQueue).not.toHaveBeenCalled();
      expect(mockFetchContentModerationBlockActivity).not.toHaveBeenCalled();
      expect(fetchSuspendedModerationProfiles).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["open-reports", "Open reports", "There are no open reports."],
    ["resolved-reports", "Resolved reports", "There are no resolved reports."],
    [
      "suspended-profiles",
      "Suspended profiles",
      "There are no suspended profiles.",
    ],
    ["block-activity", "Block activity", "There is no block activity yet."],
  ])(
    "opens the %s deep link within the shared frame",
    async (slug, label, empty) => {
      globalThis.history.replaceState(null, "", `/content-moderation/${slug}`);
      mockFetchContentModerationQueue.mockResolvedValue([]);
      mockFetchContentModerationBlockActivity.mockResolvedValue([]);
      render(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <ContentModerationPageClient />
        </QueryClientProvider>
      );
      expect(
        screen.getByRole("tab", { name: new RegExp(label), selected: true })
      ).toHaveAttribute("tabindex", "0");
      expect(screen.getByRole("main")).toHaveClass(
        "tw-border-r",
        "tw-border-iron-800",
        "lg:tw-px-8"
      );
      expect(await screen.findByText(empty)).toBeVisible();
      expect(screen.getByRole("tabpanel")).toHaveAccessibleName(
        new RegExp(label)
      );
      if (slug === "block-activity" || slug === "suspended-profiles") {
        expect(mockFetchContentModerationQueue).not.toHaveBeenCalled();
      }
    }
  );

  it("switches shallowly, preserves the frame, and restores tabs with Back and Forward", async () => {
    globalThis.history.replaceState(
      null,
      "",
      "/content-moderation?context=watchtower#queue"
    );
    mockFetchContentModerationQueue.mockResolvedValue([]);
    mockFetchContentModerationBlockActivity.mockResolvedValue([]);
    const view = render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ContentModerationPageClient />
      </QueryClientProvider>
    );
    const frame = screen.getByRole("main");
    const historyLength = globalThis.history.length;
    await userEvent.click(screen.getByRole("tab", { name: "Block activity" }));
    expect(globalThis.location.pathname).toBe(
      "/content-moderation/block-activity"
    );
    expect(globalThis.location.search).toBe("?context=watchtower");
    expect(globalThis.location.hash).toBe("#queue");
    expect(screen.getByRole("main")).toBe(frame);
    await userEvent.click(screen.getByRole("tab", { name: "Block activity" }));
    expect(globalThis.history.length).toBe(historyLength + 1);
    act(() => globalThis.history.back());
    await waitFor(() =>
      expect(
        screen.getByRole("tab", { name: /Open reports/, selected: true })
      ).toBeVisible()
    );
    act(() => globalThis.history.forward());
    await waitFor(() =>
      expect(
        screen.getByRole("tab", { name: "Block activity", selected: true })
      ).toBeVisible()
    );
    expect(screen.getByRole("main")).toBe(frame);
    view.unmount();
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ContentModerationPageClient />
      </QueryClientProvider>
    );
    expect(
      screen.getByRole("tab", { name: "Block activity", selected: true })
    ).toBeVisible();
  });

  it("supports arrow, Home, End and keyboard activation without changing tabs on focus", async () => {
    mockFetchContentModerationQueue.mockResolvedValue([]);
    mockFetchContentModerationBlockActivity.mockResolvedValue([]);
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ContentModerationPageClient />
      </QueryClientProvider>
    );
    screen.getByRole("tab", { name: /Open reports/ }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Block activity" })).toHaveFocus();
    expect(globalThis.location.pathname).toBe("/content-moderation");
    await userEvent.keyboard("{Home}{ArrowRight}{Enter}");
    expect(globalThis.location.pathname).toBe(
      "/content-moderation/resolved-reports"
    );
    await userEvent.keyboard("{End} ");
    expect(globalThis.location.pathname).toBe(
      "/content-moderation/block-activity"
    );
  });

  it("identifies the profile that submitted each report", async () => {
    mockFetchContentModerationQueue.mockResolvedValue([createQueueItem(1)]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContentModerationPageClient />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Reported by @reporter1")).toBeVisible();
  });

  it("hides a neutral AI category instead of rendering Category: None", async () => {
    const item = createQueueItem(1);
    item.ai_recommendation =
      ApiContentModerationRecommendation.NoViolationDetected;
    item.ai_category = "NONE";
    item.ai_confidence = 0.95;
    mockFetchContentModerationQueue.mockResolvedValue([item]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContentModerationPageClient />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/No Violation Detected/)).toBeVisible();
    expect(screen.queryByText(/Potential category:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Category: None/i)).not.toBeInTheDocument();
  });

  it("labels a substantive AI category as a potential category", async () => {
    const item = createQueueItem(1);
    item.ai_recommendation =
      ApiContentModerationRecommendation.NeedsHumanReview;
    item.ai_category = "SCAM_OR_PHISHING";
    item.ai_confidence = 0.85;
    mockFetchContentModerationQueue.mockResolvedValue([item]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContentModerationPageClient />
      </QueryClientProvider>
    );

    await userEvent.click(await screen.findByText(/AI assessment:/i));
    expect(
      await screen.findByText("Potential category: Scam Or Phishing")
    ).toBeVisible();
  });

  it("attributes each state-history action to its actor", async () => {
    const item = createQueueItem(1);
    item.history = [
      {
        id: "audit-1",
        created_at: Date.UTC(2026, 7, 24, 11, 0),
        actor_profile_id: "moderator-2",
        actor_handle: "watcher",
        actor_pfp: "https://example.com/watcher.png",
        action: "CONTENT_REPORTED",
        target_drop_id: item.drop_id,
        target_profile_id: null,
        previous_state: null,
        new_state: null,
        reason: "Reported for review",
        metadata: null,
      },
      {
        id: "audit-2",
        created_at: Date.UTC(2026, 7, 24, 11, 1),
        actor_profile_id: "moderator-2",
        actor_handle: "watcher",
        actor_pfp: null,
        action: "DROP_HIDDEN",
        target_drop_id: item.drop_id,
        target_profile_id: null,
        previous_state: "SHOWN",
        new_state: "HIDDEN",
        reason: null,
        metadata: null,
      },
    ];
    mockFetchContentModerationQueue.mockResolvedValue([item]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContentModerationPageClient />
      </QueryClientProvider>
    );

    await userEvent.click(await screen.findByText("State history (2)"));

    expect(screen.getByText("Content Reported")).toBeVisible();
    expect(screen.getByText("Drop Hidden")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "@watcher" })).toHaveLength(2);
    screen
      .getAllByRole("link", { name: "@watcher" })
      .forEach((link) => expect(link).toHaveAttribute("href", "/watcher"));
    expect(screen.getByText("Shown → Hidden")).toBeVisible();
    expect(screen.queryByText("moderator-2")).not.toBeInTheDocument();
  });

  it("shows a neutral permission check while profile state is hydrating", () => {
    mockFetchingProfile = true;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContentModerationPageClient />
      </QueryClientProvider>
    );

    expect(screen.getByText("Checking permissions…")).toBeVisible();
    expect(
      screen.queryByText("You have no power here")
    ).not.toBeInTheDocument();
  });

  it("loads the next cursor page and renders author context", async () => {
    const firstPage = Array.from({ length: 50 }, (_, index) =>
      createQueueItem(index + 1)
    );
    const secondPage = [createQueueItem(51)];
    mockFetchContentModerationQueue
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ContentModerationPageClient />
      </QueryClientProvider>
    );

    expect(await screen.findByText("content-1")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "WatchTower - Content Moderation",
      })
    ).toBeVisible();
    expect(screen.getByRole("tab", { name: "Open reports (51)" })).toHaveClass(
      "tw-flex-1",
      "sm:tw-flex-none"
    );
    expect(screen.getByText("Open")).toHaveClass("sm:tw-hidden");
    expect(screen.getByText("Open reports")).toHaveClass(
      "tw-hidden",
      "sm:tw-inline"
    );
    expect(container.querySelector("main")).toHaveClass("tw-min-h-dvh");
    expect(container.querySelector("main")).not.toHaveClass("tw-max-w-4xl");
    expect(screen.getByRole("link", { name: "author1" })).toHaveAttribute(
      "href",
      "/author1"
    );
    expect(mockFetchContentModerationQueue).toHaveBeenNthCalledWith(1, {
      limit: 50,
      view: "OPEN",
    });

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("content-51")).toBeInTheDocument();
    expect(mockFetchContentModerationQueue).toHaveBeenNthCalledWith(2, {
      before: "cursor-50",
      limit: 50,
      view: "OPEN",
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Load more" })
      ).not.toBeInTheDocument()
    );
  });

  it("loads resolved reports through the separate moderation view", async () => {
    const resolvedItem = {
      ...createQueueItem(2),
      status: ApiContentModerationReportStatus.ResolvedAllowed,
      resolution_reason: "No policy violation",
    };
    mockFetchContentModerationQueue
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([resolvedItem]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContentModerationPageClient />
      </QueryClientProvider>
    );

    await screen.findByText("There are no open reports.");
    await userEvent.click(
      screen.getByRole("tab", { name: /Resolved reports/ })
    );

    expect(await screen.findByText("content-2")).toBeInTheDocument();
    expect(mockFetchContentModerationQueue).toHaveBeenLastCalledWith({
      limit: 50,
      view: "RESOLVED",
    });
    expect(screen.getByText("Resolved: Resolved Allowed")).toBeInTheDocument();
    expect(
      screen.queryByText("Choose a content decision")
    ).not.toBeInTheDocument();
  });

  it("lazy-loads the newest-first block activity trail", async () => {
    mockFetchContentModerationQueue.mockResolvedValue([]);
    const firstPage = Array.from({ length: 50 }, (_, index) =>
      createBlockActivityItem(index + 1)
    );
    mockFetchContentModerationBlockActivity
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(
        Array.from({ length: 50 }, (_, index) =>
          createBlockActivityItem(index + 51)
        )
      )
      .mockResolvedValueOnce([createBlockActivityItem(101)]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContentModerationPageClient />
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole("tab", { name: "Block activity" }));

    expect(
      await screen.findByRole("link", { name: "@blocker1" })
    ).toHaveAttribute("href", "/blocker1");
    expect(screen.getByRole("link", { name: "@blocked1" })).toHaveAttribute(
      "href",
      "/blocked1"
    );
    expect(screen.getAllByText("Blocked")[0]).toBeVisible();
    expect(screen.getAllByText("Unblocked")[0]).toBeVisible();
    const feed = screen.getByRole("list").parentElement;
    expect(feed).toHaveClass("tw-w-full", "tw-@container");
    expect(feed?.className).not.toContain("tw-max-w-");
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      "@blocker1 Blocked @blocked1"
    );
    expect(screen.getAllByRole("listitem")[1]).toHaveTextContent(
      "@blocker2 Unblocked @blocked2"
    );
    expect(mockFetchContentModerationBlockActivity).toHaveBeenNthCalledWith(1, {
      limit: 50,
    });
    expect(screen.getByRole("button", { name: "Load more" })).toBeVisible();

    act(() => mockBlockActivityIntersection?.(true));

    expect(
      await screen.findByRole("link", { name: "@blocker51" })
    ).toBeVisible();
    expect(mockFetchContentModerationBlockActivity).toHaveBeenNthCalledWith(2, {
      before: "block-cursor-50",
      limit: 50,
    });

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(
      await screen.findByRole("link", { name: "@blocker101" })
    ).toBeVisible();
    expect(mockFetchContentModerationBlockActivity).toHaveBeenNthCalledWith(3, {
      before: "block-cursor-100",
      limit: 50,
    });
  });
});
