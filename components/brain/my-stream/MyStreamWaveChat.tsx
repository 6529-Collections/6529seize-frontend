"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ActiveDropAction,
  ActiveDropState,
} from "../../../types/dropInteractionTypes";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import WaveDropsAll from "../../waves/drops/WaveDropsAll";
import { CreateDropWaveWrapper } from "../../waves/CreateDropWaveWrapper";
import PrivilegedDropCreator, {
  DropMode,
} from "../../waves/PrivilegedDropCreator";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { useLayout } from "./layout/LayoutContext";
import MobileMemesArtSubmissionBtn from "../../waves/memes/submission/MobileMemesArtSubmissionBtn";
import { useWave } from "../../../hooks/useWave";
import { useSelector } from "react-redux";
import { selectEditingDropId } from "../../../store/editSlice";
import useDeviceInfo from "../../../hooks/useDeviceInfo";

interface MyStreamWaveChatProps {
  readonly wave: ApiWave;
}

const MyStreamWaveChat: React.FC<MyStreamWaveChatProps> = ({ wave }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialDrop, setInitialDrop] = useState<number | null>(null);
  const [searchParamsDone, setSearchParamsDone] = useState(false);
  const { isMemesWave } = useWave(wave);
  const editingDropId = useSelector(selectEditingDropId);
  const { isApp } = useDeviceInfo();

  // Handle URL parameters
  useEffect(() => {
    const dropParam = searchParams?.get("serialNo");
    if (dropParam) {
      setInitialDrop(parseInt(dropParam));
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("serialNo");
      router.replace(newUrl.pathname + newUrl.search);
    } else {
      setInitialDrop(null);
    }
    setSearchParamsDone(true);
  }, [searchParams, router]);

  const { waveViewStyle } = useLayout();

  // Create container class based on wave type
  const containerClassName = useMemo(() => {
    const baseStyles =
      "tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto tw-overflow-x-hidden lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 scroll-shadow";

    // Always use flex-grow for consistent height handling
    const heightClass = "tw-flex-grow";

    return `${baseStyles} ${heightClass}`;
  }, []);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
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

  if (!searchParamsDone) {
    return null;
  }
  return (
    <div
      ref={containerRef}
      className={`${containerClassName}`}
      style={waveViewStyle}>
      <WaveDropsAll
        key={wave.id}
        waveId={wave.id}
        onReply={handleReply}
        onQuote={handleQuote}
        activeDrop={activeDrop}
        initialDrop={initialDrop}
        dropId={null}
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
      {/* Floating submission button */}
      {isMemesWave && <MobileMemesArtSubmissionBtn wave={wave} />}
    </div>
  );
};

export default MyStreamWaveChat;
