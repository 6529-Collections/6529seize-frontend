jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import { getCurrentCurationTdhEditorialMarkdown } from "@/lib/public-review/streamReviewCurationTdhPage";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";

async function loadCurationTdhEditorial() {
  const reviewVersion = getStreamReviewVersion(
    STREAM_REVIEW_DEFINITION.activeVersion
  );
  if (reviewVersion === undefined) {
    throw new Error("The active Stream review version is unavailable.");
  }
  const page = reviewVersion.pages.find(
    (candidate) => candidate.id === "curation-and-tdh-authorization"
  );
  if (page === undefined) {
    throw new Error("The curation and TDH test page is unavailable.");
  }
  return {
    editorialMarkdown: await loadStreamEditorialContent(
      page,
      reviewVersion.version
    ),
    source: reviewVersion.source,
  };
}

describe("getCurrentCurationTdhEditorialMarkdown", () => {
  it("renders the plain current explanation for every supported locale", async () => {
    const input = await loadCurationTdhEditorial();

    for (const locale of SUPPORTED_LOCALES) {
      const currentMarkdown = getCurrentCurationTdhEditorialMarkdown({
        ...input,
        locale,
      });

      expect(currentMarkdown).toContain("**The answer in one minute**");
      expect(currentMarkdown).toContain(
        "The artwork decision happens before Stream is involved."
      );
      expect(currentMarkdown).toContain(
        "Stream receives signed artwork and sale details for creating an NFT or starting an auction."
      );
      expect(currentMarkdown).toContain(
        "The signature confirms that Stream’s approved signer has authorized those exact details."
      );
      expect(currentMarkdown).toContain(
        "Nothing happens automatically. Someone submits the signed details to the Stream contract."
      );
      expect(currentMarkdown).toContain(
        "For a paid mint, the signed payer must submit them and pay the exact price."
      );
      expect(currentMarkdown).toContain(
        "For a free mint or auction, any account may submit them."
      );
      expect(currentMarkdown).toContain(
        "The contract then confirms who signed the details, whether the deadline has passed, and whether the permission was cancelled or used before."
      );
      expect(currentMarkdown).toContain(
        "If every check passes, it creates the NFT or starts the auction."
      );
      expect(currentMarkdown).toContain(
        "1. The artwork is chosen outside the Stream contract."
      );
      expect(currentMarkdown).toContain(
        "2. The artwork and sale details are prepared for signing."
      );
      expect(currentMarkdown).toContain(
        "3. Stream’s approved signer signs those details."
      );
      expect(currentMarkdown).toContain(
        "4. Someone submits the signed details to the Stream contract."
      );
      expect(currentMarkdown).toContain("## What the signed details contain");
      expect(currentMarkdown).toContain(
        "Before the contract creates an NFT or starts an auction, it receives a fixed set of signed details."
      );
      expect(currentMarkdown).toContain(
        "In the code, this set is called [**DropAuthorization**]"
      );
      expect(currentMarkdown).toContain(
        "Stream uses EIP-712, a standard way to sign structured data."
      );
      expect(currentMarkdown).toContain(
        "This stops the same signed details from being accepted by another contract or on another blockchain."
      );
      expect(currentMarkdown).toContain(
        "Every part of Stream must use the same signed details. Otherwise, someone could approve one action while the contract carries out something different."
      );
      expect(currentMarkdown).toContain(
        "Each signed permission can create only one NFT in this minting flow. For example, creating 10 NFTs requires 10 separate signed permissions."
      );
      expect(currentMarkdown).toContain(
        "An epoch is the current signing period. When an admin starts a new epoch or changes the approved signer, all permissions from earlier epochs stop working immediately."
      );
      expect(currentMarkdown).toContain(
        "The signed permission fixes which collection receives the new NFT and the exact NFT information used when it is created. If someone changes that information after signing, the contract rejects it."
      );
      expect(currentMarkdown).toContain(
        "When Stream starts an auction, the signed details set its minimum price and planned end time. After that, the auction contract holds the NFT and manages bids, extra time, cancellations, refunds, and the final sale."
      );
      expect(currentMarkdown).toContain(
        "Each signed permission includes an expiry time. After that time, the contract rejects it. A later expiry gives people more time to submit it, but also leaves more time for someone to misuse it if it is stolen or no longer correct."
      );
      expect(currentMarkdown).toContain("ADR 0001");
      expect(currentMarkdown).toContain(
        "The exact **StreamDrops.sol** code shows what the contract actually does."
      );
      expect(currentMarkdown).toContain(
        "Need to understand TDH? See the [TDH guide](/network/tdh)."
      );
      expect(currentMarkdown).not.toContain(
        "This process uses curation rules and TDH."
      );
      expect(currentMarkdown).not.toContain(
        "an approved wallet signs one exact instruction"
      );
      expect(currentMarkdown).not.toContain("an outside service prepares");
      expect(currentMarkdown).not.toContain(
        "the full Stream curation rules are not yet linked here"
      );
      expect(currentMarkdown).not.toContain(
        "A service turns that result into one exact mint or auction permission."
      );
      expect(currentMarkdown).not.toContain("mint or auction request");
      expect(currentMarkdown).not.toContain("signs the request");
      expect(currentMarkdown).not.toContain("## The exact authorization");
      expect(currentMarkdown).not.toContain("The signed permission contains:");
      expect(currentMarkdown).not.toContain(
        "The typed-data definition, service, wallet display, Solidity encoding, and emitted events must agree."
      );
      expect(currentMarkdown).not.toContain(
        "The signer epoch makes key rotation immediate."
      );
      expect(currentMarkdown).not.toContain(
        "The permission names one collection."
      );
      expect(currentMarkdown).not.toContain(
        "The structure has a quantity field"
      );
      expect(currentMarkdown).not.toContain(
        "The current permission has no token-address field"
      );
      expect(currentMarkdown).not.toContain(
        "the signed reserve and end time create the first auction state"
      );
      expect(currentMarkdown).not.toContain(
        "The deadline limits how long the permission can be used."
      );
      expect(currentMarkdown).not.toContain(
        "Stream checks the signature and the signed details."
      );
      expect(currentMarkdown).not.toContain("This page reviews that handoff.");
      expect(currentMarkdown).not.toContain("**Current status**");
      expect(currentMarkdown).toContain(
        "The current path first checks the [**DROP_EXECUTION** pause in **mintDrop**]"
      );
      expect(currentMarkdown).toContain(
        "**Still open as a product and operations requirement:**"
      );
      expect(currentMarkdown).not.toContain(
        "Stream converts a social curation decision into a cryptographically bound action."
      );
    }
  });

  it("keeps the existing section anchors for feedback links", async () => {
    const input = await loadCurationTdhEditorial();
    const currentMarkdown = getCurrentCurationTdhEditorialMarkdown(input);

    expect(
      extractPublicReviewSections(currentMarkdown).map((section) => section.id)
    ).toEqual(
      extractPublicReviewSections(input.editorialMarkdown).map(
        (section) => section.id
      )
    );
  });

  it("builds evidence links from the current source context", async () => {
    const input = await loadCurationTdhEditorial();
    const repository = "example/Stream";
    const commit = "a".repeat(40);

    const currentMarkdown = getCurrentCurationTdhEditorialMarkdown({
      ...input,
      source: { repository, commit },
    });

    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamDrops.sol#L24-L60`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamDrops.sol#L736-L785`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/docs/adr/0001-drop-authorization.md`
    );
    expect(currentMarkdown).not.toContain(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
  });

  it("fails loudly when the immutable source editorial changes", async () => {
    const input = await loadCurationTdhEditorial();

    expect(() =>
      getCurrentCurationTdhEditorialMarkdown({
        ...input,
        editorialMarkdown: `${input.editorialMarkdown}\nChanged source.`,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: curation and TDH authorization."
    );
  });
});
