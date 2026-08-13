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
      expect(currentMarkdown).toContain(
        "Each signed permission has a unique ID called **dropId**. The ID is created from the approved signer, the current signing period (**epoch**), and two extra values called **nonce** and **salt** that make the permission unique."
      );
      expect(currentMarkdown).toContain(
        "After the permission succeeds or is cancelled, the contract will not accept it again. If the transaction fails, the permission stays unused and can be tried again."
      );
      expect(currentMarkdown).toContain(
        "## Who can approve mints and auctions"
      );
      expect(currentMarkdown).toContain("Stream [accepts signatures]");
      expect(currentMarkdown).toContain(
        "from either a normal wallet or a shared contract wallet, such as a Safe. A Safe can require approval from several people before it signs."
      );
      expect(currentMarkdown).toContain(
        "Because this signer can approve mints and auctions, the public should know which wallet is used, how it is controlled, and how it can be replaced in an emergency. Private keys and recovery secrets must always stay private."
      );
      expect(currentMarkdown).toContain("## How a fixed-price mint works");
      expect(currentMarkdown).toContain(
        "Before creating the NFT, the contract checks that [minting is not paused]"
      );
      expect(currentMarkdown).toContain(
        "For a paid mint, only the wallet named as the payer can submit it, and it must send the exact ETH price. A free mint sends no ETH. Both need a wallet that will receive the NFT."
      );
      expect(currentMarkdown).toContain(
        "If every check passes, the contract uses the permission and creates the NFT in one transaction. If any step fails, everything is undone and the permission can be tried again."
      );
      expect(currentMarkdown).toContain("## How an auction starts");
      expect(currentMarkdown).toContain(
        "The signed permission includes the auction's minimum price and planned end time."
      );
      expect(currentMarkdown).toContain(
        "Someone must submit this permission to Stream to start the auction. Any wallet can submit it. The wallet sends no ETH, and submitting the permission does not make it the buyer. Buyers place bids later."
      );
      expect(currentMarkdown).toContain(
        "Stream then creates the NFT and places it in a separate [auction contract]"
      );
      expect(currentMarkdown).toContain(
        "This contract holds the NFT, records bids, and completes the sale."
      );
      expect(currentMarkdown).toContain(
        "The same auction contract can manage many auctions. It keeps a separate record for each one."
      );
      expect(currentMarkdown).toContain(
        "Once the auction starts, the signed permission has been used. Later changes to the signer or unused permissions do not change the active auction."
      );
      expect(currentMarkdown).toContain(
        "## How unused permissions can be stopped"
      );
      expect(currentMarkdown).toContain(
        "An authorized admin can cancel a specific signed permission before anyone uses it."
      );
      expect(currentMarkdown).not.toContain(
        "The admin cancels the permission, not the person or wallet trying to submit it."
      );
      expect(currentMarkdown).toContain(
        "If a mistake is found before the mint, an admin can cancel the permission using its unique ID, called **dropId**. Stream then rejects it."
      );
      expect(currentMarkdown).toContain(
        "An admin can stop all older permissions by starting a new signing period, called an **epoch**. Changing the signer does this automatically."
      );
      expect(currentMarkdown).toContain(
        "The contract [records these changes on the blockchain]"
      );
      expect(currentMarkdown).toContain(
        "These controls only work before the permission succeeds. Once it creates an NFT or starts an auction, it can no longer be cancelled. If the transaction fails, it stays unused and can be tried again."
      );
      expect(currentMarkdown).not.toContain(
        "These protections only work well if admins watch the system and act quickly. The public should know who the admins are, what they can do, and how they will handle emergencies."
      );
      expect(currentMarkdown).toContain("## Can someone copy the transaction?");
      expect(currentMarkdown).toContain(
        "For a free mint or auction, another wallet may copy the transaction and submit it first. It cannot change the signed details or take the NFT."
      );
      expect(currentMarkdown).toContain(
        "If the copied transaction succeeds first, the original transaction fails because the permission has already been used."
      );
      expect(currentMarkdown).not.toContain(
        "## Which transaction happens first"
      );
      expect(currentMarkdown).not.toContain(
        "Ethereum decides which waiting transaction is processed first."
      );
      expect(currentMarkdown).not.toContain("## Transaction ordering and MEV");
      expect(currentMarkdown).not.toContain("public-mempool ordering");
      expect(currentMarkdown).not.toContain("**Review goal:**");
      expect(currentMarkdown).toContain("## What the contract cannot verify");
      expect(currentMarkdown).toContain(
        "The contract can verify that Stream's approved signer accepted the exact NFT and sale details."
      );
      expect(currentMarkdown).toContain(
        "It cannot verify how the artwork was chosen, whether TDH was calculated correctly, whether the signer and services followed the rules, or whether the artist received accurate information."
      );
      expect(currentMarkdown).toContain(
        "Those steps happen outside the blockchain. They need clear public records so others can check them."
      );
      expect(currentMarkdown).not.toContain(
        "## Offchain evidence completes the authorization"
      );
      expect(currentMarkdown).not.toContain(
        "These claims need public rules, reproducible calculations, retained records, monitoring, and accountable operators."
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
        "The **dropId** is derived from the signer, epoch, nonce, and salt."
      );
      expect(currentMarkdown).not.toContain(
        "## EOA and contract-wallet signers"
      );
      expect(currentMarkdown).not.toContain(
        "supports a normal ECDSA wallet and an ERC-1271 contract wallet"
      );
      expect(currentMarkdown).not.toContain(
        "**Still needed outside the contract:**"
      );
      expect(currentMarkdown).not.toContain("## Fixed-price execution");
      expect(currentMarkdown).not.toContain(
        "The current path first checks the [**DROP_EXECUTION** pause in **mintDrop**]"
      );
      expect(currentMarkdown).not.toContain("## Auction registration");
      expect(currentMarkdown).not.toContain(
        "For an auction permission, recipient, payer, fixed price, and submitted ETH must all be zero."
      );
      expect(currentMarkdown).not.toContain(
        "Stream creates the NFT, places it in the [auction contract]"
      );
      expect(currentMarkdown).not.toContain(
        "## Cancellation, consumption, and rotation"
      );
      expect(currentMarkdown).not.toContain(
        "The current code gives configured function admins or a global admin three controls:"
      );
      expect(currentMarkdown).not.toContain("**Operational risk:**");
      expect(currentMarkdown).not.toContain(
        "Stream checks the signature and the signed details."
      );
      expect(currentMarkdown).not.toContain("This page reviews that handoff.");
      expect(currentMarkdown).not.toContain("**Current status**");
      expect(currentMarkdown).toContain(
        "## A public proof page is still needed"
      );
      expect(currentMarkdown).toContain(
        "After an NFT is approved and created, people need an easy way to check that nothing changed."
      );
      expect(currentMarkdown).toContain("- What was approved?");
      expect(currentMarkdown).toContain("- Who approved it?");
      expect(currentMarkdown).toContain("- What did Stream create?");
      expect(currentMarkdown).toContain(
        "- Did the final result match the approval?"
      );
      expect(currentMarkdown).toContain(
        "This page is not created automatically. Stream and its operators still need to build and publish it."
      );
      expect(currentMarkdown).not.toContain("## The authorization receipt");
      expect(currentMarkdown).not.toContain(
        "**Still open as a product and operations requirement:**"
      );
      expect(currentMarkdown).toContain(
        "## How to test that Stream fails safely"
      );
      expect(currentMarkdown).toContain("### Contract tests");
      expect(currentMarkdown).toContain(
        "Change a signed detail, such as the recipient or price. The contract should reject it."
      );
      expect(currentMarkdown).toContain(
        "Make a mint or auction fail after the checks begin. The whole transaction should be undone, and the permission should remain unused."
      );
      expect(currentMarkdown).toContain(
        "Copy a free-mint or auction transaction. The copy must not change the signed details or take the NFT."
      );
      expect(currentMarkdown).toContain("### Public record and process checks");
      expect(currentMarkdown).toContain(
        "Start with a known TDH and curation decision. Compare it with the prepared data, readable display, signed permission, and final transaction."
      );
      expect(currentMarkdown).toContain(
        "Confirm the public proof page shows the decision, signed details, final transaction, and current status."
      );
      expect(currentMarkdown).not.toContain(
        "## Failure modes reviewers should test"
      );
      expect(currentMarkdown).not.toContain(
        "EIP-712 field order, encoding, chain, or contract differs between layers."
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
