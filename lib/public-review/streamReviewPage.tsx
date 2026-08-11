import "next/dist/compiled/server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicReviewEditorialFeedback } from "@/components/public-review/PublicReviewEditorialFeedback";
import { PublicReviewShell } from "@/components/public-review/PublicReviewShell";
import { StreamReviewBotAuthorshipNote } from "@/components/public-review/StreamReviewBotAuthorshipNote";
import {
  StreamReviewDevelopmentStatus,
  StreamReviewReviewerPrompts,
} from "@/components/public-review/StreamReviewDevelopmentStatus";
import { StreamReviewForArtistsDetails } from "@/components/public-review/StreamReviewForArtistsDetails";
import { StreamReviewForArtistsGuide } from "@/components/public-review/StreamReviewForArtistsGuide";
import { StreamReviewOverviewGuide } from "@/components/public-review/StreamReviewOverviewGuide";
import {
  STREAM_REVIEW_ROLES_GUIDE_SECTIONS,
  StreamReviewRolesGuide,
} from "@/components/public-review/StreamReviewRolesGuide";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  loadStreamEditorialContent,
  PublicReviewEditorialContentError,
} from "@/lib/public-review/editorialContent";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import { getCurrentCommunityReviewEditorialMarkdown } from "@/lib/public-review/streamReviewCommunityPage";
import {
  createStreamEditorialFeedbackPageContext,
  createStreamReviewFeedbackConfig,
  resolveStreamReviewFeedbackDestination,
} from "@/lib/public-review/streamReviewFeedback.server";
import {
  resolveStreamReviewRoute,
  type StreamReviewRouteModel,
  type StreamReviewRouteParams,
} from "@/lib/public-review/streamReviewRoutes";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";
import { getStreamSolidityReferenceReader } from "@/lib/public-review/streamSolidityReference";

const ARTWORK_LIFECYCLE_OLD_INTRO = `A Stream artwork moves through a sequence of deliberate commitments. Collection
identity comes first. Artwork materials, distribution, payment, randomness, and
metadata are then assembled around it. Supply and Core configuration can later
be closed, preservation evidence can accumulate, and a final ceremony can make
the remaining artwork state terminal.

That sequence is a major part of the design. “Minted,” “sold,” “frozen,”
“preserved,” and “final” describe different facts. Keeping them separate makes
each commitment visible and reviewable.

This page follows one collection through the lifecycle and explains what each
stage protects.`;
const ARTWORK_LIFECYCLE_IDENTITY_SECTION =
  /## 1\. The collection receives a permanent identity[\s\S]*?(?=## 2\.)/;
const ARTWORK_LIFECYCLE_PACKAGE_SECTION =
  /## 2\. The artwork package is assembled[\s\S]*?(?=## 3\.)/;
const ARTWORK_LIFECYCLE_ARTIST_APPROVAL_SECTION =
  /## 3\. The artist can approve a specific state[\s\S]*?(?=## 4\.)/;
const ARTWORK_LIFECYCLE_DISTRIBUTION_SECTION =
  /## 4\. A distribution policy is selected[\s\S]*?(?=## 5\.|$)/;
const ARTWORK_LIFECYCLE_CURATION_SECTION =
  /## 5\. Curation becomes a bound authorization[\s\S]*?(?=## 6\.|$)/;
const ARTWORK_LIFECYCLE_MINT_EXECUTION_SECTION =
  /## 6\. The selected mint lane executes atomically[\s\S]*?(?=## 7\.|$)/;
const ARTWORK_LIFECYCLE_TOKEN_IDENTITY_SECTION =
  /## 7\. The token receives a permanent identity[\s\S]*?(?=## 8\.|$)/;
const ARTWORK_LIFECYCLE_REMAINING_SECTIONS =
  /## 8\. Randomness enters a recorded lifecycle[\s\S]*$/;
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

function getCurrentDevelopmentEditorialMarkdown({
  editorialMarkdown,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly source: {
    readonly commit: string;
    readonly repository: string;
    readonly tree: string;
  };
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
  const plainOpening = [
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

  const markdownWithPlainOpening = editorialMarkdown.replace(
    DEVELOPMENT_EDITORIAL_OPENING,
    (_match, title: string) => `${title}${plainOpening}\n\n`
  );
  const plainWorkingSection = [
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
  const markdownWithPlainWorkingSection = markdownWithPlainOpening.replace(
    DEVELOPMENT_WORKING_SECTION,
    `${plainWorkingSection}\n\n`
  );
  const plainConnectedSection = [
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
  const markdownWithPlainConnectedSection =
    markdownWithPlainWorkingSection.replace(
      DEVELOPMENT_CONNECTED_SECTION,
      `${plainConnectedSection}\n\n`
    );
  const plainCodeSection = [
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
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.existsLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.governance.exists"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.missingLabel"),
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
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.existsLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.artwork.exists"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.missingLabel"),
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
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.existsLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.minting.exists"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.missingLabel"),
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
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.existsLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.randomness.exists"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.missingLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.code.randomness.missing"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.code.boundary"),
  ].join("\n");
  const markdownWithPlainCodeSection = markdownWithPlainConnectedSection.replace(
    DEVELOPMENT_CODE_SECTION,
    `${plainCodeSection}\n\n`
  );
  const plainPlanSection = [
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
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.revenue.why"
    ),
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
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.roles.planned"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.whyLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.roles.reason"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.missingLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.plan.roles.missing"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.plan.boundary"),
  ].join("\n");
  const markdownWithPlainPlanSection = markdownWithPlainCodeSection.replace(
    DEVELOPMENT_PLAN_SECTION,
    `${plainPlanSection}\n\n`
  );
  const plainOpenSection = [
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
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.proposalLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.artist.proposal"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.missingLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.artist.missing"
    ),
    "",
    `### ${t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.payments.heading"
    )}`,
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.proposalLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.payments.proposal"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.missingLabel"),
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
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.proposalLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.records.proposal"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.missingLabel"),
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
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.proposalLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.randomness.proposal"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.missingLabel"),
    "",
    t(
      DEFAULT_LOCALE,
      "publicReview.development.editorial.open.randomness.missing"
    ),
    "",
    t(DEFAULT_LOCALE, "publicReview.development.editorial.open.boundary"),
  ].join("\n");
  const markdownWithPlainOpenSection = markdownWithPlainPlanSection.replace(
    DEVELOPMENT_OPEN_SECTION,
    `${plainOpenSection}\n\n`
  );
  const copy = (key: MessageKey) => t(DEFAULT_LOCALE, key);
  const bullets = (keys: readonly MessageKey[]) =>
    keys.map((key) => `- ${copy(key)}`);
  const questions = (keys: readonly MessageKey[]) =>
    keys.map((key, index) => `${index + 1}. ${copy(key)}`);
  const plainRemainingSections = [
    `## ${copy("publicReview.development.editorial.remaining.tests.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.tests.intro"),
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.tests.unit",
      "publicReview.development.editorial.remaining.tests.fuzz",
      "publicReview.development.editorial.remaining.tests.composition",
      "publicReview.development.editorial.remaining.tests.focused",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.tests.provesHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.tests.proves"),
    "",
    `### ${copy("publicReview.development.editorial.remaining.tests.limitsHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.tests.limits"),
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.tests.limit.assertions",
      "publicReview.development.editorial.remaining.tests.limit.specification",
      "publicReview.development.editorial.remaining.tests.limit.deployment",
      "publicReview.development.editorial.remaining.tests.limit.external",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.tests.gapsHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.tests.mintGap"),
    "",
    copy("publicReview.development.editorial.remaining.tests.revenueGap"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.static.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.static.definition"),
    "",
    copy("publicReview.development.editorial.remaining.static.count"),
    "",
    copy("publicReview.development.editorial.remaining.static.caveat"),
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.static.fix",
      "publicReview.development.editorial.remaining.static.falsePositive",
      "publicReview.development.editorial.remaining.static.acceptedRisk",
      "publicReview.development.editorial.remaining.static.remove",
    ]),
    "",
    copy("publicReview.development.editorial.remaining.static.register"),
    "",
    `[${copy("publicReview.development.editorial.remaining.static.link")}](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/ops/SLITHER_BASELINE.json).`,
    "",
    `## ${copy("publicReview.development.editorial.remaining.limitations.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.limitations.intro"),
    "",
    `### ${copy("publicReview.development.editorial.remaining.limitations.minting.heading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.limitations.minting.finalSupply",
      "publicReview.development.editorial.remaining.limitations.minting.paths",
      "publicReview.development.editorial.remaining.limitations.minting.nullifiers",
      "publicReview.development.editorial.remaining.limitations.minting.replay",
      "publicReview.development.editorial.remaining.limitations.minting.identity",
    ]),
    "",
    `[${copy("publicReview.development.editorial.remaining.limitations.minting.link")}](./tokens-collections-and-minting).`,
    "",
    `### ${copy("publicReview.development.editorial.remaining.limitations.payments.heading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.limitations.payments.paths",
      "publicReview.development.editorial.remaining.limitations.payments.asset",
      "publicReview.development.editorial.remaining.limitations.payments.auction",
    ]),
    "",
    `[${copy("publicReview.development.editorial.remaining.limitations.payments.link")}](./revenue-splits-and-royalties).`,
    "",
    `### ${copy("publicReview.development.editorial.remaining.limitations.governance.heading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.limitations.governance.records",
      "publicReview.development.editorial.remaining.limitations.governance.value",
      "publicReview.development.editorial.remaining.limitations.governance.binding",
      "publicReview.development.editorial.remaining.limitations.governance.size",
    ]),
    "",
    `[${copy("publicReview.development.editorial.remaining.limitations.governance.link")}](./governance-pausing-and-successors).`,
    "",
    `### ${copy("publicReview.development.editorial.remaining.limitations.randomness.heading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.limitations.randomness.stale",
      "publicReview.development.editorial.remaining.limitations.randomness.retry",
      "publicReview.development.editorial.remaining.limitations.randomness.target",
      "publicReview.development.editorial.remaining.limitations.randomness.live",
    ]),
    "",
    `[${copy("publicReview.development.editorial.remaining.limitations.randomness.link")}](./randomness).`,
    "",
    `### ${copy("publicReview.development.editorial.remaining.limitations.artwork.heading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.limitations.artwork.refresh",
      "publicReview.development.editorial.remaining.limitations.artwork.size",
      "publicReview.development.editorial.remaining.limitations.artwork.finality",
      "publicReview.development.editorial.remaining.limitations.artwork.availability",
    ]),
    "",
    `[${copy("publicReview.development.editorial.remaining.limitations.artwork.link")}](./freezing-preservation-and-artwork-finality).`,
    "",
    `## ${copy("publicReview.development.editorial.remaining.standard.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.standard.identity"),
    "",
    copy("publicReview.development.editorial.remaining.standard.evidence"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.bytecode.heading")}`,
    "",
    `### ${copy("publicReview.development.editorial.remaining.bytecode.coreHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.bytecode.core"),
    "",
    copy("publicReview.development.editorial.remaining.bytecode.risk"),
    "",
    `### ${copy("publicReview.development.editorial.remaining.bytecode.futureHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.bytecode.future"),
    "",
    copy("publicReview.development.editorial.remaining.bytecode.notBuilt"),
    "",
    `[${copy("publicReview.development.editorial.remaining.bytecode.link")}](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/release-artifacts/latest/bytecode-release-proof.json).`,
    "",
    `## ${copy("publicReview.development.editorial.remaining.candidate.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.candidate.intro"),
    "",
    `### ${copy("publicReview.development.editorial.remaining.candidate.codeHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.candidate.code.hashes",
      "publicReview.development.editorial.remaining.candidate.code.deployment",
      "publicReview.development.editorial.remaining.candidate.code.graph",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.candidate.authorityHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.candidate.authority.roles",
      "publicReview.development.editorial.remaining.candidate.authority.records",
      "publicReview.development.editorial.remaining.candidate.authority.governance",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.candidate.externalHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.candidate.external.randomness",
      "publicReview.development.editorial.remaining.candidate.external.money",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.candidate.deploymentHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.candidate.deployment.sealing",
      "publicReview.development.editorial.remaining.candidate.deployment.readback",
    ]),
    "",
    copy("publicReview.development.editorial.remaining.candidate.independent"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.external.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.external.intro"),
    "",
    `### ${copy("publicReview.development.editorial.remaining.external.chainHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.external.chain.testnet",
      "publicReview.development.editorial.remaining.external.chain.wallets",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.external.servicesHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.external.services.randomness",
      "publicReview.development.editorial.remaining.external.services.marketplaces",
      "publicReview.development.editorial.remaining.external.services.rpc",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.external.operationsHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.external.operations.preservation",
      "publicReview.development.editorial.remaining.external.operations.auctions",
      "publicReview.development.editorial.remaining.external.operations.continuity",
    ]),
    "",
    copy("publicReview.development.editorial.remaining.external.coverage"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.audit.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.audit.status"),
    "",
    copy("publicReview.development.editorial.remaining.audit.scope"),
    "",
    copy("publicReview.development.editorial.remaining.audit.record"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.blockers.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.blockers.intro"),
    "",
    `### ${copy("publicReview.development.editorial.remaining.blockers.codeHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.blockers.code.findings",
      "publicReview.development.editorial.remaining.blockers.code.finalSupply",
      "publicReview.development.editorial.remaining.blockers.code.governance",
      "publicReview.development.editorial.remaining.blockers.code.bytecode",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.blockers.pathHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.blockers.path.minting",
      "publicReview.development.editorial.remaining.blockers.path.accounting",
      "publicReview.development.editorial.remaining.blockers.path.royalties",
      "publicReview.development.editorial.remaining.blockers.path.adapter",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.blockers.setupHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.blockers.setup.randomness",
      "publicReview.development.editorial.remaining.blockers.setup.finality",
      "publicReview.development.editorial.remaining.blockers.setup.deployment",
      "publicReview.development.editorial.remaining.blockers.setup.preservation",
      "publicReview.development.editorial.remaining.blockers.setup.feedback",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.blockers.reviewHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.blockers.review.audit",
      "publicReview.development.editorial.remaining.blockers.review.version",
    ]),
    "",
    copy("publicReview.development.editorial.remaining.blockers.outro"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.threats.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.threats.intro"),
    "",
    `### ${copy("publicReview.development.editorial.remaining.threats.attackersHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.threats.attackers.people",
      "publicReview.development.editorial.remaining.threats.attackers.chain",
      "publicReview.development.editorial.remaining.threats.attackers.signatures",
      "publicReview.development.editorial.remaining.threats.attackers.money",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.threats.systemsHeading")}`,
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.threats.systems.accounts",
      "publicReview.development.editorial.remaining.threats.systems.services",
      "publicReview.development.editorial.remaining.threats.systems.metadata",
      "publicReview.development.editorial.remaining.threats.systems.config",
    ]),
    "",
    `### ${copy("publicReview.development.editorial.remaining.threats.mistakesHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.threats.mistakes"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.priorities.heading")}`,
    "",
    `### ${copy("publicReview.development.editorial.remaining.priorities.moneyHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.priorities.moneyIntro"),
    "",
    ...bullets([
      "publicReview.development.editorial.remaining.priorities.money.received",
      "publicReview.development.editorial.remaining.priorities.money.promise",
      "publicReview.development.editorial.remaining.priorities.money.dust",
      "publicReview.development.editorial.remaining.priorities.money.progress",
      "publicReview.development.editorial.remaining.priorities.money.emergency",
      "publicReview.development.editorial.remaining.priorities.money.successor",
      "publicReview.development.editorial.remaining.priorities.money.wallets",
    ]),
    "",
    copy("publicReview.development.editorial.remaining.priorities.moneyTests"),
    "",
    `### ${copy("publicReview.development.editorial.remaining.priorities.signaturesHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.priorities.signaturesBinding"),
    "",
    copy("publicReview.development.editorial.remaining.priorities.signaturesCompare"),
    "",
    `### ${copy("publicReview.development.editorial.remaining.priorities.artworkHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.priorities.artworkTest"),
    "",
    copy("publicReview.development.editorial.remaining.priorities.artworkReason"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.findings.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.findings.policy"),
    "",
    `[${copy("publicReview.development.editorial.remaining.findings.guide")}](./community-review#public-conduct-and-sensitive-information).`,
    "",
    copy("publicReview.development.editorial.remaining.findings.response"),
    "",
    `### ${copy("publicReview.development.editorial.remaining.findings.destinationHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.findings.staging"),
    "",
    copy("publicReview.development.editorial.remaining.findings.production"),
    "",
    copy("publicReview.development.editorial.remaining.findings.activation"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.questions.heading")}`,
    "",
    ...questions([
      "publicReview.development.editorial.remaining.questions.progress",
      "publicReview.development.editorial.remaining.questions.threat",
      "publicReview.development.editorial.remaining.questions.static",
      "publicReview.development.editorial.remaining.questions.bytecode",
      "publicReview.development.editorial.remaining.questions.governance",
      "publicReview.development.editorial.remaining.questions.services",
      "publicReview.development.editorial.remaining.questions.proof",
      "publicReview.development.editorial.remaining.questions.features",
    ]),
  ].join("\n");
  const markdownWithPlainRemainingSections =
    markdownWithPlainOpenSection.replace(
      DEVELOPMENT_REMAINING_SECTIONS,
      plainRemainingSections
    );

  return DEVELOPMENT_PROGRESS_ROWS.reduce(
    (markdown, { label, sourceHeading }) =>
      markdown.replace(
        `## ${sourceHeading}`,
        `## ${t(DEFAULT_LOCALE, label)}`
      ),
    markdownWithPlainRemainingSections
  );
}

function getStreamReviewMetadata({
  baseEndpoint,
  params,
}: {
  readonly baseEndpoint: string;
  readonly params: StreamReviewRouteParams;
}): Metadata | undefined {
  const route = resolveStreamReviewRoute({ baseEndpoint, params });
  if (!route) {
    return undefined;
  }

  return {
    ...getAppMetadata({
      title: t(DEFAULT_LOCALE, "publicReview.metadata.title", {
        page: t(DEFAULT_LOCALE, route.page.titleKey),
      }),
      description: t(DEFAULT_LOCALE, "publicReview.metadata.description"),
    }),
    alternates: {
      canonical: new URL(route.canonicalPath, baseEndpoint).toString(),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function loadAvailableStreamEditorialContent({
  contentVersion,
  route,
}: {
  readonly contentVersion: string;
  readonly route: StreamReviewRouteModel;
}): Promise<string | undefined> {
  try {
    return await loadStreamEditorialContent(route.page, contentVersion);
  } catch (error) {
    if (error instanceof PublicReviewEditorialContentError) {
      return undefined;
    }
    throw error;
  }
}

async function renderStreamReviewRoute(route: StreamReviewRouteModel) {
  const contentVersion =
    route.version ?? STREAM_REVIEW_DEFINITION.activeVersion;
  const reviewVersion = getStreamReviewVersion(contentVersion);
  if (!reviewVersion) {
    throw new Error("The resolved Stream review version is unavailable.");
  }
  const [editorialMarkdown, { manifest }, feedbackDestination] =
    await Promise.all([
      loadAvailableStreamEditorialContent({ contentVersion, route }),
      getStreamSolidityReferenceReader().loadManifest(contentVersion),
      resolveStreamReviewFeedbackDestination(route.baseEndpoint),
    ]);
  if (editorialMarkdown === undefined) {
    notFound();
  }
  const feedbackConfig = await createStreamReviewFeedbackConfig({ manifest });
  const isCurrentOverview =
    route.page.id === "overview" && route.version === undefined;
  const isCurrentArtworkLifecycle =
    route.page.id === "artwork-lifecycle" && route.version === undefined;
  const isCurrentForArtists =
    route.page.id === "for-artists" && route.version === undefined;
  const isCurrentRoles =
    route.page.id === "roles-and-trust" && route.version === undefined;
  const isCurrentDevelopmentStatus =
    route.page.id === "security-testing-and-known-limitations" &&
    route.version === undefined;
  const isCurrentCommunityReview =
    route.page.id === "community-review" && route.version === undefined;
  let displayedEditorialMarkdown = editorialMarkdown;
  if (isCurrentArtworkLifecycle) {
    displayedEditorialMarkdown = displayedEditorialMarkdown.replace(
      ARTWORK_LIFECYCLE_OLD_INTRO,
      t(DEFAULT_LOCALE, "publicReview.pages.artworkLifecycle.currentIntro")
    );
    displayedEditorialMarkdown = displayedEditorialMarkdown.replace(
      ARTWORK_LIFECYCLE_IDENTITY_SECTION,
      `${t(
        DEFAULT_LOCALE,
        "publicReview.pages.artworkLifecycle.currentIdentitySection"
      )}\n\n`
    );
    displayedEditorialMarkdown = displayedEditorialMarkdown.replace(
      ARTWORK_LIFECYCLE_PACKAGE_SECTION,
      `${t(
        DEFAULT_LOCALE,
        "publicReview.pages.artworkLifecycle.currentArtworkPackageSection"
      )}\n\n`
    );
    displayedEditorialMarkdown = displayedEditorialMarkdown.replace(
      ARTWORK_LIFECYCLE_ARTIST_APPROVAL_SECTION,
      `${t(
        DEFAULT_LOCALE,
        "publicReview.pages.artworkLifecycle.currentArtistApprovalSection"
      )}\n\n`
    );
    displayedEditorialMarkdown = displayedEditorialMarkdown.replace(
      ARTWORK_LIFECYCLE_DISTRIBUTION_SECTION,
      `${t(
        DEFAULT_LOCALE,
        "publicReview.pages.artworkLifecycle.currentDistributionSection"
      )}\n\n`
    );
    displayedEditorialMarkdown = displayedEditorialMarkdown.replace(
      ARTWORK_LIFECYCLE_CURATION_SECTION,
      `${t(
        DEFAULT_LOCALE,
        "publicReview.pages.artworkLifecycle.currentCurationSection"
      )}\n\n`
    );
    displayedEditorialMarkdown = displayedEditorialMarkdown.replace(
      ARTWORK_LIFECYCLE_MINT_EXECUTION_SECTION,
      `${t(
        DEFAULT_LOCALE,
        "publicReview.pages.artworkLifecycle.currentMintExecutionSection"
      )}\n\n`
    );
    displayedEditorialMarkdown = displayedEditorialMarkdown.replace(
      ARTWORK_LIFECYCLE_TOKEN_IDENTITY_SECTION,
      `${t(
        DEFAULT_LOCALE,
        "publicReview.pages.artworkLifecycle.currentTokenIdentitySection"
      )}\n\n`
    );
    displayedEditorialMarkdown = displayedEditorialMarkdown.replace(
      ARTWORK_LIFECYCLE_REMAINING_SECTIONS,
      t(
        DEFAULT_LOCALE,
        "publicReview.pages.artworkLifecycle.currentRemainingSections"
      )
    );
  }
  if (isCurrentDevelopmentStatus) {
    displayedEditorialMarkdown = getCurrentDevelopmentEditorialMarkdown({
      editorialMarkdown: displayedEditorialMarkdown,
      source: manifest.source,
    });
  } else if (isCurrentCommunityReview) {
    displayedEditorialMarkdown = getCurrentCommunityReviewEditorialMarkdown({
      reviewVersion: contentVersion,
      source: manifest.source,
    });
  }
  const displayedPage: typeof route.page = isCurrentArtworkLifecycle
    ? {
        ...route.page,
        summaryKey: "publicReview.pages.artworkLifecycle.currentSummary",
      }
    : route.page;
  const sections = extractPublicReviewSections(displayedEditorialMarkdown);
  let displayedSections: readonly (typeof sections)[number][] = sections;
  if (isCurrentOverview) {
    displayedSections = [];
  } else if (isCurrentRoles) {
    displayedSections = STREAM_REVIEW_ROLES_GUIDE_SECTIONS;
  }
  const displayedFeedbackConfig =
    isCurrentDevelopmentStatus || isCurrentCommunityReview
      ? {
          ...feedbackConfig,
          pages: feedbackConfig.pages.map((configuredPage) =>
            configuredPage.value === route.page.id
              ? {
                  ...configuredPage,
                  sectionValues: displayedSections.map((section) => section.id),
                }
              : configuredPage
          ),
        }
      : feedbackConfig;

  return (
    <PublicReviewShell
      editorialMarkdown={displayedEditorialMarkdown}
      page={displayedPage}
      review={STREAM_REVIEW_DEFINITION}
      reviewVersion={reviewVersion}
      sections={displayedSections}
      routeVersion={route.version}
      displayedVersion={contentVersion}
      introNotice={
        <>
          {isCurrentOverview ? (
            <StreamReviewOverviewGuide pages={reviewVersion.pages} />
          ) : null}
          {isCurrentDevelopmentStatus ? (
            <StreamReviewDevelopmentStatus />
          ) : null}
          {isCurrentForArtists ? (
            <>
              <StreamReviewForArtistsGuide pages={reviewVersion.pages} />
              <StreamReviewForArtistsDetails />
            </>
          ) : null}
          {isCurrentRoles ? (
            <StreamReviewRolesGuide pages={reviewVersion.pages} />
          ) : null}
          {route.version !== undefined || isCurrentCommunityReview ? (
            <StreamReviewBotAuthorshipNote />
          ) : null}
        </>
      }
      outroNotice={
        isCurrentCommunityReview ? (
          <StreamReviewReviewerPrompts pages={reviewVersion.pages} />
        ) : null
      }
      showAudiencePaths={!isCurrentOverview}
      showEditorialContent={
        !isCurrentOverview && !isCurrentForArtists && !isCurrentRoles
      }
      source={{
        repository: manifest.source.repository,
        commit: manifest.source.commit,
      }}
      feedbackSlot={
        <PublicReviewEditorialFeedback
          config={displayedFeedbackConfig}
          destination={feedbackDestination}
          page={createStreamEditorialFeedbackPageContext({
            page: route.page,
            version: contentVersion,
          })}
          sections={displayedSections}
        />
      }
    />
  );
}

type StreamReviewRoutePageProps = {
  readonly params: Promise<StreamReviewRouteParams>;
};

export async function generateStreamReviewRouteMetadata({
  params,
}: StreamReviewRoutePageProps): Promise<Metadata> {
  const metadata = getStreamReviewMetadata({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: await params,
  });
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export async function renderStreamReviewRoutePage({
  params,
}: StreamReviewRoutePageProps) {
  const route = resolveStreamReviewRoute({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: await params,
  });
  if (!route) {
    notFound();
  }
  return renderStreamReviewRoute(route);
}
