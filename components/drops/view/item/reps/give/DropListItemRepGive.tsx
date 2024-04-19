import { useContext, useEffect, useRef, useState } from "react";
import DropListItemRepGiveChangeButton from "./DropListItemRepGiveChangeButton";
import DropListItemRepGiveSubmit from "./DropListItemRepGiveSubmit";
import { DropFull } from "../../../../../../entities/IDrop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import { Time } from "../../../../../../helpers/time";
import { AuthContext } from "../../../../../auth/Auth";
import { ProfileConnectedStatus } from "../../../../../../entities/IProfile";

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
  const { connectionStatus, connectedProfile } = useContext(AuthContext);
  const memeticWaitTime = 1000;
  const memeticValues: number[] = [
    -69420, -42069, -6529, -420, -69, 69, 420, 6529, 42069, 69420,
  ];
  const [onProgressRep, setOnProgressRep] = useState<number>(1);

  const getCanRate = () => {
    return (
      connectionStatus === ProfileConnectedStatus.HAVE_PROFILE &&
      connectedProfile?.profile?.handle.toLowerCase() !==
        drop.author.handle.toLowerCase() &&
      !!availableRep
    );
  };

  const [canRate, setCanRate] = useState(getCanRate());

  useEffect(() => {
    setCanRate(getCanRate());
    if (
      connectionStatus === ProfileConnectedStatus.HAVE_PROFILE &&
      Math.abs(onProgressRep) > availableRep
    ) {
      setOnProgressRep(onProgressRep > 0 ? availableRep : 0 - availableRep);
    } else if (connectionStatus === ProfileConnectedStatus.HAVE_PROFILE) {
      setOnProgressRep(1);
    }
  }, [connectionStatus, connectedProfile, drop, availableRep]);

  const onSuccessfulRepChange = () => {
    setOnProgressRep(1);
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

  const getCorrectedNewRep = (newValue: number) => {
    if (newValue > availableRep) {
      return availableRep;
    }
    if (newValue < 0 - availableRep) {
      return 0 - availableRep;
    }
    return newValue;
  };

  const getMemeticNewRep = ({
    previousRep,
    newRep,
    changeType,
  }: {
    readonly previousRep: number;
    readonly newRep: number;
    readonly changeType: RepChangeType;
  }): {
    readonly rep: number;
    readonly isMemetic: boolean;
  } => {
    let finalVal = newRep; // Start with the new value
    const values =
      changeType === RepChangeType.DECREASE
        ? memeticValues.toReversed()
        : memeticValues;
    for (const memeticVal of values) {
      if (
        (previousRep < memeticVal && memeticVal < newRep) || // memeticVal is between oldVal and newVal
        (newRep < memeticVal && memeticVal < previousRep) // memeticVal is between newVal and oldVal
      ) {
        finalVal = memeticVal; // Set the final value to the memetic value
        break; // Exit the loop
      }
    }
    return {
      rep: finalVal,
      isMemetic: values.includes(finalVal),
    };
  };

  const getNewRepConfig = ({
    changeType,
    previousRep,
    startTime,
  }: {
    readonly changeType: RepChangeType;
    readonly previousRep: number;
    readonly startTime: number;
  }): {
    readonly rep: number;
  } => {
    const increaseAmount = getIncreaseAmount(startTime);
    const newRep =
      changeType === RepChangeType.INCREASE
        ? previousRep + increaseAmount
        : previousRep - increaseAmount;
    const newValue = Math.round(newRep / increaseAmount) * increaseAmount;
    const correctedNewRep = getCorrectedNewRep(newValue);
    return {
      rep: correctedNewRep,
    };
  };

  const modifyRep = ({
    changeType,
    intervalTime,
    previousRep,
    startTime,
  }: {
    readonly intervalTime: number;
    readonly changeType: RepChangeType;
    readonly previousRep: number;
    readonly startTime: number;
  }) => {
    const { rep: newRep } = getNewRepConfig({
      changeType,
      previousRep,
      startTime,
    });
    const { rep: memeticRep, isMemetic } = getMemeticNewRep({
      previousRep,
      newRep,
      changeType,
    });
    setOnProgressRep(memeticRep);

    // Decrease interval time by 50%
    const newIntervalTime = Math.max(10, intervalTime * 0.9); // Minimum interval time is 10ms
    const waitForMemetic = isMemetic ? memeticWaitTime : newIntervalTime;

    // Schedule next increase
    timeoutRef.current = setTimeout(
      () =>
        modifyRep({
          intervalTime:
            isMemetic && newIntervalTime < 300 ? 300 : newIntervalTime,
          changeType,
          previousRep: memeticRep,
          startTime: isMemetic ? startTime + memeticWaitTime : startTime,
        }),
      waitForMemetic
    );
  };

  const handleMouseDown = (changeType: RepChangeType) => {
    modifyRep({
      intervalTime: 500,
      changeType,
      previousRep: onProgressRep,
      startTime: Time.now().toMillis(),
    });
  };

  const handleMouseUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const getRepText = () =>
    `${onProgressRep > 0 ? "+" : ""}${formatNumberWithCommas(onProgressRep)}`;

  const getRepClasses = () => {
    if (onProgressRep > 0) {
      return "tw-text-green";
    }
    if (onProgressRep < 0) {
      return "tw-text-red";
    }
    return "tw-text-iron-500";
  };

  return (
    <div className="tw-gap-y-1 tw-flex tw-flex-col tw-items-center">
      {canRate && (
        <div className="tw-text-center">
          <span
            className={`${getRepClasses()} tw-text-xs tw-font-normal tw-text-center tw-w-full tw-transition tw-duration-300 tw-ease-out`}
          >
            {getRepText()}
          </span>
        </div>
      )}
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-[0.3125rem]">
        <DropListItemRepGiveChangeButton
          drop={drop}
          type={RepChangeType.INCREASE}
          availableRep={availableRep}
          handleMouseDown={handleMouseDown}
          handleMouseUp={handleMouseUp}
        />
        <DropListItemRepGiveSubmit
          rep={onProgressRep}
          drop={drop}
          availableRep={availableRep}
          onSuccessfulRepChange={onSuccessfulRepChange}
        />
        <DropListItemRepGiveChangeButton
          drop={drop}
          type={RepChangeType.DECREASE}
          availableRep={availableRep}
          handleMouseDown={handleMouseDown}
          handleMouseUp={handleMouseUp}
        />
      </div>
    </div>
  );
}
