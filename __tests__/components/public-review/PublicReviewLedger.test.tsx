import {
  createPublicReviewLedgerCsv,
  createPublicReviewLedgerMarkdown,
} from "@/lib/public-review/publicReviewLedgerExport";
import type { PublicReviewFeedbackRecord } from "@/services/api/public-review/types";

const record: PublicReviewFeedbackRecord = {
  feedbackId: "=auditor-formula",
  dropId: "drop-1",
  serialNo: 1,
  destination: {
    environment: "staging",
    logicalKey: "stream-review",
    waveId: "22222222-2222-4222-8222-222222222222",
  },
  reviewId: "6529-stream",
  reviewVersion: "2026-07-26.1",
  category: "possible-exploitable-security-vulnerability",
  severity: "critical",
  pageId: "reference-function",
  reference: {
    kind: "code",
    repository: "https://github.com/6529-Collections/6529Stream",
    commit: "0123456789abcdef0123456789abcdef01234567",
    path: "src/StreamCore.sol",
    sourceSha256: "a".repeat(64),
    snippetSha256: "b".repeat(64),
    lineStart: 10,
    lineEnd: 12,
    contract: "StreamCore",
    declaration: "withdraw(uint256)",
  },
  author: {
    id: "reviewer-1",
    handle: "@reviewer",
    pfp: null,
  },
  createdAt: Date.UTC(2026, 6, 26),
  body: "The exact invariant can fail.",
  reactionsCount: 3,
  disposition: "NEW",
  discussionPath: "/waves/stream-review?serialNo=1",
};

describe("PublicReviewLedger auditor exports", () => {
  it("exports exact source provenance and neutralizes spreadsheet formulas", () => {
    const csv = createPublicReviewLedgerCsv([
      { ...record, body: ' \t=HYPERLINK("https://example.invalid")' },
    ]);

    expect(csv).toContain(`"'=auditor-formula"`);
    expect(csv).toContain('"wave_drop_id"');
    expect(csv).toContain('"drop-1"');
    expect(csv).toContain(`"'@reviewer"`);
    expect(csv).toContain('"src/StreamCore.sol"');
    expect(csv).toContain('"10","12"');
    expect(csv).toContain(`"${"b".repeat(64)}"`);
    expect(csv).toContain(`"' \t=HYPERLINK`);
  });

  it("exports a readable Markdown evidence packet", () => {
    const markdown = createPublicReviewLedgerMarkdown(
      [record],
      "Stream feedback"
    );

    expect(markdown).toContain("# Stream feedback");
    expect(markdown).toContain("## Wave drop drop-1");
    expect(markdown).toContain("- Submission ID: `=auditor-formula`");
    expect(markdown).toContain("Source: `src/StreamCore.sol:10-12`");
    expect(markdown).toContain(`Snippet checksum: \`${"b".repeat(64)}\``);
    expect(markdown).toContain("> The exact invariant can fail.");
  });
});
