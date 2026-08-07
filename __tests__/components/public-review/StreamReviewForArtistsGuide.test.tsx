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
        "Stream is still being designed. This guide explains the intended artist experience in plain language. The sections below explain how the contracts work in more detail."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "An artwork in Stream includes its media, identity, edition size, artist approval, and sale and payment rules. Its records also show important changes and what later became final."
      )
    ).toBeInTheDocument();
    for (const heading of [
      "Artwork and identity",
      "Editions and minting",
      "Your approval",
      "Sales, payments, and royalties",
      "What can still change",
      "Files and artwork history",
    ]) {
      expect(
        screen.getByRole("heading", { level: 3, name: heading })
      ).toBeInTheDocument();
    }
    expect(
      screen.getByText(
        "The artwork has its own identity. Its records show who the artist is, which files belong to the artwork, and which tokens were created from it."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You choose whether it is a one-of-one or an edition, how many can exist, and how minting works. Artists can use randomness to generate a result for each token. The random value is saved, so the result can be recreated later."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your wallet approves one version of the artwork, including how many tokens can exist. If those details change, your old approval no longer applies. Without a new approval, the changed version is not approved by you."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The plan states how collectors first receive tokens: through a fixed-price mint or an auction. It also states the price, currency, and who receives the money. Later sales may pay royalties, but marketplaces do not always pay them."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Before the artwork becomes final, details such as file links, token supply, minting, and sale settings can still be corrected or completed. Changes stay in the artwork's history. Some changes make the artist's old approval no longer apply."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The artwork's records can show where its files are stored and how to check that they have not changed. They can also include artist statements, authenticity details, and exhibition history. The files themselves still need reliable long-term storage."
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
