import { useRef } from "react";
import CreateGroupWalletsUpload from "./CreateGroupWalletsUpload";
import CreateGroupWalletsCount from "./CreateGroupWalletsCount";

export default function GroupCreateWallets({
  wallets,
  setWallets,
}: {
  readonly wallets: string[] | null;
  readonly setWallets: (wallets: string[] | null) => void;
}) {
  if (wallets?.length) {
    return (
      <CreateGroupWalletsCount
        wallets={wallets}
        removeWallets={() => setWallets(null)}
      />
    );
  } else {
    return (
      <div className="tw-col-span-full">
        <div className="tw-inline-flex tw-items-center tw-space-x-4">
          <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-700">
            <svg
              className="tw-flex-shrink-0 tw-text-iron-50 tw-size-6"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 8.5H2M2 12.5H5.54668C6.08687 12.5 6.35696 12.5 6.61813 12.5466C6.84995 12.5879 7.0761 12.6563 7.29191 12.7506C7.53504 12.8567 7.75977 13.0065 8.20924 13.3062L8.79076 13.6938C9.24023 13.9935 9.46496 14.1433 9.70809 14.2494C9.9239 14.3437 10.15 14.4121 10.3819 14.4534C10.643 14.5 10.9131 14.5 11.4533 14.5H12.5467C13.0869 14.5 13.357 14.5 13.6181 14.4534C13.85 14.4121 14.0761 14.3437 14.2919 14.2494C14.535 14.1433 14.7598 13.9935 15.2092 13.6938L15.7908 13.3062C16.2402 13.0065 16.465 12.8567 16.7081 12.7506C16.9239 12.6563 17.15 12.5879 17.3819 12.5466C17.643 12.5 17.9131 12.5 18.4533 12.5H22M2 7.2L2 16.8C2 17.9201 2 18.4802 2.21799 18.908C2.40973 19.2843 2.71569 19.5903 3.09202 19.782C3.51984 20 4.07989 20 5.2 20L18.8 20C19.9201 20 20.4802 20 20.908 19.782C21.2843 19.5903 21.5903 19.2843 21.782 18.908C22 18.4802 22 17.9201 22 16.8V7.2C22 6.0799 22 5.51984 21.782 5.09202C21.5903 4.7157 21.2843 4.40974 20.908 4.21799C20.4802 4 19.9201 4 18.8 4L5.2 4C4.0799 4 3.51984 4 3.09202 4.21799C2.7157 4.40973 2.40973 4.71569 2.21799 5.09202C2 5.51984 2 6.07989 2 7.2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
            Wallets
          </p>
        </div>
        <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-8">
          <CreateGroupWalletsUpload setWallets={setWallets} />
          <div className="tw-p-5 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
            <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
              EMMA
            </p>
            <div className="tw-mt-4">
              <div className="tw-group tw-w-full tw-relative">
                <input
                  type="text"
                  id="floating_allowlist"
                  className="tw-form-input tw-block tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-11 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                  placeholder=" "
                />
                <svg
                  className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-4 tw-h-5 tw-w-5 tw-text-iron-300"
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
                  htmlFor="floating_allowlist"
                  className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-ml-8 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
                        peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                >
                  Search allowlist
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
