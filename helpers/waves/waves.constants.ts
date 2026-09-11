import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CreateWaveGroupConfigType, CreateWaveStep } from "@/types/waves.types";

export const WAVE_LABELS: Record<ApiWaveType, string> = {
  [ApiWaveType.Chat]: "Chat",
  [ApiWaveType.Rank]: "Rank",
  [ApiWaveType.Approve]: "Approve",
};

export const WAVE_VOTE_STATS_LABELS = {
  YOUR_VOTES: "Your votes",
  TOTAL: "Total",
};

const WAVE_VOTE_SCOPE_MAX_LABELS: Record<ApiWaveCreditScope, string> = {
  [ApiWaveCreditScope.Wave]: "Max for wave",
  [ApiWaveCreditScope.Drop]: "Max per drop",
};

export const getWaveVoteScopeMaxLabel = (
  scope?: ApiWaveCreditScope | null
): string =>
  WAVE_VOTE_SCOPE_MAX_LABELS[scope ?? ApiWaveCreditScope.Wave] ??
  WAVE_VOTE_SCOPE_MAX_LABELS[ApiWaveCreditScope.Wave];

export const WAVE_VOTING_LABELS: Record<ApiWaveCreditType, string> = {
  [ApiWaveCreditType.Tdh]: "TDH",
  [ApiWaveCreditType.Xtdh]: "XTDH",
  [ApiWaveCreditType.TdhPlusXtdh]: "TDH + XTDH",
  [ApiWaveCreditType.Rep]: "Rep",
  [ApiWaveCreditType.CardSetTdh]: "Card Set TDH",
};

// Perpetual rank waves never award outcomes, so their flow skips the
// Outcomes step entirely (steps already vary by wave type).
export const getCreateWaveMainSteps = ({
  waveType,
  ongoingRanking,
}: {
  readonly waveType: ApiWaveType;
  readonly ongoingRanking: boolean;
}): CreateWaveStep[] => {
  const steps = CREATE_WAVE_MAIN_STEPS[waveType];
  if (waveType === ApiWaveType.Rank && ongoingRanking) {
    return steps.filter((step) => step !== CreateWaveStep.OUTCOMES);
  }
  return steps;
};

const CREATE_WAVE_MAIN_STEPS: Record<ApiWaveType, CreateWaveStep[]> = {
  [ApiWaveType.Chat]: [
    CreateWaveStep.OVERVIEW,
    CreateWaveStep.GROUPS,
    CreateWaveStep.RULES,
    CreateWaveStep.DESCRIPTION,
    CreateWaveStep.REVIEW,
  ],
  [ApiWaveType.Rank]: [
    CreateWaveStep.OVERVIEW,
    CreateWaveStep.GROUPS,
    CreateWaveStep.DATES,
    CreateWaveStep.DROPS,
    CreateWaveStep.VOTING,
    CreateWaveStep.OUTCOMES,
    CreateWaveStep.RULES,
    CreateWaveStep.DESCRIPTION,
    CreateWaveStep.REVIEW,
  ],
  [ApiWaveType.Approve]: [
    CreateWaveStep.OVERVIEW,
    CreateWaveStep.GROUPS,
    CreateWaveStep.DATES,
    CreateWaveStep.DROPS,
    CreateWaveStep.VOTING,
    CreateWaveStep.OUTCOMES,
    CreateWaveStep.RULES,
    CreateWaveStep.DESCRIPTION,
    CreateWaveStep.REVIEW,
  ],
};

export const CREATE_WAVE_GROUPS: Record<
  ApiWaveType,
  CreateWaveGroupConfigType[]
> = {
  [ApiWaveType.Chat]: [
    CreateWaveGroupConfigType.CAN_VIEW,
    CreateWaveGroupConfigType.CAN_CHAT,
    CreateWaveGroupConfigType.ADMIN,
  ],
  [ApiWaveType.Rank]: [
    CreateWaveGroupConfigType.CAN_VIEW,
    CreateWaveGroupConfigType.CAN_DROP,
    CreateWaveGroupConfigType.CAN_VOTE,
    CreateWaveGroupConfigType.CAN_CHAT,
    CreateWaveGroupConfigType.ADMIN,
  ],
  [ApiWaveType.Approve]: [
    CreateWaveGroupConfigType.CAN_VIEW,
    CreateWaveGroupConfigType.CAN_DROP,
    CreateWaveGroupConfigType.CAN_VOTE,
    CreateWaveGroupConfigType.CAN_CHAT,
    CreateWaveGroupConfigType.ADMIN,
  ],
};

const CREATE_WAVE_STEPS_LABELS: Record<
  ApiWaveType,
  Record<CreateWaveStep, string>
> = {
  [ApiWaveType.Chat]: {
    [CreateWaveStep.OVERVIEW]: "Setup",
    [CreateWaveStep.GROUPS]: "Access",
    [CreateWaveStep.DATES]: "Schedule",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.RULES]: "Guidelines",
    [CreateWaveStep.VOTING]: "Rating",
    [CreateWaveStep.APPROVAL]: "Approval",
    [CreateWaveStep.OUTCOMES]: "Outcomes",
    [CreateWaveStep.DESCRIPTION]: "Description",
    [CreateWaveStep.REVIEW]: "Overview",
  },
  [ApiWaveType.Rank]: {
    [CreateWaveStep.OVERVIEW]: "Setup",
    [CreateWaveStep.GROUPS]: "Access",
    [CreateWaveStep.DATES]: "Schedule",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.RULES]: "Guidelines",
    [CreateWaveStep.VOTING]: "Voting",
    [CreateWaveStep.APPROVAL]: "Approval",
    [CreateWaveStep.OUTCOMES]: "Outcomes",
    [CreateWaveStep.DESCRIPTION]: "Description",
    [CreateWaveStep.REVIEW]: "Overview",
  },
  [ApiWaveType.Approve]: {
    [CreateWaveStep.OVERVIEW]: "Setup",
    [CreateWaveStep.GROUPS]: "Access",
    [CreateWaveStep.DATES]: "Schedule",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.RULES]: "Guidelines",
    [CreateWaveStep.VOTING]: "Voting",
    [CreateWaveStep.APPROVAL]: "Approval",
    [CreateWaveStep.OUTCOMES]: "Outcomes",
    [CreateWaveStep.DESCRIPTION]: "Description",
    [CreateWaveStep.REVIEW]: "Overview",
  },
};

export const getCreateWaveStepLabel = ({
  step,
  waveType,
  locale,
}: {
  readonly step: CreateWaveStep;
  readonly waveType: ApiWaveType;
  readonly locale: SupportedLocale;
}): string => {
  if (step === CreateWaveStep.OVERVIEW) {
    return t(locale, "waves.create.review.setup");
  }
  if (step === CreateWaveStep.REVIEW) {
    return t(locale, "waves.create.review.title");
  }
  if (step === CreateWaveStep.RULES) {
    return t(locale, "waves.create.rules.title");
  }
  return CREATE_WAVE_STEPS_LABELS[waveType][step];
};

export const CREATE_WAVE_SELECT_GROUP_LABELS: Record<
  ApiWaveType,
  Record<CreateWaveGroupConfigType, string>
> = {
  [ApiWaveType.Chat]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can access this wave",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can rate",
    [CreateWaveGroupConfigType.CAN_CHAT]: "Who can chat",
    [CreateWaveGroupConfigType.ADMIN]: "Admins",
  },
  [ApiWaveType.Rank]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can access this wave",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can vote",
    [CreateWaveGroupConfigType.CAN_CHAT]: "Who can chat",
    [CreateWaveGroupConfigType.ADMIN]: "Admins",
  },
  [ApiWaveType.Approve]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can access this wave",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can vote",
    [CreateWaveGroupConfigType.CAN_CHAT]: "Who can chat",
    [CreateWaveGroupConfigType.ADMIN]: "Admins",
  },
};

export const CREATE_WAVE_NONE_GROUP_LABELS: Record<
  CreateWaveGroupConfigType,
  string
> = {
  [CreateWaveGroupConfigType.CAN_VIEW]: "Everyone",
  [CreateWaveGroupConfigType.CAN_DROP]: "Everyone",
  [CreateWaveGroupConfigType.CAN_VOTE]: "Everyone",
  [CreateWaveGroupConfigType.CAN_CHAT]: "Everyone",
  [CreateWaveGroupConfigType.ADMIN]: "Only me",
};
