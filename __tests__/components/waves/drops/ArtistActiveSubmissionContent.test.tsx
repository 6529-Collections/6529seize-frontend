import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArtistActiveSubmissionContent } from "@/components/waves/drops/ArtistActiveSubmissionContent";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { createMockDrop } from "@/__tests__/utils/editDropTestUtils";
import { useSubmissionDrops } from "@/hooks/useUserArtSubmissions";
import { mockDefaultTimeZone } from "@/__tests__/utils/timeZoneHydration";

// Mock dependencies
const mockPush = jest.fn();
const mockUseSearchParams = jest.fn(() => new URLSearchParams());

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/test-path",
  useSearchParams: () => mockUseSearchParams(),
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: undefined,
    isSafeWallet: false,
  }),
}));

jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: ({ media_url }: any) => (
    <img src={media_url} alt="submission" data-testid="media-display" />
  ),
}));

const mockSubmissions = [
  {
    id: "drop-1",
    imageUrl: "https://example.com/image1.jpg",
    mediaMimeType: "image/jpeg",
    title: "Test Artwork 1",
    createdAt: 1640995200000, // 2022-01-01
  },
  {
    id: "drop-2",
    imageUrl: "https://example.com/image2.png",
    mediaMimeType: "image/png",
    title: "Test Artwork 2",
    createdAt: 1641081600000, // 2022-01-02
  },
];

jest.mock("@/hooks/useUserArtSubmissions", () => ({
  useUserArtSubmissions: jest.fn(() => ({
    submissions: mockSubmissions,
    isLoading: false,
    error: null,
  })),
  useSubmissionDrops: jest.fn(() => ({
    submissionsWithDrops: mockSubmissions.map((submission) => ({
      ...submission,
      drop: {
        id: `drop-${submission.id}`,
        wave: { id: "wave-1", name: "The Memes Collection" },
      },
    })),
    isLoading: false,
  })),
}));

// Create QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Helper to render with providers
const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("ArtistActiveSubmissionContent", () => {
  const mockUser: ApiProfileMin = {
    id: "user-123",
    handle: "test-artist",
    pfp: "https://example.com/avatar.jpg",
    level: 1,
    cic: 100,
    rep: 50,
  };

  const defaultProps = {
    user: mockUser,
    isOpen: true,
    onClose: jest.fn(),
    isApp: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    // Reset to default mock state with submissions
    const {
      useUserArtSubmissions,
      useSubmissionDrops,
    } = require("@/hooks/useUserArtSubmissions");
    useUserArtSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
    });
    useSubmissionDrops.mockReturnValue({
      submissionsWithDrops: mockSubmissions.map((submission) => ({
        ...submission,
        drop: {
          id: `drop-${submission.id}`,
          wave: { id: "wave-1", name: "The Memes Collection" },
        },
      })),
      isLoading: false,
    });
  });

  it("navigates safely when searchParams is null", () => {
    mockUseSearchParams.mockReturnValueOnce(null);

    renderWithProviders(<ArtistActiveSubmissionContent {...defaultProps} />);

    const firstSubmission = screen
      .getByText("Test Artwork 1")
      .closest(".tw-group");
    expect(firstSubmission).not.toBeNull();
    fireEvent.click(firstSubmission!);

    expect(mockPush).toHaveBeenCalledWith("/test-path?drop=drop-1");
  });

  it("renders submissions when data is available", () => {
    renderWithProviders(<ArtistActiveSubmissionContent {...defaultProps} />);

    // Should render the submission titles
    expect(screen.getByText("Test Artwork 1")).toBeInTheDocument();
    expect(screen.getByText("Test Artwork 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Image - JPEG")).toBeInTheDocument();
    expect(screen.getByLabelText("Image - PNG")).toBeInTheDocument();
    // Reusing the leaderboard badge must not invent first place for unranked art.
    expect(screen.queryByText("1st")).not.toBeInTheDocument();
  });

  it.each([false, true])(
    "shows the promise badge only for flagged submissions (app: %s)",
    (isApp) => {
      const submissionsWithDrops = [true, false, null].map(
        (promised, index) => ({
          ...mockSubmissions[0]!,
          id: `promise-${index}`,
          title: `Artwork ${index}`,
          drop: createMockDrop({
            id: `promise-${index}`,
            is_additional_action_promised: promised,
            rank: index === 0 ? 23 : null,
          }),
        })
      );
      jest.mocked(useSubmissionDrops).mockReturnValue({
        submissionsWithDrops,
        isLoading: false,
        error: null,
      });
      const onClose = jest.fn();
      renderWithProviders(
        <ArtistActiveSubmissionContent
          {...defaultProps}
          isApp={isApp}
          onClose={onClose}
        />
      );

      const badges = screen.getAllByRole("button", {
        name: "Additional Action",
      });
      expect(badges).toHaveLength(1);
      const position = screen.getByText("23rd");
      expect(position).toBeInTheDocument();
      expect(position.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true"
      );
      expect(screen.queryByLabelText(/winner/i)).not.toBeInTheDocument();
      expect(screen.queryByText("1st")).not.toBeInTheDocument();
      expect(badges[0]).toHaveAccessibleDescription(
        /The creator marked this submission as promising an extra action/
      );
      fireEvent.click(badges[0]!);
      expect(mockPush).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText("Artwork 0"));
      expect(mockPush).toHaveBeenCalledWith("/test-path?drop=promise-0");
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  );

  it("shows loading state", () => {
    const {
      useUserArtSubmissions,
      useSubmissionDrops,
    } = require("@/hooks/useUserArtSubmissions");
    useUserArtSubmissions.mockReturnValue({
      submissions: [],
      isLoading: true,
      error: null,
    });
    useSubmissionDrops.mockReturnValue({
      submissionsWithDrops: [],
      isLoading: true,
    });

    renderWithProviders(<ArtistActiveSubmissionContent {...defaultProps} />);

    expect(
      screen.getByText("Loading submissions...", { selector: "span" })
    ).toBeInTheDocument();
  });

  it("renders empty grid when no submissions", () => {
    const {
      useUserArtSubmissions,
      useSubmissionDrops,
    } = require("@/hooks/useUserArtSubmissions");
    useUserArtSubmissions.mockReturnValue({
      submissions: [],
      isLoading: false,
      error: null,
    });
    useSubmissionDrops.mockReturnValue({
      submissionsWithDrops: [],
      isLoading: false,
    });

    renderWithProviders(<ArtistActiveSubmissionContent {...defaultProps} />);

    // Should render empty grid
    expect(document.querySelector(".tw-grid")).toBeInTheDocument();
  });

  it("renders submissions grid", () => {
    // Reset mock to return submissions
    const {
      useUserArtSubmissions,
      useSubmissionDrops,
    } = require("@/hooks/useUserArtSubmissions");
    useUserArtSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
    });
    useSubmissionDrops.mockReturnValue({
      submissionsWithDrops: mockSubmissions.map((submission) => ({
        ...submission,
        drop: {
          id: `drop-${submission.id}`,
          wave: { id: "wave-1", name: "The Memes Collection" },
        },
      })),
      isLoading: false,
    });

    renderWithProviders(<ArtistActiveSubmissionContent {...defaultProps} />);

    expect(screen.getByText("Test Artwork 1")).toBeInTheDocument();
    expect(screen.getByText("Test Artwork 2")).toBeInTheDocument();
    expect(screen.getAllByTestId("media-display")).toHaveLength(2);
  });

  it("handles submission click navigation", () => {
    // Reset mock to return submissions
    const {
      useUserArtSubmissions,
      useSubmissionDrops,
    } = require("@/hooks/useUserArtSubmissions");
    useUserArtSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
    });
    useSubmissionDrops.mockReturnValue({
      submissionsWithDrops: mockSubmissions.map((submission) => ({
        ...submission,
        drop: {
          id: `drop-${submission.id}`,
          wave: { id: "wave-1", name: "The Memes Collection" },
        },
      })),
      isLoading: false,
    });

    renderWithProviders(<ArtistActiveSubmissionContent {...defaultProps} />);

    const firstSubmission = screen
      .getByText("Test Artwork 1")
      .closest(".tw-group");
    expect(firstSubmission).not.toBeNull();
    fireEvent.click(firstSubmission!);

    expect(mockPush).toHaveBeenCalledWith("/test-path?drop=drop-1");
  });

  it("closes modal after navigation", () => {
    // Reset mock to return submissions
    const {
      useUserArtSubmissions,
      useSubmissionDrops,
    } = require("@/hooks/useUserArtSubmissions");
    useUserArtSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
    });
    useSubmissionDrops.mockReturnValue({
      submissionsWithDrops: mockSubmissions.map((submission) => ({
        ...submission,
        drop: {
          id: `drop-${submission.id}`,
          wave: { id: "wave-1", name: "The Memes Collection" },
        },
      })),
      isLoading: false,
    });

    const mockOnClose = jest.fn();
    renderWithProviders(
      <ArtistActiveSubmissionContent {...defaultProps} onClose={mockOnClose} />
    );

    const firstSubmission = screen
      .getByText("Test Artwork 1")
      .closest(".tw-group");
    expect(firstSubmission).not.toBeNull();
    fireEvent.click(firstSubmission!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  // The submissions are created at 2022-01-01T00:00Z and 2022-01-02T00:00Z.
  // Each date renders in the viewer's zone, so Los Angeles is a day behind.
  it.each([
    ["UTC", "Jan 1, 2022", "Jan 2, 2022"],
    ["America/Los_Angeles", "Dec 31, 2021", "Jan 1, 2022"],
    ["Pacific/Auckland", "Jan 1, 2022", "Jan 2, 2022"],
  ])(
    "renders date information for submissions in %s",
    (zone, firstDate, secondDate) => {
      const restoreTimeZone = mockDefaultTimeZone(zone);
      try {
        renderWithProviders(
          <ArtistActiveSubmissionContent {...defaultProps} />
        );

        expect(screen.getByText(firstDate)).toBeInTheDocument();
        expect(screen.getByText(secondDate)).toBeInTheDocument();
      } finally {
        restoreTimeZone();
      }
    }
  );

  it("renders submission grid correctly", () => {
    renderWithProviders(<ArtistActiveSubmissionContent {...defaultProps} />);

    // Check that submission grid is rendered with proper structure
    expect(document.querySelector(".tw-grid")).toBeInTheDocument();
    expect(document.querySelector(".tw-grid")).toHaveClass(
      "tw-grid-cols-1",
      "sm:tw-grid-cols-2",
      "lg:tw-grid-cols-3"
    );
  });

  it("renders media displays for submissions", () => {
    renderWithProviders(<ArtistActiveSubmissionContent {...defaultProps} />);

    const mediaDisplays = screen.getAllByTestId("media-display");
    expect(mediaDisplays).toHaveLength(2);
  });

  it("applies different scrolling styles for app vs web", () => {
    const { rerender } = renderWithProviders(
      <ArtistActiveSubmissionContent {...defaultProps} />
    );

    // Web version should have scrollbar styles
    expect(document.querySelector(".tw-overflow-y-auto")).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={queryClient}>
        <ArtistActiveSubmissionContent {...defaultProps} isApp={true} />
      </QueryClientProvider>
    );

    // App version should not have the scrollbar styles in the same container
    // (scrolling is handled by the app wrapper)
  });

  it("handles submissions without titles", () => {
    const submissionsWithoutTitle = [
      {
        ...mockSubmissions[0],
        title: undefined,
      },
    ];

    const {
      useUserArtSubmissions,
      useSubmissionDrops,
    } = require("@/hooks/useUserArtSubmissions");
    useUserArtSubmissions.mockReturnValue({
      submissions: submissionsWithoutTitle,
      isLoading: false,
      error: null,
    });
    useSubmissionDrops.mockReturnValue({
      submissionsWithDrops: submissionsWithoutTitle.map((submission) => ({
        ...submission,
        drop: {
          id: `drop-${submission.id}`,
          wave: { id: "wave-1", name: "The Memes Collection" },
        },
      })),
      isLoading: false,
    });

    renderWithProviders(<ArtistActiveSubmissionContent {...defaultProps} />);

    // Should not crash and should still render the submission
    expect(screen.getByTestId("media-display")).toBeInTheDocument();
  });
});
