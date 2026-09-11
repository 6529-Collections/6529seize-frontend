import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type DevelopmentSource = {
  readonly commit: string;
  readonly repository: string;
};

const copy = (key: MessageKey) => t(DEFAULT_LOCALE, key);
const bullets = (keys: readonly MessageKey[]) =>
  keys.map((key) => `- ${copy(key)}`);
const questions = (keys: readonly MessageKey[]) =>
  keys.map((key, index) => `${index + 1}. ${copy(key)}`);
const bulletSubsection = (
  headingKey: MessageKey,
  bulletKeys: readonly MessageKey[]
): readonly string[] => [
  `### ${copy(headingKey)}`,
  "",
  ...bullets(bulletKeys),
  "",
];

function getTestsAndLimitations(
  source: DevelopmentSource
): readonly string[] {
  const sourceRoot = `https://github.com/${source.repository}/blob/${source.commit}`;
  return [
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
    `[${copy("publicReview.development.editorial.remaining.static.link")}](${sourceRoot}/ops/SLITHER_BASELINE.json).`,
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
  ];
}

function getReleaseEvidence(source: DevelopmentSource): readonly string[] {
  const sourceRoot = `https://github.com/${source.repository}/blob/${source.commit}`;
  return [
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
    `[${copy("publicReview.development.editorial.remaining.bytecode.link")}](${sourceRoot}/release-artifacts/latest/bytecode-release-proof.json).`,
    "",
    `## ${copy("publicReview.development.editorial.remaining.candidate.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.candidate.intro"),
    "",
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.candidate.codeHeading",
      [
        "publicReview.development.editorial.remaining.candidate.code.hashes",
        "publicReview.development.editorial.remaining.candidate.code.deployment",
        "publicReview.development.editorial.remaining.candidate.code.graph",
      ]
    ),
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.candidate.authorityHeading",
      [
        "publicReview.development.editorial.remaining.candidate.authority.roles",
        "publicReview.development.editorial.remaining.candidate.authority.records",
        "publicReview.development.editorial.remaining.candidate.authority.governance",
      ]
    ),
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.candidate.externalHeading",
      [
        "publicReview.development.editorial.remaining.candidate.external.randomness",
        "publicReview.development.editorial.remaining.candidate.external.money",
      ]
    ),
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.candidate.deploymentHeading",
      [
        "publicReview.development.editorial.remaining.candidate.deployment.sealing",
        "publicReview.development.editorial.remaining.candidate.deployment.readback",
      ]
    ),
    copy("publicReview.development.editorial.remaining.candidate.independent"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.external.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.external.intro"),
    "",
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.external.chainHeading",
      [
        "publicReview.development.editorial.remaining.external.chain.testnet",
        "publicReview.development.editorial.remaining.external.chain.wallets",
      ]
    ),
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.external.servicesHeading",
      [
        "publicReview.development.editorial.remaining.external.services.randomness",
        "publicReview.development.editorial.remaining.external.services.marketplaces",
        "publicReview.development.editorial.remaining.external.services.rpc",
      ]
    ),
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.external.operationsHeading",
      [
        "publicReview.development.editorial.remaining.external.operations.preservation",
        "publicReview.development.editorial.remaining.external.operations.auctions",
        "publicReview.development.editorial.remaining.external.operations.continuity",
      ]
    ),
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
  ];
}

function getBlockersAndQuestions(): readonly string[] {
  return [
    `## ${copy("publicReview.development.editorial.remaining.blockers.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.blockers.intro"),
    "",
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.blockers.codeHeading",
      [
        "publicReview.development.editorial.remaining.blockers.code.findings",
        "publicReview.development.editorial.remaining.blockers.code.finalSupply",
        "publicReview.development.editorial.remaining.blockers.code.governance",
        "publicReview.development.editorial.remaining.blockers.code.bytecode",
      ]
    ),
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.blockers.pathHeading",
      [
        "publicReview.development.editorial.remaining.blockers.path.minting",
        "publicReview.development.editorial.remaining.blockers.path.accounting",
        "publicReview.development.editorial.remaining.blockers.path.royalties",
        "publicReview.development.editorial.remaining.blockers.path.adapter",
      ]
    ),
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.blockers.setupHeading",
      [
        "publicReview.development.editorial.remaining.blockers.setup.randomness",
        "publicReview.development.editorial.remaining.blockers.setup.finality",
        "publicReview.development.editorial.remaining.blockers.setup.deployment",
        "publicReview.development.editorial.remaining.blockers.setup.preservation",
        "publicReview.development.editorial.remaining.blockers.setup.feedback",
      ]
    ),
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.blockers.reviewHeading",
      [
        "publicReview.development.editorial.remaining.blockers.review.audit",
        "publicReview.development.editorial.remaining.blockers.review.version",
      ]
    ),
    copy("publicReview.development.editorial.remaining.blockers.outro"),
    "",
    `## ${copy("publicReview.development.editorial.remaining.threats.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.threats.intro"),
    "",
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.threats.attackersHeading",
      [
        "publicReview.development.editorial.remaining.threats.attackers.people",
        "publicReview.development.editorial.remaining.threats.attackers.chain",
        "publicReview.development.editorial.remaining.threats.attackers.signatures",
        "publicReview.development.editorial.remaining.threats.attackers.money",
      ]
    ),
    ...bulletSubsection(
      "publicReview.development.editorial.remaining.threats.systemsHeading",
      [
        "publicReview.development.editorial.remaining.threats.systems.accounts",
        "publicReview.development.editorial.remaining.threats.systems.services",
        "publicReview.development.editorial.remaining.threats.systems.metadata",
        "publicReview.development.editorial.remaining.threats.systems.config",
      ]
    ),
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
    copy(
      "publicReview.development.editorial.remaining.priorities.signaturesBinding"
    ),
    "",
    copy(
      "publicReview.development.editorial.remaining.priorities.signaturesCompare"
    ),
    "",
    `### ${copy("publicReview.development.editorial.remaining.priorities.artworkHeading")}`,
    "",
    copy("publicReview.development.editorial.remaining.priorities.artworkTest"),
    "",
    copy(
      "publicReview.development.editorial.remaining.priorities.artworkReason"
    ),
    "",
    `## ${copy("publicReview.development.editorial.remaining.findings.heading")}`,
    "",
    copy("publicReview.development.editorial.remaining.findings.policy"),
    "",
    `[${copy("publicReview.development.editorial.remaining.findings.guide")}](./community-review#before-reporting-a-security-issue).`,
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
  ];
}

export function getCurrentDevelopmentRemainingMarkdown(
  source: DevelopmentSource
): string {
  return [
    ...getTestsAndLimitations(source),
    ...getReleaseEvidence(source),
    ...getBlockersAndQuestions(),
  ].join("\n");
}
