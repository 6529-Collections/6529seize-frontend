import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { PublicReviewEditorialFeedback } from "@/components/public-review/PublicReviewEditorialFeedback";
import { getWaveComposerDockElements } from "@/components/waves/WaveComposerDockVisibility";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewPageContext,
} from "@/services/api/public-review/types";

jest.mock("@/components/public-review/PublicReviewFeedbackComposer", () => ({
  __esModule: true,
  default: ({
    contextControl,
  }: {
    readonly contextControl: React.ReactNode;
  }) => <div data-testid="composer">{contextControl}</div>,
}));

jest.mock("@/components/public-review/PublicReviewPageComments", () => ({
  PublicReviewPageComments: () => <div data-testid="comments" />,
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
  categories: [],
  severityOptions: [],
  pages: [],
};

const page: PublicReviewPageContext = {
  pageId: "overview",
  pageTitle: "Overview",
  canonicalPath: "/reviews/6529-stream/versions/2026-07-27.1",
};

describe("PublicReviewEditorialFeedback", () => {
  afterEach(() => {
    window.history.replaceState({}, "", window.location.pathname);
  });

  it("fills the feedback rail and registers its bottom action for overlay clearance", async () => {
    const { unmount } = render(
      <PublicReviewEditorialFeedback
        config={config}
        destination={destination}
        page={page}
        sections={[]}
      />
    );

    expect(
      screen.getByTestId("comments").parentElement?.parentElement
    ).toHaveClass("@[760px]:tw-h-full");
    const disclosure = screen
      .getByText("Send feedback", { exact: true })
      .closest("details");
    await waitFor(() =>
      expect(getWaveComposerDockElements()).toContain(disclosure)
    );
    expect(disclosure).not.toHaveAttribute("open");

    fireEvent.click(screen.getByText("Send feedback", { exact: true }));

    expect(disclosure).toHaveAttribute("open");
    expect(screen.getByRole("combobox")).toHaveClass(
      "tw-bg-iron-900",
      "tw-ring-white/[0.09]"
    );
    expect(screen.getByTestId("composer")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Send feedback", { exact: true }));
    expect(getWaveComposerDockElements()).toContain(disclosure);

    unmount();
    await waitFor(() => expect(getWaveComposerDockElements()).toEqual([]));
  });

  it("reveals the composer for the feedback hash target", async () => {
    window.history.replaceState({}, "", "#public-review-feedback");

    render(
      <PublicReviewEditorialFeedback
        config={config}
        destination={destination}
        page={page}
        sections={[]}
      />
    );

    const disclosure = screen
      .getByText("Send feedback", { exact: true })
      .closest("details");
    await waitFor(() => expect(disclosure).toHaveAttribute("open"));
    await waitFor(() =>
      expect(getWaveComposerDockElements()).toContain(disclosure)
    );
  });
});
