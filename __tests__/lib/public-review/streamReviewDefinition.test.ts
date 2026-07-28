import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { extractPublicReviewEvidenceStates } from "@/lib/public-review/editorialSections";
import { getPublicReviewLifecycleCapabilities } from "@/lib/public-review/publicReviewLifecycle";
import { PUBLIC_REVIEW_EVIDENCE_STATES } from "@/lib/public-review/publicReviewTypes";
import {
  getStreamReviewFeedbackHref,
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_HIDDEN_DRAFT_VERSION,
  STREAM_REVIEW_INITIAL_VERSION,
  STREAM_REVIEW_PAGES,
  STREAM_REVIEW_PREVIOUS_VERSION,
  STREAM_REVIEW_SOURCE_COMMIT,
  STREAM_REVIEW_VERSION,
} from "@/lib/public-review/streamReviewDefinition";

const EXPECTED_PAGE_TITLES = [
  "Overview",
  "Artwork Lifecycle",
  "For Artists",
  "Roles and Trust",
  "Curation and TDH Authorization",
  "Tokens, Collections, and Minting",
  "Fixed-Price Sales and Auctions",
  "Revenue, Splits, and Royalties",
  "Randomness",
  "Metadata, Scripts, and Dependencies",
  "Freezing, Preservation, and Artwork Finality",
  "Governance, Pausing, and Successors",
  "Current Implementation and Readiness",
  "Community Review",
] as const;

describe("6529 Stream public review definition", () => {
  it("pins the active review version and exact source commit", () => {
    expect(STREAM_REVIEW_VERSION).toBe("2026-07-28.2");
    expect(STREAM_REVIEW_HIDDEN_DRAFT_VERSION).toBe("2026-07-28.1");
    expect(STREAM_REVIEW_PREVIOUS_VERSION).toBe("2026-07-27.1");
    expect(STREAM_REVIEW_INITIAL_VERSION).toBe("2026-07-26.1");
    expect(STREAM_REVIEW_SOURCE_COMMIT).toBe(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
    expect(STREAM_REVIEW_DEFINITION.versions[0]?.source.commit).toBe(
      STREAM_REVIEW_SOURCE_COMMIT
    );
    expect(STREAM_REVIEW_DEFINITION.versions[0]?.version).toBe(
      STREAM_REVIEW_VERSION
    );
    expect(STREAM_REVIEW_DEFINITION.versions[0]?.pages).toBe(
      STREAM_REVIEW_PAGES
    );
    expect(STREAM_REVIEW_DEFINITION.versions[0]?.status).toBe(
      STREAM_REVIEW_DEFINITION.status
    );
    expect(STREAM_REVIEW_DEFINITION.versions[0]?.deploymentStatus).toBe(
      STREAM_REVIEW_DEFINITION.deploymentStatus
    );
    expect(STREAM_REVIEW_DEFINITION.versions[0]?.auditStatus).toBe(
      STREAM_REVIEW_DEFINITION.auditStatus
    );
  });

  it("retains the hidden draft and both superseded public snapshots", () => {
    const hiddenDraft = STREAM_REVIEW_DEFINITION.versions.find(
      (version) => version.version === STREAM_REVIEW_HIDDEN_DRAFT_VERSION
    );
    const previous = STREAM_REVIEW_DEFINITION.versions.find(
      (version) => version.version === STREAM_REVIEW_PREVIOUS_VERSION
    );
    const initial = STREAM_REVIEW_DEFINITION.versions.find(
      (version) => version.version === STREAM_REVIEW_INITIAL_VERSION
    );

    expect(hiddenDraft).toMatchObject({
      version: "2026-07-28.1",
      status: "DRAFT",
      deploymentStatus: "NOT_DEPLOYED",
      auditStatus: "PRE_AUDIT",
      source: {
        commit: STREAM_REVIEW_SOURCE_COMMIT,
      },
    });
    expect(
      getPublicReviewLifecycleCapabilities(hiddenDraft!.status)
        .publicRoutesAvailable
    ).toBe(false);
    expect(previous).toMatchObject({
      version: "2026-07-27.1",
      status: "REVIEW_CLOSED",
      deploymentStatus: "NOT_DEPLOYED",
      auditStatus: "PRE_AUDIT",
      source: {
        commit: STREAM_REVIEW_SOURCE_COMMIT,
      },
    });
    expect(previous?.pages).toHaveLength(14);
    expect(initial).toMatchObject({
      version: "2026-07-26.1",
      status: "REVIEW_CLOSED",
      deploymentStatus: "NOT_DEPLOYED",
      auditStatus: "PRE_AUDIT",
      source: {
        commit: STREAM_REVIEW_SOURCE_COMMIT,
      },
    });
    expect(initial?.pages).toHaveLength(14);
    expect(
      initial?.pages.map((page) => t(DEFAULT_LOCALE, page.titleKey))
    ).toContain("Security, Testing, and Known Limitations");
  });

  it("keeps the previous editorial snapshot byte-for-byte immutable", () => {
    const editorialRoot = path.join(
      process.cwd(),
      "content",
      "public-reviews",
      "6529-stream",
      "versions",
      STREAM_REVIEW_PREVIOUS_VERSION,
      "editorial"
    );
    const fileIdentities = fs
      .readdirSync(editorialRoot)
      .sort()
      .map((name) => ({
        name,
        sha256: createHash("sha256")
          .update(fs.readFileSync(path.join(editorialRoot, name)))
          .digest("hex"),
      }));
    const directoryIdentity = createHash("sha256")
      .update(JSON.stringify(fileIdentities))
      .digest("hex");

    expect(fileIdentities).toHaveLength(15);
    expect(directoryIdentity).toBe(
      "4720cd5a980ba33b890c055a864c521165f3ab91864f6cffe003cb4cd30bb0be"
    );
  });

  it("opens feedback only on the new active writing revision", () => {
    const active = STREAM_REVIEW_DEFINITION.versions.find(
      (version) => version.version === STREAM_REVIEW_VERSION
    );
    const previous = STREAM_REVIEW_DEFINITION.versions.find(
      (version) => version.version === STREAM_REVIEW_PREVIOUS_VERSION
    );

    expect(active?.status).toBe("PUBLIC_REVIEW");
    expect(previous?.status).toBe("REVIEW_CLOSED");
    expect(
      getPublicReviewLifecycleCapabilities(active!.status)
        .feedbackSubmissionsOpen
    ).toBe(true);
    expect(
      getPublicReviewLifecycleCapabilities(previous!.status)
        .feedbackSubmissionsOpen
    ).toBe(false);
  });

  it("keeps active and immutable feedback ledgers version-addressable", () => {
    expect(getStreamReviewFeedbackHref()).toBe("/reviews/6529-stream/feedback");
    expect(getStreamReviewFeedbackHref(STREAM_REVIEW_VERSION)).toBe(
      `/reviews/6529-stream/versions/${STREAM_REVIEW_VERSION}/feedback`
    );
  });

  it("defines fourteen stable, unique editorial pages in order", () => {
    expect(STREAM_REVIEW_PAGES).toHaveLength(14);
    expect(
      STREAM_REVIEW_PAGES.map((page) => t(DEFAULT_LOCALE, page.titleKey))
    ).toEqual(EXPECTED_PAGE_TITLES);
    expect(new Set(STREAM_REVIEW_PAGES.map((page) => page.id)).size).toBe(14);
    expect(new Set(STREAM_REVIEW_PAGES.map((page) => page.slug)).size).toBe(14);
    expect(
      new Set(STREAM_REVIEW_PAGES.map((page) => page.editorialFile)).size
    ).toBe(14);

    for (const page of STREAM_REVIEW_PAGES) {
      const pageStates = new Set(page.evidenceStates);
      expect(page.evidenceStates).toEqual(
        PUBLIC_REVIEW_EVIDENCE_STATES.filter((state) => pageStates.has(state))
      );
    }
    for (const [audience, pageId] of Object.entries(
      STREAM_REVIEW_DEFINITION.versions[0]!.audienceEntryPageIds
    )) {
      const entryPage = STREAM_REVIEW_PAGES.find((page) => page.id === pageId);
      expect(entryPage?.audiences).toContain(audience);
    }
  });

  it("contains no feedback transport identifiers in shared review data", () => {
    const serialized = JSON.stringify(STREAM_REVIEW_DEFINITION);
    expect(serialized).not.toMatch(
      /wave[_-]?id|subwave|discussion[_-]?id|destination[_-]?id/i
    );
    expect(STREAM_REVIEW_DEFINITION.feedbackAvailable).toBe(true);
  });

  it("does not understate evidence labels used by an editorial page", () => {
    const editorialRoot = path.join(
      process.cwd(),
      "content",
      "public-reviews",
      "6529-stream",
      "versions",
      STREAM_REVIEW_VERSION,
      "editorial"
    );

    const understatedPages = STREAM_REVIEW_PAGES.flatMap((page) => {
      const markdown = fs.readFileSync(
        path.join(editorialRoot, page.editorialFile),
        "utf8"
      );
      const omittedStates = extractPublicReviewEvidenceStates(markdown).filter(
        (state) => !page.evidenceStates.includes(state)
      );

      return omittedStates.length === 0
        ? []
        : [{ page: page.id, omittedStates }];
    });

    expect(understatedPages).toEqual([]);
  });
});
