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

export const WaveDropTime: React.FC<WaveDropTimeProps> = ({ wave }) => {
  const votingTimeStart = wave.voting.period?.min ?? Time.currentMillis();
  const votingTimeEnd = wave.voting.period?.max ?? Time.currentMillis();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ 
    days: 0, 
    hours: 0, 
    minutes: 0, 
    seconds: 0, 
    percentage: 0 
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Time.currentMillis();
      const totalDuration = votingTimeEnd - votingTimeStart;
      const elapsed = now - votingTimeStart;
      const remaining = votingTimeEnd - now;

      if (remaining <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, percentage: 100 });
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

      setTimeRemaining({ days, hours, minutes, seconds, percentage });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [votingTimeStart, votingTimeEnd]);

  return (
    <div className="tw-relative">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
        <span className="tw-text-xs tw-text-iron-400">Time Remaining</span>
        <div className="tw-flex tw-items-center tw-gap-2">
          <div className="tw-flex tw-items-baseline">
            <span className="tw-text-sm tw-font-medium tw-text-iron-100 tw-min-w-[1.5rem] tw-text-right">
              {timeRemaining.days}
            </span>
            <span className="tw-text-xs tw-text-iron-400 tw-ml-1">
              {timeRemaining.days === 1 ? 'Day' : 'Days'}
            </span>
          </div>
          <div className="tw-flex tw-items-baseline">
            <span className="tw-text-sm tw-font-medium tw-text-iron-100 tw-min-w-[1.5rem] tw-text-right">
              {timeRemaining.hours}
            </span>
            <span className="tw-text-xs tw-text-iron-400 tw-ml-1">Hours</span>
          </div>
          <div className="tw-flex tw-items-baseline">
            <span className="tw-text-sm tw-font-medium tw-text-iron-100 tw-min-w-[1.5rem] tw-text-right">
              {timeRemaining.minutes}
            </span>
            <span className="tw-text-xs tw-text-iron-400 tw-ml-1">Minutes</span>
          </div>
          <div className="tw-flex tw-items-baseline">
            <span className="tw-text-sm tw-font-medium tw-text-iron-100 tw-min-w-[1.5rem] tw-text-right">
              {timeRemaining.seconds}
            </span>
            <span className="tw-text-xs tw-text-iron-400 tw-ml-1">Seconds</span>
          </div>
        </div>
      </div>
      <div className="tw-h-1 tw-bg-iron-800/50 tw-rounded-full">
        <div 
          className="tw-h-full tw-bg-gradient-to-r tw-from-emerald-700 tw-to-emerald-600 tw-rounded-full" 
          style={{ width: `${timeRemaining.percentage}%` }}
        />
      </div>
    </div>
  );
};
