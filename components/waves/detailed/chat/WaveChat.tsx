import React, { useEffect, useMemo, useRef, useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import WaveDetailedRightSidebar from "../WaveDetailedRightSidebar";
import useCapacitor from "../../../../hooks/useCapacitor";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import WaveDropsAll from "../drops/WaveDropsAll";
import { CreateDropWaveWrapper } from "../CreateDropWaveWrapper";
import { WaveDetailedView } from "../WaveDetailed";
import { WaveDetailedDesktopTabs } from "../WaveDetailedDesktopTabs";
import { ExtendedDrop } from "../../../../helpers/waves/wave-drops.helpers";
import PrivilegedDropCreator, { DropMode } from "../PrivilegedDropCreator";

export enum ActiveDropAction {
  REPLY = "REPLY",
  QUOTE = "QUOTE",
}

export interface ActiveDropState {
  action: ActiveDropAction;
  drop: ApiDrop;
  partId: number;
}

interface WaveChatProps {
  readonly wave: ApiWave;
  readonly activeTab: WaveDetailedView;
  readonly setActiveTab: (tab: WaveDetailedView) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveChat: React.FC<WaveChatProps> = ({
  wave,
  activeTab,
  setActiveTab,
  onDropClick,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const isNotChatWave = wave.wave.type !== ApiWaveType.Chat;
  const capacitor = useCapacitor();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const [initialDrop, setInitialDrop] = useState<number | null>(null);
  const [searchParamsDone, setSearchParamsDone] = useState(false);
  useEffect(() => {
    const dropParam = searchParams.get("drop");
    if (dropParam) {
      setInitialDrop(parseInt(dropParam));
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("drop");
      router.replace(newUrl.pathname + newUrl.search);
    }
    setSearchParamsDone(true);
  }, [searchParams, router]);

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

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col ${
      capacitor.isCapacitor
        ? "tw-h-[calc(100vh-14.7rem)]"
        : `tw-h-[calc(100vh-8.8rem)] ${
            isNotChatWave
              ? "lg:tw-h-[calc(100vh-9.25rem)]"
              : "lg:tw-h-[calc(100vh-7.5rem)]"
          }`
    }`;
  }, [capacitor.isCapacitor, isNotChatWave]);

  if (!searchParamsDone) {
    return null;
  }

  return (
    <>
      <div
        className={`tw-flex-1 lg:tw-ml-[21.5rem]  ${
          isSidebarOpen && isNotChatWave ? "lg:tw-mr-[20.5rem]" : ""
        } tw-transition-all tw-duration-300`}
      >
        <div
          ref={contentWrapperRef}
          className="tw-overflow-hidden tw-bg-iron-950 tw-ring-1 tw-ring-iron-800 tw-relative"
        >
          {isNotChatWave && (
            <div className="tw-hidden lg:tw-block tw-pb-2 tw-pt-3 tw-bg-iron-950 tw-border-b tw-border-solid tw-border-iron-800 tw-border-x-0 tw-border-t-0">
              <WaveDetailedDesktopTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
          )}
          <div className="tw-relative tw-h-full">
            <div className="tw-w-full tw-flex tw-items-stretch lg:tw-divide-x-4 lg:tw-divide-iron-600 lg:tw-divide-solid lg:tw-divide-y-0">
              <div className={containerClassName}>
                <WaveDropsAll
                  waveId={wave.id}
                  onReply={handleReply}
                  onQuote={handleQuote}
                  activeDrop={activeDrop}
                  initialDrop={initialDrop}
                  dropId={null}
                  onDropClick={onDropClick}
                />
                <div className="tw-mt-auto">
                  <CreateDropWaveWrapper>
                    <PrivilegedDropCreator
                      activeDrop={activeDrop}
                      onCancelReplyQuote={onCancelReplyQuote}
                      wave={wave}
                      dropId={null}
                      fixedDropMode={DropMode.BOTH}
                    />
                  </CreateDropWaveWrapper>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="tw-hidden lg:tw-block">
        {isNotChatWave && (
          <WaveDetailedRightSidebar
            isOpen={isSidebarOpen}
            wave={wave}
            onDropClick={onDropClick}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}
      </div>
    </>
  );
};
