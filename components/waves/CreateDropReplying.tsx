import { Drop } from "../../generated/models/Drop";
import { ActiveDropAction } from "./detailed/WaveDetailedContent";

interface CreateDropReplyingProps {
  drop: Drop;
  action: ActiveDropAction;
  onCancel: () => void;
}

export default function CreateDropReplying({
  drop,
  action,
  onCancel,
}: CreateDropReplyingProps) {
  const ACTION_LABELS = {
    [ActiveDropAction.REPLY]: "Replying to",
    [ActiveDropAction.QUOTE]: "Quoting",
  };

  return (
    <div className="-tw-mt-2 tw-flex tw-justify-between tw-items-center">
      <span className="tw-text-xs tw-text-iron-400">
        {ACTION_LABELS[action]}{" "}
        <span className="tw-text-green tw-text-xs tw-font-semibold">
          {drop.author.handle}
        </span>
      </span>
      <button
        type="button"
        onClick={onCancel}
        className="tw-bg-transparent tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-border-0 -tw-mr-2  tw-text-primary-400 hover:tw-text-primary-500 tw-transition tw-duration-300 tw-ease-out "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}