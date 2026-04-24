"use client";

import { useAuth } from "@/components/auth/Auth";
import { CreateDropWaveWrapper } from "@/components/waves/CreateDropWaveWrapper";
import { WaveDropsAllWithoutProvider } from "@/components/waves/drops/wave-drops-all";
import { WaveGallery } from "@/components/waves/gallery";
import MobileMemesArtSubmissionBtn from "@/components/waves/memes/submission/MobileMemesArtSubmissionBtn";
import PrivilegedDropCreator, {
  DropMode,
} from "@/components/waves/PrivilegedDropCreator";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  UnreadDividerProvider,
  useUnreadDivider,
} from "@/contexts/wave/UnreadDividerContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getHomeRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  resolveWaveSubmissionExperience,
  WaveSubmissionExperience,
} from "@/helpers/waves/wave-submission-experience.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import type { WaveViewMode } from "@/hooks/useWaveViewMode";
import { selectEditingDropId } from "@/store/editSlice";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import {
  API_MEDIA_UPLOAD_MIME_TYPE_VALUES,
  getContentType,
  toApiMediaUploadMimeType,
} from "@/services/uploads/mediaUploadMimeType";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLayout } from "./layout/LayoutContext";
import { ApiMediaUploadMimeType } from "@/generated/models/ApiMediaUploadMimeType";

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
}

interface WaveChatLeaveHandlerProps {
  readonly enabled: boolean;
  readonly waveId: string;
}

const WaveChatLeaveHandler: React.FC<WaveChatLeaveHandlerProps> = ({
  enabled,
  waveId,
}) => {
  const { setUnreadDividerSerialNo } = useUnreadDivider();
  const { removeWaveDeliveredNotifications } = useNotificationsContext();
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return () => {
      setUnreadDividerSerialNo(null);
      void (async () => {
        try {
          await Promise.resolve(removeWaveDeliveredNotifications(waveId));
        } catch (error: unknown) {
          console.error(
            "Failed to remove wave delivered notifications:",
            error
          );
        }

        try {
          await commonApiPostWithoutBodyAndResponse({
            endpoint: `notifications/wave/${waveId}/read`,
          });
          invalidateNotifications();
        } catch (error: unknown) {
          console.error("Failed to mark feed as read:", error);
        }
      })();
    };
  }, [
    enabled,
    waveId,
    setUnreadDividerSerialNo,
    removeWaveDeliveredNotifications,
    invalidateNotifications,
  ]);

  return null;
};

const FILE_TYPE_LABEL_RULES: ReadonlyArray<{
  readonly label: string;
  readonly matches: (mimeType: string) => boolean;
}> = [
  { label: "Image", matches: (m) => m.startsWith("image/") },
  { label: "Video", matches: (m) => m.startsWith("video/") },
  { label: "Audio", matches: (m) => m.startsWith("audio/") },
  { label: "3D Model", matches: (m) => m.startsWith("model/") },
  { label: "PDF", matches: (m) => m === ApiMediaUploadMimeType.ApplicationPdf },
  { label: "CSV", matches: (m) => m === ApiMediaUploadMimeType.TextCsv },
];

const ACCEPTED_FILE_TYPE_LABELS = FILE_TYPE_LABEL_RULES.filter((rule) =>
  API_MEDIA_UPLOAD_MIME_TYPE_VALUES.some(rule.matches)
)
  .map((rule) => rule.label)
  .join(", ");

const MyStreamWaveChat: React.FC<MyStreamWaveChatProps> = ({
  wave,
  firstUnreadSerialNo,
  viewMode,
  onDropClick,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const externalAttachmentDropTokenRef = useRef(0);
  const { connectedProfile, setToast } = useAuth();
  const { isMemesWave, isCurationWave, isQuorumWave } = useWave(wave);
  const submissionExperience = resolveWaveSubmissionExperience({
    isMemesWave,
    isCurationWave,
    isQuorumWave,
    submissionStrategy: wave.participation.submission_strategy ?? null,
  });
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

  const isFileDragEvent = (event: React.DragEvent<HTMLDivElement>): boolean => {
    return Array.from(event.dataTransfer.types).includes("Files");
  };

  const filterSupportedFiles = (files: File[]) => {
    const supported: File[] = [];
    const unsupported: File[] = [];

    files.forEach((file) => {
      const normalizedMimeType = toApiMediaUploadMimeType(getContentType(file));
      if (normalizedMimeType) {
        supported.push(file);
      } else {
        unsupported.push(file);
      }
    });

    return { supported, unsupported };
  };

  const onContainerDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDragEvent(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragDropActive(true);
  };

  const onContainerDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDragEvent(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const onContainerDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDragEvent(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragDropActive(false);
    }
  };

  const onContainerDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDragEvent(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragDropActive(false);

    const droppedFiles = Array.from(event.dataTransfer.files ?? []);
    if (droppedFiles.length === 0) {
      return;
    }

    handleExternalAttachmentFiles(droppedFiles);
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
      const unsupportedNames = unsupported.map((file) => file.name).join(", ");
      setToast({
        message: `Unsupported file type: ${unsupportedNames}. Accepted Types: ${ACCEPTED_FILE_TYPE_LABELS}`,
        type: "error",
      });
    }
  };

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    handleExternalAttachmentFiles(selectedFiles);
    event.target.value = "";
  };

  const onContainerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const onContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      fileInputRef.current?.click();
    }
  };

  if (viewMode === "gallery") {
    return (
      <div
        ref={containerRef}
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
      <div
        ref={containerRef}
        className={`${containerClassName} tw-relative`}
        style={waveViewStyle}
        role="button"
        tabIndex={0}
        aria-label="Wave chat file upload area"
        onKeyDown={onContainerKeyDown}
        onClick={onContainerClick}
        onDragEnter={onContainerDragEnter}
        onDragOver={onContainerDragOver}
        onDragLeave={onContainerDragLeave}
        onDrop={onContainerDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="tw-hidden"
          accept={API_MEDIA_UPLOAD_MIME_TYPE_VALUES.join(",")}
          onChange={onFileInputChange}
          tabIndex={-1}
          aria-hidden="true"
        />
        {isDragDropActive && (
          <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-40 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-2 tw-border-dotted tw-border-primary-400 tw-bg-iron-900/95 tw-p-6">
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
          onReply={handleReply}
          activeDrop={activeDrop}
          initialDrop={scrollTarget}
          dividerSerialNo={dividerTarget}
          unreadCount={wave.metrics.your_unread_drops_count}
          dropId={null}
          isMuted={wave.metrics.muted}
        />
        {!(isApp && editingDropId) && (
          <div className="tw-mt-auto">
            <CreateDropWaveWrapper>
              <PrivilegedDropCreator
                activeDrop={activeDrop}
                onCancelReplyQuote={onCancelReplyQuote}
                onDropAddedToQueue={onCancelReplyQuote}
                wave={wave}
                dropId={null}
                fixedDropMode={DropMode.BOTH}
                externalAttachmentDrop={externalAttachmentDrop}
              />
            </CreateDropWaveWrapper>
          </div>
        )}
        {submissionExperience === WaveSubmissionExperience.MEMES_LEGACY && (
          <MobileMemesArtSubmissionBtn wave={wave} />
        )}
      </div>
    </UnreadDividerProvider>
  );
};

export default MyStreamWaveChat;
