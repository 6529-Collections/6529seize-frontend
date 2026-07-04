import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { commonApiPost } from "@/services/api/common-api";
import { CreateWaveStepStatus } from "@/types/waves.types";

export const getCreateWaveStepStatus = ({
  stepIndex,
  activeStepIndex,
}: {
  readonly stepIndex: number;
  readonly activeStepIndex: number;
}): CreateWaveStepStatus => {
  if (stepIndex < activeStepIndex) {
    return CreateWaveStepStatus.DONE;
  }
  if (stepIndex === activeStepIndex) {
    return CreateWaveStepStatus.ACTIVE;
  }
  return CreateWaveStepStatus.PENDING;
};

export const getParentWaveName = (
  parentWave: ApiWave["parent_wave"]
): string | undefined => {
  if (!parentWave) {
    return undefined;
  }

  const trimmedName = parentWave.name.trim();
  return trimmedName.length > 0 ? trimmedName : parentWave.id;
};

const getPeriodUpdate = <T>(
  period: T | null | undefined
): Partial<{ readonly period: T }> => {
  if (period === null || period === undefined) {
    return {};
  }

  return { period };
};

const getSlowModeUpdate = (
  slowModeCooldownMs: number | null | undefined
): Partial<{ readonly slow_mode_cooldown_ms: number }> => {
  if (slowModeCooldownMs === null || slowModeCooldownMs === undefined) {
    return {};
  }

  return { slow_mode_cooldown_ms: slowModeCooldownMs };
};

const getWinningThresholdMinDurationUpdate = (
  minDurationMs: number | null | undefined
): Partial<{ readonly winning_threshold_min_duration_ms: number | null }> => {
  if (minDurationMs === undefined) {
    return {};
  }

  return { winning_threshold_min_duration_ms: minDurationMs };
};

const getCreditNftsUpdate = (
  wave: ApiWave
): Partial<{ readonly credit_nfts: ApiWave["voting"]["credit_nfts"] }> => {
  if (wave.voting.credit_type !== ApiWaveCreditType.CardSetTdh) {
    return {};
  }

  return { credit_nfts: wave.voting.credit_nfts ?? [] };
};

export const convertWaveToUpdateWave = (
  wave: ApiWave
): ApiUpdateWaveRequest => ({
  name: wave.name,
  picture: wave.picture,
  voting: {
    scope: {
      group_id: wave.voting.scope.group?.id ?? null,
    },
    credit_type: wave.voting.credit_type,
    credit_scope: wave.voting.credit_scope,
    credit_category: wave.voting.credit_category,
    creditor_id: wave.voting.creditor?.id ?? null,
    signature_required: !!wave.voting.signature_required,
    ...getPeriodUpdate(wave.voting.period),
    ...getCreditNftsUpdate(wave),
    forbid_negative_votes: wave.voting.forbid_negative_votes,
  },
  visibility: {
    scope: {
      group_id: wave.visibility.scope.group?.id ?? null,
    },
  },
  chat: {
    scope: {
      group_id: wave.chat.scope.group?.id ?? null,
    },
    enabled: wave.chat.enabled,
    links_disabled: wave.chat.links_disabled === true,
    ...getSlowModeUpdate(wave.chat.slow_mode_cooldown_ms),
  },
  participation: {
    scope: {
      group_id: wave.participation.scope.group?.id ?? null,
    },
    no_of_applications_allowed_per_participant:
      wave.participation.no_of_applications_allowed_per_participant,
    required_media: wave.participation.required_media,
    required_metadata: wave.participation.required_metadata,
    signature_required:
      wave.wave.type === ApiWaveType.Chat
        ? false
        : !!wave.participation.signature_required,
    ...getPeriodUpdate(wave.participation.period),
    terms:
      wave.wave.type === ApiWaveType.Chat ? null : wave.participation.terms,
  },
  wave: {
    admin_drop_deletion_enabled: wave.wave.admin_drop_deletion_enabled,
    type: wave.wave.type,
    winning_threshold: wave.wave.winning_threshold,
    ...getWinningThresholdMinDurationUpdate(
      wave.wave.winning_threshold_min_duration_ms
    ),
    max_winners: wave.wave.max_winners,
    max_votes_per_identity_to_drop: wave.wave.max_votes_per_identity_to_drop,
    time_lock_ms: wave.wave.time_lock_ms,
    admin_group: {
      group_id: wave.wave.admin_group.group?.id ?? null,
    },
    decisions_strategy: wave.wave.decisions_strategy,
  },
});

export const canEditWave = ({
  connectedProfile,
  activeProfileProxy,
  wave,
}: {
  readonly connectedProfile: ApiIdentity | null;
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly wave: ApiWave;
}): boolean => {
  if (!connectedProfile?.handle) {
    return false;
  }
  if (!!activeProfileProxy) {
    return false;
  }
  if (wave.author.handle === connectedProfile.handle) {
    return true;
  }
  if (wave.wave.authenticated_user_eligible_for_admin) {
    return true;
  }
  return false;
};

export const createDirectMessageWave = ({
  addresses,
}: {
  readonly addresses: string[];
}): Promise<ApiWave> => {
  return commonApiPost({
    endpoint: "waves/direct-message/new",
    body: {
      identity_addresses: addresses,
    },
  });
};
