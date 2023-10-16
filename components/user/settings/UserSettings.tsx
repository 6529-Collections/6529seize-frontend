import UserSettingsPfp from "./UserSettingsPfp";
import { Inter } from "next/font/google";
interface Props {
  user: string;
  wallets: string[];
}

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export default function UserSettingsComponent(props: Props) {
  /*  return <UserSettingsPfp user={props.user} wallets={props.wallets} />; */
  return (
    <div
      id="allowlist-tool"
      className={`tw-bg-neutral-900 tw-overflow-y-auto tw-min-h-screen tw-relative ${inter.className}`}
    >
      <div className="tw-max-w-lg tw-mx-auto tw-pt-8 tw-pb-12">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <button
            type="button"
            className="tw-h-8 tw-w-8 tw-inline-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-white tw-rounded-full tw-bg-white hover:tw-bg-neutral-200 hover:tw-border-white tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-w-5 tw-h-5 tw-text-neutral-900 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 12H4M4 12L10 18M4 12L10 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div className="tw-inline-flex tw-items-center tw-gap-x-2">
            <span className="tw-text-2xl tw-font-bold tw-text-white">
              0x23a8...1e6e
            </span>
            <svg
              className="tw-cursor-pointer tw-h-5 tw-w-5 tw-text-neutral-300 hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 8V5.2C8 4.0799 8 3.51984 8.21799 3.09202C8.40973 2.71569 8.71569 2.40973 9.09202 2.21799C9.51984 2 10.0799 2 11.2 2H18.8C19.9201 2 20.4802 2 20.908 2.21799C21.2843 2.40973 21.5903 2.71569 21.782 3.09202C22 3.51984 22 4.0799 22 5.2V12.8C22 13.9201 22 14.4802 21.782 14.908C21.5903 15.2843 21.2843 15.5903 20.908 15.782C20.4802 16 19.9201 16 18.8 16H16M5.2 22H12.8C13.9201 22 14.4802 22 14.908 21.782C15.2843 21.5903 15.5903 21.2843 15.782 20.908C16 20.4802 16 19.9201 16 18.8V11.2C16 10.0799 16 9.51984 15.782 9.09202C15.5903 8.71569 15.2843 8.40973 14.908 8.21799C14.4802 8 13.9201 8 12.8 8H5.2C4.0799 8 3.51984 8 3.09202 8.21799C2.71569 8.40973 2.40973 8.71569 2.21799 9.09202C2 9.51984 2 10.0799 2 11.2V18.8C2 19.9201 2 20.4802 2.21799 20.908C2.40973 21.2843 2.71569 21.5903 3.09202 21.782C3.51984 22 4.07989 22 5.2 22Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="tw-pt-10 tw-space-y-6 tw-divide-y tw-divide-x-0 tw-divide-solid tw-divide-neutral-700">
          <div className="tw-flex tw-flex-col tw-gap-y-6">
            <div>
              <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-350">
                Username
              </label>
              <div className="tw-mt-2">
                <input
                  type="text"
                  name="name"
                  required
                  autoComplete="off"
                  className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-600 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 hover:tw-ring-neutral-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                />
              </div>
            </div>

            <div className="tw-max-w-lg tw-relative">
              <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-350">
                Primary wallet
              </label>
              <div className="tw-mt-2 tw-relative">
                <button className="tw-text-left tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 focus:tw-bg-transparent tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-600 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 hover:tw-ring-neutral-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out">
                  <span className="tw-text-neutral-350 tw-font-light">
                    Select wallet
                  </span>
                </button>
                <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
                  <svg
                    className="tw-h-5 tw-w-5 tw-text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-max-w-lg tw-w-full tw-rounded-md tw-bg-neutral-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
                <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
                  <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                    <li className="tw-group tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-neutral-700 tw-transition tw-duration-300 tw-ease-out">
                      <span className="tw-inline-block tw-text-sm tw-font-medium tw-text-white">
                        0x495f947276749ce646f68ac8c248420045cb7b5e
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="tw-pt-6">
            <div className="tw-flex tw-items-center tw-justify-center tw-w-full">
              <label className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full tw-h-64 tw-border-2 tw-border-dashed tw-rounded-lg tw-cursor-pointer tw-bg-neutral-800 tw-border-neutral-600 hover:tw-border-neutral-500 hover:tw-bg-neutral-700 tw-transition tw-duration-300 tw-ease-out">
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-pt-5 tw-pb-6">
                  <div className="tw-hidden tw-h-32 tw-w-32">
                    <img
                      src="#"
                      alt="Profile image"
                      className="tw-h-full tw-w-full tw-object-contain tw-bg-neutral-700 tw-rounded-sm"
                    />
                  </div>

                  <svg
                    className="tw-w-8 tw-h-8 tw-mb-4 tw-text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 16.2422C2.79401 15.435 2 14.0602 2 12.5C2 10.1564 3.79151 8.23129 6.07974 8.01937C6.54781 5.17213 9.02024 3 12 3C14.9798 3 17.4522 5.17213 17.9203 8.01937C20.2085 8.23129 22 10.1564 22 12.5C22 14.0602 21.206 15.435 20 16.2422M8 16L12 12M12 12L16 16M12 12V21"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <p className="tw-mb-2 tw-text-sm tw-font-normal tw-text-neutral-400">
                    <span className="tw-font-medium tw-text-white">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="tw-text-xs tw-font-normal tw-text-neutral-400">
                    JPEG, JPG, PNG, GIF, WEBP
                  </p>
                </div>
                <input id="" type="file" className="tw-hidden" />
              </label>
            </div>

            <div className="tw-inline-flex tw-items-center tw-my-2 tw-justify-center tw-w-full">
              <hr className="tw-w-full tw-h-px tw-border tw-bg-neutral-600" />
              <span className="tw-absolute tw-px-3 tw-font-medium tw-text-sm tw-uppercase tw-text-white">
                or
              </span>
            </div>

            <div className="tw-max-w-lg tw-relative">
              <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-350">
                Select Memes
              </label>
              <div className="tw-mt-2 tw-relative">
                <input
                  placeholder="Search"
                  className="tw-text-left tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 focus:tw-bg-transparent tw-text-white tw-font-light tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-600 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 hover:tw-ring-neutral-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                />
                <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center tw-right-0 tw-pr-3">
                  <svg
                    className="tw-h-5 tw-w-5 tw-text-neutral-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-max-w-lg tw-w-full tw-rounded-md tw-bg-neutral-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
                <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
                  <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                    <li className="tw-group tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-neutral-700 tw-transition tw-duration-300 tw-ease-out">
                      <img
                        src="#"
                        alt=""
                        className="tw-flex-shrink-0 tw-ml-0 tw-pl-0 tw-rounded-full tw-bg-neutral-700 tw-h-6 tw-w-6"
                      />
                      <span className="tw-inline-block tw-ml-2 tw-text-sm tw-font-medium tw-text-white">
                        6529Seizing
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="tw-pt-6">
            <div className="tw-flex tw-gap-x-5">
              <div className="tw-flex-1 tw-cursor-pointer">
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-350">
                  Background Color 1
                </label>
                <div className="tw-mt-2 tw-relative">
                  <input
                    type="color"
                    name="name"
                    className="tw-cursor-pointer tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-h-12 tw-px-3 tw-pr-10 tw-bg-neutral-900 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-600 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 hover:tw-ring-neutral-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                  <div className="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
                    <svg
                      className="tw-h-4 tw-w-4 tw-text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 10L14 6M2.49997 21.5L5.88434 21.124C6.29783 21.078 6.50457 21.055 6.69782 20.9925C6.86926 20.937 7.03242 20.8586 7.18286 20.7594C7.35242 20.6475 7.49951 20.5005 7.7937 20.2063L21 7C22.1046 5.89543 22.1046 4.10457 21 3C19.8954 1.89543 18.1046 1.89543 17 3L3.7937 16.2063C3.49952 16.5005 3.35242 16.6475 3.24061 16.8171C3.1414 16.9676 3.06298 17.1307 3.00748 17.3022C2.94493 17.4954 2.92195 17.7021 2.87601 18.1156L2.49997 21.5Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="tw-flex-1 tw-cursor-pointer">
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-350">
                  Background Color 2
                </label>
                <div className="tw-mt-2 tw-relative">
                  <input
                    type="color"
                    name="color"
                    className="tw-cursor-pointer tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-h-12 tw-px-3 tw-pr-10 tw-bg-neutral-900 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-600 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 hover:tw-ring-neutral-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                  <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
                    <svg
                      className="tw-h-4 tw-w-4 tw-text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 10L14 6M2.49997 21.5L5.88434 21.124C6.29783 21.078 6.50457 21.055 6.69782 20.9925C6.86926 20.937 7.03242 20.8586 7.18286 20.7594C7.35242 20.6475 7.49951 20.5005 7.7937 20.2063L21 7C22.1046 5.89543 22.1046 4.10457 21 3C19.8954 1.89543 18.1046 1.89543 17 3L3.7937 16.2063C3.49952 16.5005 3.35242 16.6475 3.24061 16.8171C3.1414 16.9676 3.06298 17.1307 3.00748 17.3022C2.94493 17.4954 2.92195 17.7021 2.87601 18.1156L2.49997 21.5Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="tw-pt-6 tw-flex tw-justify-end">
              <button
                type="button"
                className="tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
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
