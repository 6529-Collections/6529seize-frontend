export default function CreateCustomSnapshotFormAddWalletsModal() {
  return (
    <div className="tw-rounded-lg tw-overflow-hidden">
      <div className="tw-max-h-[calc(100vh_+_-100px)] tw-overflow-y-auto tw-overflow-x-hidden">
        <div className="tw-p-6 tw-rounded-lg">
          <p className="tw-max-w-sm tw-text-lg tw-text-white tw-font-medium tw-mb-0">
            Add wallets
          </p>
          <div className="tw-mt-6 tw-flex tw-gap-x-4">
            <div className="tw-flex tw-gap-x-4">
              <div className="tw-relative">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                    Wallet no.
                  </label>
                </div>
                <div className="tw-mt-1.5">
                  <input
                    type="text"
                    name="owner"
                    autoComplete="off"
                    className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-3 tw-pr-20 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40
              hover:tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
              </div>
              <div className="tw-self-end">
                <button
                  type="button"
                  className="tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
                >
                  Add
                </button>
              </div>
              <div className="tw-mt-9">
                <span className="tw-text-sm tw-text-neutral-400 tw-font-normal">
                  or
                </span>
              </div>
              <div className="tw-mt-10">
                <label
                  htmlFor="fileInput"
                  className="tw-group tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-text-sm tw-font-medium tw-text-primary-300 tw-w-full hover:tw-underline tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
                >
                  <svg
                    className="tw-h-5 tw-w-5 tw-mr-2 group-hover:-tw-translate-y-0.5 tw-transform tw-transition tw-duration-300 tw-ease-out"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 15V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V15M17 8L12 3M12 3L7 8M12 3V15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Upload a CSV</span>
                </label>
                <input
                  id="fileInput"
                  type="file"
                  accept="text/csv"
                  className="tw-form-input tw-hidden"
                />
              </div>
            </div>
          </div>

          <div className="tw-mt-6 tw-flow-root">
            <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
              <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle sm:tw-px-6 lg:tw-px-8">
                <div className="tw-overflow-hidden tw-shadow tw-ring-1 tw-ring-black tw-ring-opacity-5 sm:tw-rounded-lg">
                  <table className="tw-min-w-full tw-divide-y tw-divide-solid tw-divide-neutral-700">
                    <tbody className="tw-divide-y tw-divide-solid tw-divide-neutral-700/40 tw-bg-neutral-800">
                      <tr>
                        <td className="tw-w-8 tw-whitespace-nowrap tw-py-3 tw-pl-4 tw-pr-3 tw-text-sm tw-font-light tw-text-neutral-400 sm:pl-6">
                          1
                        </td>
                        <td className="tw-whitespace-nowrap tw-py-3 tw-pl-3 tw-pr-3 tw-text-sm tw-font-medium tw-text-neutral-50 sm:pl-6">
                          Owner
                        </td>
                        <td className="tw-whitespace-nowrap tw-py-3 tw-pl-3 tw-pr-4 tw-text-right tw-text-sm tw-font-medium sm:tw-pr-6">
                          <button
                            type="button"
                            title="Delete"
                            className="tw-rounded-full tw-group tw-p-1.5 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20"
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
            <button
              type="button"
              className="tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Add wallets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
