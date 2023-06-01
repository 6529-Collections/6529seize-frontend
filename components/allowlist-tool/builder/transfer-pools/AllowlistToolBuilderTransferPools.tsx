export default function AllowlistToolBuilderTransferPools() {
  return (
    <>
      <div>
        <div className="tw-cursor-pointer tw-bg-[#18181B] tw-rounded-xl tw-py-5 tw-px-6 hover:tw-bg-[#1E1E23] tw-transition tw-duration-300 tw-ease-out">
          <div className="tw-flex tw-items-center tw-gap-x-4">
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-[#303035] tw-rounded-md">
              <svg
                className="tw-h-6 tw-w-6 tw-text-neutral-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <p className="tw-m-0 tw-p-0 tw-text-lg tw-font-medium tw-text-white">
              Transfer pools
            </p>
          </div>

          <div className="tw-border-t tw-border-red-500 tw-mt-5 tw-pt-5 tw-w-full">
            <div className="tw-grid tw-grid-cols-6">
              <div className="tw-col-span-2">
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                  Pool name
                </label>
                <div className="tw-mt-2">
                  <input
                    required
                    className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
