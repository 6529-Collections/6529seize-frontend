import { CreateNewWave } from "../../generated/models/CreateNewWave";
import { Wave } from "../../generated/models/Wave";
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

export const convertWaveToCreateNewWave = (wave: Wave): CreateNewWave => ({
  name: wave.name,
  picture: wave.picture,
  description_drop: {
    title: wave.description_drop.title,
    parts: wave.description_drop.parts,
    referenced_nfts: wave.description_drop.referenced_nfts,
    mentioned_users: wave.description_drop.mentioned_users,
    metadata: wave.description_drop.metadata,
  },
  voting: {
    scope: {
      group_id: wave.voting.scope.group?.id ?? null,
    },
    credit_type: wave.voting.credit_type,
    credit_scope: wave.voting.credit_scope,
    credit_category: wave.voting.credit_category,
    creditor_id: wave.voting.creditor?.id ?? null,
    signature_required: wave.voting.signature_required,
    period: wave.voting.period,
  },
  visibility: {
    scope: {
      group_id: wave.visibility.scope.group?.id ?? null,
    },
  },
  participation: {
    scope: {
      group_id: wave.participation.scope.group?.id ?? null,
    },
    no_of_applications_allowed_per_participant:
      wave.participation.no_of_applications_allowed_per_participant,
    required_media: wave.participation.required_media,
    required_metadata: wave.participation.required_metadata,
    signature_required: wave.participation.signature_required,
    period: wave.participation.period,
  },
  wave: {
    type: wave.wave.type,
    winning_thresholds: wave.wave.winning_thresholds,
    max_winners: wave.wave.max_winners,
    time_lock_ms: wave.wave.time_lock_ms,
    admin_group: {
      group_id: wave.wave.admin_group.group?.id ?? null,
    },
    period: wave.wave.period,
  },
  outcomes: wave.outcomes,
});
