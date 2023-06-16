import AllowlistToolExpandableTableWrapper from "../../common/AllowlistToolExpandableTableWrapper";
import AllowlistToolPoolsWrapper from "../../common/pools/AllowlistToolPoolsWrapper";
import AllowlistToolJsonIcon from "../../icons/AllowlistToolJsonIcon";

export default function AllowlistToolBuilderRaports() {
  return (
    <AllowlistToolPoolsWrapper isLoading={false}>
      <AllowlistToolExpandableTableWrapper title="Raports">

        <div className="tw-flex tw-flex-col">
          <div className="tw-overflow-x-auto tw-rounded-b-lg">
            <div className="tw-inline-block tw-min-w-full tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-neutral-800">
              <div className="tw-bg-neutral-800/50 tw-border tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-neutral-800 tw-grid tw-grid-cols-9 tw-items-center tw-gap-x-4 sm:tw-gap-x-6">
                <div className="tw-col-span-2">
                  <div className="tw-py-1.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6">
                    Pool name
                  </div>
                </div>
                <div className="tw-col-span-2">
                  <div className="tw-px-3 tw-py-1.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                    Description
                  </div>
                </div>
                <div className="tw-col-span-2">
                  <div className="tw-px-3 tw-py-1.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                    Wallets
                  </div>
                </div>
                <div className="tw-col-span-2">
                  <div className="tw-px-3 tw-py-1.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                    Spots
                  </div>
                </div>
                <div className="tw-col-span-1">
                  <div className="tw-px-3 tw-py-1.5 tw-pl-3 tw-pr-4 sm:tw-pr-6 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400">
                    <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2.5">
                      <button
                        type="button"
                        className="tw-group tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                      >
                        <div className="tw-h-4 tw-w-4 tw-flex tw-items-center tw-justify-center">
                          <AllowlistToolJsonIcon />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="tw-flex tw-flex-col tw-bg-neutral-900 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-neutral-800">
                <div className="tw-cursor-pointer tw-grid tw-grid-cols-9 tw-items-center tw-gap-x-4">
                  <div className="tw-col-span-2">
                    <div className="tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
                      <div className="tw-flex tw-items-center tw-gap-x-2">
                        <div className="tw-inline-flex tw-items-center tw-gap-x-3">
                          Airdrops
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tw-col-span-2">
                    <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
                      Automatic Airdrops
                    </div>
                  </div>
                  <div className="tw-col-span-2 tw-px-3 tw-py-2">
                    <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
                      29
                    </div>
                  </div>
                  <div className="tw-col-span-2 tw-px-3 tw-py-2">
                    <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
                      29
                    </div>
                  </div>
                  <div className="tw-col-span-1">
                    <div className="tw-py-2 tw-pl-3 tw-pr-4 sm:tw-pr-6">
                      <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2.5">
                        <button
                          type="button"
                          className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-w-8 tw-h-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                        >
                          <div className="tw-h-4 tw-w-4 tw-flex tw-justify-center tw-items-center">
                            <AllowlistToolJsonIcon />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tw-cursor-pointer tw-grid tw-grid-cols-9 tw-items-center tw-gap-x-4">
                  <div className="tw-col-span-2">
                    <div className="tw-whitespace-nowrap tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-normal tw-text-neutral-50 sm:tw-pl-[3.25rem]">
                      <div className="tw-inline-flex tw-items-center tw-gap-x-3">
                        Artist (YuYu)
                      </div>
                    </div>
                  </div>
                  <div className="tw-col-span-2">
                    <div className="tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
                      Artist (YuYu)
                    </div>
                  </div>
                  <div className="tw-col-span-2 tw-px-3 tw-py-2">
                    <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
                      1
                    </div>
                  </div>
                  <div className="tw-col-span-2 tw-px-3 tw-py-2">
                    <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
                      5
                    </div>
                  </div>
                  <div className="tw-col-span-1">
                    <div className="tw-py-2 tw-pl-3 tw-pr-4 sm:tw-pr-6">
                      <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
                        <button
                          type="button"
                          className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                        >
                          <div className="tw-h-4 tw-w-4 tw-flex tw-justify-center tw-items-center">
                            <AllowlistToolJsonIcon />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </AllowlistToolExpandableTableWrapper>
    </AllowlistToolPoolsWrapper>
  );
}
