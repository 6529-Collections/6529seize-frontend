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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
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
              ? "lg:tw-h-[calc(100vh-9.7rem)]"
              : "lg:tw-h-[calc(100vh-6.5rem)]"
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
          isSidebarOpen && isNotChatWave ? "xl:tw-mr-[20.5rem] 3xl:tw-mr-[28rem]" : ""
        } tw-transition-all tw-duration-300 lg:tw-pl-4`}
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
      <div>
        {isNotChatWave && (
          <>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`lg:tw-hidden tw-fixed tw-right-0 tw-border-0 tw-z-[100] tw-text-iron-500 desktop-hover:hover:tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-700 tw-rounded-r-none tw-rounded-l-lg tw-size-8 tw-flex tw-items-center tw-justify-center tw-shadow-lg ${
                capacitor.isCapacitor ? "tw-top-[10.5rem]" : "tw-top-[6.25rem]"
              }`}
            >
              {isSidebarOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                  className="tw-w-5 tw-h-5 tw-text-iron-300 tw-flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="tw-w-5 tw-h-5 tw-text-iron-300 tw-flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              )}
            </button>

            <div
              className={`tw-transition-transform lg:tw-transform-none tw-duration-300 
              lg:tw-fixed xl:tw-static lg:tw-right-0 lg:tw-top-0 lg:tw-h-full lg:tw-z-10 ${
                capacitor.isCapacitor ? "tw-pt-4" : ""
              }`}
            >
              <WaveDetailedRightSidebar
                isOpen={isSidebarOpen}
                wave={wave}
                onDropClick={onDropClick}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};
