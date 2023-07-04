export default function BuildPhaseFormConfigModal() {
  return (
    <div className="tw-p-6">
      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
          Exclude from
        </label>
        <div className="tw-mt-2">
          <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-indigo-500">
            <input
              type="text"
              className="tw-flex-1 tw-border-0 tw-bg-transparent tw-py-1.5 tw-pl-1 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
              placeholder="Select"
            />
          </div>
        </div>
      </div>
      <div className="tw-grid tw-grid-cols-2 tw-gap-4">
        <div className="tw-col-span-2">
          <fieldset>
            <legend className="sr-only">Notification method</legend>
            <div className="tw-space-y-4 sm:tw-flex sm:tw-items-center sm:tw-space-x-10 sm:tw-space-y-0">
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-border-gray-300 tw-text-indigo-600 focus:tw-ring-indigo-600"
                />
                <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                  Total cards
                </label>
              </div>
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-border-gray-300 tw-text-indigo-600 focus:tw-ring-indigo-600"
                />
                <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                  Total unique cards
                </label>
              </div>
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-border-gray-300 tw-text-indigo-600 focus:tw-ring-indigo-600"
                />
                <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                  Total TDH
                </label>
              </div>
            </div>
          </fieldset>
        </div>
        <div className="col-span-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
            From
          </label>
          <div className="tw-mt-2">
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-indigo-500">
              <input
                type="text"
                className="tw-flex-1 tw-border-0 tw-bg-transparent tw-py-1.5 tw-pl-1 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                placeholder="From 1 to 150"
              />
            </div>
          </div>
        </div>
        <div className="col-span-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
            To
          </label>
          <div className="tw-mt-2">
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-indigo-500">
              <input
                type="text"
                className="tw-flex-1 tw-border-0 tw-bg-transparent tw-py-1.5 tw-pl-1 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                placeholder="To 1 to 150"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
