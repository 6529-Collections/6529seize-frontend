import Tippy from "@tippyjs/react";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import { RepChangeType } from "./DropListItemRepGive";
import { ReactNode, useContext } from "react";
import { AuthContext } from "../../../../../auth/Auth";
import { ProfileConnectedStatus } from "../../../../../../entities/IProfile";
import { assertUnreachable } from "../../../../../../helpers/AllowlistToolHelpers";

export default function DropListItemRepGiveChangeButton({
  availableRep,
  type,
  onProgressRep,
  handleMouseDown,
  handleMouseUp,
}: {
  readonly availableRep: number;
  readonly type: RepChangeType;
  readonly onProgressRep: number;
  readonly handleMouseDown: (changeType: RepChangeType) => void;
  readonly handleMouseUp: () => void;
}) {
  const { connectionStatus } = useContext(AuthContext);

  const getTooltipContent = (): ReactNode => {
    switch (connectionStatus) {
      case ProfileConnectedStatus.NOT_CONNECTED:
        return "Connect your wallet to give rep";
      case ProfileConnectedStatus.NO_PROFILE:
        return "Create a profile to give rep";
      case ProfileConnectedStatus.HAVE_PROFILE:
        if (!availableRep) {
          return "You don't have any rep left to give";
        }
        return formatNumberWithCommas(onProgressRep);
      default:
        assertUnreachable(connectionStatus);
        return "";
    }
  };

  const tooltipPlacements: Record<RepChangeType, "top" | "bottom"> = {
    [RepChangeType.INCREASE]: "top",
    [RepChangeType.DECREASE]: "bottom",
  };

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

  return (
    <Tippy
      content={getTooltipContent()}
      placement={tooltipPlacements[type]}
      hideOnClick={false}
    >
      <button
        type="button"
        // disabled={connectionStatus !== ProfileConnectedStatus.HAVE_PROFILE}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        aria-label={ariaLabels[type]}
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
            d={svgpaths[type]}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </Tippy>
  );
}
