jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: () => ({}),
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
    outroNotice,
    sections,
    showEditorialContent,
  }: {
    readonly editorialMarkdown: string;
    readonly feedbackSlot: React.ReactNode;
    readonly introNotice?: React.ReactNode;
    readonly page: { readonly summaryKey: string };
    readonly outroNotice?: React.ReactNode;
    readonly sections: readonly unknown[];
    readonly showEditorialContent?: boolean;
  }) => (
    <div
      data-testid="review-shell"
      data-editorial-visible={showEditorialContent !== false}
      data-section-count={sections.length}
      data-summary-key={page.summaryKey}
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
  StreamReviewForArtistsGuide: () => <div>Artist guide</div>,
}));

jest.mock("@/components/public-review/StreamReviewForArtistsDetails", () => ({
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

jest.mock("@/lib/public-review/editorialContent", () => ({
  loadStreamEditorialContent: jest.fn(async (page: { readonly id: string }) => {
    if (page.id === "security-testing-and-known-limitations") {
      return "# Editorial title\n\nAt this snapshot, Stream was in public review before deployment and independent audit.\n\nThe source reviewed on these pages is an exact commit.\n\nThe separately dated development update on the current Overview records work completed after this snapshot.\n\n## How this snapshot describes progress\n\nOld progress labels.\n\n## A separate evidence dimension\n\nBody.\n\n## Working in the rehearsal\n\nBody.\n\n## Connected for integration\n\nBody.\n\n## Source-implemented systems\n\nBody.\n\n## Planned for release\n\nBody.\n\n## Under discussion\n\nBody.\n\n## Test evidence\n\nBody.";
    }
    if (page.id === "artwork-lifecycle") {
      return "# Artwork lifecycle\n\nA Stream artwork moves through a sequence of deliberate commitments. Collection\nidentity comes first. Artwork materials, distribution, payment, randomness, and\nmetadata are then assembled around it. Supply and Core configuration can later\nbe closed, preservation evidence can accumulate, and a final ceremony can make\nthe remaining artwork state terminal.\n\nThat sequence is a major part of the design. “Minted,” “sold,” “frozen,”\n“preserved,” and “final” describe different facts. Keeping them separate makes\neach commitment visible and reviewable.\n\nThis page follows one collection through the lifecycle and explains what each\nstage protects.\n\n## 1. The collection receives a permanent identity\n\nOld technical identity copy.\n\n## 2. The artwork package is assembled\n\nOld artwork package copy.\n\n## 3. The artist can approve a specific state\n\nOld artist approval copy.\n\n## 4. A distribution policy is selected\n\nDistribution body.\n\n## 5. Curation becomes a bound authorization\n\nOld curation copy.\n\n## 6. The selected mint lane executes atomically\n\nOld mint execution copy.\n\n## 7. The token receives a permanent identity\n\nOld token identity copy.\n\n## 8. Randomness enters a recorded lifecycle\n\nOld randomness copy.\n\n## 9. Metadata turns stored state into an artwork description\n\nOld metadata copy.\n\n## 10. Sale value becomes explicit liabilities\n\nOld payment copy.\n\n## 11. An auction reaches a terminal outcome\n\nOld auction copy.\n\n## 12. Burning preserves token history\n\nOld burning copy.\n\n## 13. Supply is closed\n\nOld supply copy.\n\n## 14. The permanent Core boundary is frozen\n\nOld Core freeze copy.\n\n## 15. Preservation evidence remains available to grow\n\nOld preservation copy.\n\n## 16. Artwork finality becomes a visible ceremony\n\nOld finality copy.\n\n## 17. Successor modules can carry future duties\n\nOld successor copy.\n\n## What collectors should see\n\nOld collector copy.\n\n## Failure modes reviewers should test\n\nOld failure-mode copy.\n\n## Questions for reviewers\n\nOld reviewer questions.";
    }
    return "# Editorial title\n\n## Technical section\n\nBody.";
  }),
  PublicReviewEditorialContentError: class extends Error {},
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
        value: "security-testing-and-known-limitations",
        sectionValues: ["old-development-section"],
      },
      {
        value: "community-review",
        sectionValues: ["technical-section"],
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
import { renderStreamReviewRoutePage } from "@/lib/public-review/streamReviewPage";

const loadStreamEditorialContentMock = jest.mocked(loadStreamEditorialContent);
const notFoundMock = jest.mocked(notFound);

describe("renderStreamReviewRoutePage", () => {
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
    expect(editorialCopy).toHaveTextContent(
      "What works in the reviewed flow"
    );
    expect(editorialCopy).toHaveTextContent("Artwork identity and history");
    expect(editorialCopy).toHaveTextContent(
      "a freeze is not complete artwork finality."
    );
    expect(editorialCopy).toHaveTextContent(
      "Fixed-price sales and auctions"
    );
    expect(editorialCopy).toHaveTextContent("Payments and royalties");
    expect(editorialCopy).toHaveTextContent(
      "Safety controls and preservation"
    );
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
    expect(editorialCopy).toHaveTextContent(
      "Artwork protection and records"
    );
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
    expect(editorialCopy).toHaveTextContent(
      "Artist permissions and recovery"
    );
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
    expect(editorialCopy).toHaveTextContent(
      "Governance and contract size"
    );
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
    expect(editorialCopy).not.toHaveTextContent(
      "The repository contains:"
    );
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
      "Before anything is minted or sold, Stream gives the collection a permanent ID."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Why this matters: The artwork keeps one clear identity even when the tools around it change."
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
      "The current setFinalSupply function does not emit its own supply-closed event."
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
      "Old reviewer questions."
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
      "1"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("1");
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
      "publicReview.pages.artworkLifecycle.summary"
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
      "Old reviewer questions."
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
