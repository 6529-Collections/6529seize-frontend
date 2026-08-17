import type { BlockPickerTimeWindow } from "@/app/tools/block-finder/page.client";

export default function BlockPickerTimeWindowSelectList({
  options,
  timeWindow,
  setTimeWindow,
}: {
  options: {
    readonly title: string;
    readonly value: BlockPickerTimeWindow;
  }[];
  timeWindow: BlockPickerTimeWindow;
  setTimeWindow: (timeWindow: BlockPickerTimeWindow) => void;
}) {
  return (
    <ul
      className="tw-absolute tw-z-10 tw-mt-1 tw-max-h-60 tw-w-full tw-list-none tw-overflow-auto tw-rounded-lg tw-bg-iron-900 tw-py-2 tw-pl-1.5 tw-pr-1.5 tw-text-base tw-text-iron-200 tw-shadow-xl tw-ring-1 tw-ring-inset tw-ring-iron-700/60 focus:tw-outline-none sm:tw-text-sm"
      role="listbox"
      aria-labelledby="listbox-label"
    >
      {options.map((option) => (
        <li
          id={`block-picker-time-window-option-${option.value}`}
          key={option.value}
          onClick={(e) => {
            e.stopPropagation();
            setTimeWindow(option.value);
          }}
          className="tw-group tw-relative tw-cursor-pointer tw-select-none tw-rounded-lg tw-py-2.5 tw-pl-3 tw-pr-9 tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 hover:tw-text-iron-50"
          role="option"
          aria-selected={timeWindow === option.value}
        >
          <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-4 tw-pr-4">
            <div className="tw-flex-1">
              <span className="tw-block tw-truncate tw-font-normal">
                {option.title}
              </span>
            </div>
          </div>

          {timeWindow === option.value && (
            <span className="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-4">
              <svg
                className="tw-h-5 tw-w-5 tw-text-primary-300"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
