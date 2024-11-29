import React, { useEffect, useRef, useState } from "react";

interface WaveDropVoteInputProps {
  readonly voteValue: number | string;
  readonly setVoteValue: React.Dispatch<React.SetStateAction<string | number>>;
  readonly availableCredit: number;
}

export const WaveDropVoteInput: React.FC<WaveDropVoteInputProps> = ({
  voteValue,
  setVoteValue,
  availableCredit,
}) => {
  const memeticValues: number[] = [
    -69420, -42069, -6529, -420, -69, 69, 420, 6529, 42069, 69420,
  ];

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

  const [isPaused, setIsPaused] = useState(false);

  const pressTimer = useRef<NodeJS.Timeout>();
  const pressStartTime = useRef<number>();
  const isPressed = useRef<boolean>(false);

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

  return (
    <div className="tw-flex tw-items-center tw-gap-4">
      <div className="tw-relative tw-w-48">
        <input
          type="text"
          pattern="-?[0-9]*"
          inputMode="numeric"
          className="tw-w-full tw-px-3 tw-h-9 tw-bg-iron-950 tw-rounded-lg tw-text-iron-50 tw-placeholder-iron-400 tw-text-base tw-font-medium tw-border-0 tw-ring-1 tw-ring-iron-700/50 focus:tw-ring-primary-400/50 hover:tw-ring-primary-400/30 tw-outline-none tw-transition-all hover:tw-bg-iron-950/60 focus:tw-bg-iron-950/80 focus:tw-scale-105"
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
  );
};
