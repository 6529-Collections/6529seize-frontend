"use client";

import React, { useEffect, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import { useContentTab } from "@/components/brain/ContentTabContext";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import MyStreamWaveTabsMemeSubmit from "./MyStreamWaveTabsMemeSubmit";
import { useWave } from "../../../../hooks/useWave";
import { useDecisionPoints } from "../../../../hooks/waves/useDecisionPoints";
import { Time } from "../../../../helpers/time";
import type {
  TimeLeft} from "../../../../helpers/waves/time.utils";
import {
  calculateTimeLeft
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
    if (!nextDecisionTime) return;

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
      <div className="tw-flex tw-w-full tw-flex-col tw-bg-iron-950">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4 tw-overflow-x-hidden tw-px-2 tw-py-3 sm:tw-px-4">
          <div className="tw-flex tw-min-w-0 tw-items-center">
            {isMobile && (
              <button
                onClick={handleMobileBack}
                className="-tw-ml-2.5 tw-mr-1.5 tw-flex tw-h-full tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-px-2.5 tw-text-iron-300 tw-transition-colors hover:tw-text-iron-50"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
              </button>
            )}
            {isMobile ? (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search messages in this wave"
                className="tw-flex tw-min-w-0 tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-left"
              >
                <div className="tw-size-6 tw-flex-shrink-0 tw-rounded-full tw-ring-1 tw-ring-white/30 tw-ring-offset-1 tw-ring-offset-iron-950 lg:tw-size-9">
                  <WavePicture
                    name={wave.name}
                    picture={wave.picture}
                    contributors={wave.contributors_overview.map((c) => ({
                      pfp: c.contributor_pfp,
                    }))}
                  />
                </div>
                <h1 className="tw-mb-0 tw-ml-3 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
                  {wave.name}
                </h1>
              </button>
            ) : (
              <>
                <div className="tw-size-6 tw-flex-shrink-0 tw-rounded-full tw-ring-1 tw-ring-white/30 tw-ring-offset-1 tw-ring-offset-iron-950 lg:tw-size-9">
                  <WavePicture
                    name={wave.name}
                    picture={wave.picture}
                    contributors={wave.contributors_overview.map((c) => ({
                      pfp: c.contributor_pfp,
                    }))}
                  />
                </div>
                <h1 className="tw-mb-0 tw-ml-3 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
                  {wave.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search messages in this wave"
                  className="tw-ml-2 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
                >
                  <MagnifyingGlassIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
                </button>
              </>
            )}
          </div>
          <div className="tw-relative tw-flex tw-items-center tw-gap-x-2 tw-pr-10">
            <div className="tw-hidden lg:tw-block">
              <MyStreamWaveTabsMemeSubmit
                handleMemesSubmit={handleMemesSubmit}
                wave={wave}
              />
            </div>
            <button
              type="button"
              onClick={toggleRightSidebar}
              className="tw-group tw-absolute tw-right-0 tw-top-1/2 tw-flex tw-h-8 tw-w-8 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-700 tw-shadow-[0_12px_28px_rgba(0,0,0,0.35)] tw-backdrop-blur-sm tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-iron-500/80 desktop-hover:hover:tw-bg-iron-700/85 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.4)]"
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
