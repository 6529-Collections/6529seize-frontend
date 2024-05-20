export default function HeaderProxyNewModal() {
  return (
    <div className="tw-cursor-default tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div className="tw-overflow-hidden sm:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6">
            <div className="tw-flex tw-justify-between">
              <div className="tw-max-w-xl sm:tw-flex sm:tw-space-x-4">
                <div>
                  <span className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-h-12 tw-w-12 tw-bg-green/20">
                    <svg
                      className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-green tw-transition tw-duration-300 tw-ease-out"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        stroke-Linejoin="round"
                      />
                    </svg>
                    <div className="tw-absolute">
                      <svg
                        width="336"
                        height="336"
                        viewBox="0 0 336 336"
                        fill="none"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <mask
                          id="mask0_8902_8329"
                          style={{ maskType: "alpha" }}
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="336"
                          height="336"
                        >
                          <rect
                            width="336"
                            height="336"
                            fill="url(#paint0_radial_8902_8329)"
                          />
                        </mask>
                        <g mask="url(#mask0_8902_8329)">
                          <circle cx="168" cy="168" r="47.5" stroke="#1F242F" />
                          <circle cx="168" cy="168" r="47.5" stroke="#1F242F" />
                          <circle cx="168" cy="168" r="71.5" stroke="#1F242F" />
                          <circle cx="168" cy="168" r="95.5" stroke="#1F242F" />
                          <circle
                            cx="168"
                            cy="168"
                            r="119.5"
                            stroke="#1F242F"
                          />
                          <circle
                            cx="168"
                            cy="168"
                            r="143.5"
                            stroke="#1F242F"
                          />
                          <circle
                            cx="168"
                            cy="168"
                            r="167.5"
                            stroke="#1F242F"
                          />
                        </g>
                        <defs>
                          <radialGradient
                            id="paint0_radial_8902_8329"
                            cx="0"
                            cy="0"
                            r="1"
                            gradientUnits="userSpaceOnUse"
                            gradientTransform="translate(168 168) rotate(90) scale(168 168)"
                          >
                            <stop />
                            <stop offset="1" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                      </svg>
                    </div>
                  </span>
                </div>
                <div className="tw-relative tw-mt-3 sm:tw-mt-0 sm:tw-max-w-sm tw-flex tw-flex-col">
                  <p className="tw-text-lg tw-text-iron-50 tw-font-medium tw-mb-0">
                    Congrats!
                  </p>
                  <p className="tw-mt-1 tw-mb-0 tw-text-md tw-text-iron-400">
                    Use the arrow next to your profile name in the header to
                    switch users.
                  </p>
                </div>
              </div>
              <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-justify-between tw-items-center">
                <button
                  type="button"
                  aria-label="Close"
                  title="Close"
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                >
                  <svg
                    className="tw-h-6 tw-w-6"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="tw-relative tw-mt-6">
              <div className="tw-bg-iron-800 tw-rounded-lg tw-p-8">
                profile name button and dropdown img
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
