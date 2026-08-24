"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { getDefaultFirstDecisionTime } from "../services/waveDecisionService";
import { DEFAULT_PROPOSAL_CARD_RECIPE } from "@/helpers/waves/proposal-card.helpers";
import { useWaveGroupValidation } from "./useWaveGroupValidation";
import type { ApiWaveGroupRole } from "@/generated/models/ApiWaveGroupRole";

// Stable empty reference so the derived `errors` keeps identity while there
// is nothing to show (no surfaced errors), avoiding needless re-renders.
const EMPTY_VALIDATION_ERRORS: CREATE_WAVE_VALIDATION_ERROR[] = [];
const EMPTY_INVALID_GROUP_ROLES: ApiWaveGroupRole[] = [];

interface EndDateConfig {
  time: number | null;
  period: Period | null;
}

type PrivilegeGroupKey = "canDrop" | "canVote" | "canChat";

const getPrivilegeGroupDefaults = ({
  groupId,
  waveType,
  manuallySelected,
}: {
  readonly groupId: string;
  readonly waveType: ApiWaveType;
  readonly manuallySelected: ReadonlySet<PrivilegeGroupKey>;
}): Partial<CreateWaveConfig["groups"]> => {
  return {
    ...(!manuallySelected.has("canChat") ? { canChat: groupId } : {}),
    ...(waveType !== ApiWaveType.Chat && !manuallySelected.has("canDrop")
      ? { canDrop: groupId }
      : {}),
    ...(waveType !== ApiWaveType.Chat && !manuallySelected.has("canVote")
      ? { canVote: groupId }
      : {}),
  };
};

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
        typeSelected: true,
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
        firstDecisionTime: getDefaultFirstDecisionTime(now),
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
        proposalCards: {
          mode: "custom",
          excerptMaxCharacters:
            DEFAULT_PROPOSAL_CARD_RECIPE.excerptMaxCharacters,
          showMediaThumbnail: DEFAULT_PROPOSAL_CARD_RECIPE.showMediaThumbnail,
        },
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

  // Errors surfaced by the last failed forward-navigation attempt. Visible
  // errors are derived from these during render (below): a surfaced error
  // stays on screen only while it still fails, so fixing one field clears its
  // message without wiping the others, and none appear mid-typing.
  const [surfacedErrors, setSurfacedErrors] = useState<
    CREATE_WAVE_VALIDATION_ERROR[]
  >([]);
  // Bumped on every failed forward navigation; CreateWave watches it to
  // focus the first invalid field after the error state has committed.
  const [errorFocusRequest, setErrorFocusRequest] = useState(0);
  const [groupValidationErrorVisible, setGroupValidationErrorVisible] =
    useState(false);

  const [groupsCache, setGroupsCache] = useState<Record<string, ApiGroupFull>>(
    {}
  );
  // Manual privilege choices stay sticky while editing the current Wave type,
  // including an explicit "Public" selection represented by null.
  const manuallySelectedPrivilegeGroups = useRef<Set<PrivilegeGroupKey>>(
    new Set()
  );
  const navigationRequestId = useRef(0);

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
  const groupValidationQuery = useWaveGroupValidation(effectiveConfig);

  const replaceConfig = (nextConfig: CreateWaveConfig) => {
    manuallySelectedPrivilegeGroups.current.clear();
    const { canView } = nextConfig.groups;
    const privilegeGroups: readonly [
      PrivilegeGroupKey,
      string | null,
      boolean,
    ][] = [
      ["canChat", nextConfig.groups.canChat, nextConfig.chat.enabled],
      [
        "canDrop",
        nextConfig.groups.canDrop,
        nextConfig.overview.type !== ApiWaveType.Chat,
      ],
      [
        "canVote",
        nextConfig.groups.canVote,
        nextConfig.overview.type !== ApiWaveType.Chat,
      ],
    ];
    for (const [key, groupId, isActive] of privilegeGroups) {
      // A loaded privilege scope that differs from View represents an
      // intentional override. Matching scopes remain linked to future View
      // changes, which is the defaulting behavior users expect.
      if (isActive && groupId !== canView) {
        manuallySelectedPrivilegeGroups.current.add(key);
      }
    }
    setConfig(nextConfig);
  };

  // Update end date config when config changes
  useEffect(() => {
    if (config.dates.endDate === null) {
      setEndDateConfig({ time: null, period: null });
    }
  }, [config.dates.endDate]);

  // Visible errors: the surfaced ones that still fail against the current
  // config/step. Derived during render (not stored) so fixing a field drops
  // just that message and the rest stay until they resolve too.
  const errors = useMemo<CREATE_WAVE_VALIDATION_ERROR[]>(() => {
    if (surfacedErrors.length === 0) {
      return EMPTY_VALIDATION_ERRORS;
    }
    const currentErrors = new Set(
      getCreateWaveValidationErrors({ config: effectiveConfig, step })
    );
    return surfacedErrors.filter((error) => currentErrors.has(error));
  }, [surfacedErrors, effectiveConfig, step]);

  // Section state updates
  const setOverview = (overview: CreateWaveConfig["overview"]) => {
    const isTypeChange = config.overview.type !== overview.type;
    if (isTypeChange) {
      setEndDateConfig({ time: null, period: null });
      // The type change replaces the entire config (including group choices),
      // so the next type starts a fresh privilege-defaulting session too.
      manuallySelectedPrivilegeGroups.current.clear();
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

  const validateCurrentGroups = async (requestId: number): Promise<boolean> => {
    try {
      // An explicit refetch always goes to the server, even while the
      // background query data is still within its stale-time window.
      const validationResult = await groupValidationQuery.refetch();
      if (navigationRequestId.current !== requestId) {
        return false;
      }
      if (validationResult.isError || !validationResult.data?.valid) {
        const hasActionableRoleErrors =
          (validationResult.data?.invalid_roles.length ?? 0) > 0;
        setGroupValidationErrorVisible(
          validationResult.isError ||
            !validationResult.data ||
            !hasActionableRoleErrors
        );
        setErrorFocusRequest((count) => count + 1);
        return false;
      }
      return true;
    } catch {
      if (navigationRequestId.current !== requestId) {
        return false;
      }
      setGroupValidationErrorVisible(true);
      setErrorFocusRequest((count) => count + 1);
      return false;
    }
  };

  // Step navigation with validation
  const onStep = async ({
    step: newStep,
    direction,
  }: {
    readonly step: CreateWaveStep;
    readonly direction: "forward" | "backward";
  }) => {
    const requestId = ++navigationRequestId.current;
    if (direction === "forward") {
      const newErrors = getCreateWaveValidationErrors({
        config: effectiveConfig,
        step,
      });
      if (newErrors.length) {
        setSurfacedErrors(newErrors);
        setErrorFocusRequest((count) => count + 1);
        return;
      }
      if (
        step === CreateWaveStep.GROUPS &&
        effectiveConfig.groups.canView !== null
      ) {
        const groupsAreValid = await validateCurrentGroups(requestId);
        if (!groupsAreValid) {
          return;
        }
      }
    }
    setSurfacedErrors([]);
    setGroupValidationErrorVisible(false);
    setSelectedOutcomeType(null);
    setStep(newStep);
  };

  // Outcome type management
  const onOutcomeTypeChange = (outcomeType: CreateWaveOutcomeType | null) => {
    setSelectedOutcomeType(outcomeType);
    setSurfacedErrors([]);
  };

  // Group selection
  const onGroupSelect = ({
    group,
    groupType,
  }: {
    readonly group: ApiGroupFull | null;
    readonly groupType: CreateWaveGroupConfigType;
  }) => {
    setGroupValidationErrorVisible(false);
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
            ...(group
              ? getPrivilegeGroupDefaults({
                  groupId: group.id,
                  waveType: prev.overview.type,
                  manuallySelected: manuallySelectedPrivilegeGroups.current,
                })
              : {}),
          },
        }));
        break;
      case CreateWaveGroupConfigType.CAN_DROP:
        manuallySelectedPrivilegeGroups.current.add("canDrop");
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canDrop: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.CAN_VOTE:
        manuallySelectedPrivilegeGroups.current.add("canVote");
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canVote: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.CAN_CHAT:
        manuallySelectedPrivilegeGroups.current.add("canChat");
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
    replaceConfig,
    endDateConfig,
    setEndDateConfig,
    step,
    selectedOutcomeType,
    errors,
    errorFocusRequest,
    groupValidation: {
      invalidRoles:
        groupValidationQuery.data?.invalid_roles ?? EMPTY_INVALID_GROUP_ROLES,
      isFetching: groupValidationQuery.isFetching,
      unavailable: groupValidationErrorVisible,
    },
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
