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
import { useAndroidKeyboard } from "@/hooks/useAndroidKeyboard";
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

interface MyStreamWaveChatProps {
  readonly wave: ApiWave;
}

const MyStreamWaveChat: React.FC<MyStreamWaveChatProps> = ({ wave }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialDrop, setInitialDrop] = useState<number | null>(null);
  const [searchParamsDone, setSearchParamsDone] = useState(false);
  const { isMemesWave } = useWave(wave);
  const editingDropId = useSelector(selectEditingDropId);
  const { isApp } = useDeviceInfo();
  const { getContainerStyle } = useAndroidKeyboard();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);

  // Handle URL parameters
  useEffect(() => {
    const dropParam = searchParams?.get("serialNo");
    if (dropParam) {
      setInitialDrop(parseInt(dropParam));
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.delete("serialNo");
      const href = params.toString()
        ? `${pathname}?${params.toString()}`
        : (pathname || getHomeFeedRoute());
      router.replace(href, { scroll: false });
    } else {
      setInitialDrop(null);
    }
    setSearchParamsDone(true);
  }, [searchParams, router, pathname]);

  const { waveViewStyle } = useLayout();

  // Create container class based on wave type
  const containerClassName = useMemo(() => {
    const baseStyles =
      "tw-w-full tw-flex tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 scroll-shadow";

    // Always use flex-grow for consistent height handling
    const heightClass = "tw-flex-grow";

    return `${baseStyles} ${heightClass}`;
  }, []);

  // Android keyboard adjustment style using centralized hook
  const containerStyle = useMemo<React.CSSProperties>(() => {
    return getContainerStyle(waveViewStyle || {}, 128);
  }, [waveViewStyle, getContainerStyle]);

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
      style={containerStyle}>
      
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
      {isMemesWave && <MobileMemesArtSubmissionBtn wave={wave} />}
    </div>
  );
};

export default MyStreamWaveChat;
