import React, { useEffect, useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { Time } from "../../../../helpers/time";

interface WaveDropTimeProps {
  readonly wave: ApiWave;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  percentage: number;
}

enum WaveDropTimeState {
  UPCOMING = "UPCOMING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export const WaveDropTime: React.FC<WaveDropTimeProps> = ({ wave }) => {
  const votingTimeStart = wave.voting.period?.min ?? Time.currentMillis();
  const votingTimeEnd = wave.voting.period?.max ?? Time.currentMillis();

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    percentage: 0,
  });
  const [votingState, setVotingState] = useState<WaveDropTimeState>(
    WaveDropTimeState.UPCOMING
  );

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Time.currentMillis();

      if (now < votingTimeStart) {
        setVotingState(WaveDropTimeState.UPCOMING);
        const remaining = votingTimeStart - now;

        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (remaining % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          percentage: 0,
        });
      } else if (now >= votingTimeStart && now < votingTimeEnd) {
        setVotingState(WaveDropTimeState.IN_PROGRESS);
        const totalDuration = votingTimeEnd - votingTimeStart;
        const elapsed = now - votingTimeStart;
        const remaining = votingTimeEnd - now;

        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (remaining % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        const percentage = Math.min(
          100,
          Math.max(0, (elapsed / totalDuration) * 100)
        );

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          percentage,
        });
      } else {
        setVotingState(WaveDropTimeState.COMPLETED);
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          percentage: 100,
        });
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [votingTimeStart, votingTimeEnd]);

  return (
    <div className="tw-relative">
      {votingState === WaveDropTimeState.UPCOMING && (
        <>
          <span className="tw-text-xs tw-text-iron-400">Voting Starts In</span>
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-2 tw-mt-1">
            <div className="tw-flex tw-items-center tw-gap-x-4">
              <div className="tw-flex tw-items-baseline">
                <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
                  {timeRemaining.days}
                </span>
                <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
                  {timeRemaining.days === 1 ? "Day" : "Days"}
                </span>
              </div>
              <div className="tw-flex tw-items-baseline">
                <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
                  {timeRemaining.hours}
                </span>
                <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
                  Hrs
                </span>
              </div>
              <div className="tw-flex tw-items-baseline">
                <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
                  {timeRemaining.minutes}
                </span>
                <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
                  Min
                </span>
              </div>
              <div className="tw-flex tw-items-baseline">
                <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
                  {timeRemaining.seconds}
                </span>
                <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
                  Sec
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {votingState === WaveDropTimeState.IN_PROGRESS && (
        <>
          <span className="tw-text-sm tw-text-iron-400">Voting Ends In</span>
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-2 tw-mt-1">
            <div className="tw-flex tw-items-center tw-gap-x-4">
              <div className="tw-flex tw-items-baseline">
                <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
                  {timeRemaining.days}
                </span>
                <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
                  {timeRemaining.days === 1 ? "Day" : "Days"}
                </span>
              </div>
              <div className="tw-flex tw-items-baseline">
                <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
                  {timeRemaining.hours}
                </span>
                <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
                  Hours
                </span>
              </div>
              <div className="tw-flex tw-items-baseline">
                <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
                  {timeRemaining.minutes}
                </span>
                <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
                  Minutes
                </span>
              </div>
              <div className="tw-flex tw-items-baseline">
                <span className="tw-text-xl tw-font-semibold tw-text-iron-100 tw-w-6">
                  {timeRemaining.seconds}
                </span>
                <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
                  Sec
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {votingState === WaveDropTimeState.COMPLETED && (
        <div className="tw-text-sm tw-text-white/60 tw-bg-white/5 tw-rounded-lg tw-p-3 tw-text-center">
          The voting has ended
        </div>
      )}
    </div>
  );
};
