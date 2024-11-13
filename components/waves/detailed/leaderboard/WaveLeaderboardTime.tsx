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
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

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
    <div>
      <div>
        <div className="tw-mt-4 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
          {/* Dropping Phase Card - Completed State */}
          <div className="tw-rounded-xl tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-p-6 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
              <div className="tw-size-8 tw-rounded-lg tw-bg-gradient-to-br tw-from-emerald-300/10 tw-to-emerald-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
                <svg
                  className="tw-w-4 tw-h-4 tw-text-emerald-400/80"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h2 className="tw-text-base tw-font-medium tw-mb-0.5 tw-text-white/90">
                  Dropping Complete
                </h2>
                <p className="tw-text-xs tw-text-white/60 tw-mb-0">
                  Completed on December 1
                </p>
              </div>
            </div>
            <div className="tw-text-sm tw-text-white/60 tw-bg-white/5 tw-rounded-lg tw-p-3 tw-text-center">
              The dropping phase has ended
            </div>
          </div>

          {/* Voting Phase Card - Completed State */}
          <div className="tw-rounded-xl tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-p-6 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
              <div className="tw-size-8 tw-rounded-lg tw-bg-gradient-to-br tw-from-violet-300/10 tw-to-violet-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
                <svg
                  className="tw-w-4 tw-h-4 tw-text-violet-400/80"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h2 className="tw-text-base tw-font-medium tw-mb-0.5 tw-text-white/90">
                  Voting Complete
                </h2>
                <p className="tw-text-xs tw-text-white/60 tw-mb-0">
                  Completed on December 15
                </p>
              </div>
            </div>
            <div className="tw-text-sm tw-text-white/60 tw-bg-white/5 tw-rounded-lg tw-p-3 tw-text-center">
              The voting phase has ended
            </div>
          </div>
        </div>
      </div>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        {/* Dropping Phase Card */}
        <div className="tw-rounded-xl tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-p-6 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
            <div className="tw-size-8 tw-rounded-lg tw-bg-gradient-to-br tw-from-emerald-300/10 tw-to-emerald-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
              <svg
                className="tw-w-4 tw-h-4 tw-text-emerald-400/80"
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
              <h2 className="tw-text-base tw-font-medium tw-mb-0.5 tw-text-white/90">
                Dropping Starts In
              </h2>
              <p className="tw-text-xs tw-text-white/60 tw-mb-0">December 1</p>
            </div>
          </div>
          <div className="tw-grid tw-grid-cols-4 tw-gap-2">
            <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border-solid tw-border tw-border-primary-300/10">
              <span className="tw-text-xl tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-w-[2ch] tw-text-center">
                {timeLeft.days}
              </span>
              <span className="tw-ml-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block">
                {timeLeft.days === 1 ? "Day" : "Days"}
              </span>
            </div>
            <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border-solid tw-border tw-border-primary-300/10">
              <span className="tw-text-xl tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-w-[2ch] tw-text-center">
                {timeLeft.hours}
              </span>
              <span className="tw-ml-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block">
                {timeLeft.hours === 1 ? "Hr" : "Hrs"}
              </span>
            </div>
            <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border-solid tw-border tw-border-primary-300/10">
              <span className="tw-text-xl tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-w-[2ch] tw-text-center">
                {timeLeft.minutes}
              </span>
              <span className="tw-ml-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block">
                {timeLeft.minutes === 1 ? "Min" : "Min"}
              </span>
            </div>
            <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border-solid tw-border tw-border-primary-300/10">
              <span className="tw-text-xl tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-w-[2ch] tw-text-center">
                {timeLeft.seconds}
              </span>
              <span className="tw-ml-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block">
                {timeLeft.seconds === 1 ? "Sec" : "Sec"}
              </span>
            </div>
          </div>
        </div>

        {/* Voting Phase Card */}
        <div className="tw-rounded-xl tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-p-6 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
            <div className="tw-size-8 tw-rounded-lg tw-bg-gradient-to-br tw-from-violet-300/10 tw-to-violet-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
              <svg
                className="tw-w-4 tw-h-4 tw-text-violet-400/80"
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
              <h2 className="tw-text-base tw-font-medium tw-mb-0.5 tw-text-white/90">
                Voting Ends In
              </h2>
              <p className="tw-text-xs tw-text-white/60 tw-mb-0">December 15</p>
            </div>
          </div>
          <div className="tw-grid tw-grid-cols-4 tw-gap-2">
            <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border-solid tw-border tw-border-primary-300/10">
              <span className="tw-text-xl tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-w-[2ch] tw-text-center">
                {timeLeft.days}
              </span>
              <span className="tw-ml-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block">
                {timeLeft.days === 1 ? "Day" : "Days"}
              </span>
            </div>
            <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border-solid tw-border tw-border-primary-300/10">
              <span className="tw-text-xl tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-w-[2ch] tw-text-center">
                {timeLeft.hours}
              </span>
              <span className="tw-ml-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block">
                {timeLeft.hours === 1 ? "Hr" : "Hrs"}
              </span>
            </div>
            <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border-solid tw-border tw-border-primary-300/10">
              <span className="tw-text-xl tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-w-[2ch] tw-text-center">
                {timeLeft.minutes}
              </span>
              <span className="tw-ml-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block">
                {timeLeft.minutes === 1 ? "Min" : "Min"}
              </span>
            </div>
            <div className="tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border-solid tw-border tw-border-primary-300/10">
              <span className="tw-text-xl tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-w-[2ch] tw-text-center">
                {timeLeft.seconds}
              </span>
              <span className="tw-ml-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium tw-inline-block">
                {timeLeft.seconds === 1 ? "Sec" : "Sec"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
