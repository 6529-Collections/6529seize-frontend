export default function UserSettingsImg() {
  return (
    <>
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
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
    </>
  );
}
