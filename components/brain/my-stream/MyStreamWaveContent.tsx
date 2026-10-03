"use client";
import dynamic from "next/dynamic";

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
import { useDrop } from "@/hooks/useDrop";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import MyStreamWaveLeaderboard from "./MyStreamWaveLeaderboard";
import MyStreamWaveDesktopTabs from "./MyStreamWaveDesktopTabs";
import MyStreamWaveSubmissions from "./MyStreamWaveSubmissions";
import MyStreamWaveOutcome from "./MyStreamWaveOutcome";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { WaveWinners } from "@/components/waves/winners/WaveWinners";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import { MyStreamWaveTab } from "@/types/waves.types";
import BrainRightSidebarConfiguration from "@/components/brain/right-sidebar/BrainRightSidebarConfiguration";
import MyStreamWaveAbout from "./MyStreamWaveAbout";
import { useWaveContentTabRegistration } from "./useWaveContentTabRegistration";
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
import {
  getHomeRoute,
  getWaveHomeRoute,
  getWavePathRoute,
} from "@/helpers/navigation.helpers";
import { useWaveViewMode } from "@/hooks/useWaveViewMode";
import { useWave } from "@/hooks/useWave";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
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
import { isCompetitionPathname } from "@/helpers/competition.helpers";
import { useDefaultCompetitionNavigation } from "@/hooks/competitions/useDefaultCompetitionNavigation";
import { useCompetitionEvents } from "@/hooks/competitions/useCompetitionEvents";
import { DefaultCompetitionState } from "@/components/competitions/DefaultCompetitionState";
import { waveCompetitionTabs } from "@/helpers/default-competition.helpers";
import { useCompetitionNavigation } from "@/contexts/CompetitionNavigationContext";
import {
  getChatSubmitDropRestrictionMessage,
  getMemesHeaderDropActionState,
} from "./waveDropAction.helpers";

export interface MyStreamWaveProps {
  readonly waveId: string;
  readonly competitionContent?: React.ReactNode;
  readonly competitionOnly?: boolean;
}

const CompetitionHub = dynamic(
  () => import("@/components/competitions/CompetitionHub")
);

const getContentTabPanelId = (tab: MyStreamWaveTab): string =>
  `my-stream-wave-tabpanel-${tab.toLowerCase()}`;

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWaveContent: React.FC<MyStreamWaveProps> = ({
  waveId,
  competitionContent,
  competitionOnly = false,
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { flat } = useCompetitionNavigation();
  const { isApp } = useDeviceInfo();
  const queryClient = useQueryClient();
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, setToast } = useAuth();
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
  useWaveContentTabRegistration(wave, competitionOnly);
  const defaultNavigation = useDefaultCompetitionNavigation(
    wave,
    !competitionOnly
  );
  useCompetitionEvents(waveId, !competitionOnly);

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
  const currentWaveId = wave?.id ?? null;
  const currentWaveName = wave?.name ?? null;

  // Update wave data in title context
  const waveTitleData = useMemo(
    () =>
      currentWaveId === waveId && currentWaveName !== null
        ? {
            id: currentWaveId,
            name: currentWaveName,
            newItemsCount: newDropsCount,
          }
        : null,
    [currentWaveId, currentWaveName, newDropsCount, waveId]
  );
  useSetWaveData(waveTitleData);

  // Create a stable key for proper remounting
  const stableWaveKey = `wave-${waveId}`;

  // Get the active tab and utilities from global context
  const { activeContentTab, setActiveContentTab } = useContentTab();
  const activeCurationId = competitionOnly
    ? null
    : searchParams.get("curation");
  const loadedWaveId = wave?.id ?? null;
  const { editingDropId, setEditingDropId } = useEditingDrop();
  const requestedEditPostId = searchParams.get("editPost") ?? "";
  const { drop: requestedEditPost } = useDrop({
    dropId: requestedEditPostId,
    enabled: requestedEditPostId.length > 0,
  });

  useEffect(() => {
    if (!requestedEditPostId || !requestedEditPost) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString() || "");
    nextParams.delete("editPost");
    const nextQuery = nextParams.toString();
    const clearEditRequest = () => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    };
    const canEdit =
      requestedEditPost.wave.id === waveId &&
      requestedEditPost.drop_type !== ApiDropType.Participatory &&
      !activeProfileProxy &&
      areSameProfileIdentity({
        left: requestedEditPost.author,
        right: connectedProfile,
      });

    if (!canEdit) {
      clearEditRequest();
      setToast({
        type: "warning",
        message: t(locale, "profileCuration.actions.authorOnly"),
      });
      return;
    }

    setEditingDropId(requestedEditPost.id);
    clearEditRequest();
  }, [
    activeProfileProxy,
    connectedProfile,
    locale,
    pathname,
    requestedEditPost,
    requestedEditPostId,
    router,
    searchParams,
    setEditingDropId,
    setToast,
    waveId,
  ]);

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
    params.delete("default");
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
        restrictionKind: memesHeaderDropActionState.restrictionKind,
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
    const basePath =
      isCompetitionPathname(pathname) && curationId
        ? getWavePathRoute(waveId)
        : pathname;
    const nextUrl = nextQuery ? `${basePath}?${nextQuery}` : basePath;
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
    [MyStreamWaveTab.COMPETITIONS]: competitionContent ?? (
      <CompetitionHub waveId={wave.id} embedded />
    ),
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
    [MyStreamWaveTab.CONFIGURATION]: (
      <div className="tw-h-full tw-min-h-0 tw-overflow-y-auto">
        <BrainRightSidebarConfiguration wave={wave} />
      </div>
    ),
    [MyStreamWaveTab.ABOUT]: <MyStreamWaveAbout wave={wave} />,
  };

  const isResolvingCompetitionTab =
    defaultNavigation.resolve &&
    waveCompetitionTabs[activeContentTab] !== undefined;
  const isFlatCompetitionView = flat && isCompetitionPathname(pathname);
  let activeTabContent = components[activeContentTab];
  if (activeCurationId) {
    activeTabContent = (
      <MyStreamWaveCurationContent
        key={activeCurationId}
        wave={wave}
        curationId={activeCurationId}
        onDropClick={onDropClick}
      />
    );
  } else if (isFlatCompetitionView && competitionContent !== undefined) {
    activeTabContent = competitionContent;
  } else if (isResolvingCompetitionTab && !flat) {
    activeTabContent = (
      <DefaultCompetitionState selection={defaultNavigation.selection} />
    );
  }

  return (
    <div
      className="tailwind-scope tw-relative tw-flex tw-h-full tw-min-h-0 tw-min-w-0 tw-flex-col"
      key={stableWaveKey}
    >
      {competitionOnly ? (
        <div className="tw-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950">
          <MyStreamWaveDesktopTabs
            wave={wave}
            activeTab={activeContentTab}
            setActiveTab={setActiveContentTab}
            activeCurationId={null}
            onSelectCuration={() => {}}
            showCreateActionsMenu={false}
            competitionOnly
          />
        </div>
      ) : (
        <MyStreamWaveTabs
          wave={wave}
          viewMode={viewMode}
          onToggleViewMode={toggleViewMode}
          showGalleryToggle={showGalleryToggle}
          activeCurationId={activeCurationId}
          onSelectCuration={onSelectCuration}
          chatSubmitDropAction={chatSubmitDropAction}
        />
      )}

      {defaultNavigation.resolve &&
        !isResolvingCompetitionTab &&
        defaultNavigation.selection.isError && (
          <DefaultCompetitionState selection={defaultNavigation.selection} />
        )}

      <div
        className="tw-relative tw-min-h-0 tw-min-w-0 tw-flex-grow tw-overflow-hidden"
        role={isApp && flat ? "region" : "tabpanel"}
        aria-label={isApp && flat ? wave.name : undefined}
        id={
          activeCurationId
            ? `my-stream-wave-tabpanel-curation-${activeCurationId}`
            : getContentTabPanelId(activeContentTab)
        }
      >
        {activeTabContent}
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
