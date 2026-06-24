"use client";

import { useAuth } from "@/components/auth/Auth";
import { CreateDropWaveWrapper } from "@/components/waves/CreateDropWaveWrapper";
import { WaveDropsAllWithoutProvider } from "@/components/waves/drops/wave-drops-all";
import { WaveGallery } from "@/components/waves/gallery";
import { WaveLeaderboardCurationDropModal } from "@/components/waves/leaderboard/create/WaveLeaderboardCurationDropModal";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
import PrivilegedDropCreator, {
  DropMode,
} from "@/components/waves/PrivilegedDropCreator";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import {
  UnreadDividerProvider,
  useUnreadDivider,
} from "@/contexts/wave/UnreadDividerContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getHomeRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useMarkWaveNotificationsRead } from "@/hooks/useMarkWaveNotificationsRead";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import type { WaveViewMode } from "@/hooks/useWaveViewMode";
import { selectEditingDropId } from "@/store/editSlice";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import {
  ACCEPTED_FILE_TYPE_LABELS,
  isSupportedUploadFile,
} from "@/services/uploads/mediaUploadMimeType";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useLayout } from "./layout/LayoutContext";
import { useWaveChatLeaveCleanup } from "./useWaveChatLeaveCleanup";
import { WaveChatSubmitDropModal } from "./WaveChatSubmitDropModal";
import type {
  ChatSubmitDropAction,
  ChatSubmitDropState,
} from "./chatSubmitDrop.types";

interface InitialDropState {
  readonly waveId: string;
  readonly serialNo: number;
  readonly dividerSerialNo: number | null;
}

interface MyStreamWaveChatProps {
  readonly wave: ApiWave;
  readonly firstUnreadSerialNo: number | null;
  readonly viewMode: WaveViewMode;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly chatSubmitDrop?: ChatSubmitDropState | null | undefined;
  readonly chatSubmitDropAction?: ChatSubmitDropAction | null | undefined;
  readonly onCloseChatSubmitDrop?: (() => void) | undefined;
}

interface WaveChatLeaveHandlerProps {
  readonly enabled: boolean;
  readonly waveId: string;
}

const MAX_UNSUPPORTED_FILE_NAMES_IN_TOAST = 3;
const noop = () => {};

const WaveChatLeaveHandler: React.FC<WaveChatLeaveHandlerProps> = ({
  enabled,
  waveId,
}) => {
  const { setUnreadDividerSerialNo } = useUnreadDivider();
  const { removeWaveDeliveredNotifications } = useNotificationsContext();
  const markWaveNotificationsRead = useMarkWaveNotificationsRead();

  useWaveChatLeaveCleanup({
    enabled,
    waveId,
    setUnreadDividerSerialNo,
    removeWaveDeliveredNotifications,
    markWaveNotificationsRead,
  });

  return null;
};

const MyStreamWaveChat: React.FC<MyStreamWaveChatProps> = ({
  wave,
  firstUnreadSerialNo,
  viewMode,
  onDropClick,
  chatSubmitDrop = null,
  chatSubmitDropAction = null,
  onCloseChatSubmitDrop,
}) => {
  const router = useRouter();
  const { fetchAroundSerialNo } = useMyStream();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense covered by MyStreamWave Suspense wrapper
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const galleryContainerRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);
  const externalAttachmentDropTokenRef = useRef(0);
  const { connectedProfile, setToast } = useAuth();
  const editingDropId = useSelector(selectEditingDropId);
  const { isApp } = useDeviceInfo();
  const [isDragDropActive, setIsDragDropActive] = useState(false);
  const [externalAttachmentDrop, setExternalAttachmentDrop] = useState<{
    readonly token: number;
    readonly files: File[];
  } | null>(null);

  const [activeDropState, setActiveDropState] = useState<{
    readonly waveId: string;
    readonly activeDrop: ActiveDropState | null;
  }>({
    waveId: wave.id,
    activeDrop: null,
  });

  const activeDrop =
    activeDropState.waveId === wave.id ? activeDropState.activeDrop : null;

  const setActiveDropForWave = (nextActiveDrop: ActiveDropState | null) => {
    setActiveDropState({ waveId: wave.id, activeDrop: nextActiveDrop });
  };

  const initialDropState = useMemo<InitialDropState | null>(() => {
    const dropParam = searchParams.get("serialNo");
    if (!dropParam) {
      return null;
    }

    const parsed = Number.parseInt(dropParam, 10);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    const dividerParam = searchParams.get("divider");
    const dividerParsed = dividerParam
      ? Number.parseInt(dividerParam, 10)
      : null;
    const dividerSerialNo =
      dividerParsed !== null && Number.isFinite(dividerParsed)
        ? dividerParsed
        : firstUnreadSerialNo;

    return {
      waveId: wave.id,
      serialNo: parsed,
      dividerSerialNo,
    };
  }, [searchParams, wave.id, firstUnreadSerialNo]);

  const [capturedDividerState] = useState<{
    readonly waveId: string;
    readonly serialNo: number | null;
  }>(() => {
    if (
      initialDropState?.waveId === wave.id &&
      initialDropState.dividerSerialNo !== null
    ) {
      return {
        waveId: wave.id,
        serialNo: initialDropState.dividerSerialNo,
      };
    }

    return {
      waveId: wave.id,
      serialNo: firstUnreadSerialNo,
    };
  });

  const scrollTarget =
    initialDropState?.waveId === wave.id ? initialDropState.serialNo : null;

  let dividerTarget = firstUnreadSerialNo;
  if (initialDropState?.waveId === wave.id) {
    dividerTarget = initialDropState.dividerSerialNo;
  } else if (capturedDividerState.waveId === wave.id) {
    dividerTarget = capturedDividerState.serialNo;
  }

  useEffect(() => {
    if (!initialDropState || viewMode === "gallery") {
      return;
    }

    fetchAroundSerialNo(wave.id, initialDropState.serialNo);
  }, [fetchAroundSerialNo, initialDropState, viewMode, wave.id]);

  useEffect(() => {
    if (!initialDropState || viewMode === "gallery") {
      return;
    }

    const params = new URLSearchParams(searchParams.toString() || "");
    if (!params.has("serialNo") && !params.has("divider")) {
      return;
    }
    params.delete("serialNo");
    params.delete("divider");
    const href = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || getHomeRoute();
    router.replace(href, { scroll: false });
  }, [initialDropState, pathname, router, searchParams, viewMode]);

  const { waveViewStyle } = useLayout();

  const containerClassName = useMemo(() => {
    const baseStyles =
      "tw-w-full tw-flex tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 scroll-shadow";

    const heightClass = "tw-flex-grow";

    return `${baseStyles} ${heightClass}`;
  }, []);

  const onReply = (drop: ApiDrop, partId: number) => {
    setActiveDropForWave({
      action: ActiveDropAction.REPLY,
      drop,
      partId,
    });
  };

  const handleReply = ({ drop, partId }: { drop: ApiDrop; partId: number }) => {
    onReply(drop, partId);
  };

  const onCancelReplyQuote = () => {
    setActiveDropForWave(null);
  };
  const {
    winningThreshold,
    winningThresholdMinDurationMs,
    isVotingClosed,
    isVotingControlsLocked,
  } = useApprovalWaveStatus({
    wave,
  });
  const fixedDropMode = DropMode.CHAT;
  const activeChatSubmitDropExperience =
    chatSubmitDrop?.submissionExperience ?? null;
  const showFixedParticipationSubmit =
    activeChatSubmitDropExperience !== null &&
    activeChatSubmitDropExperience !==
      WaveSubmissionExperience.CURATION_LEGACY &&
    activeChatSubmitDropExperience !== WaveSubmissionExperience.MEMES_LEGACY &&
    activeChatSubmitDropExperience !== WaveSubmissionExperience.QUORUM_PROPOSAL;
  const showQuorumProposalSubmit =
    activeChatSubmitDropExperience === WaveSubmissionExperience.QUORUM_PROPOSAL;
  const showCurationSubmitModal =
    activeChatSubmitDropExperience === WaveSubmissionExperience.CURATION_LEGACY;
  const closeChatSubmitDrop = onCloseChatSubmitDrop ?? noop;
  const chatCurationUrlSubmitHandler =
    chatSubmitDropAction?.isVisible === true
      ? chatSubmitDropAction.onOpenWithCurationUrl
      : undefined;
  const canSubmitChatCurationUrl =
    chatSubmitDropAction?.isVisible === true && chatSubmitDropAction.canOpen;
  const chatCurationUrlSubmitRestrictionMessage =
    chatSubmitDropAction?.isVisible === true
      ? chatSubmitDropAction.restrictionMessage
      : null;
  const isChatSubmitFlowOpen = activeChatSubmitDropExperience !== null;

  const shouldHandleContainerFileDrop = (
    event: React.DragEvent<HTMLElement>
  ): boolean => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return true;
    }

    return (
      target.closest(
        '[contenteditable="true"], input, textarea, [role="textbox"]'
      ) === null
    );
  };

  const isFileDragEvent = (event: React.DragEvent<HTMLElement>): boolean => {
    return Array.from(event.dataTransfer.types).includes("Files");
  };

  const filterSupportedFiles = (files: File[]) => {
    const supported: File[] = [];
    const unsupported: File[] = [];

    files.forEach((file) => {
      if (isSupportedUploadFile(file)) {
        supported.push(file);
      } else {
        unsupported.push(file);
      }
    });

    return { supported, unsupported };
  };

  const resetDragDropState = useCallback(() => {
    dragCounterRef.current = 0;
    setIsDragDropActive(false);
  }, []);

  useEffect(() => {
    globalThis.window.addEventListener("dragend", resetDragDropState);
    globalThis.window.addEventListener("drop", resetDragDropState);

    return () => {
      globalThis.window.removeEventListener("dragend", resetDragDropState);
      globalThis.window.removeEventListener("drop", resetDragDropState);
    };
  }, [resetDragDropState]);

  const onContainerDragEnter = (event: React.DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event) || !shouldHandleContainerFileDrop(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragDropActive(true);
  };

  const onContainerDragOver = (event: React.DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event) || !shouldHandleContainerFileDrop(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const onContainerDragLeave = (event: React.DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event) || !shouldHandleContainerFileDrop(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragDropActive(false);
    }
  };

  const onContainerDrop = (event: React.DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event) || !shouldHandleContainerFileDrop(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragDropActive(false);

    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length === 0) {
      return;
    }

    handleExternalAttachmentFiles(droppedFiles);
  };

  const formatUnsupportedFileNames = (unsupported: File[]): string => {
    const displayedNames = unsupported
      .slice(0, MAX_UNSUPPORTED_FILE_NAMES_IN_TOAST)
      .map((file) => file.name);
    const remainingCount = Math.max(
      0,
      unsupported.length - displayedNames.length
    );
    return remainingCount > 0
      ? `${displayedNames.join(", ")} and ${remainingCount} more`
      : displayedNames.join(", ");
  };

  const handleExternalAttachmentFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const { supported, unsupported } = filterSupportedFiles(files);

    if (supported.length > 0) {
      externalAttachmentDropTokenRef.current += 1;
      setExternalAttachmentDrop({
        token: externalAttachmentDropTokenRef.current,
        files: supported,
      });
    }

    if (unsupported.length > 0) {
      const unsupportedNames = formatUnsupportedFileNames(unsupported);
      setToast({
        message: `Unsupported file type: ${unsupportedNames}. Accepted Types: ${ACCEPTED_FILE_TYPE_LABELS}`,
        type: "error",
      });
    }
  };

  if (viewMode === "gallery") {
    return (
      <div
        ref={galleryContainerRef}
        className="tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-hidden"
        style={waveViewStyle}
      >
        <WaveGallery wave={wave} onDropClick={onDropClick} />
      </div>
    );
  }

  return (
    <UnreadDividerProvider
      initialSerialNo={dividerTarget ?? null}
      key={`unread-divider-${wave.id}`}
    >
      <WaveChatLeaveHandler
        enabled={Boolean(connectedProfile?.handle)}
        waveId={wave.id}
      />
      <section
        className={`${containerClassName} tw-relative`}
        style={waveViewStyle}
        aria-label="Wave chat file upload area"
        onDragEnter={onContainerDragEnter}
        onDragOver={onContainerDragOver}
        onDragLeave={onContainerDragLeave}
        onDrop={onContainerDrop}
      >
        {isDragDropActive && (
          <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-40 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-2 tw-border-dotted tw-border-primary-400 tw-bg-iron-900/75 tw-p-6">
            <div className="tw-max-w-3xl tw-p-4 tw-text-center">
              <p className="tw-text-base tw-font-semibold tw-text-primary-300">
                Drop files here
              </p>
              <p className="tw-mt-2 tw-text-xs tw-text-iron-300">
                Accepted types: {ACCEPTED_FILE_TYPE_LABELS}
              </p>
            </div>
          </div>
        )}
        <WaveDropsAllWithoutProvider
          key={wave.id}
          waveId={wave.id}
          wave={wave}
          onReply={handleReply}
          activeDrop={activeDrop}
          initialDrop={scrollTarget}
          dividerSerialNo={dividerTarget}
          unreadCount={wave.metrics.your_unread_drops_count}
          dropId={null}
          onDropContentClick={onDropClick}
          isMuted={wave.metrics.muted}
          winningThreshold={winningThreshold}
          winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          isVotingClosed={isVotingClosed}
          isVotingControlsLocked={isVotingControlsLocked}
        />
        {!(isApp && editingDropId) && (
          <div className="tw-mt-auto tw-bg-iron-950 tw-pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] lg:tw-pb-0">
            <CreateDropWaveWrapper>
              <PrivilegedDropCreator
                activeDrop={activeDrop}
                onCancelReplyQuote={onCancelReplyQuote}
                onDropAddedToQueue={onCancelReplyQuote}
                wave={wave}
                dropId={null}
                fixedDropMode={fixedDropMode}
                externalAttachmentDrop={externalAttachmentDrop}
                onExternalAttachmentDropConsumed={() =>
                  setExternalAttachmentDrop(null)
                }
                onSubmitCurationUrl={chatCurationUrlSubmitHandler}
                canSubmitCurationUrl={canSubmitChatCurationUrl}
                curationUrlSubmitRestrictionMessage={
                  chatCurationUrlSubmitRestrictionMessage
                }
                termsSignatureFlowEnabled={!isChatSubmitFlowOpen}
              />
            </CreateDropWaveWrapper>
          </div>
        )}
        {showFixedParticipationSubmit && (
          <WaveChatSubmitDropModal
            isOpen
            wave={wave}
            title="Submit drop"
            initialCurationUrl={chatSubmitDrop?.initialCurationUrl ?? null}
            onClose={closeChatSubmitDrop}
          />
        )}
        {showQuorumProposalSubmit && (
          <WaveDropCreate
            wave={wave}
            onCancel={closeChatSubmitDrop}
            onSuccess={closeChatSubmitDrop}
            onExitFixedDropMode={closeChatSubmitDrop}
            isModalContent
          />
        )}
        {showCurationSubmitModal && (
          <WaveLeaderboardCurationDropModal
            isOpen
            wave={wave}
            initialUrl={chatSubmitDrop?.initialCurationUrl ?? null}
            onClose={closeChatSubmitDrop}
          />
        )}
      </section>
    </UnreadDividerProvider>
  );
};

export default MyStreamWaveChat;
