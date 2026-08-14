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
        "These controls exist in the pinned code. This page does not prove that the contracts are deployed, independently audited, or safe."
      );
      expect(currentMarkdown).toContain(
        "A deployment process creates the contracts. A temporary setup account then connects them"
      );
      expect(currentMarkdown).not.toContain(
        "A new system needs temporary setup power."
      );
      expect(currentMarkdown).toContain("This accepted ADR sets the design.");
      expect(currentMarkdown).toContain(
        "Open high risk RISK-GOV-004 says the planned production settings still need deployment evidence"
      );
      expect(currentMarkdown).toContain(
        "Open high risk RISK-GOV-003 says this power may still be too broad for launch."
      );
      expect(currentMarkdown).toContain(
        "A permanent-removal guardian can block only an update that removes a power forever."
      );
      expect(currentMarkdown).toContain(
        "adding a helper contract to the registry uses a different update type with a 48-hour minimum wait."
      );
      expect(currentMarkdown).toContain(
        "The current code does not show one complete 30-day changeover. Registering a helper does not prove that Stream has switched to it."
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
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/docs/adr/0007-upgrade-redeployment.md#L85-L118`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/docs/adr/0009-protocol-v1-open-question-resolutions.md#L59-L78`
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
