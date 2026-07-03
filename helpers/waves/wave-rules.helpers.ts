import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiIntRange } from "@/generated/models/ApiIntRange";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import type { ApiWaveParticipationSubmissionStrategy } from "@/generated/models/ApiWaveParticipationSubmissionStrategy";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import type { ApiWaveScope } from "@/generated/models/ApiWaveScope";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { getCreateWaveEndDate } from "@/helpers/waves/create-wave.helpers";
import {
  getWaveCustomRulesFromMetadata,
  getWaveOutcomeVisibilityFromMetadata,
  normalizeWaveCustomRules,
} from "@/helpers/waves/wave-metadata.helpers";
import {
  WAVE_IDENTITY_DUPLICATES_COPY,
  WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY,
} from "@/helpers/waves/wave-submission-strategy.helpers";
import {
  WAVE_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import type { CreateWaveConfig } from "@/types/waves.types";

export interface WaveRuleRow {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly description?: string | undefined;
}

export interface WaveRuleSection {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly WaveRuleRow[];
}

export interface WaveCustomRules {
  readonly binding: string | null;
  readonly display: string | null;
  readonly signatureRequired: boolean;
}

export interface WaveRules {
  readonly automatic: readonly WaveRuleSection[];
  readonly custom: WaveCustomRules;
}

type BuildWaveRulesInput =
  | {
      readonly wave: ApiWave;
      readonly metadata?: readonly ApiWaveMetadata[] | null | undefined;
    }
  | {
      readonly config: CreateWaveConfig;
      readonly groupsCache?: Readonly<Record<string, ApiGroupFull>> | undefined;
    };

const CREDIT_SCOPE_LABELS: Record<ApiWaveCreditScope, string> = {
  [ApiWaveCreditScope.Wave]: "Whole wave",
  [ApiWaveCreditScope.Drop]: "Each drop",
};

const METADATA_TYPE_LABELS: Record<ApiWaveMetadataType, string> = {
  [ApiWaveMetadataType.String]: "Text",
  [ApiWaveMetadataType.Number]: "Number",
};

const REQUIRED_MEDIA_LABELS: Record<ApiWaveParticipationRequirement, string> = {
  [ApiWaveParticipationRequirement.Image]: "Image",
  [ApiWaveParticipationRequirement.Audio]: "Audio",
  [ApiWaveParticipationRequirement.Video]: "Video",
};

const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;

const formatFiniteNumber = (value: number | null | undefined): string | null =>
  typeof value === "number" && Number.isFinite(value)
    ? formatNumberWithCommas(value)
    : null;

const formatDateTime = (value: number | null | undefined): string | null =>
  typeof value === "number" && Number.isFinite(value)
    ? Time.millis(value).toLocaleDateTimeString()
    : null;

const formatDuration = (durationMs: number | null | undefined): string | null => {
  if (
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  ) {
    return null;
  }

  const days = Math.floor(durationMs / DAY_IN_MS);
  const hours = Math.floor((durationMs % DAY_IN_MS) / HOUR_IN_MS);
  const minutes = Math.floor((durationMs % HOUR_IN_MS) / MINUTE_IN_MS);

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(" ");
};

const formatPeriod = ({
  min,
  max,
}: {
  readonly min: number | null | undefined;
  readonly max: number | null | undefined;
}): string => {
  const minLabel = formatDateTime(min);
  const maxLabel = formatDateTime(max);

  if (minLabel && maxLabel) {
    return `${minLabel} to ${maxLabel}`;
  }

  if (minLabel) {
    return `Opens ${minLabel}`;
  }

  if (maxLabel) {
    return `Until ${maxLabel}`;
  }

  return "Open";
};

const formatDurationList = (durations: readonly number[]): string =>
  durations
    .map((duration) => formatDuration(duration) ?? "Immediate")
    .join(", ");

const getGroupName = (group: ApiGroup | ApiGroupFull | null | undefined) => {
  const name = group?.name?.trim();
  if (name) {
    return name;
  }

  return group?.id ?? null;
};

const getScopeLabel = ({
  scope,
  fallback,
}: {
  readonly scope: ApiWaveScope | null | undefined;
  readonly fallback: string;
}): string => getGroupName(scope?.group) ?? fallback;

const getCreateGroupLabel = ({
  groupId,
  groupsCache,
  fallback,
}: {
  readonly groupId: string | null | undefined;
  readonly groupsCache: Readonly<Record<string, ApiGroupFull>> | undefined;
  readonly fallback: string;
}): string => {
  if (!groupId) {
    return fallback;
  }

  return groupsCache?.[groupId]?.name ?? "Selected group";
};

const getRequiredMediaLabel = (
  media: readonly ApiWaveParticipationRequirement[] | null | undefined
): string => {
  if (!media?.length) {
    return "None";
  }

  return media.map((item) => REQUIRED_MEDIA_LABELS[item]).join(", ");
};

const getRequiredMetadataLabel = (
  metadata:
    | readonly {
        readonly name?: string | null | undefined;
        readonly key?: string | null | undefined;
        readonly type: ApiWaveMetadataType;
      }[]
    | null
    | undefined
): string => {
  const rows =
    metadata
      ?.map((item) => {
        const name = (item.name ?? item.key ?? "").trim();
        if (!name) {
          return null;
        }

        return `${name} (${METADATA_TYPE_LABELS[item.type]})`;
      })
      .filter((item): item is string => item !== null) ?? [];

  return rows.length ? rows.join(", ") : "None";
};

const getSubmissionStrategyRows = (
  strategy: ApiWaveParticipationSubmissionStrategy | null | undefined
): WaveRuleRow[] => {
  if (strategy?.type !== ApiWaveParticipationSubmissionStrategyType.Identity) {
    return [
      {
        id: "submission-type",
        label: "Submission type",
        value: "Standard drops",
      },
    ];
  }

  return [
    {
      id: "submission-type",
      label: "Submission type",
      value: "Identity nominations",
    },
    {
      id: "identity-who",
      label: "Who can be nominated",
      value:
        WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY[
          strategy.config.who_can_be_submitted
        ].summary,
    },
    {
      id: "identity-duplicates",
      label: "Duplicate nominations",
      value: WAVE_IDENTITY_DUPLICATES_COPY[strategy.config.duplicates].summary,
    },
  ];
};

const getTermsLabel = ({
  signatureRequired,
  terms,
}: {
  readonly signatureRequired: boolean;
  readonly terms: string | null | undefined;
}): string => {
  if (normalizeWaveCustomRules(terms)) {
    return signatureRequired ? "Terms and wallet signature" : "Terms";
  }

  return signatureRequired ? "Wallet signature" : "Not required";
};

const getCreditProfileLabel = ({
  profileId,
  profileHandle,
}: {
  readonly profileId: string | null | undefined;
  readonly profileHandle: string | null | undefined;
}): string => {
  if (profileHandle) {
    return profileHandle;
  }

  return profileId ?? "Not restricted";
};

const getCardSetLabel = (
  creditNfts:
    | readonly {
        readonly token_id: number;
      }[]
    | null
    | undefined
): string => {
  if (!creditNfts?.length) {
    return "No cards selected";
  }

  const tokenLabels = creditNfts
    .slice(0, 6)
    .map((nft) => `#${nft.token_id}`)
    .join(", ");
  const remaining = creditNfts.length - 6;

  return remaining > 0 ? `${tokenLabels}, +${remaining} more` : tokenLabels;
};

const getDecisionRows = (
  decisionsStrategy:
    | {
        readonly first_decision_time: number;
        readonly subsequent_decisions: readonly number[];
        readonly is_rolling: boolean;
      }
    | null
    | undefined
): WaveRuleRow[] => {
  if (!decisionsStrategy) {
    return [];
  }

  const subsequentDecisions = decisionsStrategy.subsequent_decisions ?? [];
  const cadenceLabel = !subsequentDecisions.length
    ? "Single decision"
    : decisionsStrategy.is_rolling
      ? `Rolling sequence: ${formatDurationList(subsequentDecisions)}`
      : `${subsequentDecisions.length + 1} scheduled decisions`;

  return [
    {
      id: "first-decision",
      label: "First decision",
      value: formatDateTime(decisionsStrategy.first_decision_time) ?? "Not set",
    },
    {
      id: "decision-cadence",
      label: "Decision cadence",
      value: cadenceLabel,
    },
  ];
};

const getOutcomeCountLabel = (count: number): string => {
  if (count === 0) {
    return "None yet";
  }

  return count === 1 ? "1 outcome" : `${count} outcomes`;
};

const getCreateRules = ({
  config,
  groupsCache,
}: {
  readonly config: CreateWaveConfig;
  readonly groupsCache: Readonly<Record<string, ApiGroupFull>> | undefined;
}): WaveRules => {
  const endDate = getCreateWaveEndDate({ config });
  const creditLabel =
    WAVE_VOTING_LABELS[config.voting.type ?? ApiWaveCreditType.TdhPlusXtdh];
  const approvalThreshold = formatFiniteNumber(config.approval.threshold);
  const isChatWave = config.overview.type === ApiWaveType.Chat;
  const automatic: WaveRuleSection[] = [
    {
      id: "overview",
      title: "Wave",
      rows: [
        {
          id: "wave-type",
          label: "Type",
          value: WAVE_LABELS[config.overview.type],
        },
      ],
    },
    {
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
        ...(isChatWave
          ? []
          : [
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
            ]),
        {
          id: "can-chat",
          label: "Who can chat",
          value: config.chat.enabled
            ? getCreateGroupLabel({
                groupId: config.groups.canChat,
                groupsCache,
                fallback: "Anyone",
              })
            : "Chat disabled",
        },
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
    },
    {
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
        ...getDecisionRows(
          config.overview.type === ApiWaveType.Rank
            ? {
                first_decision_time: config.dates.firstDecisionTime,
                subsequent_decisions: config.dates.subsequentDecisions,
                is_rolling: config.dates.isRolling,
              }
            : null
        ),
      ],
    },
    {
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
    },
    {
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
    },
    {
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
    },
  ];

  if (isChatWave) {
    automatic.splice(2, automatic.length - 2, {
      id: "chat",
      title: "Chat",
      rows: [
        {
          id: "chat-enabled",
          label: "Chat",
          value: config.chat.enabled ? "Enabled" : "Disabled",
        },
      ],
    });
  }

  if (config.overview.type === ApiWaveType.Approve) {
    automatic.splice(5, 0, {
      id: "approval",
      title: "Approval",
      rows: [
        {
          id: "approval-threshold",
          label: "Approval threshold",
          value:
            approvalThreshold !== null
              ? `${approvalThreshold} ${creditLabel}`
              : "Not set",
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
  }

  return {
    automatic,
    custom: {
      binding: normalizeWaveCustomRules(config.drops.terms) || null,
      display: normalizeWaveCustomRules(config.display.customRules) || null,
      signatureRequired: config.drops.signatureRequired,
    },
  };
};

const getWavePeriod = (period: ApiIntRange | null | undefined) =>
  formatPeriod({
    min: period?.min ?? null,
    max: period?.max ?? null,
  });

const getWaveRules = ({
  wave,
  metadata,
}: {
  readonly wave: ApiWave;
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
}): WaveRules => {
  const isChatWave = wave.wave.type === ApiWaveType.Chat;
  const creditLabel =
    WAVE_VOTING_LABELS[
      wave.voting.credit_type ?? ApiWaveCreditType.TdhPlusXtdh
    ];
  const approvalThreshold = formatFiniteNumber(wave.wave.winning_threshold);
  const automatic: WaveRuleSection[] = [
    {
      id: "overview",
      title: "Wave",
      rows: [
        {
          id: "wave-type",
          label: "Type",
          value: WAVE_LABELS[wave.wave.type],
        },
      ],
    },
    {
      id: "access",
      title: "Access",
      rows: [
        {
          id: "can-view",
          label: "Who can view",
          value: getScopeLabel({
            scope: wave.visibility.scope,
            fallback: "Anyone",
          }),
        },
        ...(isChatWave
          ? []
          : [
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
            ]),
        {
          id: "can-chat",
          label: "Who can chat",
          value: wave.chat.enabled
            ? getScopeLabel({
                scope: wave.chat.scope,
                fallback: "Anyone",
              })
            : "Chat disabled",
        },
        {
          id: "admin",
          label: "Who can admin",
          value: getScopeLabel({
            scope: wave.wave.admin_group,
            fallback: "Creator/admin group",
          }),
        },
      ],
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
  ];

  if (isChatWave) {
    automatic.splice(2, automatic.length - 2, {
      id: "chat",
      title: "Chat",
      rows: [
        {
          id: "chat-enabled",
          label: "Chat",
          value: wave.chat.enabled ? "Enabled" : "Disabled",
        },
        {
          id: "chat-links",
          label: "Links",
          value: wave.chat.links_disabled ? "Disabled" : "Allowed",
        },
        {
          id: "chat-slow-mode",
          label: "Slow mode",
          value: formatDuration(wave.chat.slow_mode_cooldown_ms) ?? "Off",
        },
      ],
    });
  }

  if (wave.wave.type === ApiWaveType.Approve) {
    automatic.splice(5, 0, {
      id: "approval",
      title: "Approval",
      rows: [
        {
          id: "approval-threshold",
          label: "Approval threshold",
          value:
            approvalThreshold !== null
              ? `${approvalThreshold} ${creditLabel}`
              : "Not set",
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
  }

  return {
    automatic,
    custom: {
      binding: normalizeWaveCustomRules(wave.participation.terms) || null,
      display: getWaveCustomRulesFromMetadata(metadata),
      signatureRequired: wave.participation.signature_required,
    },
  };
};

export const buildWaveRules = (input: BuildWaveRulesInput): WaveRules => {
  if ("wave" in input) {
    return getWaveRules({
      wave: input.wave,
      metadata: input.metadata,
    });
  }

  return getCreateRules({
    config: input.config,
    groupsCache: input.groupsCache,
  });
};
