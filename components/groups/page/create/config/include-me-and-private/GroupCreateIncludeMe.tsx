export default function GroupCreateIncludeMe({
  iAmIncluded,
  setIAmIncluded,
}: {
  readonly iAmIncluded: boolean;
  readonly setIAmIncluded: (iAmIncluded: boolean) => void;
}) {
  return (
    <div>
      <label
        htmlFor="include-me-toggle"
        className="tw-flex tw-flex-col tw-cursor-pointer"
      >
        <span className="tw-mb-0 tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
          Include me
        </span>
        <div className="tw-mt-2 sm:tw-mt-3">
          <div className="tw-flex tw-items-center">
            <div
              className="tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] 
            "
            >
              <button
                id="include-me-toggle"
                onClick={() => setIAmIncluded(!iAmIncluded)}
                type="button"
                className={`tw-p-0 tw-relative tw-flex tw-items-center tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none ${
                  iAmIncluded
                    ? "tw-bg-primary-500 focus:tw-ring-2 focus:tw-ring-primary-500 focus:tw-ring-offset-2"
                    : "tw-bg-iron-700"
                }`}
                role="switch"
                aria-checked={iAmIncluded}
              >
                <span
                  aria-hidden="true"
                  className={`tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${
                    iAmIncluded ? "tw-translate-x-5" : "tw-translate-x-0"
                  }`}
                ></span>
              </button>
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}
