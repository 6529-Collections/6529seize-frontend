import { Switch } from "@headlessui/react";
import { classNames } from "@/helpers/Helpers";

export default function ProxyCreateActionConfigEndTimeSwitch({
  isActive,
  setIsActive,
}: {
  readonly isActive: boolean;
  readonly setIsActive: (isActive: boolean) => void;
}) {
  return (
    <div className="tw-mt-4 tw-flex tw-items-center">
      <Switch
        checked={isActive}
        onChange={setIsActive}
        className={classNames(
          isActive ? "tw-bg-primary-500" : "tw-bg-iron-700",
          "tw-p-0 tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out"
        )}
      >
        <span className="tw-sr-only">No end time</span>
        <span
          className={classNames(
            isActive ? "tw-translate-x-5" : "tw-translate-x-0",
            "tw-pointer-events-none tw-relative tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-white tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out"
          )}
        >
          <span
            className={classNames(
              isActive
                ? "tw-opacity-0 tw-duration-100 tw-ease-out"
                : "tw-opacity-100 tw-duration-200 tw-ease-in",
              "tw-absolute tw-inset-0 tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-transition-opacity"
            )}
            aria-hidden="true"
          >
            <svg
              className="tw-h-3 tw-w-3 tw-text-iron-400"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 12 12"
            >
              <path
                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span
            className={classNames(
              isActive
                ? "tw-opacity-100 tw-duration-200 tw-ease-in"
                : "tw-opacity-0 tw-duration-100 tw-ease-out",
              "tw-absolute tw-inset-0 tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-transition-opacity"
            )}
            aria-hidden="true"
          >
            <svg
              className="tw-h-3 tw-w-3 tw-text-primary-500"
              fill="currentColor"
              viewBox="0 0 12 12"
            >
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
            </svg>
          </span>
        </span>
      </Switch>
      <span className="tw-ml-3 tw-whitespace-nowrap tw-text-iron-300 tw-text-sm tw-font-medium">
        No end time
      </span>
    </div>
  );
}
