import {
  extractPublicReviewEvidenceStates,
  extractPublicReviewSections,
  getPublicReviewHeadingId,
} from "@/lib/public-review/editorialSections";

describe("public review editorial sections", () => {
  it("extracts stable level-two anchors and ignores deeper headings", () => {
    expect(
      extractPublicReviewSections(`
# Page title
## 1. A collection record is created
### IMPLEMENTED
## Questions for reviewers
`)
    ).toEqual([
      {
        id: "a-collection-record-is-created",
        title: "1. A collection record is created",
      },
      {
        id: "questions-for-reviewers",
        title: "Questions for reviewers",
      },
    ]);
  });

  it("normalizes punctuation and Unicode without empty anchors", () => {
    expect(getPublicReviewHeadingId("Metadata, scripts & dependencies")).toBe(
      "metadata-scripts-dependencies"
    );
    expect(getPublicReviewHeadingId("  ")).toBe("");
  });

  it("keeps renamed review headings on their existing feedback anchors", () => {
    expect(getPublicReviewHeadingId("What the signed details contain")).toBe(
      "the-exact-authorization"
    );
    expect(getPublicReviewHeadingId("Who can approve mints and auctions")).toBe(
      "eoa-and-contract-wallet-signers"
    );
    expect(getPublicReviewHeadingId("How a fixed-price mint works")).toBe(
      "fixed-price-execution"
    );
    expect(getPublicReviewHeadingId("How an auction starts")).toBe(
      "auction-registration"
    );
    expect(
      getPublicReviewHeadingId("How unused permissions can be stopped")
    ).toBe("cancellation-consumption-and-rotation");
    expect(getPublicReviewHeadingId("Can someone copy the transaction?")).toBe(
      "transaction-ordering-and-mev"
    );
    expect(getPublicReviewHeadingId("What the contract cannot verify")).toBe(
      "offchain-evidence-completes-the-authorization"
    );
    expect(
      getPublicReviewHeadingId("A public proof page is still needed")
    ).toBe("the-authorization-receipt");
    expect(
      getPublicReviewHeadingId("How to test that Stream fails safely")
    ).toBe("failure-modes-reviewers-should-test");
  });

  it("suffixes repeated section titles deterministically", () => {
    expect(
      extractPublicReviewSections("## Same title\n\n## Same title\n")
    ).toEqual([
      { id: "same-title", title: "Same title" },
      { id: "same-title-2", title: "Same title" },
    ]);
  });

  it("derives evidence states from editorial labels without treating not implemented as implemented", () => {
    expect(
      extractPublicReviewEvidenceStates(`
### SOURCE IMPLEMENTED - CANDIDATE UNBOUND
### TESTED
### ACCEPTED TARGET - NOT IMPLEMENTED
### OPEN FOR FEEDBACK
### AUDIT PENDING
The profile is **PROPOSED OR
DEFERRED**.
### IMPORTANT LIMIT
`)
    ).toEqual([
      "IMPLEMENTED",
      "TESTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "DEFERRED",
      "KNOWN_LIMITATION",
    ]);
  });
});
