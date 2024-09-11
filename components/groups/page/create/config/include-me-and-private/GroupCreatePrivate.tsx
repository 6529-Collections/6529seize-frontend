export default function GroupCreatePrivate({
  isPrivate,
  setIsPrivate,
}: {
  readonly isPrivate: boolean;
  readonly setIsPrivate: (isPrivate: boolean) => void;
}) {
  return (
    <div>
      <label htmlFor="private-group-toggle" className="tw-flex tw-cursor-pointer">
        <div className="tw-flex tw-items-center tw-gap-x-2 sm:tw-gap-x-3">
          <div
            className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px]  ${
              isPrivate ? "tw-from-primary-300" : "tw-from-iron-600"
            }`}
          >
            <input
              id="private-group-toggle"
              type="checkbox"
              checked={isPrivate}
              onChange={() => setIsPrivate(!isPrivate)}
              className={`tw-sr-only`}
            />
            <span
              className={`tw-p-0 tw-relative tw-flex tw-items-center tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none ${
                isPrivate
                  ? "tw-bg-primary-500 focus-focus:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2"
                  : "tw-bg-iron-700"
              }`}
              role="switch"
              aria-checked={isPrivate}
            >
              <span
                aria-hidden="true"
                className={`tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${
                  isPrivate ? "tw-translate-x-5" : "tw-translate-x-0"
                }`}
              ></span>
            </span>
          </div>
          <span className="tw-mb-0 tw-text-sm sm:tw-text-base tw-font-semibold tw-text-iron-50">
            Private group
          </span>
        </div>
      </label>
    </div>
  );
}
