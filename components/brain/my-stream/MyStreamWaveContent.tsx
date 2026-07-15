"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useSetWaveData } from "@/contexts/TitleContext";
import {
  type HeaderWaveDropAction,
  useHeaderContext,
} from "@/contexts/HeaderContext";
import { useContentTab } from "../ContentTabContext";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import MyStreamWaveChat from "./MyStreamWaveChat";
import MyStreamWaveCurationContent from "./curations/MyStreamWaveCurationContent";
import { useWaveData } from "@/hooks/useWaveData";
import MyStreamWaveLeaderboard from "./MyStreamWaveLeaderboard";
import MyStreamWaveSubmissions from "./MyStreamWaveSubmissions";
import MyStreamWaveOutcome from "./MyStreamWaveOutcome";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { WaveWinners } from "@/components/waves/winners/WaveWinners";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import { MyStreamWaveTab } from "@/types/waves.types";
import { MyStreamWaveTabs } from "./tabs/MyStreamWaveTabs";
import MyStreamWaveMyVotes from "./votes/MyStreamWaveMyVotes";
import MyStreamWaveFAQ from "./MyStreamWaveFAQ";
import MyStreamWaveSales from "./MyStreamWaveSales";
import MyStreamWavePolls from "./MyStreamWavePolls";
import {
  useWaveOutcomeVisibility,
  useWaveSubmissionButtonLabelOverride,
} from "@/hooks/waves/useWaveMetadata";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import { createBreakpoint } from "react-use";
import { getHomeRoute, getWaveHomeRoute } from "@/helpers/navigation.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { MEMES_NOMINEE_REQUIRED_REP } from "@/helpers/waves/memes-nomination";
import { useWaveViewMode } from "@/hooks/useWaveViewMode";
import { SubmissionStatus, useWave } from "@/hooks/useWave";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getDropQueryKey } from "@/services/api/drop-api";
import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";
import { getWaveDropEligibility } from "@/components/waves/leaderboard/dropEligibility";
import {
  resolveWaveSubmissionExperience,
  WaveSubmissionExperience,
} from "@/helpers/waves/wave-submission-experience.helpers";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { useEditingDrop } from "@/contexts/EditingDropContext";
import type {
  ChatSubmitDropAction,
  ChatSubmitDropState,
} from "./chatSubmitDrop.types";
import { getChatSubmitDropLabels } from "./chatSubmitDrop.types";

export interface MyStreamWaveProps {
  readonly waveId: string;
}

const getContentTabPanelId = (tab: MyStreamWaveTab): string =>
  `my-stream-wave-tabpanel-${tab.toLowerCase()}`;

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const getChatSubmitDropRestrictionMessage = ({
  dropEligibility,
  isApprovalVotingControlsLocked,
}: {
  readonly dropEligibility: ReturnType<typeof getWaveDropEligibility>;
  readonly isApprovalVotingControlsLocked: boolean;
}): string | null => {
  if (!dropEligibility.canCreateDrop) {
    return dropEligibility.restrictionMessage;
  }

  if (isApprovalVotingControlsLocked) {
    return "Approval controls are locked";
  }

  return null;
};

type MemesHeaderDropActionState = Pick<
  HeaderWaveDropAction,
  "canOpen" | "label" | "compactLabel" | "restrictionMessage"
>;

interface MemesHeaderParticipationState {
  readonly canSubmitNow: boolean;
  readonly endTime: number;
  readonly hasReachedLimit: boolean;
  readonly isEligible: boolean;
  readonly maxSubmissions: number | null;
  readonly startTime: number;
  readonly status: SubmissionStatus;
}

const getMemesSubmissionPeriodHeaderDropActionState = ({
  endTime,
  startTime,
  status,
}: Pick<
  MemesHeaderParticipationState,
  "endTime" | "startTime" | "status"
>): MemesHeaderDropActionState | null => {
  if (status === SubmissionStatus.ENDED) {
    const closingTime = endTime ? new Date(endTime).toLocaleString() : null;

    return {
      canOpen: false,
      label: "Submissions Closed",
      compactLabel: "Closed",
      restrictionMessage: closingTime
        ? `Submissions closed on ${closingTime}`
        : "Submissions are closed",
    };
  }

  if (status === SubmissionStatus.NOT_STARTED) {
    const openingTime = startTime ? new Date(startTime).toLocaleString() : null;

    return {
      canOpen: false,
      label: "Submissions Open Soon",
      compactLabel: "Opens",
      restrictionMessage: openingTime
        ? `Submissions open on ${openingTime}`
        : "Submissions will open soon",
    };
  }

  return null;
};

const getMemesHeaderDropActionState = ({
  participationState,
  isApprovalVotingControlsLocked,
}: {
  readonly participationState: MemesHeaderParticipationState;
  readonly isApprovalVotingControlsLocked: boolean;
}): MemesHeaderDropActionState => {
  if (isApprovalVotingControlsLocked) {
    return {
      canOpen: false,
      label: "Submit Work to The Memes",
      compactLabel: "Submit",
      restrictionMessage: "Approval controls are locked",
    };
  }

  const periodActionState =
    getMemesSubmissionPeriodHeaderDropActionState(participationState);
  if (periodActionState) {
    return periodActionState;
  }

  if (!participationState.isEligible) {
    return {
      canOpen: false,
      label: "How to Submit",
      compactLabel: "Submit",
      restrictionMessage: `Reach ${formatNumberWithCommas(MEMES_NOMINEE_REQUIRED_REP)} MemesNominee REP to become eligible to submit work.`,
    };
  }

  if (participationState.hasReachedLimit) {
    const maxSubmissions = participationState.maxSubmissions ?? "?";
    const submissionText =
      maxSubmissions === 1 ? "1 submission" : `${maxSubmissions} submissions`;

    return {
      canOpen: false,
      label: "Submission Limit Reached",
      compactLabel: "Limit",
      restrictionMessage: `You have already submitted the maximum allowed (${submissionText})`,
    };
  }

  if (!participationState.canSubmitNow) {
    return {
      canOpen: false,
      label: "Submit Work to The Memes",
      compactLabel: "Submit",
      restrictionMessage: "You cannot submit at this time",
    };
  }

  return {
    canOpen: true,
    label: "Submit Work to The Memes",
    compactLabel: "Submit",
    restrictionMessage: null,
  };
};

const MyStreamWaveContent: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { setWaveDropAction } = useHeaderContext();
  const {
    waves,
    directMessages,
    registerWave,
    serverFeedSeed: { completeInitialRegistration },
  } = useMyStream();
  const { updateEligibility } = useWaveEligibility();
  const { data: wave } = useWaveData({
    waveId,
    onWaveNotFound: () => {
      const params = new URLSearchParams(searchParams.toString() || "");
      params.delete("wave");
      const basePath = getWaveHomeRoute({
        isDirectMessage: pathname.startsWith("/messages"),
        isApp,
      });
      const newUrl = params.toString()
        ? `${basePath}?${params.toString()}`
        : basePath || getHomeRoute();
      router.push(newUrl, { scroll: false });
    },
  });
  const metadataWaveId = wave?.id;

  useEffect(() => {
    registerWave(waveId, true);
    completeInitialRegistration(waveId);
  }, [completeInitialRegistration, registerWave, waveId]);

  useEffect(() => {
    if (!metadataWaveId) {
      return;
    }

    markMobileLaunchStep("wave_metadata_loaded");
  }, [metadataWaveId]);

  useEffect(() => {
    if (!wave) {
      return;
    }

    updateEligibility(wave.id, {
      authenticated_user_eligible_to_chat:
        wave.chat.authenticated_user_eligible,
      authenticated_user_eligible_to_vote:
        wave.voting.authenticated_user_eligible,
      authenticated_user_eligible_to_participate:
        wave.participation.authenticated_user_eligible,
      authenticated_user_admin: wave.wave.authenticated_user_eligible_for_admin,
    });
  }, [updateEligibility, wave]);

  // Get enhanced data from the waves list (has correct WS-updated values)
  const enhancedData = useMemo(() => {
    const waveFromList =
      waves.list.find((w) => w.id === waveId) ??
      directMessages.list.find((w) => w.id === waveId);
    return {
      newDropsCount: waveFromList?.newDropsCount.count ?? 0,
      firstUnreadSerialNo: waveFromList?.firstUnreadDropSerialNo ?? null,
    };
  }, [waves.list, directMessages.list, waveId]);

  const newDropsCount = enhancedData.newDropsCount;

  // Update wave data in title context
  useSetWaveData(
    wave ? { name: wave.name, newItemsCount: newDropsCount } : null
  );

  // Create a stable key for proper remounting
  const stableWaveKey = `wave-${waveId}`;

  // Get the active tab and utilities from global context
  const { activeContentTab } = useContentTab();
  const activeCurationId = searchParams.get("curation");
  const loadedWaveId = wave?.id ?? null;
  const { editingDropId } = useEditingDrop();

  // View mode for chat/gallery toggle
  const { viewMode, setViewMode, toggleViewMode } = useWaveViewMode(waveId);

  // Get wave type info to determine if gallery toggle should be shown
  // Show for CHAT type waves (normal waves), hide for RANK, MEMES, and DMs
  const {
    isRankWave,
    isApproveWave,
    isMemesWave,
    isCurationWave,
    isQuorumWave,
    isDm,
    isChatWave,
    participation,
  } = useWave(wave);
  const {
    canSubmitNow: participationCanSubmitNow,
    endTime: participationEndTime,
    hasReachedLimit: participationHasReachedLimit,
    isEligible: participationIsEligible,
    maxSubmissions: participationMaxSubmissions,
    startTime: participationStartTime,
    status: participationStatus,
  } = participation;
  const { isVotingControlsLocked: isApprovalVotingControlsLocked } =
    useApprovalWaveStatus({ wave });
  const showGalleryToggle =
    !isRankWave && !isApproveWave && !isMemesWave && !isDm;
  const hasSerialTarget = searchParams.get("serialNo") !== null;
  const submissionExperience = useMemo(
    () =>
      resolveWaveSubmissionExperience({
        isMemesWave,
        isCurationWave,
        isQuorumWave,
        submissionStrategy: wave?.participation.submission_strategy ?? null,
      }),
    [
      isCurationWave,
      isMemesWave,
      isQuorumWave,
      wave?.participation.submission_strategy,
    ]
  );
  const isLoggedIn = Boolean(connectedProfile?.handle);
  const dropEligibility = useMemo(
    () =>
      getWaveDropEligibility({
        isLoggedIn,
        isProxy: Boolean(activeProfileProxy),
        isCurationWave,
        participation,
      }),
    [activeProfileProxy, isCurationWave, isLoggedIn, participation]
  );
  const chatSubmitDropRestrictionMessage = getChatSubmitDropRestrictionMessage({
    dropEligibility,
    isApprovalVotingControlsLocked,
  });
  const canOpenChatSubmitDrop =
    dropEligibility.canCreateDrop && !isApprovalVotingControlsLocked;
  const showChatSubmitDropAction =
    !isChatWave &&
    !isMemesWave &&
    submissionExperience !== WaveSubmissionExperience.MEMES_LEGACY;
  const customSubmissionButtonLabel = useWaveSubmissionButtonLabelOverride({
    enabled: showChatSubmitDropAction,
    waveId: loadedWaveId,
  });
  const chatSubmitDropLabels = getChatSubmitDropLabels(
    submissionExperience,
    customSubmissionButtonLabel
  );
  const isMemesLegacySubmission =
    submissionExperience === WaveSubmissionExperience.MEMES_LEGACY;
  const outcomesVisible = useWaveOutcomeVisibility(wave);
  const [chatSubmitDropState, setChatSubmitDropState] = useState<{
    readonly waveId: string;
    readonly submissionExperience: WaveSubmissionExperience;
    readonly initialCurationUrl: string | null;
    readonly isApprovalVotingControlsLocked: boolean;
  } | null>(null);
  const [appMemesSubmitWaveId, setAppMemesSubmitWaveId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (
      !wave ||
      !hasSerialTarget ||
      !showGalleryToggle ||
      viewMode !== "gallery"
    ) {
      return;
    }

    setViewMode("chat");
  }, [hasSerialTarget, setViewMode, showGalleryToggle, viewMode, wave]);

  useBreakpoint();

  // For handling clicks on drops
  const onDropClick = (drop: ExtendedDrop) => {
    queryClient.setQueryData<ApiDrop>(
      getDropQueryKey(drop.id),
      drop as ApiDrop
    );
    const params = new URLSearchParams(searchParams.toString() || "");
    params.set("drop", drop.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const openChatSubmitDrop = useCallback(
    (initialCurationUrl: string | null = null) => {
      if (!wave || !showChatSubmitDropAction || !canOpenChatSubmitDrop) {
        return;
      }

      setChatSubmitDropState({
        waveId: wave.id,
        submissionExperience,
        initialCurationUrl,
        isApprovalVotingControlsLocked,
      });
    },
    [
      canOpenChatSubmitDrop,
      isApprovalVotingControlsLocked,
      showChatSubmitDropAction,
      submissionExperience,
      wave,
    ]
  );

  const closeChatSubmitDrop = useCallback(() => {
    setChatSubmitDropState(null);
  }, []);

  const memesHeaderDropActionState = useMemo(
    () =>
      getMemesHeaderDropActionState({
        participationState: {
          canSubmitNow: participationCanSubmitNow,
          endTime: participationEndTime,
          hasReachedLimit: participationHasReachedLimit,
          isEligible: participationIsEligible,
          maxSubmissions: participationMaxSubmissions,
          startTime: participationStartTime,
          status: participationStatus,
        },
        isApprovalVotingControlsLocked,
      }),
    [
      isApprovalVotingControlsLocked,
      participationCanSubmitNow,
      participationEndTime,
      participationHasReachedLimit,
      participationIsEligible,
      participationMaxSubmissions,
      participationStartTime,
      participationStatus,
    ]
  );

  const canOpenAppMemesSubmit = memesHeaderDropActionState.canOpen;
  const openAppMemesSubmit = useCallback(() => {
    if (!loadedWaveId || !isMemesLegacySubmission || !canOpenAppMemesSubmit) {
      return;
    }

    setAppMemesSubmitWaveId(loadedWaveId);
  }, [canOpenAppMemesSubmit, isMemesLegacySubmission, loadedWaveId]);

  const closeAppMemesSubmit = useCallback(() => {
    setAppMemesSubmitWaveId(null);
  }, []);

  const chatSubmitDropAction = useMemo<ChatSubmitDropAction>(
    () => ({
      isVisible: showChatSubmitDropAction,
      canOpen: canOpenChatSubmitDrop,
      label: chatSubmitDropLabels.label,
      compactLabel: chatSubmitDropLabels.compactLabel,
      restrictionMessage: chatSubmitDropRestrictionMessage,
      onOpen: () => openChatSubmitDrop(null),
      onOpenWithCurationUrl: openChatSubmitDrop,
    }),
    [
      canOpenChatSubmitDrop,
      chatSubmitDropLabels.compactLabel,
      chatSubmitDropLabels.label,
      chatSubmitDropRestrictionMessage,
      openChatSubmitDrop,
      showChatSubmitDropAction,
    ]
  );

  const headerWaveDropAction = useMemo<HeaderWaveDropAction | null>(() => {
    if (
      !isApp ||
      !loadedWaveId ||
      editingDropId !== null ||
      activeContentTab !== MyStreamWaveTab.CHAT ||
      activeCurationId !== null ||
      (!isMemesLegacySubmission && !chatSubmitDropAction.isVisible)
    ) {
      return null;
    }

    if (isMemesLegacySubmission) {
      return {
        waveId: loadedWaveId,
        canOpen: memesHeaderDropActionState.canOpen,
        label: memesHeaderDropActionState.label,
        compactLabel: memesHeaderDropActionState.compactLabel,
        restrictionMessage: memesHeaderDropActionState.restrictionMessage,
        onOpen: openAppMemesSubmit,
      };
    }

    return {
      waveId: loadedWaveId,
      canOpen: chatSubmitDropAction.canOpen,
      label: chatSubmitDropAction.label,
      compactLabel: chatSubmitDropAction.compactLabel,
      restrictionMessage: chatSubmitDropAction.restrictionMessage,
      onOpen: chatSubmitDropAction.onOpen,
    };
  }, [
    activeContentTab,
    activeCurationId,
    chatSubmitDropAction,
    editingDropId,
    isApp,
    isMemesLegacySubmission,
    loadedWaveId,
    memesHeaderDropActionState,
    openAppMemesSubmit,
  ]);

  useEffect(() => {
    setWaveDropAction(headerWaveDropAction);
    return () => setWaveDropAction(null);
  }, [headerWaveDropAction, setWaveDropAction]);

  const onSelectCuration = (curationId: string | null) => {
    const params = new URLSearchParams(searchParams.toString() || "");

    if (curationId) {
      params.set("curation", curationId);
    } else {
      params.delete("curation");
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentQuery = searchParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    if (nextUrl === currentUrl) {
      return;
    }

    router.replace(nextUrl, { scroll: false });
  };

  // Early return if no wave data - all hooks must be called before this
  if (!wave) {
    return null;
  }

  const activeChatSubmitDropState: ChatSubmitDropState | null =
    chatSubmitDropState?.waveId === wave.id &&
    chatSubmitDropState.submissionExperience === submissionExperience &&
    chatSubmitDropState.isApprovalVotingControlsLocked ===
      isApprovalVotingControlsLocked
      ? {
          submissionExperience: chatSubmitDropState.submissionExperience,
          initialCurationUrl: chatSubmitDropState.initialCurationUrl,
        }
      : null;
  const isAppMemesSubmitModalOpen =
    appMemesSubmitWaveId === wave.id &&
    isMemesLegacySubmission &&
    !isApprovalVotingControlsLocked;
  // Create component instances with wave-specific props and stable measurements
  const components: Record<MyStreamWaveTab, React.ReactNode> = {
    [MyStreamWaveTab.CHAT]: (
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={enhancedData.firstUnreadSerialNo}
        viewMode={showGalleryToggle ? viewMode : "chat"}
        onDropClick={onDropClick}
        chatSubmitDrop={activeChatSubmitDropState}
        chatSubmitDropAction={chatSubmitDropAction}
        onCloseChatSubmitDrop={closeChatSubmitDrop}
      />
    ),
    [MyStreamWaveTab.LEADERBOARD]: (
      <MyStreamWaveLeaderboard
        key={wave.id}
        wave={wave}
        onDropClick={onDropClick}
      />
    ),
    [MyStreamWaveTab.SUBMISSIONS]: (
      <MyStreamWaveSubmissions wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.SALES]: <MyStreamWaveSales waveId={wave.id} />,
    [MyStreamWaveTab.WINNERS]: (
      <WaveWinners wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.OUTCOME]: outcomesVisible ? (
      <MyStreamWaveOutcome wave={wave} />
    ) : null,
    [MyStreamWaveTab.MY_VOTES]: (
      <MyStreamWaveMyVotes wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.POLLS]: (
      <MyStreamWavePolls wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.FAQ]: <MyStreamWaveFAQ wave={wave} />,
  };

  return (
    <div
      className="tailwind-scope tw-relative tw-flex tw-h-full tw-min-h-0 tw-min-w-0 tw-flex-col"
      key={stableWaveKey}
    >
      {/* Always render tab container (hidden on app inside MyStreamWaveTabs) */}
      <MyStreamWaveTabs
        wave={wave}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        showGalleryToggle={showGalleryToggle}
        activeCurationId={activeCurationId}
        onSelectCuration={onSelectCuration}
        chatSubmitDropAction={chatSubmitDropAction}
      />

      <div
        className="tw-relative tw-min-h-0 tw-min-w-0 tw-flex-grow tw-overflow-hidden"
        role="tabpanel"
        id={
          activeCurationId
            ? `my-stream-wave-tabpanel-curation-${activeCurationId}`
            : getContentTabPanelId(activeContentTab)
        }
      >
        {activeCurationId ? (
          <MyStreamWaveCurationContent
            key={activeCurationId}
            wave={wave}
            curationId={activeCurationId}
            onDropClick={onDropClick}
          />
        ) : (
          components[activeContentTab]
        )}
      </div>
      <MemesArtSubmissionModal
        isOpen={isAppMemesSubmitModalOpen}
        wave={wave}
        onClose={closeAppMemesSubmit}
      />
    </div>
  );
};

export default MyStreamWaveContent;
