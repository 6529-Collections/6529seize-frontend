export default function AllowlistToolBuilderTransferPools() {
  return (
    <>
      <div>
        <div className="tw-cursor-pointer tw-bg-[#1E1E23] tw-rounded-xl tw-py-5  tw-transition tw-duration-300 tw-ease-out">
          {" "}
          {/* hover:tw-bg-[#1E1E23] */}
          <div className="tw-px-6 tw-flex tw-items-center tw-gap-x-4">
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
          <div className="tw-border tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-neutral-700/60 tw-mt-5 tw-pt-5 tw-w-full">
            <div className="tw-px-6 tw-flex tw-gap-x-4 tw-items-end">
              <div className="tw-flex-1">
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                  Pool name
                </label>
                <div className="tw-mt-2">
                  <input
                    required
                    className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-[#2D2E32] tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-[#2D2E32] placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
              </div>
              <div className="tw-flex-1">
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                  Description
                </label>
                <div className="tw-mt-2">
                  <input
                    required
                    className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-[#2D2E32] tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-[#2D2E32] placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
              </div>
              <div className="tw-flex-1">
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                  Block number
                </label>
                <div className="tw-mt-2">
                  <input
                    required
                    className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-[#2D2E32] tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-[#2D2E32] placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
              </div>
              <div className="tw-flex-1">
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                  Contract number
                </label>
                <div className="tw-mt-2">
                  <input
                    required
                    className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-[#2D2E32] tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-[#2D2E32] placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  style={{ fontSize: "14px !important" }}
                  className="tw-bg-primary tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-primary tw-rounded-lg hover:tw-bg-primary-hover hover:tw-border-primary-hover tw-transition tw-duration-300 tw-ease-out"
                >
                  Add transfer pool
                </button>
              </div>
            </div>

            <div className="tw-bg-[#1E1E23]">
              <div className="tw-px-4 sm:tw-px-6 lg:tw-px-8">
                <div className="tw-mt-8 tw-flow-root">
                  <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
                    <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle">
                      <table className="tw-min-w-full tw-border tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-neutral-700/60 tw-divide-solid tw-divide-y tw-divide-neutral-700/60">
                        <thead className="tw-bg-[#222327]">
                          <tr>
                            <th
                              scope="col"
                              className="tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
                            >
                              Pool name
                            </th>
                            <th
                              scope="col"
                              className="tw-px-3 tw-py-3.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px]"
                            >
                              Contract number
                            </th>
                            <th
                              scope="col"
                              className="tw-px-3 tw-py-3.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px]"
                            >
                              Description
                            </th>
                            <th
                              scope="col"
                              className="tw-px-3 tw-py-3.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px]"
                            >
                              Block number
                            </th>
                            <th
                              scope="col"
                              className="tw-relative tw-py-3.5 tw-pl-3 tw-pr-4 sm:tw-pr-6"
                            >
                             
                            </th>
                          </tr>
                        </thead>
                        <tbody className="tw-divide-y tw-divide-neutral-800">
                          <tr>
                            <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
                              Memes collection
                            </td>
                            <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
                              0x33fd...17af1
                            </td>
                            <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal  tw-text-neutral-300">
                              Description
                            </td>
                            <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal  tw-text-neutral-300">
                              32536673
                            </td>
                            <td className="tw-relative tw-whitespace-nowrap tw-py-4 tw-pl-3 tw-pr-4 tw-text-right tw-text-sm tw-font-normal  sm:tw-pr-6">
                              icons
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
