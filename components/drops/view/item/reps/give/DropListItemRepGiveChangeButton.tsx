import { RepChangeType } from "./DropListItemRepGive";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../../auth/Auth";
import { ProfileConnectedStatus } from "../../../../../../entities/IProfile";
import { DropFull } from "../../../../../../entities/IDrop";

export default function DropListItemRepGiveChangeButton({
  drop,
  type,
  availableRep,
  handleMouseDown,
  handleMouseUp,
}: {
  readonly drop: DropFull;
  readonly type: RepChangeType;
  readonly availableRep: number;
  readonly handleMouseDown: (changeType: RepChangeType) => void;
  readonly handleMouseUp: () => void;
}) {
  const { connectionStatus, connectedProfile } = useContext(AuthContext);

  const getCanRate = () => {
    return (
      connectionStatus === ProfileConnectedStatus.HAVE_PROFILE &&
      connectedProfile?.profile?.handle.toLowerCase() !==
        drop.author.handle.toLowerCase() &&
      !!availableRep
    );
  };

  const [canRate, setCanRate] = useState(getCanRate());

  const svgpaths: Record<RepChangeType, string> = {
    [RepChangeType.INCREASE]: "M18 15L12 9L6 15",
    [RepChangeType.DECREASE]: "M6 9L12 15L18 9",
  };

  const ariaLabels: Record<RepChangeType, string> = {
    [RepChangeType.INCREASE]: "Choose positive rep",
    [RepChangeType.DECREASE]: "Choose negative rep",
  };

  const onMouseDown = () => {
    if (connectionStatus !== ProfileConnectedStatus.HAVE_PROFILE) {
      return;
    }
    handleMouseDown(type);
  };

  const onMouseUpOrLeave = () => {
    if (connectionStatus !== ProfileConnectedStatus.HAVE_PROFILE) {
      return;
    }
    handleMouseUp();
  };

  const getButtonClasses = (ratingAllowed: boolean) => {
    if (ratingAllowed) {
      return "hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-text-white";
    }
    return "tw-text-iron-500";
  };

  const [buttonClasses, setButtonClasses] = useState<string | null>(
    getButtonClasses(canRate)
  );

  useEffect(() => {
    const ratingAllowed = getCanRate();
    setCanRate(ratingAllowed);
    setButtonClasses(getButtonClasses(ratingAllowed));
  }, [connectionStatus, connectedProfile, drop, availableRep]);

  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUpOrLeave}
      onMouseLeave={onMouseUpOrLeave}
      disabled={!canRate}
      aria-label={ariaLabels[type]}
      className={`${buttonClasses} tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-full tw-bg-iron-900 tw-ring-2 tw-ring-inset tw-ring-iron-700 tw-h-7 tw-w-7  tw-shadow-sm tw-transition-all tw-duration-300 tw-ease-out`}
    >
      <svg
        className="tw-flex-shrink-0 tw-h-5 tw-w-5"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={svgpaths[type]}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
