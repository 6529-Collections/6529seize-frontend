export default function WavesDropsTypes() {
  return (
    <div>
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
        Required Types
      </p>
      <div className="tw-mt-4 tw-grid tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
        <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400 tw-bg-primary-400/10 tw-px-5 tw-py-4 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out">
          <div className="tw-flex tw-h-6 tw-items-center">
            <input
              id="comments"
              aria-describedby="comments-description"
              name="comments"
              type="checkbox"
              className="tw-form-checkbox tw-w-5 tw-h-5 tw-rounded tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
            />
          </div>
          <span className="tw-flex tw-items-center">
            <span className="tw-flex tw-flex-col tw-text-base">
              <span className="tw-font-bold tw-text-primary-400">Image</span>
            </span>
          </span>
        </div>
        <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-800 tw-px-5 tw-py-4 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3 hover:tw-ring-iron-600 tw-transition tw-duration-300 tw-ease-out">
          <input
            id="comments"
            aria-describedby="comments-description"
            name="comments"
            type="checkbox"
            className="tw-form-checkbox tw-w-5 tw-h-5 tw-rounded tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
          />
          <span className="tw-flex tw-items-center">
            <span className="tw-flex tw-flex-col tw-text-base">
              <span className="tw-font-semibold tw-text-iron-300">Audio</span>
            </span>
          </span>
        </div>
        <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-800 tw-px-5 tw-py-4 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3 hover:tw-ring-iron-600 tw-transition tw-duration-300 tw-ease-out">
          <input
            id="comments"
            aria-describedby="comments-description"
            name="comments"
            type="checkbox"
            className="tw-form-checkbox tw-w-5 tw-h-5 tw-rounded tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
          />
          <span className="tw-flex tw-items-center">
            <span className="tw-flex tw-flex-col tw-text-base">
              <span className="tw-font-semibold tw-text-iron-300">Video</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
