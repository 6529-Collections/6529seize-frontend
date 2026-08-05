import { render, screen } from "@testing-library/react";

import { StreamReviewOverviewGuide } from "@/components/public-review/StreamReviewOverviewGuide";
import { getStreamReviewVersion } from "@/lib/public-review/streamReviewDefinition";

const ACTIVE_REVIEW_VERSION = getStreamReviewVersion();
if (!ACTIVE_REVIEW_VERSION) {
  throw new Error("Stream review active version is missing");
}

describe("StreamReviewOverviewGuide", () => {
  it("explains Stream through its artwork parts, journey, and audience paths", () => {
    render(<StreamReviewOverviewGuide pages={ACTIVE_REVIEW_VERSION.pages} />);

    expect(
      screen.getByRole("heading", { name: "What is Stream?" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "What makes up a Stream artwork?",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Digital fingerprints and final records help future viewers check what became permanent."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "How one artwork moves through Stream",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read Curation and TDH Authorization" })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/curation-and-tdh-authorization"
    );
    expect(
      screen.getByText(
        "After the community accepts the artwork, a wallet that Stream is configured to trust signs a digital approval containing the exact artwork and launch terms. Stream checks this approval before allowing the launch."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Collectors and minters" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start with Artwork Lifecycle" })
    ).toHaveAttribute("href", "/reviews/6529-stream/artwork-lifecycle");
    expect(
      screen.getByRole("link", {
        name: "Start with Where Development Stands",
      })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/security-testing-and-known-limitations"
    );
  });
});
