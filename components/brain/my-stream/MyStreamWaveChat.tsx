"use client";

import { CreateDropWaveWrapper } from "@/components/waves/CreateDropWaveWrapper";
import WaveDropsAll from "@/components/waves/drops/wave-drops-all";
import MobileMemesArtSubmissionBtn from "@/components/waves/memes/submission/MobileMemesArtSubmissionBtn";
import PrivilegedDropCreator, {
  DropMode,
} from "@/components/waves/PrivilegedDropCreator";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiWave } from "@/generated/models/ApiWave";
import { getHomeFeedRoute } from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { selectEditingDropId } from "@/store/editSlice";
import {
  ActiveDropAction,
  ActiveDropState,
} from "@/types/dropInteractionTypes";
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
}

const MyStreamWaveChat: React.FC<MyStreamWaveChatProps> = ({
  wave,
  firstUnreadSerialNo,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialDropState, setInitialDropState] =
    useState<InitialDropState | null>(null);
  const { isMemesWave } = useWave(wave);
  const editingDropId = useSelector(selectEditingDropId);
  const { isApp } = useDeviceInfo();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);

  const scrollTarget =
    initialDropState?.waveId === wave.id ? initialDropState.serialNo : null;

  const dividerTarget =
    initialDropState?.waveId === wave.id
      ? initialDropState.dividerSerialNo
      : firstUnreadSerialNo;

  useEffect(() => {
    const dropParam = searchParams?.get("serialNo");
    if (!dropParam) {
      return;
    }

    const parsed = Number.parseInt(dropParam, 10);
    if (!Number.isFinite(parsed)) {
      return;
    }

    const dividerParam = searchParams?.get("divider");
    const dividerParsed = dividerParam
      ? Number.parseInt(dividerParam, 10)
      : null;
    const dividerSerialNo =
      dividerParsed !== null && Number.isFinite(dividerParsed)
        ? dividerParsed
        : firstUnreadSerialNo;

    setInitialDropState({
      waveId: wave.id,
      serialNo: parsed,
      dividerSerialNo,
    });

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("serialNo");
    params.delete("divider");
    const href = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || getHomeFeedRoute();
    router.replace(href, { scroll: false });
  }, [searchParams, router, pathname, wave.id, firstUnreadSerialNo]);

  const { waveViewStyle } = useLayout();

  // Create container class based on wave type
  const containerClassName = useMemo(() => {
    const baseStyles =
      "tw-w-full tw-flex tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 scroll-shadow";

    // Always use flex-grow for consistent height handling
    const heightClass = "tw-flex-grow";

    return `${baseStyles} ${heightClass}`;
  }, []);

  const containerStyle = waveViewStyle || {};

  useEffect(() => setActiveDrop(null), [wave]);

  const onReply = (drop: ApiDrop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop,
      partId,
    });
  };

  const onQuote = (drop: ApiDrop, partId: number) => {
    setActiveDrop({
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
    setActiveDrop(null);
  };

  return (
    <div
      ref={containerRef}
      className={`${containerClassName}`}
      style={containerStyle}>
      
      <WaveDropsAll
        key={wave.id}
        waveId={wave.id}
        onReply={handleReply}
        onQuote={handleQuote}
        activeDrop={activeDrop}
        initialDrop={scrollTarget}
        dividerSerialNo={dividerTarget}
        dropId={null}
        isMuted={wave.metrics?.muted ?? false}
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
  );
};

export default MyStreamWaveChat;
