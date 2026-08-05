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
            warnings: [
              {
                code: "INVALID_REVIEW_METADATA",
                dropId: "drop-from-another-page",
                reason: "Feedback metadata is not canonical.",
              },
            ],
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
    const commentArticle = screen
      .getByText("How does the permanent Core constrain successors?")
      .closest("article");
    expect(commentArticle).toHaveClass("tw-py-4");
    expect(commentArticle).not.toHaveClass(
      "tw-rounded-lg",
      "tw-border-white/[0.12]"
    );
    expect(
      screen.queryByText(/Wave messages could not be included/)
    ).not.toBeInTheDocument();
  });

  it("shows only feedback matching the exact technical page reference", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const sourceSha256 = `sha256:${"a".repeat(64)}`;
    const makeTechnicalRecord = (
      dropId: string,
      declaration: string,
      referenceOverrides: Partial<
        Extract<
          PublicReviewFeedbackRecord["reference"],
          { readonly kind: "code" }
        >
      > = {}
    ): PublicReviewFeedbackRecord => ({
      ...record,
      feedbackId: `feedback-${dropId}`,
      dropId,
      body: `Comment for ${declaration}`,
      pageId: "reference-function",
      sectionId: undefined,
      reference: {
        kind: "code",
        repository: "6529-Collections/6529Stream",
        commit: "b".repeat(40),
        path: "src/Stream.sol",
        sourceSha256,
        lineStart: 10,
        lineEnd: 12,
        contract: "Stream",
        declaration,
        ...referenceOverrides,
      },
    });
    const recordWithoutReference: PublicReviewFeedbackRecord = {
      ...record,
      feedbackId: "feedback-drop-no-reference",
      dropId: "drop-no-reference",
      body: "Comment without a code reference",
      pageId: "reference-function",
      sectionId: undefined,
    };
    queryClient.setQueryData(
      getPublicReviewLedgerQueryKey({ config, destination, pageSize: 50 }),
      {
        pages: [
          {
            destination,
            records: [
              makeTechnicalRecord("drop-a", "mint()"),
              makeTechnicalRecord("drop-b", "withdraw()"),
              makeTechnicalRecord("drop-c", "mint()", {
                sourceSha256: `sha256:${"b".repeat(64)}`,
              }),
              makeTechnicalRecord("drop-d", "mint()", {
                contract: "OtherContract",
              }),
              recordWithoutReference,
            ],
            warnings: [],
            nextCursor: null,
            rawDropCount: 2,
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
            pageId: "reference-function",
            pageTitle: "mint()",
            canonicalPath: "/reviews/6529-stream/reference/functions/mint",
          }}
          referenceSelection={{
            kind: "code",
            path: "src/Stream.sol",
            sourceSha256,
            lineStart: 10,
            lineEnd: 12,
            contract: "Stream",
            declaration: "mint()",
          }}
          sections={[]}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText("Comment for mint()")).toBeInTheDocument();
    expect(
      screen.queryByText("Comment for withdraw()")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Comment without a code reference")
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Comment for mint()")).toHaveLength(1);
  });
});
