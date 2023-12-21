export default function UserPageRepRaters() {
  return (
    <div className="tw-bg-iron-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <div className="tw-h-16 tw-px-6 md:tw-px-8">
        <div className="tw-h-full tw-flex tw-items-center tw-justify-between tw-w-full tw-border-b tw-border-t-0 tw-border-x-0 tw-border-solid tw-border-white/10">
          <h3 className="mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
            Who's Repping <span>Simo</span>
          </h3>
        </div>
      </div>
      <div className="tw-min-h-[28rem] tw-max-h-[28rem] tw-transform-gpu tw-scroll-py-3 tw-overflow-y-auto">
        <div className="tw-flow-root">
          <div className="tw-inline-block tw-min-w-full tw-align-middle tw-px-6 md:tw-px-8">
            <table className="tw-min-w-full">
              <tbody className="tw-px-6 md:tw-px-8 tw-list-none tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0">
                <tr>
                  <td className="tw-py-2.5">
                    <div className="tw-inline-flex tw-items-center tw-space-x-2">
                      <span className="tw-relative">
                        <div className="tw-flex tw-items-center tw-justify-center tw-h-5 tw-w-5 tw-text-[0.625rem] tw-leading-3 tw-font-bold tw-rounded-full tw-ring-2 tw-ring-iron-300 tw-text-iron-300">
                          12
                        </div>
                        <span
                          className={`tw-flex-shrink-0 tw-absolute -tw-right-1 -tw-top-1 tw-block tw-h-2.5 tw-w-2.5 tw-rounded-full `}
                        ></span>
                      </span>
                      <div className="tw-inline-flex tw-items-center tw-space-x-1">
                        <button className="tw-bg-transparent tw-border-none tw-flex tw-items-center">
                          <span className="tw-whitespace-nowrap hover:tw-underline tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-100">
                            handle
                          </span>
                        </button>
                        <span
                          className={`tw-whitespace-nowrap tw-text-sm tw-font-semibold `}
                        >
                          +1334
                        </span>
                      </div>
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
            No Rep Ratings
          </span>
        </div>
      </div>
    </div>
  );
}
