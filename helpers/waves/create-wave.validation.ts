import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { MEMES_CONTRACT } from "@/constants/constants";
import { isReservedIdentitySubmissionMetadataKey } from "./identity-submission-metadata";
import { assertUnreachable } from "../AllowlistToolHelpers";
import type {
  CreateWaveApprovalConfig,
  CreateWaveConfig,
  CreateWaveDatesConfig,
  CreateWaveDisplayConfig,
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
  CreateWaveOutcomeConfig,
  CreateWaveVotingConfig,
  WaveGroupsConfig,
  WaveOverviewConfig,
} from "@/types/waves.types";
import { CreateWaveStep } from "@/types/waves.types";
import { Time } from "@/helpers/time";
import {
  APPROVE_WAVE_TAB_LABEL_MAX_LENGTH,
  areApproveWaveTabLabelsDuplicate,
  doApproveWaveTabLabelsUseReservedLabels,
  normalizeWaveTabLabel,
} from "./wave-metadata.helpers";

export enum CREATE_WAVE_VALIDATION_ERROR {
  NAME_REQUIRED = "NAME_REQUIRED",
  NAME_TOO_LONG = "NAME_TOO_LONG",
  SUBMISSION_START_DATE_REQUIRED = "SUBMISSION_START_DATE_REQUIRED",
  VOTING_START_DATE_REQUIRED = "VOTING_START_DATE_REQUIRED",
  END_DATE_REQUIRED = "END_DATE_REQUIRED",
  VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE = "VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE",
  END_DATE_MUST_BE_AFTER_VOTING_START_DATE = "END_DATE_MUST_BE_AFTER_VOTING_START_DATE",
  DROPS_REQUIRED_METADATA_NON_UNIQUE = "DROPS_REQUIRED_METADATA_NON_UNIQUE",
  DROPS_REQUIRED_METADATA_RESERVED_IDENTITY_KEY = "DROPS_REQUIRED_METADATA_RESERVED_IDENTITY_KEY",
  APPROVAL_THRESHOLD_REQUIRED = "APPROVAL_THRESHOLD_REQUIRED",
  APPROVAL_THRESHOLD_TIME_INVALID = "APPROVAL_THRESHOLD_TIME_INVALID",
  APPROVAL_THRESHOLD_TIME_EXCEEDS_WAVE_DURATION = "APPROVAL_THRESHOLD_TIME_EXCEEDS_WAVE_DURATION",
  OUTCOMES_REQUIRED = "OUTCOMES_REQUIRED",
  CHAT_WAVE_CANNOT_HAVE_APPLICATIONS_PER_PARTICIPANT = "CHAT_WAVE_CANNOT_HAVE_APPLICATIONS_PER_PARTICIPANT",
  CHAT_WAVE_CANNOT_HAVE_REQUIRED_TYPES = "CHAT_WAVE_CANNOT_HAVE_REQUIRED_TYPES",
  CHAT_WAVE_CANNOT_HAVE_REQUIRED_METADATA = "CHAT_WAVE_CANNOT_HAVE_REQUIRED_METADATA",
  DROPS_SUBMISSION_STRATEGY_INVALID = "DROPS_SUBMISSION_STRATEGY_INVALID",
  APPLICATIONS_PER_PARTICIPANT_MUST_BE_POSITIVE = "APPLICATIONS_PER_PARTICIPANT_MUST_BE_POSITIVE",
  VOTING_TYPE_REQUIRED = "VOTING_TYPE_REQUIRED",
  CHAT_WAVE_CANNOT_HAVE_VOTING = "CHAT_WAVE_CANNOT_HAVE_VOTING",
  TDH_VOTING_CANNOT_HAVE_CATEGORY = "TDH_VOTING_CANNOT_HAVE_CATEGORY",
  TDH_VOTING_CANNOT_HAVE_PROFILE_ID = "TDH_VOTING_CANNOT_HAVE_PROFILE_ID",
  VOTING_CATEGORY_CANNOT_BE_EMPTY = "VOTING_CATEGORY_CANNOT_BE_EMPTY",
  VOTING_PROFILE_ID_CANNOT_BE_EMPTY = "VOTING_PROFILE_ID_CANNOT_BE_EMPTY",
  TIME_WEIGHTED_VOTING_INTERVAL_TOO_SMALL = "TIME_WEIGHTED_VOTING_INTERVAL_TOO_SMALL",
  TIME_WEIGHTED_VOTING_INTERVAL_TOO_LARGE = "TIME_WEIGHTED_VOTING_INTERVAL_TOO_LARGE",
  TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION = "TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION",
  MAX_VOTES_PER_IDENTITY_PER_DROP_INVALID = "MAX_VOTES_PER_IDENTITY_PER_DROP_INVALID",
  CARD_SET_TDH_VOTING_NFTS_REQUIRED = "CARD_SET_TDH_VOTING_NFTS_REQUIRED",
  CARD_SET_TDH_VOTING_NFTS_CONTRACT_INVALID = "CARD_SET_TDH_VOTING_NFTS_CONTRACT_INVALID",
  CARD_SET_TDH_VOTING_MEME_COUNT_UNAVAILABLE = "CARD_SET_TDH_VOTING_MEME_COUNT_UNAVAILABLE",
  CARD_SET_TDH_VOTING_FULL_SET_NOT_ALLOWED = "CARD_SET_TDH_VOTING_FULL_SET_NOT_ALLOWED",
  CARD_SET_TDH_VOTING_NFTS_TOKEN_INVALID = "CARD_SET_TDH_VOTING_NFTS_TOKEN_INVALID",
  RANK_DECISION_TIME_MUST_BE_IN_FUTURE = "RANK_DECISION_TIME_MUST_BE_IN_FUTURE",
  RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE = "RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE",
  APPROVE_WAVE_TAB_LABEL_TOO_LONG = "APPROVE_WAVE_TAB_LABEL_TOO_LONG",
  APPROVE_WAVE_TAB_LABELS_DUPLICATE = "APPROVE_WAVE_TAB_LABELS_DUPLICATE",
  APPROVE_WAVE_TAB_LABEL_RESERVED = "APPROVE_WAVE_TAB_LABEL_RESERVED",
}

const MAX_NAME_LENGTH = 250;
const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;

const getOverviewValidationErrors = ({
  overview,
  display,
}: {
  readonly overview: WaveOverviewConfig;
  readonly display?: CreateWaveDisplayConfig | undefined;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (!overview.name) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED);
  } else if (overview.name.length > MAX_NAME_LENGTH) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.NAME_TOO_LONG);
  }

  if (overview.type === ApiWaveType.Approve) {
    const approveDisplay = display?.approve;
    const labels = [
      normalizeWaveTabLabel(approveDisplay?.approvalsTabLabel),
      normalizeWaveTabLabel(approveDisplay?.approvedTabLabel),
    ];
    if (
      labels.some((label) => label.length > APPROVE_WAVE_TAB_LABEL_MAX_LENGTH)
    ) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_TOO_LONG);
    }
    if (areApproveWaveTabLabelsDuplicate(approveDisplay)) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABELS_DUPLICATE
      );
    }
    if (doApproveWaveTabLabelsUseReservedLabels(approveDisplay)) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_RESERVED);
    }
  }

  return errors;
};

const getRankEffectiveEndDate = (
  dates: CreateWaveDatesConfig
): number | null => {
  if (dates.isRolling) {
    return dates.endDate;
  }

  return (
    dates.firstDecisionTime +
    dates.subsequentDecisions.reduce((sum, interval) => sum + interval, 0)
  );
};

const getDatesValidationErrors = ({
  waveType,
  dates,
}: {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];

  if (waveType === ApiWaveType.Chat) {
    return errors;
  }

  if (!dates.submissionStartDate) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_START_DATE_REQUIRED);
  }
  if (!dates.votingStartDate) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_REQUIRED);
  }

  if (waveType === ApiWaveType.Rank) {
    if (
      dates.submissionStartDate &&
      dates.votingStartDate &&
      dates.submissionStartDate > dates.votingStartDate
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE
      );
    }

    if (
      dates.votingStartDate &&
      dates.firstDecisionTime < dates.votingStartDate
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE
      );
    }

    const rankEffectiveEndDate = getRankEffectiveEndDate(dates);
    if (
      rankEffectiveEndDate !== null &&
      dates.votingStartDate &&
      rankEffectiveEndDate < dates.votingStartDate
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
      );
    }

    const now = Time.currentMillis();
    const isExplicitRollingEndDateInPast =
      dates.isRolling &&
      dates.endDate !== null &&
      (!Number.isFinite(dates.endDate) || dates.endDate <= now);
    const isFixedRankEffectiveEndDateInPast =
      !dates.isRolling &&
      (rankEffectiveEndDate === null || rankEffectiveEndDate <= now);
    if (
      dates.firstDecisionTime <= now ||
      isExplicitRollingEndDateInPast ||
      isFixedRankEffectiveEndDateInPast
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE
      );
    }
  } else {
    if (
      dates.submissionStartDate &&
      dates.votingStartDate &&
      dates.submissionStartDate !== dates.votingStartDate
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE
      );
    }

    if (
      dates.endDate !== null &&
      dates.votingStartDate &&
      dates.endDate <= dates.votingStartDate
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
      );
    }
  }

  return errors;
};

const isRequiredMetadataRowsNonUnique = ({
  requiredMetadata,
}: {
  requiredMetadata: CreateWaveDropsRequiredMetadata[];
}): boolean => {
  const keys = requiredMetadata.map((item) => item.key);
  return new Set(keys).size !== keys.length;
};

const hasReservedIdentitySubmissionMetadataKey = ({
  drops,
}: {
  readonly drops: CreateWaveDropsConfig;
}): boolean =>
  drops.submissionStrategy?.type ===
    ApiWaveParticipationSubmissionStrategyType.Identity &&
  drops.requiredMetadata.some((item) =>
    isReservedIdentitySubmissionMetadataKey(item.key)
  );

const getUniqueCreditNftIdsCount = (voting: CreateWaveVotingConfig): number => {
  const uniqueIds = new Set<number>();
  for (const nft of voting.creditNfts) {
    uniqueIds.add(nft.token_id);
  }
  return uniqueIds.size;
};

const getDropsValidationErrors = ({
  waveType,
  drops,
}: {
  readonly waveType: ApiWaveType;
  readonly drops: CreateWaveDropsConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  const submissionStrategy = drops.submissionStrategy;

  if (waveType === ApiWaveType.Chat) {
    // Chat waves cannot have any drops configuration
    if (drops.noOfApplicationsAllowedPerParticipant !== null) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_APPLICATIONS_PER_PARTICIPANT
      );
    }
    if (drops.requiredTypes.length > 0) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_REQUIRED_TYPES
      );
    }
    if (drops.requiredMetadata.length > 0) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_REQUIRED_METADATA
      );
    }
    if (submissionStrategy !== null) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.DROPS_SUBMISSION_STRATEGY_INVALID
      );
    }
  } else {
    // Rank and Approve waves
    if (
      drops.noOfApplicationsAllowedPerParticipant !== null &&
      drops.noOfApplicationsAllowedPerParticipant <= 0
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.APPLICATIONS_PER_PARTICIPANT_MUST_BE_POSITIVE
      );
    }

    // Check for unique metadata keys
    if (
      isRequiredMetadataRowsNonUnique({
        requiredMetadata: drops.requiredMetadata,
      })
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_NON_UNIQUE
      );
    }

    if (hasReservedIdentitySubmissionMetadataKey({ drops })) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_RESERVED_IDENTITY_KEY
      );
    }
  }

  return errors;
};

const getVotingValidationErrors = ({
  waveType,
  dates,
  voting,
  approval,
}: {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly voting: CreateWaveVotingConfig;
  readonly approval: CreateWaveApprovalConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  const maxVotesPerIdentityPerDrop: number | null | undefined =
    voting.maxVotesPerIdentityPerDrop;

  if (waveType === ApiWaveType.Chat) {
    // Chat waves must have null type and null category/profileId
    if (
      voting.type !== null ||
      voting.category !== null ||
      voting.profileId !== null ||
      maxVotesPerIdentityPerDrop !== null ||
      voting.winningThreshold !== null
    ) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING);
    }
    return errors;
  }

  if (
    waveType === ApiWaveType.Approve &&
    (approval.threshold === null ||
      !Number.isInteger(approval.threshold) ||
      approval.threshold <= 0)
  ) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED);
  }

  if (waveType === ApiWaveType.Approve && approval.thresholdTimeMs !== null) {
    if (
      !Number.isInteger(approval.thresholdTimeMs) ||
      approval.thresholdTimeMs <= 0 ||
      approval.thresholdTimeMs % MINUTE_IN_MS !== 0
    ) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_INVALID);
    } else if (dates.endDate !== null) {
      const waveDurationMs = dates.endDate - dates.submissionStartDate;

      if (waveDurationMs >= 0 && approval.thresholdTimeMs > waveDurationMs) {
        errors.push(
          CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_EXCEEDS_WAVE_DURATION
        );
      }
    }
  }

  // For Rank and Approve waves
  if (voting.type === null) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_TYPE_REQUIRED);
    return errors;
  }

  if (voting.type === ApiWaveCreditType.Rep) {
    // REP voting requires at least one of category or profileId
    const categoryEmpty =
      !voting.category || voting.category.trim().length === 0;
    const profileIdEmpty =
      !voting.profileId || voting.profileId.trim().length === 0;
    if (categoryEmpty && profileIdEmpty) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_CATEGORY_CANNOT_BE_EMPTY);
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.VOTING_PROFILE_ID_CANNOT_BE_EMPTY
      );
    }
  } else {
    // TDH voting cannot have category or profileId
    if (voting.category !== null) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.TDH_VOTING_CANNOT_HAVE_CATEGORY);
    }
    if (voting.profileId !== null) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.TDH_VOTING_CANNOT_HAVE_PROFILE_ID
      );
    }
  }

  if (voting.type === ApiWaveCreditType.CardSetTdh) {
    const { creditNfts } = voting;
    if (!creditNfts.length) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_NFTS_REQUIRED
      );
    }

    if (
      creditNfts.some(
        (nft) => nft.contract.toLowerCase() !== MEMES_CONTRACT.toLowerCase()
      )
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_NFTS_CONTRACT_INVALID
      );
    }

    if (
      creditNfts.some(
        (nft) => !Number.isInteger(nft.token_id) || nft.token_id <= 0
      )
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_NFTS_TOKEN_INVALID
      );
    }

    if (
      voting.creditNftMemeCount === null ||
      !Number.isInteger(voting.creditNftMemeCount) ||
      voting.creditNftMemeCount <= 0
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_MEME_COUNT_UNAVAILABLE
      );
    } else if (
      creditNfts.some((nft) => nft.token_id > voting.creditNftMemeCount)
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_NFTS_TOKEN_INVALID
      );
    } else if (
      getUniqueCreditNftIdsCount(voting) >= voting.creditNftMemeCount
    ) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_FULL_SET_NOT_ALLOWED
      );
    }
  }

  if (
    maxVotesPerIdentityPerDrop !== null &&
    (!Number.isInteger(maxVotesPerIdentityPerDrop) ||
      maxVotesPerIdentityPerDrop < 1)
  ) {
    errors.push(
      CREATE_WAVE_VALIDATION_ERROR.MAX_VOTES_PER_IDENTITY_PER_DROP_INVALID
    );
  }

  // Validate time-weighted voting settings for Rank and Approve waves
  if (voting.timeWeighted.enabled) {
    // Constants for validation
    const MIN_MINUTES = 5;
    const MAX_HOURS = 24;
    const MAX_MINUTES = MAX_HOURS * 60;

    // Calculate the interval in minutes for validation
    const intervalInMinutes =
      voting.timeWeighted.averagingIntervalUnit === "minutes"
        ? voting.timeWeighted.averagingInterval
        : voting.timeWeighted.averagingInterval * 60;

    // Validate minimum
    if (intervalInMinutes < MIN_MINUTES) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_TOO_SMALL
      );
    }

    // Validate maximum
    if (intervalInMinutes > MAX_MINUTES) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_TOO_LARGE
      );
    }

    if (waveType === ApiWaveType.Approve && dates.endDate !== null) {
      const intervalInMs =
        voting.timeWeighted.averagingIntervalUnit === "minutes"
          ? voting.timeWeighted.averagingInterval * MINUTE_IN_MS
          : voting.timeWeighted.averagingInterval * HOUR_IN_MS;
      const waveDurationMs = dates.endDate - dates.submissionStartDate;

      if (waveDurationMs >= 0 && intervalInMs > waveDurationMs) {
        errors.push(
          CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION
        );
      }
    }
  }

  return errors;
};

const getApprovalValidationErrors = ({
  waveType,
  approval,
}: {
  readonly waveType: ApiWaveType;
  readonly approval: CreateWaveApprovalConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];

  if (waveType !== ApiWaveType.Approve) {
    return errors;
  }

  if (
    approval.threshold === null ||
    !Number.isInteger(approval.threshold) ||
    approval.threshold <= 0
  ) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED);
  }

  return errors;
};

const getOutcomesValidationErrors = ({
  waveType,
  outcomes,
}: {
  readonly waveType: ApiWaveType;
  readonly outcomes: CreateWaveOutcomeConfig[];
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (waveType === ApiWaveType.Chat) {
    return errors;
  }
  if (!outcomes.length) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.OUTCOMES_REQUIRED);
  }
  return errors;
};

const getGroupsValidationErrors = ({
  waveType,
  groups,
}: {
  readonly waveType: ApiWaveType;
  readonly groups: WaveGroupsConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];

  if (waveType === ApiWaveType.Chat) {
    if (groups.canDrop !== null) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING);
    }
    if (groups.canVote !== null) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING);
    }
  }

  return errors;
};

export const getCreateWaveValidationErrors = ({
  step,
  config,
}: {
  readonly step: CreateWaveStep;
  readonly config: CreateWaveConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];

  switch (step) {
    case CreateWaveStep.OVERVIEW:
      errors.push(
        ...getOverviewValidationErrors({
          overview: config.overview,
          display: config.display,
        })
      );
      break;
    case CreateWaveStep.GROUPS:
      errors.push(
        ...getGroupsValidationErrors({
          waveType: config.overview.type,
          groups: config.groups,
        })
      );
      break;
    case CreateWaveStep.DATES:
      errors.push(
        ...getDatesValidationErrors({
          waveType: config.overview.type,
          dates: config.dates,
        })
      );
      break;
    case CreateWaveStep.DROPS:
      errors.push(
        ...getDropsValidationErrors({
          waveType: config.overview.type,
          drops: config.drops,
        })
      );
      break;
    case CreateWaveStep.RULES:
      // No validation for rules step
      break;
    case CreateWaveStep.VOTING:
      errors.push(
        ...getVotingValidationErrors({
          waveType: config.overview.type,
          dates: config.dates,
          voting: config.voting,
          approval: config.approval,
        })
      );
      break;
    case CreateWaveStep.APPROVAL:
      errors.push(
        ...getApprovalValidationErrors({
          waveType: config.overview.type,
          approval: config.approval,
        })
      );
      break;
    case CreateWaveStep.OUTCOMES:
      errors.push(
        ...getOutcomesValidationErrors({
          waveType: config.overview.type,
          outcomes: config.outcomes,
        })
      );
      break;
    case CreateWaveStep.DESCRIPTION:
      // No validation for description step
      break;
    default:
      assertUnreachable(step);
  }

  return errors;
};
