import { IProfileAndConsolidations } from "../../entities/IProfile";
import { ApiProfileProxy } from "../../generated/models/ApiProfileProxy";
import { ApiUpdateWaveRequest } from "../../generated/models/ApiUpdateWaveRequest";
import { ApiWave } from "../../generated/models/ApiWave";
import { CreateWaveStepStatus } from "../../types/waves.types";

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
    credit_category: wave.voting.credit_category,
    creditor_id: wave.voting.creditor?.id ?? null,
    signature_required: !!wave.voting.signature_required,
    period: wave.voting.period,
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
  },
  participation: {
    scope: {
      group_id: wave.participation.scope.group?.id ?? null,
    },
    no_of_applications_allowed_per_participant:
      wave.participation.no_of_applications_allowed_per_participant,
    required_media: wave.participation.required_media,
    required_metadata: wave.participation.required_metadata,
    signature_required: !!wave.participation.signature_required,
    period: wave.participation.period,
  },
  wave: {
    type: wave.wave.type,
    winning_thresholds:
      wave.wave.winning_thresholds?.max || wave.wave.winning_thresholds?.min
        ? wave.wave.winning_thresholds
        : null,
    max_winners: wave.wave.max_winners,
    time_lock_ms: wave.wave.time_lock_ms,
    admin_group: {
      group_id: wave.wave.admin_group.group?.id ?? null,
    },
    decisions_strategy: wave.wave.decisions_strategy,
  },
  outcomes: wave.outcomes,
});

export const canEditWave = ({
  connectedProfile,
  activeProfileProxy,
  wave,
}: {
  readonly connectedProfile: IProfileAndConsolidations | null;
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly wave: ApiWave;
}): boolean => {
  if (!connectedProfile?.profile?.handle) {
    return false;
  }
  if (!!activeProfileProxy) {
    return false;
  }
  if (wave.author.handle === connectedProfile.profile.handle) {
    return true;
  }
  if (wave.wave.authenticated_user_eligible_for_admin) {
    return true;
  }
  return false;
};
