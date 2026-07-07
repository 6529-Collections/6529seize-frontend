import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiWaveCreditNft } from "@/generated/models/ApiWaveCreditNft";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { Time } from "@/helpers/time";
import type { CreateWaveConfig } from "@/types/waves.types";

export const CREATE_WAVE_VOTING_TYPE_PARAM = "votingType";
export const CREATE_WAVE_CARD_SET_TDH_TOKEN_PARAM = "cardSetTdhTokenId";

export type CreateWaveSearchParamValue = string | string[] | undefined;
export type CreateWaveSearchParams = Record<
  string,
  CreateWaveSearchParamValue
>;

const getFirstSearchParamValue = (
  value: CreateWaveSearchParamValue
): string | undefined => (Array.isArray(value) ? value[0] : value);

const parsePositiveInteger = (value: string | undefined): number | null => {
  if (value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getInitialCreateWaveConfig = ({
  type,
}: {
  readonly type: ApiWaveType;
}): CreateWaveConfig => {
  const now = Time.currentMillis();
  return {
    overview: {
      type,
      name: "",
      image: null,
    },
    groups: {
      canView: null,
      canDrop: null,
      canVote: null,
      canChat: null,
      admin: null,
    },
    chat: {
      enabled: true,
    },
    dates: {
      submissionStartDate: now,
      votingStartDate: now,
      endDate: type === ApiWaveType.Rank ? now : null,
      firstDecisionTime: now,
      subsequentDecisions: [],
      isRolling: false,
    },
    drops: {
      noOfApplicationsAllowedPerParticipant: null,
      requiredTypes: [],
      requiredMetadata: [],
      submissionStrategy: null,
      terms: null,
      signatureRequired: false,
      adminCanDeleteDrops: true,
    },
    voting: {
      type: ApiWaveCreditType.TdhPlusXtdh,
      creditScope: ApiWaveCreditScope.Wave,
      category: null,
      profileId: null,
      creditNfts: [],
      creditNftMemeCount: null,
      allowNegativeVotes: true,
      maxVotesPerIdentityPerDrop: null,
      winningThreshold: null,
      timeWeighted: {
        enabled: false,
        averagingInterval: 24,
        averagingIntervalUnit: "hours",
      },
    },
    outcomes: [],
    approval: {
      threshold: null,
      thresholdTimeMs: null,
      maxWinners: null,
    },
    display: {
      customRules: null,
      outcomesVisible: true,
      approve: {
        approvalsTabLabel: "",
        approvedTabLabel: "",
      },
    },
  };
};

export const getCreateCardTdhWaveHref = (tokenId: number): string => {
  const params = new URLSearchParams({
    [CREATE_WAVE_VOTING_TYPE_PARAM]: ApiWaveCreditType.CardSetTdh,
    [CREATE_WAVE_CARD_SET_TDH_TOKEN_PARAM]: String(tokenId),
  });

  return `/waves/create?${params.toString()}`;
};

export const getCreateCardTdhInitialConfig = (
  tokenId: number
): CreateWaveConfig => {
  const cardNft: ApiWaveCreditNft = {
    contract: MEMES_CONTRACT,
    token_id: tokenId,
  };
  const config = getInitialCreateWaveConfig({ type: ApiWaveType.Rank });

  return {
    ...config,
    voting: {
      ...config.voting,
      type: ApiWaveCreditType.CardSetTdh,
      creditNfts: [cardNft],
    },
  };
};

export const getCreateWaveInitialConfigFromSearchParams = (
  searchParams: CreateWaveSearchParams
): CreateWaveConfig | undefined => {
  const votingType = getFirstSearchParamValue(
    searchParams[CREATE_WAVE_VOTING_TYPE_PARAM]
  );

  if (votingType !== ApiWaveCreditType.CardSetTdh) {
    return undefined;
  }

  const tokenId = parsePositiveInteger(
    getFirstSearchParamValue(searchParams[CREATE_WAVE_CARD_SET_TDH_TOKEN_PARAM])
  );

  return tokenId === null ? undefined : getCreateCardTdhInitialConfig(tokenId);
};
