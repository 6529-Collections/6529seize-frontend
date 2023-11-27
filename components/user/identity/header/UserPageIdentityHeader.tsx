import { useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import UserPageIdentityRateButton from "../../rate/UserPageIdentityRateButton";
import UserCICAccurateIcon from "../../utils/UserCICAccurateIcon";
import UserCICInaccurateIcon from "../../utils/UserCICInaccurateIcon";
import UserCICUnknownIcon from "../../utils/UserCICUnknownIcon";

export default function UserPageIdentityHeader({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const [targetHandle, setTargetHandle] = useState<string | null>(
    profile.profile?.handle ?? null
  );
  return (
    <div>
      <div className="tw-mt-8 lg:tw-flex lg:tw-items-center tw-lg:justify-between">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-col">
            <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-white tw-sm:truncate sm:tw-text-2xl sm:tw-tracking-tight">
              Community Identity Check (CIC)
            </h2>
            <p className="tw-font-normal tw-text-neutral-400 tw-text-base tw-mb-0">
              Does the community believe this profile accurately represents its
              identity?
            </p>
          </div>
          <div className="tw-mt-4 tw-flex tw-flex-col sm:tw-flex-row sm:tw-flex-wrap sm:tw-space-x-6">
            <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-text-neutral-200 ">
              <div className="tw-flex tw items-center tw-space-x-1">
                <span>CIC:</span>
                <span>24,000</span>
              </div>
              <span className="tw-ml-2 -tw-mt-1.5 tw-h-5 tw-w-5">
                <div>
                  <UserCICAccurateIcon />
                </div>
                <div className="tw-hidden">
                  <UserCICInaccurateIcon />
                </div>
                <div className="tw-hidden">
                  <UserCICUnknownIcon />
                </div>
              </span>
            </div>
            <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-text-neutral-200 tw-space-x-1">
              <span>Status:</span>
              {/*   <span className="tw-text-[#AAF0C4]">
                Probably Accurate
              </span> */}
              <span className="tw-text-[#73E2A3]">Accurate</span>
              {/*  <span className="tw-text-[#3CCB7F]">
                Highly Accurate
              </span> */}
              {/*  <span className="tw-text-[#F97066]">Inaccurate</span>
              <span className="tw-text-[#FEDF89]">Not Enough Ratings Yet</span> */}
            </div>
            <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-text-neutral-200 tw-space-x-1">
              <span>Raters:</span>
              <span>1,234</span>
            </div>
          </div>
          <div className="tw-mt-4">
            <form>
              <div className="tw-flex tw-items-center tw-space-x-3.5">
                <div>
                  <div>
                    <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-400">
                      Your total CIC Rating of @punk6529
                    </label>
                    <div className="tw-relative tw-flex tw-mt-1.5">
                      <span className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-neutral-700/40 tw-rounded-l-lg tw-border tw-border-solid tw-border-white/5 tw-px-3">
                        <svg
                          className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-neutral-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 5V19M5 12H19"
                            stroke="currentColor"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                        <svg
                          className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-neutral-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5 12H19"
                            stroke="currentColor"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </span>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        className="tw-block tw-w-[12.5rem] tw-rounded-r-lg tw-border-0 tw-py-3 tw-pl-4 tw-pr-10 tw-bg-neutral-700/40 tw-text-white tw-font-medium tw-text-right tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/5 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-300 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                      />
                      <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
                        <svg
                          className="tw-h-5 tw-w-5 tw-text-neutral-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="tw-mt-3.5 tw-space-x-1 tw-flex tw-items-center tw-justify-between tw-w-full">
                    <span className="tw-text-sm tw-font-semibold tw-text-neutral-200">
                      Your available CIC TDH:
                    </span>
                    <span className="tw-text-sm tw-font-semibold tw-text-neutral-200">
                      123,456
                    </span>
                  </div>
                </div>
                <div className="-tw-mt-1.5">
                  {targetHandle && (
                    <UserPageIdentityRateButton targetHandle={targetHandle} />
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
