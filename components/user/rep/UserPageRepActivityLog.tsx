export default function UserPageRepActivityLog() {
  return (
    <div className="tw-bg-iron-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <div className="tw-h-16 tw-px-6 md:tw-px-8">
        <div className="tw-h-full tw-flex tw-items-center tw-justify-between tw-w-full tw-border-b tw-border-t-0 tw-border-x-0 tw-border-solid tw-border-white/10">
          <h3 className="mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
            Activity Log
          </h3>
        </div>
      </div>
      <div className="tw-max-h-[28rem] tw-transform-gpu tw-scroll-py-3 tw-overflow-y-auto tw-pb-6">
        <div className="tw-px-6 md:tw-px-8 tw-mt-4 tw-max-w-sm">
          radio buttons
        </div>
        <div className="tw-flow-root">
          <div className="tw-inline-block tw-min-w-full tw-align-middle tw-px-6 md:tw-px-8">
            <table className="tw-min-w-full">
              <tbody className="tw-px-6 md:tw-px-8 tw-list-none tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0">
                <tr className="tw-flex tw-items-center tw-justify-between">
                  <td className="tw-py-2.5">
                    <div className="tw-space-x-1.5 tw-inline-flex tw-items-center">
                      <button className="tw-bg-transparent tw-border-none tw-leading-4 tw-p-0">
                        <span className=" tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
                          punk6529
                        </span>
                      </button>
                      <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-semibold">
                        gave to
                      </span>
                      <button className="tw-bg-transparent tw-border-none tw-leading-4 tw-p-0">
                        <span className=" tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
                          simo
                        </span>
                      </button>
                      <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-semibold">
                        Typescript Expert
                      </span>
                      <span className="tw-whitespace-nowrap tw-text-sm tw-text-green tw-font-semibold">
                        +1243
                      </span>
                    </div>
                  </td>
                  <td className="tw-py-2.5 tw-pl-3 tw-text-right">
                    <span className="tw-whitespace-nowrap tw-text-[0.8125rem] tw-leading-5 tw-text-iron-500">
                      14 minutes ago
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="tw-hidden tw-mt-4">
          <span className="tw-px-6 md:tw-px-8 tw-text-sm tw-italic tw-text-iron-500">
            No Activity Log
          </span>
        </div>
      </div>
    </div>
  );
}
