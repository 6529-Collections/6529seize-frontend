import { RateChangeType } from "./DropListItemRateGive";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../../auth/Auth";
import { ProfileConnectedStatus } from "../../../../../../entities/IProfile";

export default function DropListItemRateGiveChangeButton({
  type,
  canVote,
  handleMouseDown,
  handleMouseUp,
}: {
  readonly type: RateChangeType;
  readonly canVote: boolean;
  readonly handleMouseDown: (changeType: RateChangeType) => void;
  readonly handleMouseUp: () => void;
}) {
  const { connectionStatus, connectedProfile } = useContext(AuthContext);

  const svgpaths: Record<RateChangeType, string> = {
    [RateChangeType.INCREASE]: "M18 15L12 9L6 15",
    [RateChangeType.DECREASE]: "M6 9L12 15L18 9",
  };

  const ariaLabels: Record<RateChangeType, string> = {
    [RateChangeType.INCREASE]: "Choose positive votes",
    [RateChangeType.DECREASE]: "Choose negative votes",
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
    getButtonClasses(canVote)
  );

  useEffect(() => {
    setButtonClasses(getButtonClasses(canVote));
  }, [canVote]);

  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUpOrLeave}
      onMouseLeave={onMouseUpOrLeave}
      disabled={!canVote}
      aria-label={ariaLabels[type]}
      className={`${buttonClasses} tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-full  tw-bg-transparent tw-h-7 tw-w-7 tw-transition-all tw-duration-300 tw-ease-out`}
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
