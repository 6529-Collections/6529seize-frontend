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
  const indicatorShapeClass = multichoice
    ? "tw-rounded-[5px]"
    : "tw-rounded-full";
  const rowStateClass = checked
    ? "tw-border-white/20 tw-bg-white/[0.06] desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/[0.06]"
    : "tw-border-white/[0.06] tw-bg-white/[0.025] desktop-hover:hover:tw-border-white/[0.12] desktop-hover:hover:tw-bg-white/[0.05]";
  const indicatorStateClass = checked
    ? "tw-scale-110 tw-border-white tw-bg-white desktop-hover:group-hover/vote:tw-scale-100 desktop-hover:group-hover/vote:tw-border-white desktop-hover:group-hover/vote:tw-bg-white"
    : "tw-border-white/20 tw-bg-black/40 desktop-hover:group-hover/vote:tw-border-white/60 desktop-hover:group-hover/vote:tw-bg-black/60";
  const selectionFillClass = checked
    ? "tw-scale-x-100 tw-opacity-100"
    : "tw-scale-x-0 tw-opacity-0";

  return (
    <label
      className={`tw-group/vote tw-relative tw-flex tw-min-h-11 tw-transform-gpu tw-cursor-pointer tw-items-start tw-gap-3 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-px-4 tw-py-3 tw-transition-all tw-duration-300 active:tw-scale-[0.99] ${rowStateClass} ${
        disabled ? "tw-cursor-not-allowed tw-opacity-60" : ""
      }`}
    >
      {!multichoice && (
        <span
          className={`tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-full tw-origin-left tw-transform-gpu tw-bg-white/[0.12] tw-transition-[transform,opacity] tw-duration-300 tw-ease-out ${selectionFillClass}`}
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
        className={`tw-relative tw-z-10 tw-mt-0.5 tw-flex tw-size-[18px] tw-flex-shrink-0 tw-items-center tw-justify-center tw-border tw-border-solid tw-shadow-sm tw-transition-all tw-duration-300 peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-white/30 ${indicatorShapeClass} ${indicatorStateClass}`}
        aria-hidden="true"
      >
        {multichoice ? (
          <CheckIcon
            className={`tw-size-3 tw-text-black tw-transition-all tw-duration-200 ${
              checked
                ? "tw-scale-100 tw-opacity-100"
                : "tw-scale-50 tw-opacity-0"
            }`}
            strokeWidth={3}
          />
        ) : (
          <span
            className={`tw-size-[7px] tw-rounded-full tw-bg-black tw-transition-all tw-duration-200 ${
              checked
                ? "tw-scale-100 tw-opacity-100"
                : "tw-scale-0 tw-opacity-0"
            }`}
          />
        )}
      </span>
      <span
        className={`tw-relative tw-z-10 tw-min-w-0 tw-break-words tw-text-sm tw-leading-5 tw-transition-colors tw-duration-300 ${
          checked
            ? "tw-font-semibold tw-text-white"
            : "tw-font-medium tw-text-iron-300 desktop-hover:group-hover/vote:tw-text-iron-100"
        }`}
      >
        {option.option_string}
      </span>
    </label>
  );
}
