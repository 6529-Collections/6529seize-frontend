"use client";

import { useEffect, useRef, useState } from "react";
import DropListItemRateGiveChangeButton from "./DropListItemRateGiveChangeButton";
import DropListItemRateGiveSubmit from "./DropListItemRateGiveSubmit";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import { Time } from "../../../../../../helpers/time";
import { ApiDrop } from "../../../../../../generated/models/ApiDrop";
import { Tooltip } from "react-tooltip";
import { useDropInteractionRules } from "../../../../../../hooks/drops/useDropInteractionRules";

export enum RateChangeType {
  INCREASE = "INCREASE",
  DECREASE = "DECREASE",
}

export default function DropListItemRateGive({
  drop,
  onRated,
  isMobile = false,
}: {
  readonly drop: ApiDrop;
  readonly onRated?: () => void;
  readonly isMobile?: boolean;
}) {
  const memeticWaitTime = 1000;
  const memeticValues: number[] = [
    -69420, -42069, -6529, -420, -69, 69, 420, 6529, 42069, 69420,
  ];
  const { canVote } = useDropInteractionRules(drop);
  const [onProgressRate, setOnProgressRate] = useState<number>(1);
  const maxRating = drop.context_profile_context?.max_rating ?? 0;
  const minRating = drop.context_profile_context?.min_rating ?? 0;

  useEffect(() => {
    if (!canVote) {
      setOnProgressRate(0);
      return;
    }
    if (Math.abs(onProgressRate) > maxRating) {
      setOnProgressRate(onProgressRate > 0 ? maxRating : minRating);
      return;
    }
    setOnProgressRate(1);
  }, [canVote, drop]);

  const onSuccessfulRateChange = () => {
    setOnProgressRate(1);
    onRated?.();
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const getCorrectedNewRate = (newValue: number) => {
    if (newValue > maxRating) {
      return maxRating;
    }
    if (newValue < minRating) {
      return minRating;
    }
    return newValue;
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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
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
        className="tw-relative tw-gap-y-1 tw-flex tw-flex-col tw-items-center"
        data-tooltip-id={getShowRate() ? tooltipId : undefined}>
        <div
          className={`${
            isMobile ? "tw-gap-x-4" : ""
          } tw-w-full tw-inline-flex tw-items-center tw-gap-x-1`}>
          <DropListItemRateGiveChangeButton
            canVote={canVote}
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
          }}>
          <div className="tw-text-center">
            <span
              className={`${getRateClasses()} tw-text-xs tw-font-normal tw-text-center tw-w-full tw-transition tw-duration-300 tw-ease-out`}>
              {getRateText()}
            </span>
          </div>
        </Tooltip>
      )}
    </>
  );
}
