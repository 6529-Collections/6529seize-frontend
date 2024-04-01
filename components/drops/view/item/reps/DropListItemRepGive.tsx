import { useRef, useState } from "react";
import {
  formatLargeNumber,
  formatNumberWithCommas,
} from "../../../../../helpers/Helpers";
import Tippy from "@tippyjs/react";
enum RepChangeType {
  INCREASE = "INCREASE",
  DECREASE = "DECREASE",
}

export default function DropListItemRepGive() {
  const [rep, setRep] = useState<number>(1);
  const [onProgressRep, setOnProgressRep] = useState<number>(rep);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTimeRef = useRef<Date | null>(null);

  const getIncreaseAmount = () => {
    if (!startTimeRef.current) {
      return 1;
    }

    const elapsedSeconds =
      (new Date().getTime() - startTimeRef.current.getTime()) / 1000;

    if (elapsedSeconds < 2) {
      return 1;
    }
    if (elapsedSeconds < 4) {
      return 10;
    }
    if (elapsedSeconds < 6) {
      return 100;
    }
    return 1000;
  };

  const modifyRep = ({
    changeType,
    intervalTime,
  }: {
    readonly intervalTime: number;
    readonly changeType: RepChangeType;
  }) => {
    const increaseAmount = getIncreaseAmount();
    setOnProgressRep((prevRep) => {
      const newRep =
        changeType === RepChangeType.INCREASE
          ? prevRep + increaseAmount
          : prevRep - increaseAmount;
      // Round to nearest multiple of increaseAmount
      return Math.round(newRep / increaseAmount) * increaseAmount;
    });

    // Decrease interval time by 50%
    const newIntervalTime = Math.max(10, intervalTime * 0.9); // Minimum interval time is 10ms

    // Schedule next increase
    timeoutRef.current = setTimeout(
      () =>
        modifyRep({
          intervalTime: newIntervalTime,
          changeType,
        }),
      newIntervalTime
    );
  };

  const handleMouseDown = (changeType: RepChangeType) => {
    startTimeRef.current = new Date();
    modifyRep({ intervalTime: 500, changeType });
  };

  const handleMouseUp = () => {
    startTimeRef.current = null;
    setRep(onProgressRep);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-1">
      <Tippy
        content={formatNumberWithCommas(onProgressRep)}
        placement="top"
        hideOnClick={false}
      >
        <button
          type="button"
          onMouseDown={() => handleMouseDown(RepChangeType.INCREASE)}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          aria-label="Choose positive rep"
          className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-h-6 tw-w-6 tw-text-white tw-shadow-sm hover:tw-bg-iron-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-600 tw-transition-all tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-flex-shrink-0 tw-h-4 tw-w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 15L12 9L6 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </Tippy>
      <button
        type="button"
        aria-label="Give rep"
        className={`${
          rep >= 0
            ? "tw-bg-green/[0.15] tw-ring-green/[0.20]"
            : "tw-bg-red/[0.15] tw-ring-red/[0.20]"
        } tw-flex tw-items-center tw-justify-center tw-text-xxs tw-font-medium tw-border-0 tw-rounded-full tw-ring-1 tw-ring-inset  tw-min-w-[2rem] 
              tw-h-8 tw-text-white tw-shadow-sm hover:tw-scale-110 tw-transform focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-ring-300  tw-transition-all tw-duration-300 tw-ease-out`}
      >
        <span className={`${rep >= 0 ? "tw-text-green " : "tw-text-red "}`}>
          {formatLargeNumber(rep)}
        </span>
      </button>
      <Tippy
        content={formatNumberWithCommas(onProgressRep)}
        placement="bottom"
        hideOnClick={false}
      >
        <button
          onMouseDown={() => handleMouseDown(RepChangeType.DECREASE)}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          type="button"
          aria-label="Choose negative rep"
          className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-h-6 tw-w-6 tw-text-white tw-shadow-sm hover:tw-bg-iron-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-ring-400 tw-transition-all tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-flex-shrink-0 tw-h-4 tw-w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </Tippy>
    </div>
  );
}
