export default function GroupCreateIdentitiesIncludeHero() {
  return (
    <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <p className="tw-mb-0 tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
        Include me
      </p>
      <div className="tw-mt-2 sm:tw-mt-3">
        <div className="tw-flex tw-items-center">
          <div className="tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] tw-from-primary-300">
            {/* Enabled: "tw-bg-primary-500", Not Enabled: "tw-bg-iron-700" */}
            <button
              type="button"
              className="tw-p-0 tw-relative tw-flex tw-items-center tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-bg-primary-500 tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500 focus:tw-ring-offset-2"
              role="switch"
              aria-checked="false"
            >
              {/*   Enabled: "tw-translate-x-5", Not Enabled: "tw-translate-x-0"  */}
              <span
                aria-hidden="true"
                className="tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-translate-x-5 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out"
              ></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
