import { ApiDrop } from "../../generated/models/ApiDrop";
import { ActiveDropAction } from "../../types/dropInteractionTypes";

interface CreateDropReplyingProps {
  readonly drop: ApiDrop;
  readonly action: ActiveDropAction;
  readonly onCancel: () => void;
  readonly disabled: boolean;
}

export default function CreateDropReplying({
  drop,
  action,
  onCancel,
  disabled,
}: CreateDropReplyingProps) {
  const ACTION_LABELS = {
    [ActiveDropAction.REPLY]: "Replying to",
    [ActiveDropAction.QUOTE]: "Quoting",
  };

  return (
    <div className="-tw-mt-2 tw-flex tw-justify-between tw-items-center" data-text-selection-exclude="true">
      <span className="tw-text-xs tw-text-iron-400">
        {ACTION_LABELS[action]}{" "}
        <span className="tw-text-green tw-text-xs tw-font-semibold">
          {drop.author.handle}
        </span>
      </span>
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        className={`tw-bg-transparent tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-border-0 -tw-mr-2 tw-transition tw-duration-300 tw-ease-out ${
          disabled
            ? "tw-text-iron-600 tw-cursor-not-allowed"
            : "tw-text-primary-400 hover:tw-text-primary-500"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-5 tw-flex-shrink-0"
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
