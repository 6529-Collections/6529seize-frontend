import { useRef, useState } from "react";
import DropListItemRepGiveChangeButton from "./DropListItemRepGiveChangeButton";
import DropListItemRepGiveSubmit from "./DropListItemRepGiveSubmit";
import { DropFull } from "../../../../../../entities/IDrop";

export enum RepChangeType {
  INCREASE = "INCREASE",
  DECREASE = "DECREASE",
}

export default function DropListItemRepGive({
  drop,
  availableRep,
}: {
  readonly drop: DropFull;
  readonly availableRep: number;
}) {
  const repCategory = drop.input_profile_categories?.find(
    (category) => category.category === "Rep"
  );
  const repGiven = repCategory?.rep_given_by_input_profile ?? 0;
  const [rep, setRep] = useState<number>(repGiven);
  const maxRep = repGiven + availableRep;
  const minRep = repGiven - availableRep;
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
      const newValue = Math.round(newRep / increaseAmount) * increaseAmount;
      if (newValue > maxRep) {
        return maxRep;
      }
      if (newValue < minRep) {
        return minRep;
      }
      return newValue;
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
      <DropListItemRepGiveChangeButton
        availableRep={availableRep}
        type={RepChangeType.INCREASE}
        onProgressRep={onProgressRep}
        handleMouseDown={handleMouseDown}
        handleMouseUp={handleMouseUp}
      />
      <DropListItemRepGiveSubmit rep={rep} drop={drop} originalRep={repGiven} />
      <DropListItemRepGiveChangeButton
        availableRep={availableRep}
        type={RepChangeType.DECREASE}
        onProgressRep={onProgressRep}
        handleMouseDown={handleMouseDown}
        handleMouseUp={handleMouseUp}
      />
    </div>
  );
}
