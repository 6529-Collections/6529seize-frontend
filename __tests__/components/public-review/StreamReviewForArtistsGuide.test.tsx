import { render, screen } from "@testing-library/react";

import { StreamReviewForArtistsGuide } from "@/components/public-review/StreamReviewForArtistsGuide";
import { getStreamReviewVersion } from "@/lib/public-review/streamReviewDefinition";

const ACTIVE_REVIEW_VERSION = getStreamReviewVersion();
if (!ACTIVE_REVIEW_VERSION) {
  throw new Error("Stream review active version is missing");
}

describe("StreamReviewForArtistsGuide", () => {
  it("explains the artist journey before handing off to technical evidence", () => {
    render(
      <StreamReviewForArtistsGuide pages={ACTIVE_REVIEW_VERSION.pages} />
    );

    expect(
      screen.getByRole("heading", { name: "Your artwork, your choices" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stream is still being designed. This guide explains the intended artist experience in plain language. The detailed contract review below is the technical evidence for the current proposal."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your journey" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Use your wallet to sign the exact collection state you accept. If the plan changes, the new state needs its own approval."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Before you approve" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Who can still change, pause, or operate each part")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "After finality" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read Who Can Do What" })
    ).toHaveAttribute("href", "/reviews/6529-stream/roles-and-trust");
    expect(
      screen.getByRole("link", {
        name: "Read Revenue, Splits, and Royalties",
      })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/revenue-splits-and-royalties"
    );
    expect(
      screen.getByRole("link", {
        name: "Continue to the detailed contract review",
      })
    ).toHaveAttribute("href", "#your-collection-has-a-durable-identity");
  });
});
