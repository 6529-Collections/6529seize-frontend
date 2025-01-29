import React, { useEffect, useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { Time } from "../../../helpers/time";

interface SingleWaveDropTimeProps {
  readonly wave: ApiWave;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  percentage: number;
}

enum SingleWaveDropTimeState {
  UPCOMING = "UPCOMING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export const SingleWaveDropTime: React.FC<SingleWaveDropTimeProps> = ({ wave }) => {
  const votingTimeStart = wave.voting.period?.min ?? Time.currentMillis();
  const votingTimeEnd = wave.voting.period?.max ?? Time.currentMillis();

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    percentage: 0,
  });
  const [votingState, setVotingState] = useState<SingleWaveDropTimeState>(
    SingleWaveDropTimeState.UPCOMING
  );

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Time.currentMillis();

      if (now < votingTimeStart) {
        setVotingState(SingleWaveDropTimeState.UPCOMING);
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
      } else if (now >= votingTimeStart && now <= votingTimeEnd) {
        setVotingState(SingleWaveDropTimeState.IN_PROGRESS);
        const remaining = votingTimeEnd - now;
        const total = votingTimeEnd - votingTimeStart;
        const elapsed = now - votingTimeStart;

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
          percentage: Math.min(100, (elapsed / total) * 100),
        });
      } else {
        setVotingState(SingleWaveDropTimeState.COMPLETED);
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

  const getTimeDisplay = () => {
    if (votingState === SingleWaveDropTimeState.UPCOMING) {
      return "Voting starts in";
    } else if (votingState === SingleWaveDropTimeState.IN_PROGRESS) {
      return "Voting ends in";
    } else {
      return "Voting ended";
    }
  };

  const getTimeString = () => {
    if (votingState === SingleWaveDropTimeState.COMPLETED) {
      return "";
    }

    const parts = [];
    if (timeRemaining.days > 0) {
      parts.push(`${timeRemaining.days}d`);
    }
    if (timeRemaining.hours > 0 || parts.length > 0) {
      parts.push(`${timeRemaining.hours}h`);
    }
    if (timeRemaining.minutes > 0 || parts.length > 0) {
      parts.push(`${timeRemaining.minutes}m`);
    }
    parts.push(`${timeRemaining.seconds}s`);

    return parts.join(" ");
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-items-baseline tw-gap-x-2">
        <span className="tw-text-sm tw-text-iron-400">{getTimeDisplay()}</span>
        <span className="tw-text-base tw-font-medium tw-text-iron-100">
          {getTimeString()}
        </span>
      </div>
      <div className="tw-relative tw-h-1 tw-w-full tw-bg-iron-800 tw-rounded-full tw-overflow-hidden">
        <div
          className="tw-absolute tw-inset-y-0 tw-left-0 tw-bg-gradient-to-r tw-from-primary-400/80 tw-to-primary-400 tw-transition-all tw-duration-1000 tw-ease-linear"
          style={{ width: `${timeRemaining.percentage}%` }}
        />
      </div>
    </div>
  );
}; 