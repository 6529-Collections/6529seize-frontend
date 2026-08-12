import "next/dist/compiled/server-only";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type MessageParams = Record<string, string | number>;

function copy(key: MessageKey, params: MessageParams = {}): string {
  return t(DEFAULT_LOCALE, key, params);
}

function bullets(keys: readonly MessageKey[]): string[] {
  return keys.map((key) => `- ${copy(key)}`);
}

function steps(keys: readonly MessageKey[]): string[] {
  return keys.map((key, index) => `${index + 1}. ${copy(key)}`);
}

function getListSection({
  headingKey,
  introKey,
  list,
  paragraphKeys = [],
}: {
  readonly headingKey: MessageKey;
  readonly introKey: MessageKey;
  readonly list: readonly string[];
  readonly paragraphKeys?: readonly MessageKey[] | undefined;
}): string[] {
  return [
    `## ${copy(headingKey)}`,
    "",
    copy(introKey),
    "",
    ...list,
    ...paragraphKeys.flatMap((key) => ["", copy(key)]),
    "",
  ];
}

function getParagraphSection(
  headingKey: MessageKey,
  paragraphKeys: readonly MessageKey[]
): string[] {
  return [
    `## ${copy(headingKey)}`,
    "",
    ...paragraphKeys.flatMap((key, index) =>
      index === 0 ? [copy(key)] : ["", copy(key)]
    ),
  ];
}

function getParticipationSections(): string[] {
  return [
    `## ${copy("publicReview.community.editorial.people.heading")}`,
    "",
    copy("publicReview.community.editorial.people.intro"),
    "",
    ...bullets([
      "publicReview.community.editorial.people.artists",
      "publicReview.community.editorial.people.collectors",
      "publicReview.community.editorial.people.engineers",
      "publicReview.community.editorial.people.product",
      "publicReview.community.editorial.people.community",
    ]),
    "",
    copy("publicReview.community.editorial.people.outro"),
    "",
    `## ${copy("publicReview.community.editorial.scope.heading")}`,
    "",
    copy("publicReview.community.editorial.scope.intro"),
    "",
    ...bullets([
      "publicReview.community.editorial.scope.artist",
      "publicReview.community.editorial.scope.sales",
      "publicReview.community.editorial.scope.services",
      "publicReview.community.editorial.scope.artwork",
      "publicReview.community.editorial.scope.governance",
      "publicReview.community.editorial.scope.evidence",
    ]),
    "",
    copy("publicReview.community.editorial.scope.question"),
    "",
    `## ${copy("publicReview.community.editorial.safety.heading")}`,
    "",
    copy("publicReview.community.editorial.safety.policy"),
    "",
    copy("publicReview.community.editorial.safety.neverShare"),
    "",
    ...bullets([
      "publicReview.community.editorial.safety.credentials",
      "publicReview.community.editorial.safety.personal",
      "publicReview.community.editorial.safety.unrelated",
      "publicReview.community.editorial.safety.attack",
    ]),
    "",
    copy("publicReview.community.editorial.safety.otherProtocol"),
    "",
    ...getListSection({
      headingKey: "publicReview.community.editorial.submit.heading",
      introKey: "publicReview.community.editorial.submit.intro",
      list: steps([
        "publicReview.community.editorial.submit.page",
        "publicReview.community.editorial.submit.section",
        "publicReview.community.editorial.submit.classify",
        "publicReview.community.editorial.submit.explain",
        "publicReview.community.editorial.submit.send",
      ]),
      paragraphKeys: [
        "publicReview.community.editorial.submit.crossModule",
        "publicReview.community.editorial.submit.short",
      ],
    }),
    ...getListSection({
      headingKey: "publicReview.community.editorial.type.heading",
      introKey: "publicReview.community.editorial.type.intro",
      list: bullets([
        "publicReview.community.editorial.type.question",
        "publicReview.community.editorial.type.documentation",
        "publicReview.community.editorial.type.artist",
        "publicReview.community.editorial.type.product",
        "publicReview.community.editorial.type.protocol",
        "publicReview.community.editorial.type.bug",
        "publicReview.community.editorial.type.security",
        "publicReview.community.editorial.type.testing",
        "publicReview.community.editorial.type.accessibility",
      ]),
      paragraphKeys: ["publicReview.community.editorial.type.outro"],
    }),
    ...getListSection({
      headingKey: "publicReview.community.editorial.impact.heading",
      introKey: "publicReview.community.editorial.impact.intro",
      list: bullets([
        "publicReview.community.editorial.impact.critical",
        "publicReview.community.editorial.impact.high",
        "publicReview.community.editorial.impact.medium",
        "publicReview.community.editorial.impact.low",
        "publicReview.community.editorial.impact.informational",
        "publicReview.community.editorial.impact.unknown",
      ]),
      paragraphKeys: ["publicReview.community.editorial.impact.outro"],
    }),
  ];
}

function getReportingSections(): string[] {
  return [
    ...getListSection({
      headingKey: "publicReview.community.editorial.report.heading",
      introKey: "publicReview.community.editorial.report.intro",
      list: steps([
        "publicReview.community.editorial.report.expected",
        "publicReview.community.editorial.report.observed",
        "publicReview.community.editorial.report.affected",
        "publicReview.community.editorial.report.preconditions",
        "publicReview.community.editorial.report.consequence",
        "publicReview.community.editorial.report.reproduction",
        "publicReview.community.editorial.report.fix",
      ]),
      paragraphKeys: [
        "publicReview.community.editorial.report.product",
        "publicReview.community.editorial.report.artist",
      ],
    }),
    ...getListSection({
      headingKey: "publicReview.community.editorial.technical.heading",
      introKey: "publicReview.community.editorial.technical.intro",
      list: bullets([
        "publicReview.community.editorial.technical.reference",
        "publicReview.community.editorial.technical.commit",
        "publicReview.community.editorial.technical.order",
        "publicReview.community.editorial.technical.state",
        "publicReview.community.editorial.technical.test",
      ]),
      paragraphKeys: ["publicReview.community.editorial.technical.paths"],
    }),
    ...getParagraphSection("publicReview.community.editorial.after.heading", [
      "publicReview.community.editorial.after.new",
      "publicReview.community.editorial.after.replies",
      "publicReview.community.editorial.after.currentLimit",
      "publicReview.community.editorial.after.future",
    ]),
  ];
}

function getRecordSections(): string[] {
  return [
    "",
    `## ${copy("publicReview.community.editorial.record.heading")}`,
    "",
    copy("publicReview.community.editorial.record.intro"),
    "",
    ...bullets([
      "publicReview.community.editorial.record.schema",
      "publicReview.community.editorial.record.type",
      "publicReview.community.editorial.record.severity",
      "publicReview.community.editorial.record.context",
    ]),
    "",
    copy("publicReview.community.editorial.record.contextDetail"),
    "",
    copy("publicReview.community.editorial.record.visible"),
    "",
    copy("publicReview.community.editorial.record.limit"),
    "",
    copy("publicReview.community.editorial.record.filters"),
    "",
    `## ${copy("publicReview.community.editorial.versions.heading")}`,
    "",
    copy("publicReview.community.editorial.versions.new"),
    "",
    copy("publicReview.community.editorial.versions.old"),
    "",
    copy("publicReview.community.editorial.versions.manual"),
    "",
    copy("publicReview.community.editorial.versions.carry"),
    "",
    `## ${copy("publicReview.community.editorial.audit.heading")}`,
    "",
    copy("publicReview.community.editorial.audit.intro"),
    "",
    `### ${copy("publicReview.community.editorial.audit.currentHeading")}`,
    "",
    ...bullets([
      "publicReview.community.editorial.audit.inventory",
      "publicReview.community.editorial.audit.reports",
      "publicReview.community.editorial.audit.filters",
      "publicReview.community.editorial.audit.export",
    ]),
    "",
    copy("publicReview.community.editorial.audit.limit"),
    "",
    `### ${copy("publicReview.community.editorial.audit.closeoutHeading")}`,
    "",
    ...bullets([
      "publicReview.community.editorial.audit.candidate",
      "publicReview.community.editorial.audit.versions",
      "publicReview.community.editorial.audit.risks",
      "publicReview.community.editorial.audit.fixes",
      "publicReview.community.editorial.audit.auditReport",
      "publicReview.community.editorial.audit.blockers",
      "publicReview.community.editorial.audit.archive",
    ]),
    "",
    copy("publicReview.community.editorial.audit.outro"),
  ];
}

export function getCurrentCommunityReviewEditorialMarkdown({
  reviewVersion,
  source,
}: {
  readonly reviewVersion: string;
  readonly source: {
    readonly commit: string;
    readonly repository: string;
  };
}): string {
  const sourceLink = `[\`${source.commit}\`](https://github.com/${source.repository}/tree/${source.commit})`;

  return [
    `# ${copy("publicReview.community.editorial.heading")}`,
    "",
    copy("publicReview.community.editorial.intro.purpose"),
    "",
    copy("publicReview.community.editorial.intro.noCode"),
    "",
    copy("publicReview.community.editorial.intro.source", {
      reviewVersion,
      sourceLink,
    }),
    "",
    ...getParticipationSections(),
    ...getReportingSections(),
    ...getRecordSections(),
  ].join("\n");
}
