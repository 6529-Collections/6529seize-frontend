import React, { useState, useEffect } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { Time } from "../../../../helpers/time";

interface WaveLeaderboardTimeProps {
  readonly wave: ApiWave;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const WaveLeaderboardTime: React.FC<WaveLeaderboardTimeProps> = ({
  wave,
}) => {
  const endTime = wave.voting.period?.max ?? Time.currentMillis();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime - Time.currentMillis();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="tw-mt-4 tw-rounded-xl tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-p-6 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-justify-between tw-items-center tw-gap-5">
        <div className="tw-flex tw-items-center tw-gap-5">
          <div className="tw-size-10 tw-rounded-xl tw-bg-gradient-to-br tw-from-primary-300/10 tw-to-primary-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
            <svg
              className="tw-w-5 tw-h-5 tw-text-white/60 mix-blend-overlay"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 8v4l2.5 2.5M12 2v2m10 8a10 10 0 11-20 0 10 10 0 0120 0z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="tw-text-base tw-font-medium tw-mb-1 tw-text-white/90 mix-blend-overlay">
              Time Remaining
            </h2>
            <p className="tw-text-xs tw-text-white/60 mix-blend-overlay tw-m-0">
              Competition ends December 15, 2024
            </p>
          </div>
        </div>
        <div className="tw-flex tw-gap-2">
          <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 hover:tw-border-primary-300/20 tw-transition-all">
            <span className="tw-text-lg tw-font-medium tw-text-white/90 tw-tracking-tight tw-group-hover:tw-text-white tw-inline-block tw-w-[2ch] tw-text-center">
              {timeLeft.days}
            </span>
            <span className="tw-ml-1.5 tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block tw-w-12">
              {timeLeft.days === 1 ? 'Day' : 'Days'}
            </span>
          </div>
          <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 hover:tw-border-primary-300/20 tw-transition-all">
            <span className="tw-text-lg tw-font-medium tw-text-white/90 tw-tracking-tight tw-group-hover:tw-text-white tw-inline-block tw-w-[2ch] tw-text-center">
              {timeLeft.hours}
            </span>
            <span className="tw-ml-1.5 tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block tw-w-12">
              {timeLeft.hours === 1 ? 'Hour' : 'Hours'}
            </span>
          </div>
          <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 hover:tw-border-primary-300/20 tw-transition-all">
            <span className="tw-text-lg tw-font-medium tw-text-white/90 tw-tracking-tight tw-group-hover:tw-text-white tw-inline-block tw-w-[2ch] tw-text-center">
              {timeLeft.minutes}
            </span>
            <span className="tw-ml-1.5 tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block tw-w-12">
              {timeLeft.minutes === 1 ? 'Minute' : 'Minutes'}
            </span>
          </div>
          <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 hover:tw-border-primary-300/20 tw-transition-all">
            <span className="tw-text-lg tw-font-medium tw-text-white/90 tw-tracking-tight tw-group-hover:tw-text-white tw-inline-block tw-w-[2ch] tw-text-center">
              {timeLeft.seconds}
            </span>
            <span className="tw-ml-1.5 tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block tw-w-12">
              {timeLeft.seconds === 1 ? 'Second' : 'Seconds'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
