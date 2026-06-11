import type { ApiDropPollOption } from "@/generated/models/ApiDropPollOption";
import { CheckIcon } from "@heroicons/react/24/outline";

export function PollVoteOption({
  option,
  checked,
  multichoice,
  groupName,
  disabled,
  onChange,
}: {
  readonly option: ApiDropPollOption;
  readonly checked: boolean;
  readonly multichoice: boolean;
  readonly groupName: string;
  readonly disabled: boolean;
  readonly onChange: (optionNo: number) => void;
}) {
  const indicatorShapeClass = multichoice ? "tw-rounded" : "tw-rounded-full";
  const rowStateClass = checked
    ? "tw-border-iron-700 tw-bg-iron-800 tw-shadow-[0_0_15px_rgba(245,245,245,0.04)]"
    : "tw-border-iron-800 tw-bg-iron-800/60 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-800/80";
  const indicatorStateClass = checked
    ? "tw-scale-110 tw-border-iron-50 tw-bg-iron-50 desktop-hover:group-hover/vote:tw-scale-100 desktop-hover:group-hover/vote:tw-border-iron-200 desktop-hover:group-hover/vote:tw-bg-iron-200"
    : "tw-border-iron-600 tw-bg-iron-900/50 desktop-hover:group-hover/vote:tw-border-iron-400";
  const selectionFillClass = checked
    ? "tw-scale-x-100 tw-opacity-100"
    : "tw-scale-x-0 tw-opacity-0";

  return (
    <label
      className={`tw-group/vote tw-relative tw-flex tw-min-h-11 tw-transform-gpu tw-cursor-pointer tw-items-start tw-gap-2.5 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-px-3.5 tw-py-3 tw-transition-all tw-duration-300 active:tw-scale-[0.99] ${rowStateClass} ${
        disabled ? "tw-cursor-not-allowed tw-opacity-60" : ""
      }`}
    >
      {!multichoice && (
        <span
          className={`tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-full tw-origin-left tw-transform-gpu tw-bg-iron-700 tw-transition-[transform,opacity] tw-duration-300 tw-ease-out ${selectionFillClass}`}
          aria-hidden="true"
        />
      )}
      <input
        type={multichoice ? "checkbox" : "radio"}
        name={groupName}
        checked={checked}
        disabled={disabled}
        aria-label={option.option_string}
        onClick={(event) => event.stopPropagation()}
        onChange={() => onChange(option.option_no)}
        className="tw-peer tw-sr-only"
      />
      <span
        className={`tw-relative tw-z-10 tw-mt-0.5 tw-flex tw-size-4 tw-shrink-0 tw-items-center tw-justify-center tw-border tw-border-solid tw-transition-all tw-duration-300 peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-white/30 ${indicatorShapeClass} ${indicatorStateClass}`}
        aria-hidden="true"
      >
        {multichoice ? (
          <CheckIcon
            className={`tw-size-2.5 tw-text-iron-950 tw-transition-all tw-duration-200 ${
              checked
                ? "tw-scale-100 tw-opacity-100"
                : "tw-scale-50 tw-opacity-0"
            }`}
            strokeWidth={3}
          />
        ) : (
          <span
            className={`tw-size-1.5 tw-rounded-full tw-bg-iron-950 tw-transition-all tw-duration-200 ${
              checked
                ? "tw-scale-100 tw-opacity-100"
                : "tw-scale-0 tw-opacity-0"
            }`}
          />
        )}
      </span>
      <span
        className={`tw-[overflow-wrap:anywhere] tw-relative tw-z-10 tw-min-w-0 tw-break-words tw-text-sm tw-leading-5 tw-transition-colors tw-duration-300 ${
          checked
            ? "tw-font-medium tw-text-iron-50"
            : "tw-font-medium tw-text-iron-100 desktop-hover:group-hover/vote:tw-text-iron-50"
        }`}
      >
        {option.option_string}
      </span>
    </label>
  );
}
