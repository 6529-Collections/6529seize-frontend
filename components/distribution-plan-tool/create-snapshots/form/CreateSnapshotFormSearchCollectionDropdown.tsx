export default function CreateSnapshotFormSearchCollectionDropdown() {
  return (
    <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-max-w-md tw-w-full tw-rounded-md tw-bg-neutral-900 tw-shadow-lg tw-ring-1 tw-ring-white/10">
      <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
        <div>
          <table className="tw-min-w-full">
            <thead className="tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-neutral-700/60">
              <tr>
                <th
                  scope="col"
                  className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-xs tw-font-medium tw-text-neutral-400"
                >
                  Collection
                </th>
                <th
                  scope="col"
                  className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-neutral-400"
                >
                  All time volume
                </th>
                <th
                  scope="col"
                  className="tw-whitespace-nowrap tw-pl-3 tw-pr-4 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-neutral-400"
                >
                  Floor
                </th>
              </tr>
            </thead>
            <tbody className="tw-divide-y tw-divide-neutral-700/60">
              <tr className="tw-cursor-pointer hover:tw-bg-neutral-800 tw-duration-300 tw-ease-out">
                <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3">
                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    <img
                      src="#"
                      alt=""
                      className="tw-bg-neutral-700 tw-rounded tw-h-6 tw-w-6"
                    />
                    <span className="tw-text-sm tw-font-medium tw-text-neutral-200">
                      Collection name
                    </span>
                    <svg
                      className="tw-h-4 tw-w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      {/* <! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
                      <path
                        fill="#ffffff"
                        d="M369 175c9.4 9.4 9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0z"
                      />
                      <path
                        fill="#2081e2"
                        d="M256 0c36.8 0 68.8 20.7 84.9 51.1C373.8 41 411 49 437 75s34 63.3 23.9 96.1C491.3 187.2 512 219.2 512 256s-20.7 68.8-51.1 84.9C471 373.8 463 411 437 437s-63.3 34-96.1 23.9C324.8 491.3 292.8 512 256 512s-68.8-20.7-84.9-51.1C138.2 471 101 463 75 437s-34-63.3-23.9-96.1C20.7 324.8 0 292.8 0 256s20.7-68.8 51.1-84.9C41 138.2 49 101 75 75s63.3-34 96.1-23.9C187.2 20.7 219.2 0 256 0zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"
                      />
                    </svg>
                    <span className="tw-uppercase tw-text-xs tw-text-neutral-500 tw-mt-0.5">
                      Erc 721
                    </span>
                  </div>
                </td>
                <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-right tw-text-sm tw-font-medium tw-text-neutral-200">
                  <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-1.5">
                    <span>1245</span>
                    <svg
                      className="tw-h-4 tw-w-auto"
                      viewBox="0 0 1080 1760"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        opacity="0.6"
                        d="M539.8 650.9L0 896.3L539.8 1215.4L1079.7 896.3L539.8 650.9Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.45"
                        d="M0.199951 896.3L540 1215.4V650.9V0.600098L0.199951 896.3Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.8"
                        d="M540 0.600098V650.9V1215.4L1079.8 896.3L540 0.600098Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.45"
                        d="M0 998.7L539.8 1759.4V1317.6L0 998.7Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.8"
                        d="M539.8 1317.6V1759.4L1080 998.7L539.8 1317.6Z"
                        fill="#B6B6B6"
                      />
                    </svg>
                  </div>
                </td>
                <td className="tw-whitespace-nowrap tw-pl-2 tw-pr-4 tw-py-2.5 tw-text-right tw-text-sm tw-font-medium  tw-text-neutral-200">
                  <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-1.5">
                    <span>0.16</span>
                    <svg
                      className="tw-h-4 tw-w-auto"
                      viewBox="0 0 1080 1760"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        opacity="0.6"
                        d="M539.8 650.9L0 896.3L539.8 1215.4L1079.7 896.3L539.8 650.9Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.45"
                        d="M0.199951 896.3L540 1215.4V650.9V0.600098L0.199951 896.3Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.8"
                        d="M540 0.600098V650.9V1215.4L1079.8 896.3L540 0.600098Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.45"
                        d="M0 998.7L539.8 1759.4V1317.6L0 998.7Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.8"
                        d="M539.8 1317.6V1759.4L1080 998.7L539.8 1317.6Z"
                        fill="#B6B6B6"
                      />
                    </svg>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="tw-pt-1">
          <table className="tw-min-w-full">
            <thead className="tw-border-y tw-border-solid tw-border-x-0 tw-border-neutral-700/60">
              <tr>
                <th
                  scope="col"
                  className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-xs tw-font-medium tw-text-neutral-400"
                >
                  Memes collections
                </th>
                <th
                  scope="col"
                  className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-neutral-400"
                >
                  All time volume
                </th>
                <th
                  scope="col"
                  className="tw-whitespace-nowrap tw-pl-3 tw-pr-4 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-neutral-400"
                >
                  Floor
                </th>
              </tr>
            </thead>
            <tbody className="tw-divide-y tw-divide-neutral-700/60">
              <tr className="tw-cursor-pointer tw-rounded hover:tw-bg-neutral-800 tw-duration-300 tw-ease-out">
                <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3">
                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    <img
                      src="#"
                      alt=""
                      className="tw-bg-neutral-700 tw-rounded tw-h-6 tw-w-6"
                    />
                    <span className="tw-text-sm tw-font-medium tw-text-neutral-200">
                      Collection name
                    </span>
                    <svg
                      className="tw-h-4 tw-w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      {/* <! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
                      <path
                        fill="#ffffff"
                        d="M369 175c9.4 9.4 9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0z"
                      />
                      <path
                        fill="#2081e2"
                        d="M256 0c36.8 0 68.8 20.7 84.9 51.1C373.8 41 411 49 437 75s34 63.3 23.9 96.1C491.3 187.2 512 219.2 512 256s-20.7 68.8-51.1 84.9C471 373.8 463 411 437 437s-63.3 34-96.1 23.9C324.8 491.3 292.8 512 256 512s-68.8-20.7-84.9-51.1C138.2 471 101 463 75 437s-34-63.3-23.9-96.1C20.7 324.8 0 292.8 0 256s20.7-68.8 51.1-84.9C41 138.2 49 101 75 75s63.3-34 96.1-23.9C187.2 20.7 219.2 0 256 0zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"
                      />
                    </svg>
                    <span className="tw-uppercase tw-text-xs tw-text-neutral-500 tw-mt-0.5">
                      Erc 721
                    </span>
                  </div>
                </td>
                <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-right tw-text-sm tw-font-medium tw-text-neutral-200">
                  <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-1.5">
                    <span>1245</span>
                    <svg
                      className="tw-h-4 tw-w-auto"
                      viewBox="0 0 1080 1760"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        opacity="0.6"
                        d="M539.8 650.9L0 896.3L539.8 1215.4L1079.7 896.3L539.8 650.9Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.45"
                        d="M0.199951 896.3L540 1215.4V650.9V0.600098L0.199951 896.3Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.8"
                        d="M540 0.600098V650.9V1215.4L1079.8 896.3L540 0.600098Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.45"
                        d="M0 998.7L539.8 1759.4V1317.6L0 998.7Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.8"
                        d="M539.8 1317.6V1759.4L1080 998.7L539.8 1317.6Z"
                        fill="#B6B6B6"
                      />
                    </svg>
                  </div>
                </td>
                <td className="tw-whitespace-nowrap tw-pl-2 tw-pr-4 tw-py-2.5 tw-text-right tw-text-sm tw-font-medium  tw-text-neutral-200">
                  <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-1.5">
                    <span>0.16</span>
                    <svg
                      className="tw-h-4 tw-w-auto"
                      viewBox="0 0 1080 1760"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        opacity="0.6"
                        d="M539.8 650.9L0 896.3L539.8 1215.4L1079.7 896.3L539.8 650.9Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.45"
                        d="M0.199951 896.3L540 1215.4V650.9V0.600098L0.199951 896.3Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.8"
                        d="M540 0.600098V650.9V1215.4L1079.8 896.3L540 0.600098Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.45"
                        d="M0 998.7L539.8 1759.4V1317.6L0 998.7Z"
                        fill="#B6B6B6"
                      />
                      <path
                        opacity="0.8"
                        d="M539.8 1317.6V1759.4L1080 998.7L539.8 1317.6Z"
                        fill="#B6B6B6"
                      />
                    </svg>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
