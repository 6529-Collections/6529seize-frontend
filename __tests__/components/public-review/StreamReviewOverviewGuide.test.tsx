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
      screen.getByText(
        "Stream is a proposed system for publishing and selling digital art. It keeps the artwork, its history, and its important rules connected over time—from launch and sales to long-term preservation."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "A Stream artwork is more than the media you see",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Here are five important parts of a Stream artwork:")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Each artwork collection gets a permanent identity record. Every minted token also gets its own record, so both can be identified over time."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The artwork may include images, video, audio, code, or other files. For example, Stream can keep artwork code and descriptions directly in the contract. Larger files, such as videos or high-resolution images, can live on IPFS or another storage service, with Stream keeping the link."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Artist control" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Addresses with the right permission prepare the artwork and minting plan. Before minting begins, the artist's wallet approves the exact content and rules. Important later changes need fresh approval; without it, the change is rejected and the current setup remains active. The artist can also permanently prevent selected artwork files or code from being changed."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The smart contracts store the rules for a specific sale—for example, whether it uses a fixed price or auction, its price or reserve price, and which configured recipients should receive the primary-sale money. For later marketplace sales, the contracts only report royalty information; the marketplace decides whether to pay it."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Locked core details" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "When no more tokens should be created, Stream governance can close the collection. It can then permanently disable burning, so owners can no longer remove its tokens from circulation, and lock the collection's main settings. Existing tokens can still be transferred, and preservation records can still be added. A separate delayed process can later record the complete artwork as final."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Artist control is part of the intended design",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "For artwork linked to an artist, Stream is designed to require the artist to approve important steps. This includes confirming that the collection represents their work and may publicly name them as its artist, confirming the exact content of the artwork before its first token is minted, and approving mint or sale rules where required. Each approval covers exact information. If that information changes, a new approval is needed."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "How one artwork moves through Stream",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "See the main steps an artwork follows in Stream, from the artist's plan to sales, payments, preservation, and its final record."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read Curation and TDH Authorization" })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/curation-and-tdh-authorization"
    );
    expect(
      screen.getByText(
        "Stream's contract administrators register a specific wallet as the wallet allowed to approve sales. For each sale, that wallet signs the token, recipient, price or auction rules, and deadline. The contract rejects the sale if another wallet signed it or if any signed detail has changed."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Plan the artwork")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The artist chooses what the artwork is, how many editions to make, and how to sell it. This happens before the artwork is added to Stream."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create the artwork records")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stream creates a record for the artwork. The record includes its description, file links, and other details."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Authorize a specific sale")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "At a fixed price, the sale specifies which wallet pays the set price and which wallet receives the token. It can be the same wallet. In an auction, people bid and the winner claims the token."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Distribute the payment")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The contract divides the sale money between the people listed for that sale, using shares chosen beforehand."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Close and lock the collection")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "When no more tokens should be created, Stream's contract administrators can close the collection. This stops new minting, prevents existing tokens from being destroyed, and permanently locks the collection's main rules. Existing tokens can still be transferred, and new preservation records can still be added."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mark the artwork as complete")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Later, Stream can record that the artwork is complete and its protected parts should no longer change. Before this record becomes permanent, there is a waiting period so a safety guardian can stop it if something looks wrong. For artwork linked to an artist, Stream's ADRs also require the artist's approval."
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
