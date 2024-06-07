import { GroupFull } from "../../../../../generated/models/GroupFull";
import CroupCardActions from "./actions/CroupCardActions";
import GroupCardContent from "./GroupCardContent";
import GroupCardHeader from "./GroupCardHeader";

export default function GroupCard({ group }: { readonly group: GroupFull }) {
  return (
    <div className="tw-col-span-1">
      <div className="tw-bg-gradient-to-r tw-from-indigo-500 tw-relative tw-w-full tw-h-12 tw-rounded-t-2xl">
        <div className="tw-absolute tw-inset-0 tw-rounded-t-2xl tw-ring-[1.5px] tw-ring-white/20 tw-ring-inset tw-pointer-events-none"></div>
      </div>
      <div className="-tw-mt-1 tw-h-[194px] tw-flex tw-flex-col tw-bg-iron-900 tw-rounded-b-2xl tw-relative tw-border-[1.5px] tw-border-solid tw-border-t-0 tw-border-iron-700">

        <div>
          <GroupCardHeader group={group} />
          <div className="tw-pt-2 tw-pb-2 tw-flex tw-flex-col tw-h-full tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
            <GroupCardContent group={group} />
            <div className="tw-mt-auto">
              <CroupCardActions group={group} />
            </div>
          </div>
        </div>

        {/* REP ALL */}
        <div className="tw-hidden tw-py-4 tw-flex tw-flex-col tw-h-full tw-gap-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
          <div className="tw-px-4 sm:tw-px-6">
            <div className="tw-flex tw-space-x-4">
              <div className="tw-group tw-w-full tw-relative">
                <input
                  type="text"
                  id="floating_rep_number"
                  autoComplete="off"
                  className="tw-form-input tw-block tw-px-4 tw-py-3 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
                  tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                  placeholder=" "
                />
                <label
                  htmlFor="floating_rep_number"
                  className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-[1] tw-origin-[0] tw-bg-iron-900 tw-rounded-lg group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                >
                  Rep
                </label>
              </div>
              <div className="tw-group tw-w-full tw-relative">
                <input
                  type="text"
                  id="floating_rep_category"
                  className="tw-form-input tw-block tw-py-3 tw-pl-11 tw-pr-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
      tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                  placeholder=" "
                />
                <svg
                  className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <label
                  htmlFor="floating_rep_category"
                  className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-[1] tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-ml-8 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
                      peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                >
                  Rep Category
                </label>
              </div>
            </div>
            <div className="tw-mt-4 tw-flex tw-space-x-6">
              <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
                <span className="tw-text-iron-400 tw-font-normal">Min rep</span>
                <span className="tw-font-medium tw-text-red">-443</span>
              </div>
              <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
                <span className="tw-text-iron-400 tw-font-normal">Max rep</span>
                <span className="tw-font-medium tw-text-green">654</span>
              </div>
              <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-2">
                <svg
                  className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                  />
                </svg>
                <div className="tw-inline-flex tw-items-center tw-gap-x-1.5">
                  <span className="tw-text-iron-400 tw-font-normal">
                    Members count
                  </span>
                  <span className="tw-font-medium tw-text-iron-50">720</span>
                </div>
              </div>
            </div>
          </div>
          <div className="tw-pt-3 tw-px-4 sm:tw-px-6 tw-mt-auto">
            <div className="tw-flex tw-items-center tw-gap-x-3 tw-justify-end">
              {/* COMPONENDIKS - SECONDARYBUTTON */}
              <button
                type="button"
                className="tw-inline-flex tw-items-center tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
              >
                Cancel
              </button>
              {/* COMPONENDIKS - PRIMARYBUTTON */}
              <button
                type="button"
                className="tw-inline-flex tw-items-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* CIC ALL */}
        <div className="tw-hidden tw-py-4 tw-flex tw-flex-col tw-h-full tw-gap-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
          <div className="tw-px-4 sm:tw-px-6">
            <div className="tw-flex tw-space-x-4">
              <div className="tw-group tw-w-full tw-relative">
                <input
                  type="text"
                  id="floating_cic_number"
                  autoComplete="off"
                  className="tw-form-input tw-block tw-px-4 tw-py-3 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
                  tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                  placeholder=" "
                />
                <label
                  htmlFor="floating_cic_number"
                  className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-[1] tw-origin-[0] tw-bg-iron-900 tw-rounded-lg group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                >
                  CIC
                </label>
              </div>
            </div>
            <div className="tw-mt-4 tw-flex tw-space-x-6">
              <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
                <span className="tw-text-iron-400 tw-font-normal">Min rep</span>
                <span className="tw-font-medium tw-text-red">-443</span>
              </div>
              <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
                <span className="tw-text-iron-400 tw-font-normal">Max rep</span>
                <span className="tw-font-medium tw-text-green">654</span>
              </div>
              <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-2">
                <svg
                  className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                  />
                </svg>
                <div className="tw-inline-flex tw-items-center tw-gap-x-1.5">
                  <span className="tw-text-iron-400 tw-font-normal">
                    Members count
                  </span>
                  <span className="tw-font-medium tw-text-iron-50">720</span>
                </div>
              </div>
            </div>
          </div>
          <div className="tw-pt-3 tw-px-4 sm:tw-px-6 tw-mt-auto">
            <div className="tw-flex tw-items-center tw-gap-x-3 tw-justify-end">
              {/* COMPONENDIKS - SECONDARYBUTTON */}
              <button
                type="button"
                className="tw-inline-flex tw-items-center tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
              >
                Cancel
              </button>
              {/* COMPONENDIKS - PRIMARYBUTTON */}
              <button
                type="button"
                className="tw-inline-flex tw-items-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
              >
                Save
              </button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
