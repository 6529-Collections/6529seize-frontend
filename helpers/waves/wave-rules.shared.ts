import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiIntRange } from "@/generated/models/ApiIntRange";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import type { ApiWaveParticipationSubmissionStrategy } from "@/generated/models/ApiWaveParticipationSubmissionStrategy";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import type { ApiWaveScope } from "@/generated/models/ApiWaveScope";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { formatSlowModeInterval } from "@/helpers/waves/slow-mode.helpers";
import { normalizeWaveCustomRules } from "@/helpers/waves/wave-metadata.helpers";
import {
  WAVE_IDENTITY_DUPLICATES_COPY,
  WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY,
} from "@/helpers/waves/wave-submission-strategy.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

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

export const CREDIT_SCOPE_LABELS: Record<ApiWaveCreditScope, string> = {
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
const CHAT_ACCESS_FALLBACK = t(
  DEFAULT_LOCALE,
  "waves.chatSettings.access.anyoneWhenEnabled"
);

export const formatFiniteNumber = (
  value: number | null | undefined
): string | null =>
  typeof value === "number" && Number.isFinite(value)
    ? formatNumberWithCommas(value)
    : null;

const formatDateTime = (value: number | null | undefined): string | null =>
  typeof value === "number" && Number.isFinite(value)
    ? Time.millis(value).toLocaleDateTimeString()
    : null;

export const formatDuration = (
  durationMs: number | null | undefined
): string | null => {
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

export const formatPeriod = ({
  min,
  max,
}: {
  readonly min: number | null | undefined;
  readonly max: number | null | undefined;
}): string => {
  const minLabel = formatDateTime(min);
  const maxLabel = formatDateTime(max);

  if (minLabel !== null && maxLabel !== null) {
    return `${minLabel} to ${maxLabel}`;
  }

  if (minLabel !== null) {
    return `Opens ${minLabel}`;
  }

  if (maxLabel !== null) {
    return `Until ${maxLabel}`;
  }

  return "Open";
};

const formatDurationList = (durations: readonly number[]): string =>
  durations
    .map((duration) => formatDuration(duration) ?? "Immediate")
    .join(", ");

const getGroupName = (
  group: ApiGroup | ApiGroupFull | null | undefined
): string | null => {
  const name = group?.name?.trim();
  if (name !== undefined && name.length > 0) {
    return name;
  }

  return group?.id ?? null;
};

export const getScopeLabel = ({
  scope,
  fallback,
}: {
  readonly scope: ApiWaveScope | null | undefined;
  readonly fallback: string;
}): string => getGroupName(scope?.group) ?? fallback;

export const getChatStatusRow = ({
  enabled,
}: {
  readonly enabled: boolean;
}): WaveRuleRow => ({
  id: "chat-status",
  label: t(DEFAULT_LOCALE, "waves.chatSettings.status.label"),
  value: t(
    DEFAULT_LOCALE,
    enabled
      ? "waves.chatSettings.status.enabled"
      : "waves.chatSettings.status.disabled"
  ),
});

const getChatAccessRow = (value: string): WaveRuleRow => ({
  id: "chat-access",
  label: t(DEFAULT_LOCALE, "waves.chatSettings.access.label"),
  value,
});

export const getCreateGroupLabel = ({
  groupId,
  groupsCache,
  fallback,
}: {
  readonly groupId: string | null | undefined;
  readonly groupsCache: Readonly<Record<string, ApiGroupFull>> | undefined;
  readonly fallback: string;
}): string => {
  if (groupId === null || groupId === undefined || groupId.length === 0) {
    return fallback;
  }

  return groupsCache?.[groupId]?.name ?? "Selected group";
};

export const getCreateChatAccessRow = ({
  groupId,
  groupsCache,
}: {
  readonly groupId: string | null | undefined;
  readonly groupsCache: Readonly<Record<string, ApiGroupFull>> | undefined;
}): WaveRuleRow =>
  getChatAccessRow(
    getCreateGroupLabel({
      groupId,
      groupsCache,
      fallback: CHAT_ACCESS_FALLBACK,
    })
  );

export const getWaveChatAccessRow = ({
  scope,
}: {
  readonly scope: ApiWaveScope | null | undefined;
}): WaveRuleRow =>
  getChatAccessRow(
    getScopeLabel({
      scope,
      fallback: CHAT_ACCESS_FALLBACK,
    })
  );

export const getRequiredMediaLabel = (
  media: readonly ApiWaveParticipationRequirement[] | null | undefined
): string => {
  if (media === null || media === undefined || media.length === 0) {
    return "None";
  }

  return media.map((item) => REQUIRED_MEDIA_LABELS[item]).join(", ");
};

export const getRequiredMetadataLabel = (
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
        if (name.length === 0) {
          return null;
        }

        return `${name} (${METADATA_TYPE_LABELS[item.type]})`;
      })
      .filter((item): item is string => item !== null) ?? [];

  return rows.length > 0 ? rows.join(", ") : "None";
};

export const getSubmissionStrategyRows = (
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

export const getTermsLabel = ({
  signatureRequired,
  terms,
}: {
  readonly signatureRequired: boolean;
  readonly terms: string | null | undefined;
}): string => {
  if (normalizeWaveCustomRules(terms).length > 0) {
    return signatureRequired ? "Terms and wallet signature" : "Terms";
  }

  return signatureRequired ? "Wallet signature" : "Not required";
};

export const getCreditProfileLabel = ({
  profileId,
  profileHandle,
}: {
  readonly profileId: string | null | undefined;
  readonly profileHandle: string | null | undefined;
}): string => profileHandle ?? profileId ?? "Not restricted";

export const getCardSetLabel = (
  creditNfts:
    | readonly {
        readonly token_id: number;
      }[]
    | null
    | undefined
): string => {
  if (
    creditNfts === null ||
    creditNfts === undefined ||
    creditNfts.length === 0
  ) {
    return "No cards selected";
  }

  const tokenLabels = creditNfts
    .slice(0, 6)
    .map((nft) => `#${nft.token_id}`)
    .join(", ");
  const remaining = creditNfts.length - 6;

  return remaining > 0 ? `${tokenLabels}, +${remaining} more` : tokenLabels;
};

export const getDecisionRows = (
  decisionsStrategy:
    | {
        readonly first_decision_time: number;
        readonly subsequent_decisions: readonly number[];
        readonly is_rolling: boolean;
      }
    | null
    | undefined
): WaveRuleRow[] => {
  if (decisionsStrategy === null || decisionsStrategy === undefined) {
    return [];
  }

  const cadenceLabel = getDecisionCadenceLabel({
    subsequentDecisions: decisionsStrategy.subsequent_decisions,
    isRolling: decisionsStrategy.is_rolling,
  });

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

const getDecisionCadenceLabel = ({
  subsequentDecisions,
  isRolling,
}: {
  readonly subsequentDecisions: readonly number[];
  readonly isRolling: boolean;
}): string => {
  if (subsequentDecisions.length === 0) {
    return "Single decision";
  }

  if (isRolling) {
    return `Rolling sequence: ${formatDurationList(subsequentDecisions)}`;
  }

  return `${subsequentDecisions.length + 1} scheduled decisions`;
};

export const getApprovalThresholdLabel = ({
  approvalThreshold,
  creditLabel,
}: {
  readonly approvalThreshold: string | null;
  readonly creditLabel: string;
}): string => {
  if (approvalThreshold === null) {
    return "Not set";
  }

  return `${approvalThreshold} ${creditLabel}`;
};

export const getOutcomeCountLabel = (count: number): string => {
  if (count === 0) {
    return "None yet";
  }

  return count === 1 ? "1 outcome" : `${count} outcomes`;
};

export const getWavePeriod = (period: ApiIntRange | null | undefined): string =>
  formatPeriod({
    min: period?.min ?? null,
    max: period?.max ?? null,
  });

export const getChatWaveSection = ({
  linksDisabled,
  slowModeCooldownMs,
}: {
  readonly linksDisabled: boolean;
  readonly slowModeCooldownMs: number | null | undefined;
}): WaveRuleSection => ({
  id: "chat",
  title: "Chat",
  rows: [
    {
      id: "chat-links",
      label: "Links",
      value: linksDisabled ? "Disabled" : "Allowed",
    },
    {
      id: "chat-slow-mode",
      label: "Slow mode",
      value: formatSlowModeInterval(slowModeCooldownMs),
    },
  ],
});
