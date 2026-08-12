import { render, screen, within } from "@testing-library/react";

import {
  STREAM_REVIEW_FOR_ARTISTS_GUIDE_SECTIONS,
  StreamReviewForArtistsGuide,
} from "@/components/public-review/StreamReviewForArtistsGuide";
import { StreamReviewForArtistsDetails } from "@/components/public-review/StreamReviewForArtistsDetails";
import { getStreamReviewVersion } from "@/lib/public-review/streamReviewDefinition";

const ACTIVE_REVIEW_VERSION = getStreamReviewVersion();
if (!ACTIVE_REVIEW_VERSION) {
  throw new Error("Stream review active version is missing");
}

describe("StreamReviewForArtistsGuide", () => {
  it("explains the artist journey before handing off to contract details", () => {
    render(<StreamReviewForArtistsGuide pages={ACTIVE_REVIEW_VERSION.pages} />);

    for (const section of STREAM_REVIEW_FOR_ARTISTS_GUIDE_SECTIONS) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.title })
      ).toHaveAttribute("id", section.id);
    }

    expect(
      screen.queryByRole("heading", { name: "Your artwork, your choices" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Understand the plan before you approve it",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Before launch, check the artwork, edition size, sale, payments, and who can still make changes. Stream records the exact version you approve."
      )
    ).toBeInTheDocument();
    for (const heading of [
      "What artwork are you publishing?",
      "Is it unique or an edition?",
      "How can collectors get it?",
      "Where does the money go?",
      "What are you approving?",
      "What can change or become permanent?",
    ] as const) {
      expect(
        screen.getByRole("heading", { level: 3, name: heading })
      ).toBeInTheDocument();
    }
    expect(
      screen.getByText(
        "Choose the files, scripts, and other parts the artwork needs. Stream records the artist, the artwork, and the tokens created from it."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Choose whether there is one token or an edition, how many tokens can exist, and how each token is created. If the work uses randomness, Stream saves the result for each token so it can be recreated later."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The plan shows whether collectors mint at a fixed price or bid in an auction. It also shows the sale rules and who can take part."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Check the price, currency, and everyone who receives a share. Stream can state a royalty for later sales, but outside marketplaces may not pay it."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your wallet approves one exact version of the plan. If important details change, you need to review and approve the new version."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Before finality, some files, supply, minting, and sale settings can still change. Stream keeps a record of those changes. The finality process is meant to close the remaining ways the artwork itself can change."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "How your artwork moves through Stream",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your artwork moves through six stages. Each stage has different choices, checks, and approvals."
      )
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("list", { name: "Artwork journey stages" })
      ).getAllByRole("listitem")
    ).toHaveLength(6);
    expect(
      screen.getByText(
        "Add the artwork files and anything they need to work. Choose the edition size, sale method, credits, storage, and payment shares."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Check the complete plan. Make sure the artwork, sale, payments, and who can still make changes are correct."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Use your wallet to approve one exact version of the plan. If an important detail changes, review and approve the new version."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The community reviews the work outside the contracts. If it is selected, a separate Stream wallet signs the exact mint or auction terms."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stream checks the signed permission. Collectors can then mint or bid using only those sale terms."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Finality has a waiting period. During this time, the artist and reviewers check the files, supply, and every remaining way the artwork could change. The final step is meant to close those remaining change paths."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Important: Ending minting, freezing settings, recording preservation evidence, and finalizing the artwork are separate steps. Completing one does not complete the others."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Before you approve" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your wallet approval covers specific details, not every part of Stream. Check what the signature covers and review the wider artwork plan before signing."
      )
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("list", { name: "Approval checklist" })
      ).getAllByRole("listitem")
    ).toHaveLength(4);
    for (const [heading, description] of [
      [
        "What you are signing",
        "Check the artwork, artist wallet, contract, network, and version.",
      ],
      [
        "Artwork and supply",
        "Check every required file and the maximum number of tokens. Include every way more tokens can be created.",
      ],
      [
        "Sale and payments",
        "Check the sale type, price, currency, refunds, payment recipients, and shares.",
      ],
      [
        "Power and finality",
        "Check who can change, pause, or restart each part. Check what every permanent step locks.",
      ],
    ] as const) {
      expect(
        screen.getByRole("heading", { level: 3, name: heading })
      ).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    }
    expect(
      screen.getByText(
        "If a signed detail changes, the old approval stays with the old version. Review the new version before signing again."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "How sales and payments work",
      })
    ).toBeInTheDocument();
    for (const [heading, description] of [
      [
        "How collectors buy",
        "Collectors pay the signed fixed price or bid in an auction. The current signed sale paths use ETH. Before launch, check the auction end time, cancellation rules, and refund rules.",
      ],
      [
        "Where the money goes",
        "Check every person or wallet that receives money and their share. After the sale, Stream records how much each one can withdraw. Each person withdraws separately, so one failed payment does not block everyone else.",
      ],
      [
        "Later royalties",
        "Stream can show royalty information for later marketplace sales. The marketplace decides whether to pay it.",
      ],
    ] as const) {
      expect(
        screen.getByRole("heading", { level: 3, name: heading })
      ).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    }
    const sectionHeadings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(sectionHeadings.indexOf("Before you approve")).toBeLessThan(
      sectionHeadings.indexOf("Who else can affect your artwork?")
    );
    expect(
      sectionHeadings.indexOf("Who else can affect your artwork?")
    ).toBeLessThan(sectionHeadings.indexOf("How sales and payments work"));
    expect(sectionHeadings.indexOf("How sales and payments work")).toBeLessThan(
      sectionHeadings.indexOf("What can still change?")
    );
    expect(sectionHeadings.indexOf("What can still change?")).toBeLessThan(
      sectionHeadings.indexOf("Before your artwork becomes final")
    );
    expect(
      sectionHeadings.indexOf("Before your artwork becomes final")
    ).toBeLessThan(sectionHeadings.indexOf("Your next step"));
    expect(sectionHeadings.indexOf("Your next step")).toBeLessThan(
      sectionHeadings.indexOf("Read the contract details")
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "What can still change?" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stream makes parts of your artwork permanent at different times. Ending minting, freezing settings, and artwork finality are separate steps."
      )
    ).toBeInTheDocument();
    for (const [heading, description] of [
      [
        "Before minting starts",
        "Review the plan. If something is wrong, do not approve it. A corrected version can be prepared for you.",
      ],
      [
        "After minting starts",
        "Minted tokens, payments, and signed actions stay in the history. Some settings can still change. Important changes may need a new approval from you.",
      ],
      [
        "After artwork finality",
        "Finality is designed to lock the artwork records it covers. Before this happens, a waiting period lets the guardian stop a suspicious finality action.",
      ],
    ] as const) {
      expect(
        screen.getByRole("heading", { level: 3, name: heading })
      ).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Before your artwork becomes final",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Finality is meant to lock the artwork records it covers. Ending minting, freezing settings, and adding preservation records are separate steps."
      )
    ).toBeInTheDocument();
    for (const [heading, description] of [
      [
        "Check every required part",
        "Make sure every file, script, font, and other required part can still be found and opened.",
      ],
      [
        "Check the recorded fingerprints",
        "A file fingerprint is a code made from the file. A matching code shows that the file has not changed. It does not keep the file online.",
      ],
      [
        "Check the final record",
        "Confirm the token supply, mint history, payments, and any saved randomness results.",
      ],
      [
        "Use the waiting period",
        "Finality has a delay so you and other reviewers can find mistakes. A guardian can stop the action during this time, but cannot replace it with different artwork or terms.",
      ],
    ] as const) {
      expect(
        screen.getByRole("heading", { level: 3, name: heading })
      ).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "What is still under review",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stream is meant to close every approved path that can change the artwork. The current review has not yet proved that every path is closed. Check the technical evidence before relying on finality."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Read Freezing, Preservation, and Artwork Finality",
      })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/freezing-preservation-and-artwork-finality"
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Who else can affect your artwork?",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your approval matters, but other people and services also have a role. Before you sign, check what each one can do and where its power ends."
      )
    ).toBeInTheDocument();
    for (const [heading, description] of [
      [
        "Community review",
        "The community reviews and selects the work outside the contracts. The contracts cannot tell whether this decision was fair or correct.",
      ],
      [
        "Stream signing wallet",
        "If the work is selected, a separate Stream wallet signs the exact mint or auction terms. The contracts can check that signature.",
      ],
      [
        "People who run Stream",
        "The contracts give different roles different powers. Check who can change, pause, or restart each part of Stream.",
      ],
      [
        "Guardian",
        "The guardian is a safety brake. It can pause a specific part of Stream or stop a planned change during its waiting period. It cannot replace that change with different artwork or terms.",
      ],
      [
        "Outside services",
        "File storage, websites, services that provide random results, and marketplaces work outside the contracts. Stream can record links and evidence. It cannot keep a service online or force a marketplace to pay royalties.",
      ],
    ] as const) {
      expect(
        screen.getByRole("heading", { level: 3, name: heading })
      ).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    }
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
      screen.getByRole("heading", { level: 2, name: "Your next step" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Review the exact approval package. If it matches the plan you accept, sign it. If anything is missing or unclear, ask for a corrected version."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Continue to the contract details",
      })
    ).toHaveAttribute("href", "#your-collection-has-a-durable-identity");
  });

  it("co-renders the contract-detail target linked by the guide", () => {
    render(
      <>
        <StreamReviewForArtistsGuide pages={ACTIVE_REVIEW_VERSION.pages} />
        <StreamReviewForArtistsDetails />
      </>
    );

    expect(
      screen.getByRole("link", { name: "Continue to the contract details" })
    ).toHaveAttribute("href", "#your-collection-has-a-durable-identity");
    expect(
      document.getElementById("your-collection-has-a-durable-identity")
    ).toHaveClass("tw-scroll-mt-24");
  });
});
