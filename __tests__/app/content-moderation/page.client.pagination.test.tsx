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
