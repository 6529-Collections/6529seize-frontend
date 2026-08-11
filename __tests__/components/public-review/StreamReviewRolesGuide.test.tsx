import { render, screen, within } from "@testing-library/react";

import {
  STREAM_REVIEW_ROLES_GUIDE_SECTIONS,
  StreamReviewRolesGuide,
} from "@/components/public-review/StreamReviewRolesGuide";
import { getStreamReviewVersion } from "@/lib/public-review/streamReviewDefinition";

const ACTIVE_REVIEW_VERSION = getStreamReviewVersion();
if (!ACTIVE_REVIEW_VERSION) {
  throw new Error("Stream review active version is missing");
}

describe("StreamReviewRolesGuide", () => {
  it("separates current powers from source-only and planned work", () => {
    render(<StreamReviewRolesGuide pages={ACTIVE_REVIEW_VERSION.pages} />);

    for (const section of STREAM_REVIEW_ROLES_GUIDE_SECTIONS) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.title })
      ).toHaveAttribute("id", section.id);
    }

    for (const status of [
      "Working in rehearsal",
      "Connected for integration",
      "Built in source",
      "Planned",
      "Still open",
    ]) {
      expect(screen.getAllByText(status).length).toBeGreaterThan(0);
    }

    expect(
      screen.getByText(
        "Signs one exact collection state. The signature covers specific collection facts, not every later action."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Anyone may settle an auction after it ends. The winner and payment amounts come from contract state."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "ADR 0022 proposes this check. It is not approved or implemented as a current protection."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "ADR 0020 proposes a visible recovery record that keeps the original finality history. It is not implemented."
      )
    ).toBeInTheDocument();

    expect(
      within(
        screen.getByRole("heading", { name: "Questions for reviewers" })
          .parentElement as HTMLElement
      ).getAllByRole("listitem")
    ).toHaveLength(5);

    expect(
      screen.getByRole("link", { name: "Read Where Development Stands" })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/security-testing-and-known-limitations"
    );
    expect(
      screen.getByRole("link", {
        name: "Read Changes, Emergencies, and Future Contracts",
      })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/governance-pausing-and-successors"
    );
  });
});
