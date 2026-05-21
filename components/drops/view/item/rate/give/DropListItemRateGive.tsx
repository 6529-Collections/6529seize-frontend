"use client";

import { useRef, useState } from "react";
import DropListItemRateGiveChangeButton from "./DropListItemRateGiveChangeButton";
import DropListItemRateGiveSubmit from "./DropListItemRateGiveSubmit";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { Tooltip } from "react-tooltip";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";

export enum RateChangeType {
  INCREASE = "INCREASE",
  DECREASE = "DECREASE",
}

interface ProgressRateState {
  readonly dropId: string;
  readonly rate: number;
}

export default function DropListItemRateGive({
  drop,
  onRated,
  isMobile = false,
}: {
  readonly drop: ApiDrop;
  readonly onRated?: (() => void) | undefined;
  readonly isMobile?: boolean | undefined;
}) {
  const memeticWaitTime = 1000;
  const memeticValues: number[] = [
    -69420, -42069, -6529, -420, -69, 69, 420, 6529, 42069, 69420,
  ];
  const { canVote } = useDropInteractionRules(drop);
  const [progressRateState, setProgressRateState] = useState<ProgressRateState>(
    { dropId: drop.id, rate: 1 }
  );
  const maxRating = drop.context_profile_context?.max_rating ?? 0;
  const currentRating = drop.context_profile_context?.rating ?? 0;
  const rawMinRating = drop.context_profile_context?.min_rating ?? 0;
  const minRating = drop.wave.forbid_negative_votes
    ? Math.max(0, rawMinRating) - currentRating
    : rawMinRating;
  const rawProgressRate =
    progressRateState.dropId === drop.id ? progressRateState.rate : 1;

  const getCorrectedNewRate = (newValue: number) => {
    if (newValue > maxRating) {
      return maxRating;
    }
    if (newValue < minRating) {
      return minRating;
    }
    return newValue;
  };

  const onProgressRate = canVote ? getCorrectedNewRate(rawProgressRate) : 0;
  const canDecrease = onProgressRate > minRating;

  const setOnProgressRate = (rate: number) => {
    setProgressRateState({ dropId: drop.id, rate });
  };

  const onSuccessfulRateChange = () => {
    setOnProgressRate(1);
    onRated?.();
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearHoldTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const getIncreaseAmount = (startTime: number) => {
    const elapsedSeconds = (Time.now().toMillis() - startTime) / 1000;

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

  const getMemeticNewRate = ({
    previousRate,
    newRate,
    changeType,
  }: {
    readonly previousRate: number;
    readonly newRate: number;
    readonly changeType: RateChangeType;
  }): {
    readonly rate: number;
    readonly isMemetic: boolean;
  } => {
    let finalVal = newRate; // Start with the new value
    const values =
      changeType === RateChangeType.DECREASE
        ? memeticValues.toReversed()
        : memeticValues;
    for (const memeticVal of values) {
      if (
        (previousRate < memeticVal && memeticVal < newRate) || // memeticVal is between oldVal and newVal
        (newRate < memeticVal && memeticVal < previousRate) // memeticVal is between newVal and oldVal
      ) {
        finalVal = memeticVal; // Set the final value to the memetic value
        break; // Exit the loop
      }
    }
    return {
      rate: finalVal,
      isMemetic: values.includes(finalVal),
    };
  };

  const getNewRateConfig = ({
    changeType,
    previousRate,
    startTime,
  }: {
    readonly changeType: RateChangeType;
    readonly previousRate: number;
    readonly startTime: number;
  }): {
    readonly rate: number;
  } => {
    const increaseAmount = getIncreaseAmount(startTime);
    const newRate =
      changeType === RateChangeType.INCREASE
        ? previousRate + increaseAmount
        : previousRate - increaseAmount;
    const newValue = Math.round(newRate / increaseAmount) * increaseAmount;
    const correctedNewRate = getCorrectedNewRate(newValue);
    return {
      rate: correctedNewRate,
    };
  };

  const modifyRate = ({
    changeType,
    intervalTime,
    previousRate,
    startTime,
  }: {
    readonly intervalTime: number;
    readonly changeType: RateChangeType;
    readonly previousRate: number;
    readonly startTime: number;
  }) => {
    const { rate: newRate } = getNewRateConfig({
      changeType,
      previousRate,
      startTime,
    });
    const { rate: memeticRate, isMemetic } = getMemeticNewRate({
      previousRate,
      newRate,
      changeType,
    });
    setOnProgressRate(memeticRate);

    if (
      (changeType === RateChangeType.DECREASE && memeticRate <= minRating) ||
      (changeType === RateChangeType.INCREASE && memeticRate >= maxRating)
    ) {
      clearHoldTimer();
      return;
    }

    // Decrease interval time by 50%
    const newIntervalTime = Math.max(10, intervalTime * 0.9); // Minimum interval time is 10ms
    const waitForMemetic = isMemetic ? memeticWaitTime : newIntervalTime;

    // Schedule next increase
    timeoutRef.current = setTimeout(
      () =>
        modifyRate({
          intervalTime:
            isMemetic && newIntervalTime < 300 ? 300 : newIntervalTime,
          changeType,
          previousRate: memeticRate,
          startTime: isMemetic ? startTime + memeticWaitTime : startTime,
        }),
      waitForMemetic
    );
  };

  const handleMouseDown = (changeType: RateChangeType) => {
    modifyRate({
      intervalTime: 500,
      changeType,
      previousRate: onProgressRate,
      startTime: Time.now().toMillis(),
    });
  };

  const handleMouseUp = () => {
    clearHoldTimer();
  };

  const getRateText = () =>
    `${onProgressRate > 0 ? "+" : ""}${formatNumberWithCommas(onProgressRate)}`;

  const getShowRate = () => {
    return canVote && onProgressRate !== 0 && onProgressRate !== 1;
  };

  const getRateClasses = () => {
    if (onProgressRate > 0) {
      return "tw-text-green";
    }
    if (onProgressRate < 0) {
      return "tw-text-red";
    }
    return "tw-text-iron-500";
  };

  const tooltipId = `rate-give-tooltip-${drop.id}`;

  return (
    <>
      <div
        className="tw-relative tw-flex tw-flex-col tw-items-center tw-gap-y-1"
        {...(getShowRate() ? { "data-tooltip-id": tooltipId } : {})}
      >
        <div
          className={`${
            isMobile ? "tw-gap-x-4" : ""
          } tw-inline-flex tw-w-full tw-items-center tw-gap-x-1`}
        >
          <DropListItemRateGiveChangeButton
            canVote={canVote && canDecrease}
            type={RateChangeType.DECREASE}
            handleMouseDown={handleMouseDown}
            handleMouseUp={handleMouseUp}
            isMobile={isMobile}
          />
          <DropListItemRateGiveSubmit
            rate={onProgressRate}
            drop={drop}
            canVote={canVote}
            onSuccessfulRateChange={onSuccessfulRateChange}
            isMobile={isMobile}
          />
          <DropListItemRateGiveChangeButton
            canVote={canVote}
            type={RateChangeType.INCREASE}
            handleMouseDown={handleMouseDown}
            handleMouseUp={handleMouseUp}
            isMobile={isMobile}
          />
        </div>
      </div>
      {getShowRate() && (
        <Tooltip
          id={tooltipId}
          place="top"
          style={{
            backgroundColor: "#1F2937",
            color: "white",
            padding: "4px 8px",
          }}
        >
          <div className="tw-text-center">
            <span
              className={`${getRateClasses()} tw-w-full tw-text-center tw-text-xs tw-font-normal tw-transition tw-duration-300 tw-ease-out`}
            >
              {getRateText()}
            </span>
          </div>
        </Tooltip>
      )}
    </>
  );
}
