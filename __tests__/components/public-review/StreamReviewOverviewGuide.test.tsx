import { render, screen, within } from "@testing-library/react";

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
      screen.queryByRole("heading", { name: "What is Stream?" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Stream is a proposed system/)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Follow one artwork" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "See a Stream artwork" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Nothing here buys, signs, uploads, or saves anything.")
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
        "See the main steps an artwork follows in Stream, from the artist's plan through sales and payments to keeping its records clear over time and marking it as final."
      )
    ).toBeInTheDocument();
    const permissionLink = screen.getByRole("link", {
      name: "Permission details",
    });
    expect(permissionLink).toHaveAttribute(
      "href",
      "/reviews/6529-stream/curation-and-tdh-authorization"
    );
    expect(screen.getByRole("link", { name: "Artist guide" })).toHaveAttribute(
      "href",
      "/reviews/6529-stream/for-artists"
    );
    const artworkLifecycleLink = screen.getByRole("link", {
      name: "Artwork lifecycle",
    });
    expect(artworkLifecycleLink).toHaveAttribute(
      "href",
      "/reviews/6529-stream/artwork-lifecycle"
    );
    expect(
      screen.getByRole("link", {
        name: "Mint and auction details",
      })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/fixed-price-sales-and-auctions"
    );
    expect(
      screen.getByRole("link", {
        name: "Payment details",
      })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/revenue-splits-and-royalties"
    );
    expect(
      screen.getByRole("link", { name: "Freeze details" })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/freezing-preservation-and-artwork-finality#core-freeze-fixes-a-defined-boundary"
    );
    expect(
      screen.getByRole("link", { name: "Finality details" })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/freezing-preservation-and-artwork-finality#terminal-finality-is-delayed-for-a-reason"
    );
    expect(
      screen.getByText(
        "A registered signer wallet creates permission for one exact mint or auction. Nothing happens yet."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Plan the artwork")).toBeInTheDocument();
    expect(
      screen.getByText(
        "First, the artwork, number of editions, and sale are planned. The result may be decided by the artist, a community vote, or another review process."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Create the artwork records")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The artwork's contract records are created. These include its details and the wallets and percentages used to split sale money."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Create the permission")).toBeInTheDocument();
    expect(screen.getByText("Use the permission")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The permission is submitted to the contract. If it passes the checks, the contract marks it as used first. It then mints the token or starts the auction."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Record the payment shares")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The contract records how much primary-sale money each recipient is owed. The money is not sent automatically. Each recipient withdraws their share later."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Close and freeze the collection")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "An authorized wallet can close the collection when minting ends. This stops new tokens, blocks token destruction, and freezes the main settings."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mark the artwork as complete")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "An authorized wallet starts the final step. If no guardian stops it during the waiting period and any required artist approval exists, the protected records become permanent."
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
    const auditorCard = screen
      .getByRole("heading", { name: "Auditors" })
      .closest("article");
    expect(auditorCard).not.toBeNull();
    expect(within(auditorCard!).getAllByRole("link")).toHaveLength(1);
  });
});
