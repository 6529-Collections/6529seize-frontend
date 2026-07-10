import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  getWaveCustomRulesFromMetadata,
  getWaveOutcomeVisibilityFromMetadata,
  normalizeWaveCustomRules,
} from "@/helpers/waves/wave-metadata.helpers";
import {
  WAVE_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CREDIT_SCOPE_LABELS,
  formatDuration,
  formatFiniteNumber,
  getApprovalThresholdLabel,
  getCardSetLabel,
  getChatStatusRow,
  getChatWaveSection,
  getCreditProfileLabel,
  getDecisionRows,
  getRequiredMediaLabel,
  getRequiredMetadataLabel,
  getScopeLabel,
  getSubmissionStrategyRows,
  getTermsLabel,
  getWaveChatAccessRow,
  getWavePeriod,
  type WaveRuleRow,
  type WaveRuleSection,
  type WaveRules,
} from "./wave-rules.shared";

interface WaveRulesContext {
  readonly wave: ApiWave;
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly creditLabel: string;
  readonly isChatWave: boolean;
}

const getOptionalRulesText = (value: string): string | null =>
  value.length > 0 ? value : null;

const getWaveCreditLabel = (
  creditType: ApiWaveCreditType | null | undefined
): string => WAVE_VOTING_LABELS[creditType ?? ApiWaveCreditType.TdhPlusXtdh];

const getWaveOverviewSection = ({
  wave,
}: WaveRulesContext): WaveRuleSection => ({
  id: "overview",
  title: "Wave",
  rows: [
    {
      id: "wave-type",
      label: "Type",
      // A rank wave with no decision strategy never announces winners: it is
      // a perpetual (ongoing) leaderboard.
      value:
        wave.wave.type === ApiWaveType.Rank && !wave.wave.decisions_strategy
          ? t(DEFAULT_LOCALE, "waves.rules.schedule.perpetualRankType")
          : WAVE_LABELS[wave.wave.type],
    },
  ],
});

const getWaveDropAndVoteRows = ({
  isChatWave,
  wave,
}: WaveRulesContext): WaveRuleRow[] => {
  if (isChatWave) {
    return [];
  }

  return [
    {
      id: "can-drop",
      label: "Who can drop",
      value: getScopeLabel({
        scope: wave.participation.scope,
        fallback: "Anyone",
      }),
    },
    {
      id: "can-vote",
      label: "Who can vote",
      value: getScopeLabel({
        scope: wave.voting.scope,
        fallback: "Anyone",
      }),
    },
  ];
};

const getWaveChatRows = ({
  isChatWave,
  wave,
}: WaveRulesContext): WaveRuleRow[] => {
  const chatAccessRow = getWaveChatAccessRow({ scope: wave.chat.scope });

  if (isChatWave) {
    return [chatAccessRow];
  }

  return [getChatStatusRow({ enabled: wave.chat.enabled }), chatAccessRow];
};

const getWaveAccessSection = (context: WaveRulesContext): WaveRuleSection => ({
  id: "access",
  title: "Access",
  rows: [
    {
      id: "can-view",
      label: "Who can view",
      value: getScopeLabel({
        scope: context.wave.visibility.scope,
        fallback: "Anyone",
      }),
    },
    ...getWaveDropAndVoteRows(context),
    ...getWaveChatRows(context),
    {
      id: "admin",
      label: "Who can admin",
      value: getScopeLabel({
        scope: context.wave.wave.admin_group,
        fallback: "Creator/admin group",
      }),
    },
  ],
});

const getWaveTimingSection = ({ wave }: WaveRulesContext): WaveRuleSection => ({
  id: "timing",
  title: "Timing",
  rows: [
    {
      id: "submission-window",
      label: "Submission window",
      value: getWavePeriod(wave.participation.period),
    },
    {
      id: "voting-window",
      label: "Voting window",
      value: getWavePeriod(wave.voting.period),
    },
    ...getDecisionRows(wave.wave.decisions_strategy),
  ],
});

const getWaveSubmissionsSection = ({
  wave,
}: WaveRulesContext): WaveRuleSection => ({
  id: "submissions",
  title: "Submissions",
  rows: [
    ...getSubmissionStrategyRows(wave.participation.submission_strategy),
    {
      id: "required-media",
      label: "Required media",
      value: getRequiredMediaLabel(wave.participation.required_media),
    },
    {
      id: "required-metadata",
      label: "Required metadata",
      value: getRequiredMetadataLabel(wave.participation.required_metadata),
    },
    {
      id: "max-submissions",
      label: "Max simultaneous submissions",
      value:
        formatFiniteNumber(
          wave.participation.no_of_applications_allowed_per_participant
        ) ?? "Unlimited",
    },
    {
      id: "terms",
      label: "Terms/signature",
      value: getTermsLabel({
        signatureRequired: wave.participation.signature_required,
        terms: wave.participation.terms,
      }),
    },
    {
      id: "admin-delete",
      label: "Admin can delete drops",
      value: wave.wave.admin_drop_deletion_enabled ? "Enabled" : "Disabled",
    },
  ],
});

const getWaveVotingSection = ({
  creditLabel,
  wave,
}: WaveRulesContext): WaveRuleSection => ({
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
      value: CREDIT_SCOPE_LABELS[wave.voting.credit_scope],
    },
    {
      id: "credit-category",
      label: "Credit category",
      value: wave.voting.credit_category ?? "All categories",
    },
    {
      id: "credit-profile",
      label: "Credit profile",
      value: getCreditProfileLabel({
        profileId: wave.voting.creditor?.id,
        profileHandle: wave.voting.creditor?.handle,
      }),
    },
    {
      id: "card-set",
      label: "Card set",
      value:
        wave.voting.credit_type === ApiWaveCreditType.CardSetTdh
          ? getCardSetLabel(wave.voting.credit_nfts)
          : "Not used",
    },
    {
      id: "negative-voting",
      label: "Negative voting",
      value: wave.voting.forbid_negative_votes ? "Blocked" : "Allowed",
    },
    {
      id: "max-votes",
      label: "Max votes per identity per drop",
      value:
        formatFiniteNumber(wave.wave.max_votes_per_identity_to_drop) ??
        "Unlimited",
    },
    {
      id: "time-weighted",
      label: "Time weighted voting",
      value: formatDuration(wave.wave.time_lock_ms) ?? "Off",
    },
  ],
});

const getWaveApprovalSection = ({
  creditLabel,
  wave,
}: WaveRulesContext): WaveRuleSection => ({
  id: "approval",
  title: "Approval",
  rows: [
    {
      id: "approval-threshold",
      label: "Approval threshold",
      value: getApprovalThresholdLabel({
        approvalThreshold: formatFiniteNumber(wave.wave.winning_threshold),
        creditLabel,
      }),
    },
    {
      id: "approval-hold",
      label: "Hold time",
      value:
        formatDuration(wave.wave.winning_threshold_min_duration_ms) ??
        "Immediate",
    },
    {
      id: "approval-max",
      label: "Max approved drops",
      value: formatFiniteNumber(wave.wave.max_winners) ?? "Unlimited",
    },
    {
      id: "approval-window",
      label: "Approval window",
      value: getWavePeriod(wave.voting.period),
    },
  ],
});

const getWaveOutcomesSection = ({
  metadata,
}: WaveRulesContext): WaveRuleSection => ({
  id: "outcomes",
  title: "Outcomes",
  rows: [
    {
      id: "outcomes-visible",
      label: "Outcomes visibility",
      value: getWaveOutcomeVisibilityFromMetadata(metadata)
        ? "Shown"
        : "Hidden",
    },
  ],
});

const getWaveAutomaticSections = (
  context: WaveRulesContext
): WaveRuleSection[] => {
  const sections = [
    getWaveOverviewSection(context),
    getWaveAccessSection(context),
  ];

  if (context.isChatWave) {
    sections.push(
      getChatWaveSection({
        linksDisabled: context.wave.chat.links_disabled,
        slowModeCooldownMs: context.wave.chat.slow_mode_cooldown_ms,
      })
    );
    return sections;
  }

  sections.push(
    getWaveTimingSection(context),
    getWaveSubmissionsSection(context),
    getWaveVotingSection(context)
  );

  if (context.wave.wave.type === ApiWaveType.Approve) {
    sections.push(getWaveApprovalSection(context));
  }

  sections.push(getWaveOutcomesSection(context));
  return sections;
};

export const getWaveRules = ({
  wave,
  metadata,
}: {
  readonly wave: ApiWave;
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
}): WaveRules => {
  const isChatWave = wave.wave.type === ApiWaveType.Chat;
  const bindingRules = normalizeWaveCustomRules(wave.participation.terms);
  const context: WaveRulesContext = {
    wave,
    metadata,
    creditLabel: getWaveCreditLabel(wave.voting.credit_type),
    isChatWave,
  };

  return {
    automatic: getWaveAutomaticSections(context),
    custom: {
      binding: isChatWave ? null : getOptionalRulesText(bindingRules),
      display: getWaveCustomRulesFromMetadata(metadata),
      signatureRequired: isChatWave
        ? false
        : wave.participation.signature_required,
    },
  };
};
