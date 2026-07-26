import type { PublicReviewFeedbackRecord } from "@/services/api/public-review/types";

function protectSpreadsheetCell(value: string): string {
  return /^[\t\n\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function toCsvCell(value: string | number | undefined): string {
  const normalized = protectSpreadsheetCell(String(value ?? ""));
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function createPublicReviewLedgerCsv(
  records: readonly PublicReviewFeedbackRecord[]
): string {
  const rows = [
    [
      "feedback_id",
      "review_version",
      "type",
      "severity",
      "page_id",
      "section_id",
      "author",
      "created_at",
      "contract",
      "declaration",
      "source_path",
      "line_start",
      "line_end",
      "source_sha256",
      "snippet_sha256",
      "discussion_path",
      "body",
    ],
    ...records.map((record) => {
      const reference =
        record.reference?.kind === "code" ? record.reference : undefined;
      return [
        record.feedbackId,
        record.reviewVersion,
        record.category,
        record.severity,
        record.pageId,
        record.sectionId,
        record.author.handle ?? record.author.id,
        new Date(record.createdAt).toISOString(),
        reference?.contract,
        reference?.declaration,
        reference?.path,
        reference?.lineStart,
        reference?.lineEnd,
        reference?.sourceSha256,
        reference?.snippetSha256,
        record.discussionPath,
        record.body,
      ];
    }),
  ];
  return rows.map((row) => row.map(toCsvCell).join(",")).join("\r\n");
}

export function createPublicReviewLedgerMarkdown(
  records: readonly PublicReviewFeedbackRecord[],
  title: string
): string {
  const sections = records.map((record) => {
    const reference =
      record.reference?.kind === "code" ? record.reference : undefined;
    const lines = [
      `## ${record.feedbackId}`,
      "",
      `- Review version: \`${record.reviewVersion}\``,
      `- Type: \`${record.category}\``,
      `- Suspected severity: \`${record.severity}\``,
      `- Page: \`${record.pageId}\``,
      ...(record.sectionId ? [`- Section: \`${record.sectionId}\``] : []),
      `- Author: ${record.author.handle ?? record.author.id}`,
      `- Submitted: ${new Date(record.createdAt).toISOString()}`,
      `- Discussion: ${record.discussionPath}`,
      ...(reference
        ? [
            `- Source: \`${reference.path}:${reference.lineStart}-${reference.lineEnd}\``,
            `- Source checksum: \`${reference.sourceSha256}\``,
            ...(reference.snippetSha256
              ? [`- Snippet checksum: \`${reference.snippetSha256}\``]
              : []),
          ]
        : []),
      "",
      ...record.body.split("\n").map((line) => `> ${line}`),
    ];
    return lines.join("\n");
  });
  return [`# ${title}`, "", ...sections].join("\n\n");
}
