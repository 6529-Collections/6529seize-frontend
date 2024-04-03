import { useRef, useState } from "react";
import DropListItemRepGiveChangeButton from "./DropListItemRepGiveChangeButton";
import DropListItemRepGiveSubmit from "./DropListItemRepGiveSubmit";
import { DropFull } from "../../../../../../entities/IDrop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import DropListItemRepState from "./DropListItemRepState";

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
  const [onProgressRep, setOnProgressRep] = useState<number>(1);

  const onSuccessfulRepChange = () => {
    setOnProgressRep(1);
  };

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
      if (newValue > availableRep) {
        return availableRep;
      }
      if (newValue < 0 - availableRep) {
        return 0 - availableRep;
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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-1">

      <DropListItemRepGiveChangeButton
        type={RepChangeType.INCREASE}
        handleMouseDown={handleMouseDown}
        handleMouseUp={handleMouseUp}
      />
      <DropListItemRepGiveSubmit
        rep={onProgressRep}
        drop={drop}
        onSuccessfulRepChange={onSuccessfulRepChange}
      />
      <DropListItemRepGiveChangeButton
        type={RepChangeType.DECREASE}
        handleMouseDown={handleMouseDown}
        handleMouseUp={handleMouseUp}
      />
    </div>
  );
}
