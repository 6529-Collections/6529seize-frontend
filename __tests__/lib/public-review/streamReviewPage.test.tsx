jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: ({ title }: { readonly title: string }) => ({ title }),
}));

jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://staging.6529.io" },
}));

jest.mock("@/config/publicReviews", () => ({
  isPublicReviewEnabled: () => true,
}));

jest.mock("@/components/public-review/PublicReviewEditorialFeedback", () => ({
  PublicReviewEditorialFeedback: ({
    config,
    page,
    sections,
  }: {
    readonly config: {
      readonly pages: readonly {
        readonly sectionValues?: readonly string[] | undefined;
        readonly value: string;
      }[];
    };
    readonly page: { readonly pageId: string };
    readonly sections: readonly unknown[];
  }) => (
    <>
      <div data-testid="feedback-section-count">{sections.length}</div>
      <div data-testid="configured-feedback-section-count">
        {config.pages.find((candidate) => candidate.value === page.pageId)
          ?.sectionValues?.length ?? 0}
      </div>
    </>
  ),
}));

jest.mock("@/components/public-review/PublicReviewShell", () => ({
  PublicReviewShell: ({
    editorialMarkdown,
    feedbackSlot,
    introNotice,
    page,
    reviewVersion,
    outroNotice,
    sections,
    showEditorialContent,
  }: {
    readonly editorialMarkdown: string;
    readonly feedbackSlot: React.ReactNode;
    readonly introNotice?: React.ReactNode;
    readonly page: Pick<PublicReviewPageDefinition, "summaryKey" | "titleKey">;
    readonly reviewVersion: {
      readonly pages: readonly Pick<PublicReviewPageDefinition, "titleKey">[];
    };
    readonly outroNotice?: React.ReactNode;
    readonly sections: readonly unknown[];
    readonly showEditorialContent?: boolean;
  }) => (
    <div
      data-testid="review-shell"
      data-editorial-visible={showEditorialContent !== false}
      data-section-count={sections.length}
      data-summary-key={page.summaryKey}
      data-title-key={page.titleKey}
      data-navigation-title-keys={reviewVersion.pages
        .map((reviewPage) => reviewPage.titleKey)
        .join(",")}
    >
      {introNotice}
      <div data-testid="editorial-copy">{editorialMarkdown}</div>
      {outroNotice}
      {feedbackSlot}
    </div>
  ),
}));

jest.mock("@/components/public-review/StreamReviewBotAuthorshipNote", () => ({
  StreamReviewBotAuthorshipNote: () => <div>Authorship note</div>,
}));

jest.mock("@/components/public-review/StreamReviewDevelopmentStatus", () => ({
  StreamReviewDevelopmentStatus: () => <div>Launch readiness</div>,
  StreamReviewReviewerPrompts: () => <div>Reviewer prompts</div>,
}));

jest.mock("@/components/public-review/StreamReviewForArtistsGuide", () => ({
  STREAM_REVIEW_FOR_ARTISTS_GUIDE_SECTIONS: [
    { id: "artist-guide-overview", title: "Artist guide overview" },
    { id: "artist-guide-evidence", title: "Artist guide evidence" },
  ],
  StreamReviewForArtistsGuide: () => <div>Artist guide</div>,
}));

jest.mock("@/components/public-review/StreamReviewForArtistsDetails", () => ({
  STREAM_REVIEW_FOR_ARTISTS_DETAIL_SECTIONS: [
    { id: "artist-detail-overview", title: "Artist detail overview" },
    { id: "artist-detail-evidence", title: "Artist detail evidence" },
  ],
  StreamReviewForArtistsDetails: () => <div>Artist details</div>,
}));

jest.mock("@/components/public-review/StreamReviewOverviewGuide", () => ({
  StreamReviewOverviewGuide: () => <div>Overview guide</div>,
}));

jest.mock("@/components/public-review/StreamReviewRolesGuide", () => ({
  STREAM_REVIEW_ROLES_GUIDE_SECTIONS: [
    { id: "start-with-status", title: "Start with status" },
    { id: "main-risks", title: "Main risks" },
  ],
  StreamReviewRolesGuide: () => <div>Roles guide</div>,
}));

jest.mock("@/lib/public-review/streamReviewSalesAndAuctionsPage", () => ({
  getCurrentSalesAndAuctionsEditorialMarkdown: () =>
    "# Fixed-price sales and auctions\n\n## The sale flow in one minute\n\nCurrent sales copy.",
}));

jest.mock("@/lib/public-review/streamReviewFreezingFinalityPage", () => ({
  getCurrentFreezingFinalityEditorialMarkdown: () =>
    "# Freezing, preservation, and artwork finality\n\n## The answer in one minute\n\nFinalizing supply by itself does not freeze the Core.\n\n## Recovery after finality would change the promise\n\nADR 0020 is proposed, not accepted or implemented.",
}));

jest.mock("@/lib/public-review/editorialContent", () => ({
  loadStreamEditorialContent: jest.fn(async (page: { readonly id: string }) => {
    if (page.id === "security-testing-and-known-limitations") {
      return "# Editorial title\n\nAt this snapshot, Stream was in public review before deployment and independent audit.\n\nThe source reviewed on these pages is an exact commit.\n\nThe separately dated development update on the current Overview records work completed after this snapshot.\n\n## How this snapshot describes progress\n\nOld progress labels.\n\n## A separate evidence dimension\n\nBody.\n\n## Working in the rehearsal\n\nBody.\n\n## Connected for integration\n\nBody.\n\n## Source-implemented systems\n\nBody.\n\n## Planned for release\n\nBody.\n\n## Under discussion\n\nBody.\n\n## Test evidence\n\nBody.";
    }
    if (page.id === "artwork-lifecycle") {
      return "# Artwork lifecycle\n\nA Stream artwork moves through a sequence of deliberate commitments. Collection\nidentity comes first. Artwork materials, distribution, payment, randomness, and\nmetadata are then assembled around it. Supply and Core configuration can later\nbe closed, preservation evidence can accumulate, and a final ceremony can make\nthe remaining artwork state terminal.\n\nThat sequence is a major part of the design. “Minted,” “sold,” “frozen,”\n“preserved,” and “final” describe different facts. Keeping them separate makes\neach commitment visible and reviewable.\n\nThis page follows one collection through the lifecycle and explains what each\nstage protects.\n\n## 1. The collection receives a permanent identity\n\nOld technical identity copy.\n\n## 2. The artwork package is assembled\n\nOld artwork package copy.\n\n## 3. The artist can approve a specific state\n\nOld artist approval copy.\n\n## 4. A distribution policy is selected\n\nDistribution body.\n\n## 5. Curation becomes a bound authorization\n\nOld curation copy.\n\n## 6. The selected mint lane executes atomically\n\nOld mint execution copy.\n\n## 7. The token receives a permanent identity\n\nOld token identity copy.\n\n## 8. Randomness enters a recorded lifecycle\n\nOld randomness copy.\n\n## 9. Metadata turns stored state into an artwork description\n\nOld metadata copy.\n\n## 10. Sale value becomes explicit liabilities\n\nOld payment copy.\n\n## 11. An auction reaches a terminal outcome\n\nOld auction copy.\n\n## 12. Burning preserves token history\n\nOld burning copy.\n\n## 13. Supply is closed\n\nOld supply copy.\n\n## 14. The permanent Core boundary is frozen\n\nOld Core freeze copy.\n\n## 15. Preservation evidence remains available to grow\n\nOld preservation copy.\n\n## 16. Artwork finality becomes a visible ceremony\n\nOld finality copy.\n\n## 17. Successor modules can carry future duties\n\nOld successor copy.\n\n## What collectors should see\n\nOld collector copy.\n\n## Failure modes reviewers should test\n\nOld failure-mode copy.\n\n## Questions for reviewers\n\n7. What invariants must hold before a successor module becomes current?";
    }
    if (page.id === "curation-and-tdh-authorization") {
      return "# Community curation, TDH, and signed authorization\n\nArchived curation introduction.\n\n## Questions for reviewers\n\nArchived curation question.";
    }
    if (page.id === "tokens-collections-and-minting") {
      return `# Tokens, collections, and minting

A Stream token carries a larger set of facts: its collection, its serial within
that collection, the collection's maximum supply, the distribution policy that
admitted the mint, the limits consumed, and the history preserved through a
burn or module replacement.

Minting therefore spans identity, supply, replay protection, eligibility, and
accounting. The review follows each guarantee through the contracts and the
external systems that support them.

## One permanent identity surface for many collections

Old identity copy.

## Supply combines several counters

Old supply copy.

## Why mint policy lives outside the Core

Old policy copy.

## The two source mint lanes

Old lanes copy.

## Phases make distribution policy inspectable

Old phases copy.

## Gates carry security inputs

Old gates copy.

## Durable counters cover activity across transactions

Old counters copy.

## Editions and signed Drop quantity

Old editions copy.

## Prepared execution keeps cross-module state atomic

Old atomic copy.

## Replay protection needs one durable owner

Old replay copy.

## Every minted token receives durable identity

Old result copy.

## Burning preserves history

Old burn copy.

## Mint closure must close every lane

Old closure copy.

## Responsibilities carried by the minting system

Old responsibilities copy.

## What can fail

Old failures copy.

## Questions for reviewers

8. Does the final launch path remove ambiguity between the legacy and manager
mint lanes?`;
    }
    if (page.id === "freezing-preservation-and-artwork-finality") {
      return "# Freezing, preservation, and artwork finality\n\n“Finished” can describe final supply, frozen Core configuration, a preserved set of files, or terminal artwork state.\n\n## Final supply is a supply promise\n\nOld final supply copy.\n\n## Questions for reviewers\n\n10. Should any byte-changing recovery exist after finality, and what evidence would distinguish recovery from replacement?";
    }
    if (page.id === "revenue-splits-and-royalties") {
      return [
        "# Revenue, splits, and royalties",
        "Old technical introduction.",
        "## One wei should have one accountable path",
        "Old accountable path.",
        "## The current native-sale paths keep local accounting",
        "Old native-sale path.",
        "## Pull credits keep one recipient from blocking everyone",
        "Old pull-credit path.",
        "## The settlement foundation gives a sale one replay-safe identity",
        "Old settlement path.",
        "## Resolution separates policy from the sale mechanic",
        "Old resolver path.",
        "## Immutable split profiles make collaboration inspectable",
        "Old split-profile path.",
        "## Native ETH accounting must distinguish liabilities from surplus",
        "Old native accounting.",
        "## Approved ERC-20 transfers require balance checks",
        "Old ERC-20 accounting.",
        "## Payer-bound token sales remain a proposal",
        "Old payer-bound proposal.",
        "## Rounding is an allocation decision",
        "Old rounding details.",
        "## Curator rewards connect onchain claims to offchain allocation",
        "Old curator details.",
        "## ERC-2981 publishes royalty information",
        "Old royalty details.",
        "## Every value movement should be reconstructable",
        "Old event details.",
        "## Responsibilities carried by payment accounting",
        "Old responsibility details.",
        "## What can fail",
        "Old failure list.",
        "## Questions for reviewers",
        "1. Old question.\n9. Does every public royalty statement describe marketplace payment under\nERC-2981 as voluntary?",
      ].join("\n\n");
    }
    if (page.id === "randomness") {
      return "# Randomness\n\nFor generative art, randomness is part of the work's provenance. A collector\nshould be able to determine which provider produced the input, which request it\nanswered, which token and collection it belonged to, how callbacks were\nhandled, whether anyone requested new randomness, and why the final seed is\npermanent.\n\nStream therefore treats randomness as a lifecycle. Requests, delays, failures,\nprovider changes, retries, and disputed outputs all receive durable state.\n\n## Each provider has its own trust model\n\nOld provider copy.\n\n## Questions for reviewers\n\n9. Does every supported provider give artists and collectors an equally clear\nprovenance record even though its trust model differs?";
    }
    if (page.id === "metadata-scripts-and-dependencies") {
      return [
        "# Metadata, scripts, and dependencies",
        "",
        "Old metadata snapshot copy.",
        "",
        "## The first question is: where are the bytes?",
        "",
        "## Metadata modes express different preservation promises",
        "",
        "## String construction is a security boundary",
        "",
        "## Scripts are ordered, byte-exact artwork inputs",
        "",
        "## Versioned dependencies prevent silent library replacement",
        "",
        "## Collection metadata separates claims by purpose and authority",
        "",
        "## Snapshots preserve an authorized view",
        "",
        "## Shared contract metadata serves the ERC-721 surface",
        "",
        "## Refresh events tell consumers that state changed",
        "",
        "## Size limits protect delivery and execution",
        "",
        "## The browser is part of the artwork's environment",
        "",
        "## Every collection needs a dependency bill of materials",
        "",
        "## Responsibilities carried by metadata records",
        "",
        "## What can fail",
        "",
        "## Questions for reviewers",
        "",
        "9. What must be preserved outside Ethereum for each supported artwork mode to remain reproducible?",
      ].join("\n");
    }
    return "# Editorial title\n\n## Technical section\n\nBody.";
  }),
  PublicReviewEditorialContentError: class extends Error {},
}));

jest.mock("@/lib/public-review/streamReviewCurationTdhPage", () => ({
  getCurrentCurationTdhEditorialMarkdown: () =>
    "# Community curation, TDH, and signed authorization\n\n**The answer in one minute**\n\nThe artwork decision happens before Stream is involved.\n\nStream receives signed artwork and sale details for creating an NFT or starting an auction. The signature confirms that Stream’s approved signer has authorized those exact details.\n\nNothing happens automatically. Someone submits the signed details to the Stream contract. For a paid mint, the signed payer must submit them and pay the exact price. For a free mint or auction, any account may submit them.\n\nThe contract then confirms who signed the details, whether the deadline has passed, and whether the permission was cancelled or used before. If every check passes, it creates the NFT or starts the auction.\n\n## Questions for reviewers\n\nWhich real-service, launch-configuration, and independent-audit checks remain before this flow can be trusted?",
}));

jest.mock("@/lib/public-review/streamReviewGovernancePage", () => ({
  getCurrentGovernanceEditorialMarkdown: jest.fn(
    () =>
      "# Changes, Emergencies, and Future Contracts\n\n## The short answer\n\nPlain current governance copy.\n\n## Current code boundary\n\nThe 30-day class and module registration are separate."
  ),
}));

jest.mock("@/lib/public-review/streamReviewFeedback.server", () => ({
  createStreamEditorialFeedbackPageContext: jest.fn(
    ({ page }: { readonly page: { readonly id: string } }) => ({
      pageId: page.id,
    })
  ),
  createStreamReviewFeedbackConfig: jest.fn(async () => ({
    pages: [
      {
        value: "overview",
        sectionValues: ["old-overview-section"],
      },
      {
        value: "artwork-lifecycle",
        sectionValues: ["old-artwork-section"],
      },
      {
        value: "curation-and-tdh-authorization",
        sectionValues: ["old-curation-section"],
      },
      {
        value: "freezing-preservation-and-artwork-finality",
        sectionValues: ["old-freezing-section"],
      },
      {
        value: "for-artists",
        sectionValues: ["old-artist-section"],
      },
      {
        value: "roles-and-trust",
        sectionValues: ["old-roles-section"],
      },
      {
        value: "tokens-collections-and-minting",
        sectionValues: ["old-tokens-section"],
      },
      {
        value: "governance-pausing-and-successors",
        sectionValues: ["old-governance-section"],
      },
      {
        value: "randomness",
        sectionValues: ["old-randomness-section"],
      },
      {
        value: "metadata-scripts-and-dependencies",
        sectionValues: ["old-metadata-section"],
      },
      {
        value: "security-testing-and-known-limitations",
        sectionValues: ["old-development-section"],
      },
      {
        value: "fixed-price-sales-and-auctions",
        sectionValues: ["old-sales-section"],
      },
      {
        value: "community-review",
        sectionValues: ["technical-section"],
      },
      {
        value: "revenue-splits-and-royalties",
        sectionValues: ["old-revenue-section"],
      },
    ],
  })),
  resolveStreamReviewFeedbackDestination: jest.fn(async () => ({})),
}));

jest.mock("@/lib/public-review/streamSolidityReference", () => ({
  getStreamSolidityReferenceReader: () => ({
    loadManifest: jest.fn(async () => ({
      manifest: {
        source: {
          repository: "6529-Collections/6529Stream",
          commit: "513bd7e079eafe109df6ae1ae21bfbca6fec6786",
          tree: "b50ec53109f5f8d6b4f4b07f4cb6fd3c1d0e3100",
        },
      },
    })),
  }),
}));

import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";

import {
  loadStreamEditorialContent,
  PublicReviewEditorialContentError,
} from "@/lib/public-review/editorialContent";
import type { PublicReviewPageDefinition } from "@/lib/public-review/publicReviewTypes";
import {
  generateStreamReviewRouteMetadata,
  renderStreamReviewRoutePage,
} from "@/lib/public-review/streamReviewPage";

const loadStreamEditorialContentMock = jest.mocked(loadStreamEditorialContent);
const notFoundMock = jest.mocked(notFound);

describe("renderStreamReviewRoutePage", () => {
  it("uses the plain current title in metadata while preserving the archived title", async () => {
    const currentMetadata = await generateStreamReviewRouteMetadata({
      params: Promise.resolve({
        review: "6529-stream",
        page: "curation-and-tdh-authorization",
      }),
    });
    const archivedMetadata = await generateStreamReviewRouteMetadata({
      params: Promise.resolve({
        review: "6529-stream",
        version: "2026-08-01.1",
        page: "curation-and-tdh-authorization",
      }),
    });

    expect(currentMetadata.title).toBe(
      "From Artwork Decision to Signed Permission | 6529 Stream Contract Review"
    );
    expect(archivedMetadata.title).toBe(
      "Curation and TDH Authorization | 6529 Stream Contract Review"
    );
  });

  it("renders the not-found route when editorial content is unavailable", async () => {
    loadStreamEditorialContentMock.mockRejectedValueOnce(
      new PublicReviewEditorialContentError("Editorial content is unavailable")
    );

    await expect(
      renderStreamReviewRoutePage({
        params: Promise.resolve({ review: "6529-stream" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("ends the current Overview after its plain-language guide", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({ review: "6529-stream" }),
      })
    );

    expect(screen.getByText("Overview guide")).toBeInTheDocument();
    expect(screen.queryByText("Launch readiness")).not.toBeInTheDocument();
    expect(screen.queryByText("Reviewer prompts")).not.toBeInTheDocument();
    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "false"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "0"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("0");
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("0");
  });

  it("puts the current launch answer on Where Development Stands", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "security-testing-and-known-limitations",
        }),
      })
    );

    expect(screen.getByText("Launch readiness")).toBeInTheDocument();
    expect(screen.queryByText("Reviewer prompts")).not.toBeInTheDocument();
    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "true"
    );
    const editorialCopy = screen.getByTestId("editorial-copy");
    expect(editorialCopy).toHaveTextContent("What this review covers");
    expect(editorialCopy).toHaveTextContent(
      "Stream was not live when this review was created, and no Stream contracts held funds."
    );
    expect(editorialCopy).toHaveTextContent("How we describe progress");
    expect(editorialCopy).toHaveTextContent("What has been built.");
    expect(editorialCopy).toHaveTextContent(
      "What proof exists that it is safe and ready."
    );
    expect(editorialCopy).toHaveTextContent("Working in the reviewed flow");
    expect(editorialCopy).toHaveTextContent("What works in the reviewed flow");
    expect(editorialCopy).toHaveTextContent("Artwork identity and history");
    expect(editorialCopy).toHaveTextContent(
      "a freeze is not complete artwork finality."
    );
    expect(editorialCopy).toHaveTextContent("Fixed-price sales and auctions");
    expect(editorialCopy).toHaveTextContent("Payments and royalties");
    expect(editorialCopy).toHaveTextContent("Safety controls and preservation");
    expect(editorialCopy).toHaveTextContent(
      "ADR proposals are not working features."
    );
    expect(editorialCopy).toHaveTextContent("See the exact rehearsal setup");
    expect(editorialCopy).not.toHaveTextContent(
      "The current rehearsal constructs a real multi-contract baseline"
    );
    expect(editorialCopy).toHaveTextContent("Connected to selected parts");
    expect(editorialCopy).toHaveTextContent("A newer minting path");
    expect(editorialCopy).toHaveTextContent(
      "The old and new minting paths remain separate."
    );
    expect(editorialCopy).toHaveTextContent("A newer payment path");
    expect(editorialCopy).toHaveTextContent(
      "settlement has no configured caller"
    );
    expect(editorialCopy).toHaveTextContent(
      "ADR proposals are not counted here."
    );
    expect(editorialCopy).not.toHaveTextContent(
      "The rehearsal also constructs significant systems"
    );
    expect(editorialCopy).toHaveTextContent("Code exists");
    expect(editorialCopy).toHaveTextContent(
      "Governance and contract replacements"
    );
    expect(editorialCopy).toHaveTextContent("Artwork protection and records");
    expect(editorialCopy).toHaveTextContent("Minting rules");
    expect(editorialCopy).toHaveTextContent("Randomness and metadata");
    expect(editorialCopy).toHaveTextContent(
      "available code, not active launch protection"
    );
    expect(editorialCopy).toHaveTextContent(
      "ADR proposals are not counted as working features."
    );
    expect(editorialCopy).not.toHaveTextContent(
      "These mechanisms exist in Solidity at the reviewed commit"
    );
    expect(editorialCopy).toHaveTextContent("Accepted plan");
    expect(editorialCopy).toHaveTextContent("Safer revenue checks");
    expect(editorialCopy).toHaveTextContent(
      "Metadata refresh from approved contracts"
    );
    expect(editorialCopy).toHaveTextContent("Exact launch roles");
    expect(editorialCopy).toHaveTextContent(
      "does not mean the work is built, connected, tested, or ready for launch"
    );
    expect(editorialCopy).not.toHaveTextContent(
      "Planned work has an approved design direction"
    );
    expect(editorialCopy).toHaveTextContent("Not final");
    expect(editorialCopy).toHaveTextContent("Artist permissions and recovery");
    expect(editorialCopy).toHaveTextContent("Payments and sale types");
    expect(editorialCopy).toHaveTextContent(
      "Mint records and artwork recovery"
    );
    expect(editorialCopy).toHaveTextContent(
      "Randomness recovery and providers"
    );
    expect(editorialCopy).toHaveTextContent(
      "ADR 0022 proposes an immutable, stateless validation adapter."
    );
    expect(editorialCopy).toHaveTextContent(
      "ADR 0018 would make the ledger the permanent owner of each batch replay record"
    );
    expect(editorialCopy).toHaveTextContent(
      "ADR 0020 would preserve the original artwork-finality record"
    );
    expect(editorialCopy).toHaveTextContent(
      "None of these proposals are protections provided by the launch candidate."
    );
    expect(editorialCopy).not.toHaveTextContent(
      "The following material is design input awaiting implementation"
    );
    expect(editorialCopy).toHaveTextContent("What counts as proof");
    expect(editorialCopy).toHaveTextContent(
      "ADR means Architecture Decision Record. It records a design or proposal; it does not prove that the design is built or ready to launch."
    );
    expect(editorialCopy).toHaveTextContent(
      "Code exists in the reviewed version"
    );
    expect(editorialCopy).toHaveTextContent("Local tests pass");
    expect(editorialCopy).toHaveTextContent("Launch setup checked");
    expect(editorialCopy).toHaveTextContent("Real services tested");
    expect(editorialCopy).toHaveTextContent("Independent audit completed");
    expect(editorialCopy).toHaveTextContent(
      "Proof for one exact launch setup, real services, deployment, and an independent audit is still incomplete."
    );
    expect(editorialCopy).toHaveTextContent("Technical details");
    const editorialText = editorialCopy.textContent ?? "";
    expect(editorialText.indexOf("What counts as proof")).toBeLessThan(
      editorialText.indexOf("Technical details")
    );
    expect(editorialCopy).toHaveTextContent(
      "If the code changes, this review must be updated."
    );
    expect(editorialCopy).toHaveTextContent(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
    expect(editorialCopy).toHaveTextContent(
      "b50ec53109f5f8d6b4f4b07f4cb6fd3c1d0e3100"
    );
    expect(editorialCopy).toHaveTextContent("Test evidence");
    expect(editorialCopy).toHaveTextContent("What this proves");
    expect(editorialCopy).toHaveTextContent("Known test gaps");
    expect(editorialCopy).toHaveTextContent("Static analysis");
    expect(editorialCopy).toHaveTextContent(
      "30 open High or Medium findings: 3 High and 27 Medium"
    );
    expect(editorialCopy).toHaveTextContent("Known limitations");
    expect(editorialCopy).toHaveTextContent("Tokens and minting");
    expect(editorialCopy).toHaveTextContent("Payments and auctions");
    expect(editorialCopy).toHaveTextContent("Governance and contract size");
    expect(editorialCopy).toHaveTextContent("Artwork and metadata");
    expect(editorialCopy).toHaveTextContent(
      "Proposed ADRs are not counted as fixes."
    );
    expect(editorialCopy).toHaveTextContent(
      "ADR 0018 proposes one durable joined record, but it is not accepted or implemented."
    );
    expect(editorialCopy).toHaveTextContent(
      "ADR 0016 accepts this Core-only design"
    );
    expect(editorialCopy).toHaveTextContent(
      "Collection freeze is a separate protection."
    );
    expect(editorialCopy).toHaveTextContent("The release standard");
    expect(editorialCopy).toHaveTextContent("Contract bytecode size");
    expect(editorialCopy).toHaveTextContent(
      "Neither contract exists at the pinned commit."
    );
    expect(editorialCopy).toHaveTextContent(
      "Evidence required for the exact release candidate"
    );
    expect(editorialCopy).toHaveTextContent(
      "Evidence still required from real services"
    );
    expect(editorialCopy).toHaveTextContent("Independent audit");
    expect(editorialCopy).toHaveTextContent("Release blockers");
    expect(editorialCopy).toHaveTextContent("Threat model");
    expect(editorialCopy).toHaveTextContent("Review priorities");
    expect(editorialCopy).toHaveTextContent("Public findings");
    expect(editorialCopy).toHaveTextContent("Feedback destinations");
    expect(editorialCopy).toHaveTextContent("Questions for reviewers");
    expect(editorialText.indexOf("Test evidence")).toBeLessThan(
      editorialText.indexOf("Known limitations")
    );
    expect(editorialText.indexOf("The release standard")).toBeLessThan(
      editorialText.indexOf("Release blockers")
    );
    expect(editorialText.indexOf("Release blockers")).toBeLessThan(
      editorialText.indexOf("Review priorities")
    );
    expect(editorialText.indexOf("Public findings")).toBeLessThan(
      editorialText.indexOf("Questions for reviewers")
    );
    expect(
      editorialText.indexOf("19d4bbf5-86ec-4053-a5f2-bb28d7a2f780")
    ).toBeGreaterThan(editorialText.indexOf("Public findings"));
    expect(editorialCopy).not.toHaveTextContent(
      "This register centralizes release state."
    );
    expect(editorialCopy).not.toHaveTextContent("The repository contains:");
    expect(editorialCopy).not.toHaveTextContent(
      "The separately dated development update"
    );
    expect(editorialCopy).not.toHaveTextContent(
      "How this snapshot describes progress"
    );
    expect(editorialCopy).not.toHaveTextContent(
      "A separate evidence dimension"
    );
    expect(editorialCopy).not.toHaveTextContent("Working in the rehearsal");
    expect(editorialCopy).not.toHaveTextContent("Connected for integration");
    expect(editorialCopy).not.toHaveTextContent("Source-implemented systems");
    expect(editorialCopy).not.toHaveTextContent("Planned for release");
    expect(editorialCopy).not.toHaveTextContent("Under discussion");
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "22"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent(
      "22"
    );
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("22");
  });

  it("shows plain-language copy on the current Artwork Lifecycle page", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "artwork-lifecycle",
        }),
      })
    );

    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The lifecycle in one minute"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A Stream artwork is built step by step."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Minted, sold, frozen, preserved, and final are different stages."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "1. The collection gets a permanent identity"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Before anything is minted or sold, Stream gives the collection a permanent ID in the Core."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "**Why this matters:** The artwork keeps one clear identity even when the tools around it change."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old technical identity copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "2. The artwork package is prepared"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A Stream artwork is more than an image."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A tool can be replaced without giving the artwork a new identity."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old artwork package copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "3. The artist can sign the current setup"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "This signature is evidence only."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A missing or outdated signature does not pause or stop minting."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A successful mint changes the live supply and token metadata."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old artist approval copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "4. The minting rules are chosen"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The same permission can cover later mints while the policy stays the same."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "An ADR, or Architecture Decision Record, is an accepted design decision."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The paths do not share every check or counter. Each path must be reviewed on its own."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Distribution body."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "5. The selected drop receives signed approval"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "TDH, which means Total Days Held."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The signer is a wallet trusted to approve the result."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The contract does not choose the artist, calculate TDH, or decide whether the result is fair."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "In this path, one approval covers one token. After a successful use, it cannot be used again."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old curation copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "6. The mint completes fully or not at all"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "All checks and changes happen in one blockchain transaction."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "These paths do not use the same approval or counters."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The reviewed contracts do not yet enforce that check."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A collector cannot receive a half-finished mint."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old mint execution copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "7. The minted token gets a permanent ID"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "every token successfully minted, including burned tokens."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "It does not lower the minted-ever count or make room for a replacement mint."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Burning a token does not erase its history or change the identity of other tokens."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old token identity copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "8. Randomness is requested and recorded"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A technical retry cannot become a hidden redraw."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "9. Metadata describes the artwork"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A hash can prove that retrieved bytes are correct, but it cannot keep those bytes available."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "10. Sale money becomes balances to withdraw"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The current sale paths do not use those modules everywhere yet."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "11. An auction ends once"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The same token or payment cannot be handled twice."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "12. Burning affects more than ownership"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A later valid randomness answer can be kept for audit, but it cannot bring the token back."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "13. Supply closes"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The current `setFinalSupply` function does not emit its own supply-closed event."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "14. The Core is permanently frozen"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Core freeze is not the same as full artwork finality."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "15. Preservation records can still be added"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Long-term preservation needs both proof and access to the real artwork materials."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "16. Artwork finality is the last ceremony"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The same unchanged record does not automatically need a new signature."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "17. Replaceable modules can have successors"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Signatures for an old contract do not automatically become valid in a new one."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "What collectors should be able to see"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Technical review checklist"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old randomness copy."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "What invariants must hold before a successor module becomes current?"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "sequence of deliberate commitments"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "21"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.artworkLifecycle.currentSummary"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent(
      "21"
    );
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("21");
  });

  it("uses plain current copy on Tokens, Collections, and Minting", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "tokens-collections-and-minting",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");
    expect(editorialCopy).toHaveTextContent("Minting in one minute");
    expect(editorialCopy).toHaveTextContent(
      "they are not one combined launch path"
    );
    expect(editorialCopy).toHaveTextContent(
      "This ADR is only a proposal. It is not accepted or implemented in the pinned code"
    );
    expect(editorialCopy).toHaveTextContent(
      "`setFinalSupply` alone does not close an empty collection forever"
    );
    expect(editorialCopy).not.toHaveTextContent("Old identity copy.");
    expect(editorialCopy).not.toHaveTextContent("Old replay copy.");
    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "17"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.tokensCollectionsAndMinting.currentSummary"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent(
      "17"
    );
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("17");
  });

  it("shows plain copy only on the current sales and auctions route", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "fixed-price-sales-and-auctions",
        }),
      })
    );

    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The sale flow in one minute"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Current sales copy."
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.fixedPriceSalesAndAuctions.currentSummary"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("1");
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("1");
  });

  it("shows plain-language copy on the current Revenue page", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "revenue-splits-and-royalties",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");

    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(editorialCopy).toHaveTextContent("The short answer:");
    expect(editorialCopy).toHaveTextContent(
      "The reviewed source has two payment systems."
    );
    expect(editorialCopy).toHaveTextContent(
      "the current sale paths do not use it."
    );
    expect(editorialCopy).toHaveTextContent(
      "ADR 0021 is accepted design, not implemented behavior"
    );
    expect(editorialCopy).toHaveTextContent(
      "ADR 0019 is proposed, not accepted."
    );
    expect(editorialCopy).toHaveTextContent(
      "A marketplace can choose whether to pay it."
    );
    expect(editorialCopy).toHaveTextContent(
      "Implementation review and deployment proof are still separate steps."
    );
    expect(editorialCopy).not.toHaveTextContent("Old technical introduction.");
    expect(editorialCopy).not.toHaveTextContent("Old settlement path.");
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "true"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "16"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.revenueSplitsAndRoyalties.currentSummary"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent(
      "16"
    );
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("16");
  });

  it("shows plain-language copy on the current Randomness page", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "randomness",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");
    expect(editorialCopy).toHaveTextContent("Randomness in one minute");
    expect(editorialCopy).toHaveTextContent("a retry must not become a redraw");
    expect(editorialCopy).toHaveTextContent("What is in the reviewed code");
    expect(editorialCopy).toHaveTextContent("What the accepted design says");
    expect(editorialCopy).toHaveTextContent("What is still open");
    expect(editorialCopy).toHaveTextContent(
      "The current stale state is immediate and terminal"
    );
    expect(editorialCopy).toHaveTextContent(
      "Provider migration governs future requests"
    );
    expect(editorialCopy).toHaveTextContent(
      "That is an open review idea. It is not implemented in the pinned contracts."
    );
    expect(editorialCopy).toHaveTextContent(
      "An accepted seed can be stranded before it reaches the Core."
    );
    expect(editorialCopy).toHaveTextContent(
      "Those tests show local behavior. They do not prove live provider operation."
    );
    expect(editorialCopy).toHaveTextContent(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
    expect(editorialCopy).not.toHaveTextContent("Old provider copy.");
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "16"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.randomness.currentSummary"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent(
      "16"
    );
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("16");
  });

  it("puts a plain current guide before the Community Review prompts", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "community-review",
        }),
      })
    );

    const shell = screen.getByTestId("review-shell");
    const editorialCopy = screen.getByTestId("editorial-copy");
    const shellText = shell.textContent ?? "";

    expect(screen.getByText("Reviewer prompts")).toBeInTheDocument();
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.queryByText("Launch readiness")).not.toBeInTheDocument();
    expect(editorialCopy).toHaveTextContent(
      "How to participate in the community review"
    );
    expect(editorialCopy).toHaveTextContent("What to review");
    expect(editorialCopy).toHaveTextContent(
      "Before reporting a security issue"
    );
    expect(editorialCopy).toHaveTextContent("How to submit feedback");
    expect(editorialCopy).toHaveTextContent(
      "The current frontend does not yet record accepted, rejected, confirmed, or fixed states."
    );
    expect(editorialCopy).toHaveTextContent("Its only report state is `NEW`.");
    expect(editorialCopy).toHaveTextContent(
      "The stored context does not include the frontend commit or the full wording shown on screen."
    );
    expect(editorialCopy).toHaveTextContent(
      "The current process compares review versions manually."
    );
    expect(editorialCopy).toHaveTextContent(
      "Independent experts must still audit the exact release candidate"
    );
    expect(editorialCopy).toHaveTextContent("2026-08-01.1");
    expect(editorialCopy).toHaveTextContent(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
    expect(editorialCopy).not.toHaveTextContent("Technical section");
    expect(editorialCopy).not.toHaveTextContent("Body.");
    expect(shellText.indexOf("Authorship note")).toBeLessThan(
      shellText.indexOf("How to participate in the community review")
    );
    expect(
      shellText.indexOf("How to participate in the community review")
    ).toBeLessThan(shellText.indexOf("Reviewer prompts"));
    expect(shell).toHaveAttribute("data-section-count", "12");
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent(
      "12"
    );
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("12");
  });

  it("shows plain copy only on the current Curation and TDH page", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "curation-and-tdh-authorization",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");
    expect(editorialCopy).toHaveTextContent("The answer in one minute");
    expect(editorialCopy).toHaveTextContent(
      "The artwork decision happens before Stream is involved."
    );
    expect(editorialCopy).toHaveTextContent(
      "Stream receives signed artwork and sale details for creating an NFT or starting an auction."
    );
    expect(editorialCopy).toHaveTextContent(
      "The signature confirms that Stream’s approved signer has authorized those exact details."
    );
    expect(editorialCopy).toHaveTextContent(
      "Nothing happens automatically. Someone submits the signed details to the Stream contract."
    );
    expect(editorialCopy).toHaveTextContent(
      "The contract then confirms who signed the details"
    );
    expect(editorialCopy).not.toHaveTextContent(
      "This page reviews that handoff."
    );
    expect(editorialCopy).toHaveTextContent(
      "Which real-service, launch-configuration, and independent-audit checks remain before this flow can be trusted?"
    );
    expect(editorialCopy).not.toHaveTextContent(
      "Archived curation introduction."
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.curationAndTdhAuthorization.currentSummary"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-title-key",
      "publicReview.pages.curationAndTdhAuthorization.currentTitle"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-navigation-title-keys",
      expect.stringContaining(
        "publicReview.pages.curationAndTdhAuthorization.currentTitle"
      )
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("1");
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("1");
  });

  it("replaces the current For Artists editorial with plain-language details", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "for-artists",
        }),
      })
    );

    expect(screen.getByText("Artist guide")).toBeInTheDocument();
    expect(screen.getByText("Artist details")).toBeInTheDocument();
    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "false"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "4"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("4");
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("4");
  });

  it("replaces the current roles editorial with a status-first guide", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "roles-and-trust",
        }),
      })
    );

    expect(screen.getByText("Roles guide")).toBeInTheDocument();
    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "false"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "2"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("2");
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("2");
  });

  it("replaces only the current governance route with plain copy", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "governance-pausing-and-successors",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");
    expect(editorialCopy).toHaveTextContent("The short answer");
    expect(editorialCopy).toHaveTextContent("Current code boundary");
    expect(editorialCopy).not.toHaveTextContent("Technical section");
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "2"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("2");
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("2");
  });

  it("replaces the current metadata editorial with a plain evidence-first page", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "metadata-scripts-and-dependencies",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");
    const editorialText = editorialCopy.textContent ?? "";

    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(editorialCopy).toHaveTextContent("One-minute explanation");
    expect(editorialCopy).toHaveTextContent("What the pinned code does");
    expect(editorialCopy).toHaveTextContent("What the accepted design says");
    expect(editorialCopy).toHaveTextContent("What is still open");
    expect(editorialCopy).toHaveTextContent(
      "This public review is not proof of launch, deployment, audit, or safety."
    );
    expect(editorialCopy).toHaveTextContent(
      "A snapshot does not freeze the underlying records."
    );
    expect(editorialCopy).toHaveTextContent(
      "no matching public or external helper exists in the pinned Solidity"
    );
    expect(editorialCopy).toHaveTextContent(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
    expect(editorialCopy).not.toHaveTextContent("Old metadata snapshot copy.");
    expect(editorialText.indexOf("One-minute explanation")).toBeLessThan(
      editorialText.indexOf("The first question is: where are the bytes?")
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "16"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent(
      "16"
    );
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("16");
  });

  it("keeps immutable Overview routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
        }),
      })
    );

    expect(screen.queryByText("Overview guide")).not.toBeInTheDocument();
    expect(screen.queryByText("Launch readiness")).not.toBeInTheDocument();
    expect(screen.queryByText("Reviewer prompts")).not.toBeInTheDocument();
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "true"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "1"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.overviewNarrative.summary"
    );
  });

  it("keeps immutable Artwork Lifecycle routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
          page: "artwork-lifecycle",
        }),
      })
    );

    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A Stream artwork moves through a sequence of deliberate commitments."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old technical identity copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old artwork package copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old artist approval copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "4. A distribution policy is selected"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Distribution body."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "5. Curation becomes a bound authorization"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old curation copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "6. The selected mint lane executes atomically"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old mint execution copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "7. The token receives a permanent identity"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old token identity copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "8. Randomness enters a recorded lifecycle"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old randomness copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "17. Successor modules can carry future duties"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old successor copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Failure modes reviewers should test"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "What invariants must hold before a successor module becomes current?"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The lifecycle in one minute"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Before anything is minted or sold, Stream gives the collection a permanent ID."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "A Stream artwork is more than an image."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The artist can sign the current setup"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The minting rules are chosen"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The selected drop receives signed approval"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The mint completes fully or not at all"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The minted token gets a permanent ID"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Randomness is requested and recorded"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Artwork finality is the last ceremony"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "20"
    );
  });

  it("keeps immutable Curation and TDH routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
          page: "curation-and-tdh-authorization",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");
    expect(editorialCopy).toHaveTextContent("Archived curation introduction.");
    expect(editorialCopy).toHaveTextContent("Archived curation question.");
    expect(editorialCopy).not.toHaveTextContent("The answer in one minute");
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.curationAndTdhAuthorization.summary"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-title-key",
      "publicReview.pages.curationAndTdhAuthorization.title"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-navigation-title-keys",
      expect.stringContaining(
        "publicReview.pages.curationAndTdhAuthorization.title"
      )
    );
  });

  it("keeps immutable Tokens, Collections, and Minting routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
          page: "tokens-collections-and-minting",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");
    expect(editorialCopy).toHaveTextContent(
      "A Stream token carries a larger set of facts"
    );
    expect(editorialCopy).toHaveTextContent("Old identity copy.");
    expect(editorialCopy).toHaveTextContent("Old replay copy.");
    expect(editorialCopy).not.toHaveTextContent("Minting in one minute");
    expect(editorialCopy).not.toHaveTextContent(
      "they are not one combined launch path"
    );
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "16"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.tokensCollectionsAndMinting.summary"
    );
  });

  it("keeps immutable sales and auctions routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
          page: "fixed-price-sales-and-auctions",
        }),
      })
    );

    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Technical section"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent("Body.");
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The sale flow in one minute"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.fixedPriceSalesAndAuctions.summary"
    );
  });

  it("shows plain-language copy on the current Freezing and Finality page", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "freezing-preservation-and-artwork-finality",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");
    expect(editorialCopy).toHaveTextContent("The answer in one minute");
    expect(editorialCopy).toHaveTextContent(
      "Finalizing supply by itself does not freeze the Core."
    );
    expect(editorialCopy).toHaveTextContent(
      "ADR 0020 is proposed, not accepted or implemented."
    );
    expect(editorialCopy).not.toHaveTextContent("Old final supply copy.");
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.freezingPreservationAndArtworkFinality.currentSummary"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "2"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("2");
    expect(
      screen.getByTestId("configured-feedback-section-count")
    ).toHaveTextContent("2");
  });

  it("keeps immutable Freezing and Finality routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
          page: "freezing-preservation-and-artwork-finality",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");
    expect(editorialCopy).toHaveTextContent(
      "“Finished” can describe final supply, frozen Core configuration"
    );
    expect(editorialCopy).toHaveTextContent("Old final supply copy.");
    expect(editorialCopy).not.toHaveTextContent("The answer in one minute");
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.freezingPreservationAndArtworkFinality.summary"
    );
  });

  it("keeps immutable Revenue routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
          page: "revenue-splits-and-royalties",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");

    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(editorialCopy).toHaveTextContent("Old technical introduction.");
    expect(editorialCopy).toHaveTextContent("Old settlement path.");
    expect(editorialCopy).not.toHaveTextContent("The short answer:");
    expect(editorialCopy).not.toHaveTextContent(
      "ADR 0021 is accepted design, not implemented behavior"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "16"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.revenueSplitsAndRoyalties.summary"
    );
  });

  it("keeps immutable Randomness routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "randomness",
          version: "2026-08-01.1",
        }),
      })
    );

    const editorialCopy = screen.getByTestId("editorial-copy");
    expect(editorialCopy).toHaveTextContent(
      "For generative art, randomness is part of the work's provenance."
    );
    expect(editorialCopy).toHaveTextContent("Old provider copy.");
    expect(editorialCopy).not.toHaveTextContent("Randomness in one minute");
    expect(editorialCopy).not.toHaveTextContent(
      "a retry must not become a redraw"
    );
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "2"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.randomness.summary"
    );
  });

  it("keeps immutable For Artists routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "for-artists",
          version: "2026-08-01.1",
        }),
      })
    );

    expect(screen.queryByText("Artist guide")).not.toBeInTheDocument();
    expect(screen.queryByText("Artist details")).not.toBeInTheDocument();
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "true"
    );
  });

  it("keeps immutable roles routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "roles-and-trust",
          version: "2026-08-01.1",
        }),
      })
    );

    expect(screen.queryByText("Roles guide")).not.toBeInTheDocument();
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "true"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "1"
    );
  });

  it("keeps immutable governance routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "governance-pausing-and-successors",
          version: "2026-08-01.1",
        }),
      })
    );

    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Technical section"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The short answer"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "1"
    );
  });

  it("keeps immutable metadata routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "metadata-scripts-and-dependencies",
          version: "2026-08-01.1",
        }),
      })
    );

    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old metadata snapshot copy."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "One-minute explanation"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "15"
    );
  });

  it("keeps immutable development routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
          page: "security-testing-and-known-limitations",
        }),
      })
    );

    expect(screen.queryByText("Launch readiness")).not.toBeInTheDocument();
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The separately dated development update on the current Overview"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "What this review covers"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "8"
    );
  });

  it("keeps immutable Community Review routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
          page: "community-review",
        }),
      })
    );

    expect(screen.queryByText("Reviewer prompts")).not.toBeInTheDocument();
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Technical section"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent("Body.");
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "How to submit feedback"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "1"
    );
  });
});
