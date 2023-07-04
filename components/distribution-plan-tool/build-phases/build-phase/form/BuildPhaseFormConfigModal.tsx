export default function BuildPhaseFormConfigModal() {
  return (
    <div className="tw-px-6 tw-pt-6 tw-gap-y-6 tw-flex tw-flex-col tw-divide-y tw-divide-solid tw-divide-neutral-700 tw-divide-x-0">
      <div className="tw-grid tw-grid-cols-2">
        <div className="tw-col-span-2">
          <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
            Exclude from
          </label>
          <div className="tw-mt-2">
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
              <input
                type="text"
                className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                placeholder="Select"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="tw-pt-6 tw-grid tw-grid-cols-2 tw-gap-4">
        <div className="tw-col-span-2">
          <fieldset>
            <div className="tw-space-y-4 sm:tw-flex sm:tw-items-center sm:tw-space-x-10 sm:tw-space-y-0">
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-py-3 tw-px-3 placeholder:tw-text-neutral-500 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
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
                  className="tw-h-4 tw-w-4 tw-py-3 tw-px-3 placeholder:tw-text-neutral-500 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
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
                  className="tw-h-4 tw-w-4 tw-py-3 tw-px-3 placeholder:tw-text-neutral-500 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
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
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
              <input
                type="text"
                className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
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
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
              <input
                type="text"
                className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                placeholder="To 1 to 150"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="tw-pt-6 tw-grid tw-grid-cols-2 tw-gap-4">
        <div className="tw-col-span-2">
          <fieldset>
            <div className="tw-space-y-4 sm:tw-flex sm:tw-items-center sm:tw-space-x-10 sm:tw-space-y-0">
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-py-3 tw-px-3 placeholder:tw-text-neutral-500 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
                />
                <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                  All
                </label>
              </div>
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-py-3 tw-px-3 placeholder:tw-text-neutral-500 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
                />
                <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                  Random
                </label>
              </div>
            </div>
          </fieldset>
        </div>
        <div className="col-span-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
            Up to
          </label>
          <div className="tw-mt-2">
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
              <input
                type="text"
                className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                placeholder="Up to 100 wallets"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="tw-pt-6 tw-w-full">
        <button
          type="submit"
          className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-base tw-text-white tw-w-full tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Next
        </button>
      </div>
    </div>
  );
}
