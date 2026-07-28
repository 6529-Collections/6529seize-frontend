import { render, screen } from "@testing-library/react";

import { PublicReviewNavigation } from "@/components/public-review/PublicReviewNavigation";
import { createPublicReviewRouteBuilder } from "@/lib/public-review/publicReviewRoutes";
import { STREAM_REVIEW_PAGES } from "@/lib/public-review/streamReviewDefinition";

describe("PublicReviewNavigation", () => {
  it("keeps inactive page numbers on the accessible iron-500 token", () => {
    render(
      <PublicReviewNavigation
        currentPage={STREAM_REVIEW_PAGES[0]}
        pages={STREAM_REVIEW_PAGES}
        routes={createPublicReviewRouteBuilder("6529-stream")}
        sections={[]}
      />
    );

    for (const number of screen.getAllByText("02")) {
      expect(number).toHaveClass("tw-text-iron-500");
      expect(number).not.toHaveClass("tw-text-iron-600");
    }
  });
});
