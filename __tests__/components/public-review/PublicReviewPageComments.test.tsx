import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import { PublicReviewPageComments } from "@/components/public-review/PublicReviewPageComments";
import { getPublicReviewLedgerQueryKey } from "@/services/api/public-review/ledger";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewFeedbackRecord,
} from "@/services/api/public-review/types";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/common/profile/ProfileAvatar", () => ({
  __esModule: true,
  default: ({ alt }: { readonly alt: string }) => <span aria-label={alt} />,
  ProfileBadgeSize: { SMALL: "SMALL" },
}));

const destination: PublicReviewDiscussionDestination = {
  logicalKey: "stream-review",
  environment: "staging",
  waveId: "22222222-2222-4222-8222-222222222222",
};

const config: PublicReviewFeedbackConfig = {
  reviewId: "6529-stream",
  reviewVersion: "2026-07-27.1",
  reviewTitle: "6529 Stream",
  feedbackSchemaVersion: "1",
  submissionsOpen: true,
  acceptsPublicExploitReports: true,
  categories: [{ value: "question", label: "Question" }],
  severityOptions: [{ value: "not-assessed", label: "Not assessed" }],
  pages: [{ value: "overview", label: "Overview" }],
};

const record: PublicReviewFeedbackRecord = {
  feedbackId: "feedback-1",
  dropId: "drop-1",
  serialNo: 1,
  destination,
  reviewId: config.reviewId,
  reviewVersion: config.reviewVersion,
  category: "question",
  severity: "not-assessed",
  pageId: "overview",
  sectionId: "permanent-core",
  author: {
    id: "reviewer-1",
    handle: "reviewer",
    pfp: null,
  },
  createdAt: Date.UTC(2026, 6, 27),
  body: "How does the permanent Core constrain successors?",
  reactionsCount: 0,
  disposition: "NEW",
  discussionPath: "/waves/stream-review?serialNo=1",
};

describe("PublicReviewPageComments", () => {
  it("shows the section targeted by structured page feedback", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(
      getPublicReviewLedgerQueryKey({ config, destination, pageSize: 50 }),
      {
        pages: [
          {
            destination,
            records: [record],
            warnings: [],
            nextCursor: null,
            rawDropCount: 1,
          },
        ],
        pageParams: [null],
      }
    );

    render(
      <QueryClientProvider client={queryClient}>
        <PublicReviewPageComments
          config={config}
          destination={destination}
          locale="en-US"
          page={{
            pageId: "overview",
            pageTitle: "Overview",
            canonicalPath: "/reviews/6529-stream",
          }}
          sections={[
            {
              id: "permanent-core",
              title: "A permanent Core anchors identity",
            },
          ]}
        />
      </QueryClientProvider>
    );

    expect(
      screen.getByText("Section: A permanent Core anchors identity")
    ).toBeInTheDocument();
    expect(
      screen.getByText("How does the permanent Core constrain successors?")
    ).toBeInTheDocument();
  });
});
