"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CreateWaveConfig,
  CreateWaveOutcomeType,
  TimeWeightedVotingSettings,
} from "@/types/waves.types";
import { CreateWaveGroupConfigType, CreateWaveStep } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { Time } from "@/helpers/time";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ApiWaveCreditNft } from "@/generated/models/ApiWaveCreditNft";
import type { Period } from "../types/period";
import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { getCreateWaveValidationErrors } from "@/helpers/waves/create-wave.validation";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { useMemeCardCount } from "./useMemeCardCount";

interface EndDateConfig {
  time: number | null;
  period: Period | null;
}

export function useWaveConfig() {
  const initialType = ApiWaveType.Chat;
  const initialStep = CreateWaveStep.OVERVIEW;

  // Get initial config for a wave type
  const getInitialConfig = ({
    type,
  }: {
    readonly type: ApiWaveType;
  }): CreateWaveConfig => {
    const now = Time.currentMillis();
    return {
      overview: {
        type,
        typeSelected: false,
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
        ongoingRanking: false,
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
        submissionButtonLabel: null,
        approve: {
          approvalsTabLabel: "",
          approvedTabLabel: "",
        },
      },
    };
  };

  // State management
  const [config, setConfig] = useState<CreateWaveConfig>(
    getInitialConfig({
      type: initialType,
    })
  );

  const [endDateConfig, setEndDateConfig] = useState<EndDateConfig>({
    time: null,
    period: null,
  });

  const [step, setStep] = useState<CreateWaveStep>(initialStep);
  const [selectedOutcomeType, setSelectedOutcomeType] =
    useState<CreateWaveOutcomeType | null>(null);

  const [errors, setErrors] = useState<CREATE_WAVE_VALIDATION_ERROR[]>([]);
  // Bumped on every failed forward navigation; CreateWave watches it to
  // focus the first invalid field after the error state has committed.
  const [errorFocusRequest, setErrorFocusRequest] = useState(0);

  const [groupsCache, setGroupsCache] = useState<Record<string, ApiGroupFull>>(
    {}
  );

  const shouldLoadMemeCount =
    config.voting.type === ApiWaveCreditType.CardSetTdh;
  const memeCountQuery = useMemeCardCount({ enabled: shouldLoadMemeCount });
  const memeCount =
    shouldLoadMemeCount && !memeCountQuery.isError
      ? (memeCountQuery.data ?? null)
      : null;

  const effectiveConfig = useMemo<CreateWaveConfig>(() => {
    if (config.voting.creditNftMemeCount === memeCount) {
      return config;
    }

    return {
      ...config,
      voting: {
        ...config.voting,
        creditNftMemeCount: memeCount,
      },
    };
  }, [config, memeCount]);

  // Update end date config when config changes
  useEffect(() => {
    if (config.dates.endDate === null) {
      setEndDateConfig({ time: null, period: null });
    }
  }, [config.dates.endDate]);

  // Re-validate visible errors when config changes: drop the ones the user
  // has fixed but keep the rest on screen. Wiping all of them on any change
  // meant fixing one field hid every other pending error message. New errors
  // are still only introduced on a forward-step attempt, never mid-typing.
  useEffect(() => {
    setErrors((previousErrors) => {
      if (previousErrors.length === 0) {
        return previousErrors;
      }
      const currentErrors = new Set(
        getCreateWaveValidationErrors({ config: effectiveConfig, step })
      );
      const remainingErrors = previousErrors.filter((error) =>
        currentErrors.has(error)
      );
      return remainingErrors.length === previousErrors.length
        ? previousErrors
        : remainingErrors;
    });
  }, [effectiveConfig, step]);

  // Section state updates
  const setOverview = (overview: CreateWaveConfig["overview"]) => {
    const isTypeChange = config.overview.type !== overview.type;
    if (isTypeChange) {
      setEndDateConfig({ time: null, period: null });
    }
    setConfig((prev) => {
      if (prev.overview.type === overview.type) {
        return {
          ...prev,
          overview,
        };
      }

      return {
        ...getInitialConfig({ type: overview.type }),
        overview,
      };
    });
  };

  const setDates = (dates: CreateWaveConfig["dates"]) => {
    setConfig((prev) => ({
      ...prev,
      dates,
    }));
  };

  const setDrops = (drops: CreateWaveConfig["drops"]) => {
    setConfig((prev) => ({
      ...prev,
      drops,
    }));
  };

  const setDropsAdminCanDelete = (adminCanDeleteDrops: boolean) => {
    setConfig((prev) => ({
      ...prev,
      drops: {
        ...prev.drops,
        adminCanDeleteDrops,
      },
    }));
  };

  const setOutcomes = (outcomes: CreateWaveConfig["outcomes"]) => {
    setConfig((prev) => ({
      ...prev,
      outcomes,
    }));
  };

  const setDisplay = (display: CreateWaveConfig["display"]) => {
    setConfig((prev) => ({
      ...prev,
      display,
    }));
  };

  // Step navigation with validation
  const onStep = ({
    step: newStep,
    direction,
  }: {
    readonly step: CreateWaveStep;
    readonly direction: "forward" | "backward";
  }) => {
    if (direction === "forward") {
      const newErrors = getCreateWaveValidationErrors({
        config: effectiveConfig,
        step,
      });
      if (newErrors.length) {
        setErrors(newErrors);
        setErrorFocusRequest((count) => count + 1);
        return;
      }
    }
    setErrors([]);
    setSelectedOutcomeType(null);
    setStep(newStep);
  };

  // Outcome type management
  const onOutcomeTypeChange = (outcomeType: CreateWaveOutcomeType | null) => {
    setSelectedOutcomeType(outcomeType);
    setErrors([]);
  };

  // Group selection
  const onGroupSelect = ({
    group,
    groupType,
  }: {
    readonly group: ApiGroupFull | null;
    readonly groupType: CreateWaveGroupConfigType;
  }) => {
    if (group) {
      setGroupsCache((prev) => ({
        ...prev,
        [group.id]: group,
      }));
    }
    switch (groupType) {
      case CreateWaveGroupConfigType.CAN_VIEW:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canView: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.CAN_DROP:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canDrop: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.CAN_VOTE:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canVote: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.CAN_CHAT:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canChat: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.ADMIN:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            admin: group?.id ?? null,
          },
        }));
        break;
      default:
        assertUnreachable(groupType);
    }
  };

  // Voting type changes
  const onVotingTypeChange = (type: ApiWaveCreditType) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        type,
        creditScope: prev.voting.creditScope,
        category: null,
        profileId: null,
        creditNfts:
          type === ApiWaveCreditType.CardSetTdh ? prev.voting.creditNfts : [],
        creditNftMemeCount: null,
        allowNegativeVotes: prev.voting.allowNegativeVotes,
        maxVotesPerIdentityPerDrop: prev.voting.maxVotesPerIdentityPerDrop,
        winningThreshold: prev.voting.winningThreshold,
        timeWeighted: prev.voting.timeWeighted,
      },
    }));
  };

  const onTimeWeightedVotingChange = (
    timeWeighted: TimeWeightedVotingSettings
  ) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        timeWeighted,
      },
    }));
  };

  const onChatEnabledChange = (enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      chat: {
        enabled,
      },
    }));
  };

  const onCategoryChange = (category: string | null) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        category,
      },
    }));
  };

  const onProfileIdChange = (profileId: string | null) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        profileId,
      },
    }));
  };

  const onCreditNftsChange = (creditNfts: ApiWaveCreditNft[]) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        creditNfts,
      },
    }));
  };

  const onCreditScopeChange = (creditScope: ApiWaveCreditScope) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        creditScope,
      },
    }));
  };

  const onMaxVotesPerIdentityPerDropChange = (
    maxVotesPerIdentityPerDrop: number | null
  ) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        maxVotesPerIdentityPerDrop,
      },
    }));
  };

  const onAllowNegativeVotesChange = (allowNegativeVotes: boolean) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        allowNegativeVotes,
      },
    }));
  };

  const onWinningThresholdChange = (winningThreshold: number | null) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        winningThreshold,
      },
    }));
  };

  const onThresholdChange = (threshold: number | null) => {
    setConfig((prev) => ({
      ...prev,
      approval: {
        ...prev.approval,
        threshold,
      },
    }));
  };

  const onThresholdTimeChange = (thresholdTimeMs: number | null) => {
    setConfig((prev) => ({
      ...prev,
      approval: {
        ...prev.approval,
        thresholdTimeMs,
      },
    }));
  };

  const onApprovalMaxWinnersChange = (maxWinners: number | null) => {
    setConfig((prev) => ({
      ...prev,
      approval: {
        ...prev.approval,
        maxWinners,
      },
    }));
  };

  return {
    config: effectiveConfig,
    setConfig,
    endDateConfig,
    setEndDateConfig,
    step,
    selectedOutcomeType,
    errors,
    errorFocusRequest,
    groupsCache,
    isMemeCountLoading: shouldLoadMemeCount && memeCountQuery.isLoading,
    isMemeCountError: shouldLoadMemeCount && memeCountQuery.isError,
    // Section updaters
    setOverview,
    setDates,
    setDrops,
    setDropsAdminCanDelete,
    setOutcomes,
    setDisplay,
    // Navigation
    onStep,
    // Outcome management
    onOutcomeTypeChange,
    // Group handling
    onGroupSelect,
    // Voting
    onVotingTypeChange,
    onCategoryChange,
    onProfileIdChange,
    onCreditNftsChange,
    onCreditScopeChange,
    onMaxVotesPerIdentityPerDropChange,
    onAllowNegativeVotesChange,
    onTimeWeightedVotingChange,
    onWinningThresholdChange,
    onThresholdChange,
    onThresholdTimeChange,
    onApprovalMaxWinnersChange,
    // Chat
    onChatEnabledChange,
  };
}
