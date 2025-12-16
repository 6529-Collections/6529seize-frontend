"use client";

import React, { useEffect, useState } from "react";
import { ApiWave } from "@/generated/models/ApiWave";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import { useContentTab } from "@/components/brain/ContentTabContext";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import MyStreamWaveTabsMemeSubmit from "./MyStreamWaveTabsMemeSubmit";
import { useWave } from "../../../../hooks/useWave";
import { useDecisionPoints } from "../../../../hooks/waves/useDecisionPoints";
import { Time } from "../../../../helpers/time";
import {
  calculateTimeLeft,
  TimeLeft,
} from "../../../../helpers/waves/time.utils";
import { CompactTimeCountdown } from "../../../waves/leaderboard/time/CompactTimeCountdown";
import { useSidebarState } from "../../../../hooks/useSidebarState";
import {
  ChevronDoubleLeftIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import WavePicture from "../../../waves/WavePicture";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createBreakpoint } from "react-use";
import WaveDropsSearchModal from "@/components/waves/drops/search/WaveDropsSearchModal";
import { MyStreamWaveTab } from "@/types/waves.types";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

interface MyStreamWaveTabsMemeProps {
  readonly wave: ApiWave;
}

const MyStreamWaveTabsMeme: React.FC<MyStreamWaveTabsMemeProps> = ({
  wave,
}) => {
  const { activeContentTab, setActiveContentTab } = useContentTab();
  const { toggleRightSidebar, isRightSidebarOpen } = useSidebarState();
  const [isMemesModalOpen, setIsMemesModalOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "S";
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const waveChatScroll = useWaveChatScrollOptional();

  const {
    isMemesWave,
    isRankWave,
    pauses: { filterDecisionsDuringPauses },
  } = useWave(wave);

  const { allDecisions } = useDecisionPoints(wave);

  const filteredDecisions = React.useMemo(() => {
    const decisionsAsApiFormat: { decision_time: number }[] = allDecisions.map(
      (decision) => ({ decision_time: decision.timestamp })
    );
    const filtered = filterDecisionsDuringPauses(decisionsAsApiFormat);
    return allDecisions.filter((decision) =>
      filtered.some((f) => f.decision_time === decision.timestamp)
    );
  }, [allDecisions, filterDecisionsDuringPauses]);

  const nextDecisionTime =
    filteredDecisions.find(
      (decision) => decision.timestamp > Time.currentMillis()
    )?.timestamp ?? null;

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (nextDecisionTime) {
      setTimeLeft(calculateTimeLeft(nextDecisionTime));
      const intervalId = setInterval(() => {
        const newTimeLeft = calculateTimeLeft(nextDecisionTime);
        setTimeLeft(newTimeLeft);
        if (
          newTimeLeft.days === 0 &&
          newTimeLeft.hours === 0 &&
          newTimeLeft.minutes === 0 &&
          newTimeLeft.seconds === 0
        ) {
          clearInterval(intervalId);
        }
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [nextDecisionTime]);

  const handleMemesSubmit = () => {
    setIsMemesModalOpen(true);
  };

  const handleMobileBack = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("wave");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || "/waves";
    router.push(newUrl, { scroll: false });
  };

  const handleSearchSelect = (serialNo: number) => {
    setActiveContentTab(MyStreamWaveTab.CHAT);
    if (waveChatScroll) {
      waveChatScroll.requestScrollToSerialNo({ waveId: wave.id, serialNo });
      return;
    }

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("serialNo", String(serialNo));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      {" "}
      <div className="tw-w-full tw-flex tw-flex-col tw-bg-iron-950">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4 tw-px-2 sm:tw-px-4 tw-py-3 tw-overflow-x-hidden">
          <div className="tw-flex tw-items-center tw-min-w-0">
            {isMobile && (
              <button
                onClick={handleMobileBack}
                className="tw-flex tw-items-center tw-h-full tw-px-2.5 -tw-ml-2.5 tw-mr-1.5 tw-bg-transparent tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-transition-colors tw-p-0"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="tw-w-6 tw-h-6 tw-flex-shrink-0" />
              </button>
            )}
            {isMobile ? (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search messages in this wave"
                className="tw-flex tw-items-center tw-bg-transparent tw-border-0 tw-p-0 tw-text-left tw-min-w-0"
              >
                <div className="tw-size-6 lg:tw-size-9 tw-flex-shrink-0 tw-ring-1 tw-ring-offset-1 tw-ring-offset-iron-950 tw-ring-white/30 tw-rounded-full">
                  <WavePicture
                    name={wave.name}
                    picture={wave.picture}
                    contributors={wave.contributors_overview.map((c) => ({
                      pfp: c.contributor_pfp,
                    }))}
                  />
                </div>
                <h1 className="tw-ml-3 tw-text-sm lg:tw-text-xl tw-font-semibold tw-text-white/95 tw-tracking-tight tw-mb-0 tw-truncate">
                  {wave.name}
                </h1>
              </button>
            ) : (
              <>
                <div className="tw-size-6 lg:tw-size-9 tw-flex-shrink-0 tw-ring-1 tw-ring-offset-1 tw-ring-offset-iron-950 tw-ring-white/30 tw-rounded-full">
                  <WavePicture
                    name={wave.name}
                    picture={wave.picture}
                    contributors={wave.contributors_overview.map((c) => ({
                      pfp: c.contributor_pfp,
                    }))}
                  />
                </div>
                <h1 className="tw-ml-3 tw-text-sm lg:tw-text-xl tw-font-semibold tw-text-white/95 tw-tracking-tight tw-mb-0 tw-truncate">
                  {wave.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search messages in this wave"
                  className="tw-ml-2 tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white tw-transition tw-duration-150"
                >
                  <MagnifyingGlassIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
                </button>
              </>
            )}
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-2 tw-relative tw-pr-10">
            <div className="tw-hidden lg:tw-block">
              <MyStreamWaveTabsMemeSubmit
                handleMemesSubmit={handleMemesSubmit}
                wave={wave}
              />
            </div>
            <button
              type="button"
              onClick={toggleRightSidebar}
              className="tw-group tw-absolute tw-top-1/2 -tw-translate-y-1/2 tw-right-0 tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-700 tw-backdrop-blur-sm tw-shadow-[0_12px_28px_rgba(0,0,0,0.35)] tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-iron-500/80 desktop-hover:hover:tw-bg-iron-700/85 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.4)]"
              aria-label="Toggle right sidebar"
            >
              <ChevronDoubleLeftIcon
                strokeWidth={2}
                className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-200 tw-transition tw-duration-300 ${
                  isRightSidebarOpen
                    ? "tw-rotate-180 desktop-hover:group-hover:tw-translate-x-0.5"
                    : "tw-rotate-0 desktop-hover:group-hover:-tw-translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800">
          <MyStreamWaveDesktopTabs
            activeTab={activeContentTab}
            wave={wave}
            setActiveTab={setActiveContentTab}
          />
          {(isMemesWave || isRankWave) && nextDecisionTime && (
            <div className="tw-flex-shrink-0 tw-px-2 sm:tw-px-4">
              <CompactTimeCountdown timeLeft={timeLeft} />
            </div>
          )}
        </div>
      </div>
      <MemesArtSubmissionModal
        isOpen={isMemesModalOpen}
        wave={wave}
        onClose={() => setIsMemesModalOpen(false)}
      />
      <WaveDropsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        wave={wave}
        onSelectSerialNo={handleSearchSelect}
      />
    </>
  );
};

export default MyStreamWaveTabsMeme;
