jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import { getCurrentGovernanceEditorialMarkdown } from "@/lib/public-review/streamReviewGovernancePage";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";

async function loadGovernanceEditorial() {
  const reviewVersion = getStreamReviewVersion(
    STREAM_REVIEW_DEFINITION.activeVersion
  );
  if (reviewVersion === undefined) {
    throw new Error("The active Stream review version is unavailable.");
  }
  const page = reviewVersion.pages.find(
    (candidate) => candidate.id === "governance-pausing-and-successors"
  );
  if (page === undefined) {
    throw new Error("The governance test page is unavailable.");
  }
  return {
    editorialMarkdown: await loadStreamEditorialContent(
      page,
      reviewVersion.version
    ),
    source: reviewVersion.source,
  };
}

describe("getCurrentGovernanceEditorialMarkdown", () => {
  it("replaces the current page with a plain, status-aware explanation", async () => {
    const input = await loadGovernanceEditorial();

    for (const locale of SUPPORTED_LOCALES) {
      const currentMarkdown = getCurrentGovernanceEditorialMarkdown({
        ...input,
        locale,
      });

      expect(currentMarkdown).toContain("## The short answer");
      expect(currentMarkdown).toContain(
        "This review page does not prove that a launch setup uses them correctly."
      );
      expect(currentMarkdown).toContain(
        "A deployment process first creates the contracts. Temporary setup permissions then connect them"
      );
      expect(currentMarkdown).not.toContain(
        "A new system needs temporary setup power."
      );
      expect(currentMarkdown).toContain(
        "An accepted ADR records the chosen design. It does not by itself prove"
      );
      expect(currentMarkdown).toContain(
        "open risk `RISK-GOV-004` still asks for end-to-end proof"
      );
      expect(currentMarkdown).toContain(
        "The source risk register still marks `RISK-GOV-003` as an open High risk."
      );
      expect(currentMarkdown).toContain(
        "A terminal-freeze guardian may veto only a terminal-freeze action"
      );
      expect(currentMarkdown).toContain(
        "the current module-registration function requires the `DELAYED_LOOSENING` class"
      );
      expect(currentMarkdown).toContain(
        "Registration alone is not proof of a complete 30-day successor changeover."
      );
      expect(currentMarkdown).not.toContain(
        "Stream keeps the permanent Core at its original address."
      );

      const sections = extractPublicReviewSections(currentMarkdown);
      expect(sections).toHaveLength(16);
      expect(sections.map((section) => section.id)).toEqual([
        "the-short-answer",
        "from-setup-to-normal-operation",
        "changes-announced-in-advance",
        "how-long-each-kind-of-change-waits",
        "what-each-approved-change-must-include",
        "when-a-change-can-move-eth",
        "stopping-a-scheduled-change",
        "stopping-one-part-of-stream-during-an-incident",
        "emergency-powers",
        "powers-that-can-end-permanently",
        "replacing-a-signing-key",
        "adding-a-service-contract",
        "replacing-a-service-contract",
        "how-changes-stay-visible",
        "what-can-fail",
        "questions-for-reviewers",
      ]);
    }
  });

  it("builds evidence links from the current source context", async () => {
    const input = await loadGovernanceEditorial();
    const repository = "example/Stream";
    const commit = "a".repeat(40);

    const currentMarkdown = getCurrentGovernanceEditorialMarkdown({
      ...input,
      source: { repository, commit },
    });

    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamGovernanceExecutor.sol#L305-L403`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/docs/adr/0017-raise-only-parameter-governance.md#L48-L71`
    );
    expect(currentMarkdown).not.toContain(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
  });

  it("fails loudly when the pinned editorial changes", async () => {
    const input = await loadGovernanceEditorial();

    expect(() =>
      getCurrentGovernanceEditorialMarkdown({
        ...input,
        editorialMarkdown: input.editorialMarkdown.replace(
          "A new system needs temporary authority",
          "A new system needs setup authority"
        ),
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: governance page."
    );
  });
});
