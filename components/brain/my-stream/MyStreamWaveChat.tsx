"use client";

import { CreateDropWaveWrapper } from "@/components/waves/CreateDropWaveWrapper";
import { WaveDropsAllWithoutProvider } from "@/components/waves/drops/wave-drops-all";
import { WaveGallery } from "@/components/waves/gallery";
import MobileMemesArtSubmissionBtn from "@/components/waves/memes/submission/MobileMemesArtSubmissionBtn";
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
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import type { WaveViewMode } from "@/hooks/useWaveViewMode";
import { selectEditingDropId } from "@/store/editSlice";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLayout } from "./layout/LayoutContext";

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
  readonly waveId: string;
}

const WaveChatLeaveHandler: React.FC<WaveChatLeaveHandlerProps> = ({
  waveId,
}) => {
  const { setUnreadDividerSerialNo } = useUnreadDivider();
  const { removeWaveDeliveredNotifications } = useNotificationsContext();

  useEffect(() => {
    return () => {
      setUnreadDividerSerialNo(null);
      void (async () => {
        try {
          await Promise.resolve(removeWaveDeliveredNotifications(waveId));
          await commonApiPostWithoutBodyAndResponse({
            endpoint: `notifications/wave/${waveId}/read`,
          });
        } catch (error: unknown) {
          console.error("Failed to mark feed as read:", error);
        }
      })();
    };
  }, [waveId, setUnreadDividerSerialNo, removeWaveDeliveredNotifications]);

  return null;
};

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
  const { isMemesWave } = useWave(wave);
  const editingDropId = useSelector(selectEditingDropId);
  const { isApp } = useDeviceInfo();

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
    if (!initialDropState) {
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
  }, [initialDropState, searchParams, router, pathname]);

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

  const onQuote = (drop: ApiDrop, partId: number) => {
    setActiveDropForWave({
      action: ActiveDropAction.QUOTE,
      drop,
      partId,
    });
  };

  const handleReply = ({ drop, partId }: { drop: ApiDrop; partId: number }) => {
    onReply(drop, partId);
  };

  const handleQuote = ({ drop, partId }: { drop: ApiDrop; partId: number }) => {
    onQuote(drop, partId);
  };

  const onCancelReplyQuote = () => {
    setActiveDropForWave(null);
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
      <WaveChatLeaveHandler waveId={wave.id} />
      <div
        ref={containerRef}
        className={`${containerClassName}`}
        style={waveViewStyle}
      >
        <WaveDropsAllWithoutProvider
          key={wave.id}
          waveId={wave.id}
          onReply={handleReply}
          onQuote={handleQuote}
          activeDrop={activeDrop}
          initialDrop={scrollTarget}
          dividerSerialNo={dividerTarget}
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
              />
            </CreateDropWaveWrapper>
          </div>
        )}
        {isMemesWave && <MobileMemesArtSubmissionBtn wave={wave} />}
      </div>
    </UnreadDividerProvider>
  );
};

export default MyStreamWaveChat;
