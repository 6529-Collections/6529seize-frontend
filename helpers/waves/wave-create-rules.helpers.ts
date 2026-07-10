import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { getCreateWaveEndDate } from "@/helpers/waves/create-wave.helpers";
import { normalizeWaveCustomRules } from "@/helpers/waves/wave-metadata.helpers";
import {
  WAVE_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CreateWaveConfig } from "@/types/waves.types";
import {
  CREDIT_SCOPE_LABELS,
  formatDuration,
  formatFiniteNumber,
  formatPeriod,
  getApprovalThresholdLabel,
  getCardSetLabel,
  getChatStatusRow,
  getCreateChatAccessRow,
  getCreateGroupLabel,
  getCreditProfileLabel,
  getDecisionRows,
  getOutcomeCountLabel,
  getRequiredMediaLabel,
  getRequiredMetadataLabel,
  getSubmissionStrategyRows,
  getTermsLabel,
  type WaveRuleRow,
  type WaveRuleSection,
  type WaveRules,
} from "./wave-rules.shared";

interface CreateRulesContext {
  readonly config: CreateWaveConfig;
  readonly groupsCache: Readonly<Record<string, ApiGroupFull>> | undefined;
  readonly endDate: number | null;
  readonly creditLabel: string;
  readonly isChatWave: boolean;
}

const getOptionalRulesText = (value: string): string | null =>
  value.length > 0 ? value : null;

const getCreateOverviewSection = ({
  config,
}: CreateRulesContext): WaveRuleSection => ({
  id: "overview",
  title: "Wave",
  rows: [
    {
      id: "wave-type",
      label: "Type",
      value: WAVE_LABELS[config.overview.type],
    },
  ],
});

const getCreateDropAndVoteRows = ({
  config,
  groupsCache,
  isChatWave,
}: CreateRulesContext): WaveRuleRow[] => {
  if (isChatWave) {
    return [];
  }

  return [
    {
      id: "can-drop",
      label: "Who can drop",
      value: getCreateGroupLabel({
        groupId: config.groups.canDrop,
        groupsCache,
        fallback: "Anyone",
      }),
    },
    {
      id: "can-vote",
      label: "Who can vote",
      value: getCreateGroupLabel({
        groupId: config.groups.canVote,
        groupsCache,
        fallback: "Anyone",
      }),
    },
  ];
};

const getCreateChatRows = ({
  config,
  groupsCache,
  isChatWave,
}: CreateRulesContext): WaveRuleRow[] => {
  const chatAccessRow = getCreateChatAccessRow({
    groupId: config.groups.canChat,
    groupsCache,
  });

  if (isChatWave) {
    return [chatAccessRow];
  }

  return [getChatStatusRow({ enabled: config.chat.enabled }), chatAccessRow];
};

const getCreateAccessSection = (
  context: CreateRulesContext
): WaveRuleSection => {
  const { config, groupsCache } = context;

  return {
    id: "access",
    title: "Access",
    rows: [
      {
        id: "can-view",
        label: "Who can view",
        value: getCreateGroupLabel({
          groupId: config.groups.canView,
          groupsCache,
          fallback: "Anyone",
        }),
      },
      ...getCreateDropAndVoteRows(context),
      ...getCreateChatRows(context),
      {
        id: "admin",
        label: "Who can admin",
        value: getCreateGroupLabel({
          groupId: config.groups.admin,
          groupsCache,
          fallback: "Only me",
        }),
      },
    ],
  };
};

const getCreateTimingSection = ({
  config,
  endDate,
}: CreateRulesContext): WaveRuleSection => ({
  id: "timing",
  title: "Timing",
  rows: [
    {
      id: "submission-window",
      label: "Submission window",
      value: formatPeriod({
        min: config.dates.submissionStartDate,
        max: endDate,
      }),
    },
    {
      id: "voting-window",
      label: "Voting window",
      value: formatPeriod({
        min: config.dates.votingStartDate,
        max: endDate,
      }),
    },
    ...getRankScheduleRows(config),
  ],
});

const getRankScheduleRows = (config: CreateWaveConfig): WaveRuleRow[] => {
  if (config.overview.type !== ApiWaveType.Rank) {
    return [];
  }

  if (config.dates.ongoingRanking) {
    return [
      {
        id: "ongoing-ranking",
        label: t(
          DEFAULT_LOCALE,
          "waves.rules.schedule.winnerAnnouncements.label"
        ),
        value: t(
          DEFAULT_LOCALE,
          "waves.rules.schedule.winnerAnnouncements.none"
        ),
      },
    ];
  }

  return getDecisionRows({
    first_decision_time: config.dates.firstDecisionTime,
    subsequent_decisions: config.dates.subsequentDecisions,
    is_rolling: config.dates.isRolling,
  });
};

const getCreateSubmissionsSection = ({
  config,
}: CreateRulesContext): WaveRuleSection => ({
  id: "submissions",
  title: "Submissions",
  rows: [
    ...getSubmissionStrategyRows(config.drops.submissionStrategy),
    {
      id: "required-media",
      label: "Required media",
      value: getRequiredMediaLabel(config.drops.requiredTypes),
    },
    {
      id: "required-metadata",
      label: "Required metadata",
      value: getRequiredMetadataLabel(config.drops.requiredMetadata),
    },
    {
      id: "max-submissions",
      label: "Max simultaneous submissions",
      value:
        formatFiniteNumber(
          config.drops.noOfApplicationsAllowedPerParticipant
        ) ?? "Unlimited",
    },
    {
      id: "terms",
      label: "Terms/signature",
      value: getTermsLabel({
        signatureRequired: config.drops.signatureRequired,
        terms: config.drops.terms,
      }),
    },
    {
      id: "admin-delete",
      label: "Admin can delete drops",
      value: config.drops.adminCanDeleteDrops ? "Enabled" : "Disabled",
    },
  ],
});

const getCreateVotingSection = ({
  config,
  creditLabel,
}: CreateRulesContext): WaveRuleSection => ({
  id: "voting",
  title: "Voting",
  rows: [
    {
      id: "credit-type",
      label: "Credit type",
      value: creditLabel,
    },
    {
      id: "credit-scope",
      label: "Credit scope",
      value: CREDIT_SCOPE_LABELS[config.voting.creditScope],
    },
    {
      id: "credit-category",
      label: "Credit category",
      value: config.voting.category ?? "All categories",
    },
    {
      id: "credit-profile",
      label: "Credit profile",
      value: getCreditProfileLabel({
        profileId: config.voting.profileId,
        profileHandle: null,
      }),
    },
    {
      id: "card-set",
      label: "Card set",
      value:
        config.voting.type === ApiWaveCreditType.CardSetTdh
          ? getCardSetLabel(config.voting.creditNfts)
          : "Not used",
    },
    {
      id: "negative-voting",
      label: "Negative voting",
      value: config.voting.allowNegativeVotes ? "Allowed" : "Blocked",
    },
    {
      id: "max-votes",
      label: "Max votes per identity per drop",
      value:
        formatFiniteNumber(config.voting.maxVotesPerIdentityPerDrop) ??
        "Unlimited",
    },
    {
      id: "time-weighted",
      label: "Time weighted voting",
      value: config.voting.timeWeighted.enabled
        ? `${config.voting.timeWeighted.averagingInterval} ${config.voting.timeWeighted.averagingIntervalUnit}`
        : "Off",
    },
  ],
});

const getCreateOutcomesSection = ({
  config,
}: CreateRulesContext): WaveRuleSection => ({
  id: "outcomes",
  title: "Outcomes",
  rows: [
    {
      id: "outcomes-visible",
      label: "Outcomes visibility",
      value: config.display.outcomesVisible ? "Shown" : "Hidden",
    },
    {
      id: "outcomes-count",
      label: "Configured outcomes",
      value: getOutcomeCountLabel(config.outcomes.length),
    },
  ],
});

const getCreateApprovalSection = ({
  config,
  creditLabel,
  endDate,
}: CreateRulesContext): WaveRuleSection => ({
  id: "approval",
  title: "Approval",
  rows: [
    {
      id: "approval-threshold",
      label: "Approval threshold",
      value: getApprovalThresholdLabel({
        approvalThreshold: formatFiniteNumber(config.approval.threshold),
        creditLabel,
      }),
    },
    {
      id: "approval-hold",
      label: "Hold time",
      value: formatDuration(config.approval.thresholdTimeMs) ?? "Immediate",
    },
    {
      id: "approval-max",
      label: "Max approved drops",
      value: formatFiniteNumber(config.approval.maxWinners) ?? "Unlimited",
    },
    {
      id: "approval-window",
      label: "Approval window",
      value: formatPeriod({
        min: config.dates.votingStartDate,
        max: endDate,
      }),
    },
  ],
});

const getCreateAutomaticSections = (
  context: CreateRulesContext
): WaveRuleSection[] => {
  const sections = [
    getCreateOverviewSection(context),
    getCreateAccessSection(context),
  ];

  if (context.isChatWave) {
    return sections;
  }

  sections.push(
    getCreateTimingSection(context),
    getCreateSubmissionsSection(context),
    getCreateVotingSection(context)
  );

  if (context.config.overview.type === ApiWaveType.Approve) {
    sections.push(getCreateApprovalSection(context));
  }

  sections.push(getCreateOutcomesSection(context));
  return sections;
};

export const getCreateRules = ({
  config,
  groupsCache,
}: {
  readonly config: CreateWaveConfig;
  readonly groupsCache: Readonly<Record<string, ApiGroupFull>> | undefined;
}): WaveRules => {
  const isChatWave = config.overview.type === ApiWaveType.Chat;
  const bindingRules = normalizeWaveCustomRules(config.drops.terms);
  const displayRules = normalizeWaveCustomRules(config.display.customRules);
  const context: CreateRulesContext = {
    config,
    groupsCache,
    endDate: getCreateWaveEndDate({ config }),
    creditLabel:
      WAVE_VOTING_LABELS[config.voting.type ?? ApiWaveCreditType.TdhPlusXtdh],
    isChatWave,
  };

  return {
    automatic: getCreateAutomaticSections(context),
    custom: {
      binding: isChatWave ? null : getOptionalRulesText(bindingRules),
      display: getOptionalRulesText(displayRules),
      signatureRequired: isChatWave ? false : config.drops.signatureRequired,
    },
  };
};
