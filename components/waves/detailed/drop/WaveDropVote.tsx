import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import {
  ApiDrop,
  ApiWave,
} from "../../../../generated/models/ObjectSerializer";
import { useState, useEffect, useRef } from "react";
import DropListItemRateGiveSubmit from "../../../drops/view/item/rate/give/DropListItemRateGiveSubmit";
import { DropVoteState } from "../../../drops/view/item/DropsListItem";
import WaveDropVoteQuick from "./WaveDropVoteQuick";

interface WaveDropVoteProps {
  readonly wave: ApiWave;
  readonly drop: ApiDrop;
}

export const WaveDropVote: React.FC<WaveDropVoteProps> = ({ wave, drop }) => {
  const memeticValues: number[] = [
    -69420, -42069, -6529, -420, -69, 69, 420, 6529, 42069, 69420,
  ];

  const availableCredit = Math.abs(
    (drop.context_profile_context?.max_rating ?? 0) -
      (drop.context_profile_context?.rating ?? 0)
  );

  const [voteValue, setVoteValue] = useState<number | string>(1);
  const [isPaused, setIsPaused] = useState(false);

  const pressTimer = useRef<NodeJS.Timeout>();
  const pressStartTime = useRef<number>();
  const isPressed = useRef<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue === "" || inputValue === "-") {
      setVoteValue(inputValue as any);
      return;
    }

    const value = parseInt(inputValue);
    if (isNaN(value)) return;
    setVoteValue(Math.min(Math.max(value, -availableCredit), availableCredit));
  };

  const updateValue = (increment: boolean) => {
    if (isPaused) return;

    setVoteValue((prev) => {
      const currentValue = typeof prev === "string" ? 0 : prev;
      const now = Date.now();
      const elapsed = (now - (pressStartTime.current ?? now)) / 1000;

      let delta;
      if (elapsed < 2) {
        delta = 1;
      } else if (elapsed < 4) {
        delta = 10;
      } else if (elapsed < 6) {
        delta = 100;
      } else {
        delta = 1000;
      }

      const newValue = increment ? currentValue + delta : currentValue - delta;

      let crossingMemeticValue: number | null = null;

      if (increment) {
        const possibleValues = memeticValues.filter(
          (mv) => mv > currentValue && mv <= newValue
        );
        if (possibleValues.length > 0) {
          crossingMemeticValue = possibleValues[0];
        }
      } else {
        const possibleValues = memeticValues.filter(
          (mv) => mv < currentValue && mv >= newValue
        );
        if (possibleValues.length > 0) {
          crossingMemeticValue = possibleValues[possibleValues.length - 1];
        }
      }

      if (crossingMemeticValue !== null) {
        setIsPaused(true);
        if (pressTimer.current) clearInterval(pressTimer.current);
        setTimeout(() => {
          setIsPaused(false);
          if (isPressed.current) {
            pressTimer.current = setInterval(() => {
              updateValue(increment);
            }, 100);
          }
        }, 1000);
        return crossingMemeticValue;
      }

      const roundedValue = Math.round(newValue / delta) * delta;

      return Math.min(
        Math.max(roundedValue, -availableCredit),
        availableCredit
      );
    });
  };

  const startPress = (increment: boolean) => {
    isPressed.current = true;
    pressStartTime.current = Date.now();
    updateValue(increment);

    pressTimer.current = setInterval(() => {
      updateValue(increment);
    }, 100);
  };

  const stopPress = () => {
    isPressed.current = false;
    if (pressTimer.current) clearInterval(pressTimer.current);
    pressStartTime.current = undefined;
  };

  useEffect(() => {
    return () => {
      if (pressTimer.current) clearInterval(pressTimer.current);
    };
  }, []);

  const onSuccessfulRateChange = () => {
    setVoteValue(1);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-5 tw-rounded-2xl tw-bg-gradient-to-b tw-from-iron-900/60 tw-to-iron-900/40 tw-backdrop-blur-lg tw-border tw-border-iron-800/30">
      <div className="tw-flex tw-justify-between tw-items-center">
        <div className="tw-flex tw-items-center tw-gap-4">
          <div className="tw-relative tw-w-32">
            <input
              type="text"
              pattern="-?[0-9]*"
              inputMode="numeric"
              className="tw-w-full tw-px-3 tw-h-9 tw-bg-iron-950/40 tw-rounded-lg tw-text-iron-50 tw-placeholder-iron-400 tw-text-base tw-font-medium tw-border-0 tw-ring-1 tw-ring-iron-700/50 focus:tw-ring-primary-400/50 hover:tw-ring-primary-400/30 tw-outline-none tw-transition-all hover:tw-bg-iron-950/60 focus:tw-bg-iron-950/80 focus:tw-scale-105"
              value={voteValue}
              onChange={handleInputChange}
            />
            <div className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-xs tw-text-iron-400 tw-pointer-events-none">
              TDH
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-gap-x-3">
            <button
              onMouseDown={() => startPress(true)}
              onMouseUp={stopPress}
              onMouseLeave={stopPress}
              onTouchStart={() => startPress(true)}
              onTouchEnd={stopPress}
              className="tw-border-0 tw-flex tw-items-center tw-justify-center tw-size-9 tw-rounded-xl tw-bg-iron-800/80 tw-ring-1 tw-ring-iron-700/50 hover:tw-ring-emerald-400/50 tw-text-emerald-400 hover:tw-text-emerald-300 tw-transition-all tw-duration-300 hover:tw-scale-105 hover:tw-bg-iron-800/90 active:tw-scale-95"
            >
              <svg
                className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-group-hover/btn:-tw-translate-y-0.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onMouseDown={() => startPress(false)}
              onMouseUp={stopPress}
              onMouseLeave={stopPress}
              onTouchStart={() => startPress(false)}
              onTouchEnd={stopPress}
              className="tw-border-0 tw-flex tw-items-center tw-justify-center tw-size-9 tw-rounded-xl tw-bg-iron-800/80 tw-ring-1 tw-ring-iron-700/50 hover:tw-ring-rose-400/50 tw-text-rose-400 hover:tw-text-rose-300 tw-transition-all tw-duration-300 hover:tw-scale-105 hover:tw-bg-iron-800/90 active:tw-scale-95"
            >
              <svg
                className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-group-hover/btn:tw-translate-y-0.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <DropListItemRateGiveSubmit
          rate={+voteValue ?? 0}
          drop={drop}
          voteState={DropVoteState.CANT_VOTE}
          canVote={true}
          availableCredit={availableCredit}
          onSuccessfulRateChange={onSuccessfulRateChange}
          isMobile={false}
        />
      </div>
      <div className="tw-flex tw-items-center tw-gap-3 tw-text-xs tw-text-iron-400">
        <div className="tw-flex tw-items-center tw-gap-1">
          <span>
            Your votes: <span className="tw-text-iron-200">2</span>
          </span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-1">
          <span>
            Remaining: <span className="tw-text-iron-200">5</span>
          </span>
        </div>
      </div>
      {drop.rank !== 1 && (
        <WaveDropVoteQuick drop={drop} setValue={setVoteValue} />
      )}
    </div>
  );
};
