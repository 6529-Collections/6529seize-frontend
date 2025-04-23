import { useEffect, useState } from "react";
import { 
  CreateWaveConfig, 
  CreateWaveGroupConfigType, 
  CreateWaveOutcomeType, 
  CreateWaveStep, 
  TimeWeightedVotingSettings, 
} from "../../../../types/waves.types";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { Time } from "../../../../helpers/time";
import { ApiGroupFull } from "../../../../generated/models/ApiGroupFull";
import { ApiWaveCreditType } from "../../../../generated/models/ApiWaveCreditType";
import { Period } from "../types/period";
import { getCreateWaveValidationErrors, CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.validation";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";

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
        endDate: null,
        firstDecisionTime: now,
        subsequentDecisions: [],
        isRolling: false,
      },
      drops: {
        noOfApplicationsAllowedPerParticipant: null,
        requiredTypes: [],
        requiredMetadata: [],
        terms: null,
        signatureRequired: false,
        adminCanDeleteDrops: false,
      },
      voting: {
        type: ApiWaveCreditType.Tdh,
        category: null,
        profileId: null,
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
  
  const [groupsCache, setGroupsCache] = useState<Record<string, ApiGroupFull>>({});

  // Update end date config when config changes
  useEffect(() => {
    if (config.dates.endDate === null) {
      setEndDateConfig({ time: null, period: null });
    }
  }, [config.dates.endDate]);

  // Clear errors when config changes
  useEffect(() => {
    setErrors([]);
  }, [config]);

  // Section state updates
  const setOverview = (overview: CreateWaveConfig["overview"]) => {
    setConfig((prev) => ({
      ...getInitialConfig({ type: overview.type }),
      overview,
    }));
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

  // Step navigation with validation
  const onStep = ({
    step: newStep,
    direction,
  }: {
    readonly step: CreateWaveStep;
    readonly direction: "forward" | "backward";
  }) => {
    if (direction === "forward") {
      const newErrors = getCreateWaveValidationErrors({ config, step });
      if (newErrors.length) {
        setErrors(newErrors);
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
        category: null,
        profileId: null,
        timeWeighted: prev.voting.timeWeighted,
      },
    }));
  };
  
  const onTimeWeightedVotingChange = (timeWeighted: TimeWeightedVotingSettings) => {
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

  return {
    config,
    setConfig,
    endDateConfig,
    setEndDateConfig,
    step,
    selectedOutcomeType,
    errors,
    groupsCache,
    // Section updaters
    setOverview,
    setDates,
    setDrops,
    setDropsAdminCanDelete,
    setOutcomes,
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
    onTimeWeightedVotingChange,
    // Approval
    onThresholdChange,
    onThresholdTimeChange,
    // Chat
    onChatEnabledChange,
  };
}
