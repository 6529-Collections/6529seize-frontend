import ContentModerationPageClient from "@/app/content-moderation/page.client";
import type { ApiContentModerationQueueItem } from "@/generated/models/ApiContentModerationQueueItem";
import { ApiContentModerationReportReason } from "@/generated/models/ApiContentModerationReportReason";
import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { ApiModeratedProfileStatus } from "@/generated/models/ApiModeratedProfileStatus";
import { fetchContentModerationQueue } from "@/services/api/content-moderation-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let mockFetchingProfile = false;

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "moderator-1" },
    activeProfileProxy: null,
    fetchingProfile: mockFetchingProfile,
    setToast: jest.fn(),
  }),
}));

jest.mock("@/hooks/content-moderation/useContentModeratorAccess", () => ({
  useContentModeratorAccess: () => ({
    data: {
      moderator: true,
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

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@/services/api/content-moderation-api", () => ({
  decideModeratedDrop: jest.fn(),
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

describe("ContentModerationPageClient pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchingProfile = false;
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
    item.ai_recommendation = "NO_VIOLATION_DETECTED";
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
    item.ai_recommendation = "NEEDS_HUMAN_REVIEW";
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
});
