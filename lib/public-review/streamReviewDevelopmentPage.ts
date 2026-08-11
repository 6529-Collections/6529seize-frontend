import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { getCurrentDevelopmentRemainingMarkdown } from "@/lib/public-review/streamReviewDevelopmentRemainingPage";

const DEVELOPMENT_EDITORIAL_OPENING =
  /^(# [^\n]+\n\n)[\s\S]*?(?=^## Working in the rehearsal)/m;
const DEVELOPMENT_WORKING_SECTION =
  /^## Working in the rehearsal\n\n[\s\S]*?(?=^## Connected for integration)/m;
const DEVELOPMENT_CONNECTED_SECTION =
  /^## Connected for integration\n\n[\s\S]*?(?=^## Source-implemented systems)/m;
const DEVELOPMENT_CODE_SECTION =
  /^## Source-implemented systems\n\n[\s\S]*?(?=^## Planned for release)/m;
const DEVELOPMENT_PLAN_SECTION =
  /^## Planned for release\n\n[\s\S]*?(?=^## Under discussion)/m;
const DEVELOPMENT_OPEN_SECTION =
  /^## Under discussion\n\n[\s\S]*?(?=^## Test evidence)/m;
const DEVELOPMENT_REMAINING_SECTIONS = /^## Test evidence[\s\S]*$/m;
const DEVELOPMENT_CODE_EXISTS_LABEL: MessageKey =
  "publicReview.development.editorial.code.existsLabel";
const DEVELOPMENT_CODE_MISSING_LABEL: MessageKey =
  "publicReview.development.editorial.code.missingLabel";
const DEVELOPMENT_OPEN_PROPOSAL_LABEL: MessageKey =
  "publicReview.development.editorial.open.proposalLabel";
const DEVELOPMENT_OPEN_MISSING_LABEL: MessageKey =
  "publicReview.development.editorial.open.missingLabel";

const DEVELOPMENT_PROGRESS_ROWS = [
  {
    sourceHeading: "Working in the rehearsal",
    label: "publicReview.development.editorial.progress.working.label",
    meaning: "publicReview.development.editorial.progress.working.meaning",
  },
  {
    sourceHeading: "Connected for integration",
    label: "publicReview.development.editorial.progress.connected.label",
    meaning: "publicReview.development.editorial.progress.connected.meaning",
  },
  {
    sourceHeading: "Source-implemented systems",
    label: "publicReview.development.editorial.progress.code.label",
    meaning: "publicReview.development.editorial.progress.code.meaning",
  },
  {
    sourceHeading: "Planned for release",
    label: "publicReview.development.editorial.progress.plan.label",
    meaning: "publicReview.development.editorial.progress.plan.meaning",
  },
  {
    sourceHeading: "Under discussion",
    label: "publicReview.development.editorial.progress.open.label",
    meaning: "publicReview.development.editorial.progress.open.meaning",
  },
] as const;

const DEVELOPMENT_PROOF_ROWS = [
  {
    label: "publicReview.development.editorial.proof.code.label",
    meaning: "publicReview.development.editorial.proof.code.meaning",
    limit: "publicReview.development.editorial.proof.code.limit",
  },
  {
    label: "publicReview.development.editorial.proof.tests.label",
    meaning: "publicReview.development.editorial.proof.tests.meaning",
    limit: "publicReview.development.editorial.proof.tests.limit",
  },
  {
    label: "publicReview.development.editorial.proof.setup.label",
    meaning: "publicReview.development.editorial.proof.setup.meaning",
    limit: "publicReview.development.editorial.proof.setup.limit",
  },
  {
    label: "publicReview.development.editorial.proof.services.label",
    meaning: "publicReview.development.editorial.proof.services.meaning",
    limit: "publicReview.development.editorial.proof.services.limit",
  },
  {
    label: "publicReview.development.editorial.proof.audit.label",
    meaning: "publicReview.development.editorial.proof.audit.meaning",
    limit: "publicReview.development.editorial.proof.audit.limit",
  },
] as const;

type DevelopmentSource = {
  readonly commit: string;
  readonly repository: string;
  readonly tree: string;
};

function getDevelopmentOpening({
  progressRows,
  proofRows,
  source,
  sourceUrl,
}: {
  readonly progressRows: string;
  readonly proofRows: string;
  readonly source: DevelopmentSource;
  readonly sourceUrl: string;
}): string {
  return [
    `## ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.scopeHeading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.scopeSummary"),
    "",
    `## ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.progress.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.progress.intro"),
    "",
    `- ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.progress.built"
    )}`,
    `- ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.progress.proof"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.progress.caveat"),
    "",
    `| ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.progress.labelHeading"
    )} | ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.progress.meaningHeading"
    )} |`,
    "| --- | --- |",
    progressRows,
    "",
    `## ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.proof.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.proof.intro"),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.proof.adrBoundary"),
    "",
    `| ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.proof.proofHeading"
    )} | ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.proof.meaningHeading"
    )} | ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.proof.limitHeading"
    )} |`,
    "| --- | --- | --- |",
    proofRows,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.proof.current"),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.proof.remaining"),
    "",
    `## ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.technicalHeading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.technicalSummary"),
    "",
    `- ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.commitLabel"
    )}: [\`${source.commit}\`](${sourceUrl})`,
    `- ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.treeLabel"
    )}: \`${source.tree}\``,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.updateRequired"),
  ].join("\n");
}

function getDevelopmentWorkingSection(rehearsalSourceUrl: string): string {
  return [
    `## ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.working.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.working.intro"),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.working.identity.heading"
    )}`,
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.working.identity.summary"
    ),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.working.sales.heading"
    )}`,
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.working.sales.summary"
    ),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.working.payments.heading"
    )}`,
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.working.payments.summary"
    ),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.working.safety.heading"
    )}`,
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.working.safety.summary"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.working.boundary"),
    "",
    `[${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.working.setupLink"
    )}](${rehearsalSourceUrl}).`,
  ].join("\n");
}

function getDevelopmentConnectedSection(): string {
  return [
    `## ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.connected.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.connected.intro"),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.connected.minting.heading"
    )}`,
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.connected.minting.summary"
    ),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.connected.minting.missing"
    ),
    "",
    `[${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.connected.minting.link"
    )}](./tokens-collections-and-minting#the-two-source-mint-lanes).`,
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.connected.payments.heading"
    )}`,
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.connected.payments.summary"
    ),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.connected.payments.missing"
    ),
    "",
    `[${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.connected.payments.link"
    )}](./revenue-splits-and-royalties).`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.connected.boundary"),
  ].join("\n");
}

function getDevelopmentCodeSection(): string {
  return [
    `## ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.intro"),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.governance.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_CODE_EXISTS_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.governance.exists"
    ),
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_CODE_MISSING_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.governance.missing"
    ),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.artwork.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_CODE_EXISTS_LABEL),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.artwork.exists"),
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_CODE_MISSING_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.artwork.missing"
    ),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.minting.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_CODE_EXISTS_LABEL),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.minting.exists"),
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_CODE_MISSING_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.minting.missing"
    ),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.randomness.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_CODE_EXISTS_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.randomness.exists"
    ),
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_CODE_MISSING_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.randomness.missing"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.boundary"),
  ].join("\n");
}

function getDevelopmentPlanSection(): string {
  return [
    `## ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.intro"),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.revenue.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.plannedLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.revenue.planned"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.whyLabel"),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.revenue.why"),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.missingLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.revenue.missing"
    ),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.metadata.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.plannedLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.metadata.planned"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.whyLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.metadata.reason"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.missingLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.metadata.missing"
    ),
    "",
    `[${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.metadata.link"
    )}](./metadata-scripts-and-dependencies#refresh-events-tell-consumers-that-state-changed).`,
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.roles.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.plannedLabel"),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.roles.planned"),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.whyLabel"),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.roles.reason"),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.missingLabel"),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.roles.missing"),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.boundary"),
  ].join("\n");
}

function getDevelopmentOpenSection(): string {
  return [
    `## ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.intro"),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.artist.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_OPEN_PROPOSAL_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.artist.proposal"
    ),
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_OPEN_MISSING_LABEL),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.artist.missing"),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.payments.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_OPEN_PROPOSAL_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.payments.proposal"
    ),
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_OPEN_MISSING_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.payments.missing"
    ),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.records.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_OPEN_PROPOSAL_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.records.proposal"
    ),
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_OPEN_MISSING_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.records.missing"
    ),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.randomness.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_OPEN_PROPOSAL_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.randomness.proposal"
    ),
    "",
    t(DEFAULT_LOCALE, DEVELOPMENT_OPEN_MISSING_LABEL),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.randomness.missing"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.boundary"),
  ].join("\n");
}

export function getCurrentDevelopmentEditorialMarkdown({
  editorialMarkdown,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly source: DevelopmentSource;
}): string {
  const sourceUrl = `https://github.com/${source.repository}/tree/${source.commit}`;
  const rehearsalSourceUrl = `https://github.com/${source.repository}/blob/${source.commit}/script/RehearseDeployment.s.sol#L169-L270`;
  const progressRows = DEVELOPMENT_PROGRESS_ROWS.map(
    ({ label, meaning }) =>
      `| **${t(DEFAULT_LOCALE, label)}** | ${t(DEFAULT_LOCALE, meaning)} |`
  ).join("\n");
  const proofRows = DEVELOPMENT_PROOF_ROWS.map(
    ({ label, limit, meaning }) =>
      `| **${t(DEFAULT_LOCALE, label)}** | ${t(DEFAULT_LOCALE, meaning)} | ${t(
        DEFAULT_LOCALE,
        limit
      )} |`
  ).join("\n");
  const markdownWithPlainOpening = editorialMarkdown.replace(
    DEVELOPMENT_EDITORIAL_OPENING,
    (_match, title: string) =>
      `${title}${getDevelopmentOpening({
        progressRows,
        proofRows,
        source,
        sourceUrl,
      })}\n\n`
  );
  const markdownWithPlainWorkingSection = markdownWithPlainOpening.replace(
    DEVELOPMENT_WORKING_SECTION,
    `${getDevelopmentWorkingSection(rehearsalSourceUrl)}\n\n`
  );
  const markdownWithPlainConnectedSection =
    markdownWithPlainWorkingSection.replace(
      DEVELOPMENT_CONNECTED_SECTION,
      `${getDevelopmentConnectedSection()}\n\n`
    );
  const markdownWithPlainCodeSection =
    markdownWithPlainConnectedSection.replace(
      DEVELOPMENT_CODE_SECTION,
      `${getDevelopmentCodeSection()}\n\n`
    );
  const markdownWithPlainPlanSection = markdownWithPlainCodeSection.replace(
    DEVELOPMENT_PLAN_SECTION,
    `${getDevelopmentPlanSection()}\n\n`
  );
  const markdownWithPlainOpenSection = markdownWithPlainPlanSection.replace(
    DEVELOPMENT_OPEN_SECTION,
    `${getDevelopmentOpenSection()}\n\n`
  );
  const markdownWithPlainRemainingSections =
    markdownWithPlainOpenSection.replace(
      DEVELOPMENT_REMAINING_SECTIONS,
      getCurrentDevelopmentRemainingMarkdown()
    );

  return DEVELOPMENT_PROGRESS_ROWS.reduce(
    (markdown, { label, sourceHeading }) =>
      markdown.replace(`## ${sourceHeading}`, `## ${t(DEFAULT_LOCALE, label)}`),
    markdownWithPlainRemainingSections
  );
}
