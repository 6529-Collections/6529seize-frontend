import { BuildPhasesPhase } from "../BuildPhases";

export default function BuildPhase({ phase }: { phase: BuildPhasesPhase }) {
  return (
    <>
      <div className="tw-flex tw-flex-col">
        <h1 className="tw-uppercase tw-text-white">{phase.name}</h1>
        <p className="tw-mb-0 tw-block tw-font-light tw-text-base tw-text-neutral-400">
          Here you can select which groups of collectors belong in phase 1.
        </p>
      </div>

      <div className="tw-mt-8 tw-pt-8 tw-border-t tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-t-neutral-700 tw-mx-auto">
        <form className="tw-flex tw-items-end tw-gap-x-4">
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Name
            </label>
            <div className="tw-mt-2">
              <input
                type="text"
                required
                autoComplete="off"
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Description
            </label>
            <div className="tw-mt-2">
              <input
                type="text"
                required
                autoComplete="off"
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Select pools
            </label>
            <div className="tw-mt-2">
              <input
                type="number"
                required
                placeholder="Select"
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800  tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Maximum mints
            </label>
            <div className="tw-mt-2">
              <input
                type="number"
                required
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800  tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-mr-4">
            <div className="tw-flex tw-flex-col">
              <div className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                Exclude previous
              </div>
              <div className="tw-flex tw-gap-x-6 tw-py-3 tw-mt-2">
                <div className="tw-flex tw-items-center">
                  <input
                    type="radio"
                    checked
                    className="tw-h-4 tw-w-4 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
                  />
                  <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                    Yes
                  </label>
                </div>
                <div className="tw-flex tw-items-center">
                  <input
                    type="radio"
                    className="tw-h-4 tw-w-4 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
                  />
                  <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
            >
              Add group
            </button>
          </div>
        </form>

        <div className="tw-mt-8 tw-flow-root">
          <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
            <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle sm:tw-px-6 lg:tw-px-8">
              <div className="tw-overflow-hidden tw-shadow tw-ring-1 tw-ring-neutral-700 tw-rounded-lg">
                <table className="tw-min-w-full tw-divide-y tw-divide-neutral-700">
                  <thead className="tw-bg-neutral-800/50">
                    <tr>
                      <th
                        scope="col"
                        className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                      >
                        Spots
                      </th>
                      <th
                        scope="col"
                        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                      >
                        <span className="sr-only">Details</span>
                      </th>
                      <th
                        scope="col"
                        className="tw-w-20 tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                      >
                        <span className="sr-only">Delete</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tw-bg-neutral-900 tw-divide-y tw-divide-neutral-700/40">
                    <tr>
                      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
                        Name
                      </td>
                      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
                        Description
                      </td>
                      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
                        Spots
                      </td>
                      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal">
                        <span className="tw-cursor-pointer tw-text-primary-400 
                        hover:tw-text-[#74a2ff] tw-transition tw-duration-300 tw-ease-out">
                          Details
                        </span>
                      </td>
                      <td className="tw-w-20 tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
                        <button
                          type="button"
                          title="Delete"
                          className="tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20"
                        >
                          <svg
                            className="tw-h-4 tw-w-4 group-hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="tw-mt-8 tw-flex tw-justify-end">
          <button className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-sm tw-text-white tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out">
            Next
          </button>
        </div>
      </div>
    </>
  );
}
