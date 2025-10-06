"use client";

import { useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function HeaderProxyNewModal({
  connectedProfile,
  proxyGrantor,
  onClose,
}: {
  readonly connectedProfile: ApiIdentity;
  readonly proxyGrantor: ApiProfileMin;
  readonly onClose: (setAsDontShowAgain: boolean) => void;
}) {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, () => onClose(dontShowAgain));
  useKeyPressEvent("Escape", () => onClose(dontShowAgain));

  return (
    <div className="tw-cursor-default tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div
            ref={modalRef}
            className="tw-overflow-hidden sm:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6">
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
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="tw-absolute">
                      <svg
                        width="336"
                        height="336"
                        viewBox="0 0 336 336"
                        fill="none"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg">
                        <mask
                          id="mask0_8902_8329"
                          style={{ maskType: "alpha" }}
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="336"
                          height="336">
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
                            gradientTransform="translate(168 168) rotate(90) scale(168 168)">
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
                    Congratulations!
                  </p>
                  <p className="tw-mt-1 tw-mb-0 tw-text-base tw-text-iron-400">
                    Click the arrow{" "}
                    <span className="tw-font-medium tw-text-iron-50">
                      next to your profile name in the menu
                    </span>{" "}
                    to switch users.
                  </p>
                </div>
              </div>
              <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-justify-between tw-items-center">
                <button
                  type="button"
                  aria-label="Close"
                  title="Close"
                  onClick={() => onClose(dontShowAgain)}
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out">
                  <svg
                    className="tw-h-6 tw-w-6"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor">
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
              <div className="tw-bg-iron-700 tw-rounded-lg tw-p-8 tw-flex tw-justify-center">
                <div>
                  <div className="tw-relative tw-inline-flex tw-rounded-lg tw-shadow-sm">
                    <div className="tw-relative tw-px-3.5 tw-h-11 tw-inline-flex tw-items-center tw-gap-x-3 tw-text-base tw-font-semibold tw-ring-1 tw-ring-white/10 tw-border-0 tw-rounded-s-lg tw-bg-iron-800 tw-text-white">
                      {connectedProfile.pfp ? (
                        <img
                          src={connectedProfile.pfp}
                          alt="Profile Picture"
                          className="tw-flex-shrink-0 tw-h-7 tw-w-7 tw-flex-none tw-rounded-lg tw-bg-iron-700"
                        />
                      ) : (
                        <div className="tw-flex-shrink-0 tw-h-7 tw-w-7 tw-flex-none tw-rounded-lg tw-bg-iron-700 group-hover:tw-bg-iron-600 tw-transition tw-duration-300 tw-ease-out"></div>
                      )}
                      <div className="tw-flex tw-gap-x-2 tw-items-center">
                        <span>{connectedProfile.handle}</span>
                      </div>
                    </div>
                    <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-px-2.5 tw-h-11  tw-ring-2 tw-ring-offset-4 tw-ring-offset-iron-700 tw-ring-primary-400 tw-border-0 tw-text-iron-50 tw-shadow-sm">
                      <svg
                        className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="tw-mt-1.5 tw-w-72 tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5">
                    <div className="tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
                      <div className="tw-py-2 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
                        <div
                          role="list"
                          className="tw-flex tw-flex-col tw-gap-y-2 tw-divide-y tw-divide-solid tw-divide-iron-700 tw-divide-x-0">
                          <div className="tw-flex tw-flex-col tw-px-2 tw-gap-y-2 tw-mx-0">
                            <div className="tw-h-full">
                              <div className="tw-bg-iron-700 tw-group tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-white tw-rounded-lg tw-relative tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                                {connectedProfile?.pfp ? (
                                  <img
                                    src={connectedProfile.pfp}
                                    alt="Profile Picture"
                                    className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800"
                                  />
                                ) : (
                                  <div className="tw-bg-iron-600 tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"></div>
                                )}
                                <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
                                  <div className="tw-truncate tw-inline-flex tw-items-center tw-justify-between">
                                    <div className="tw-truncate tw-text-md tw-font-medium tw-text-white">
                                      {connectedProfile.handle}
                                    </div>
                                  </div>
                                  <div>
                                    <svg
                                      className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      aria-hidden="true"
                                      xmlns="http://www.w3.org/2000/svg">
                                      <path
                                        d="M20 6L9 17L4 12"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="tw-h-full">
                              <div className=" tw-group tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-white tw-rounded-lg tw-relative tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                                {proxyGrantor.pfp ? (
                                  <img
                                    src={proxyGrantor.pfp}
                                    alt="Profile Picture"
                                    className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800"
                                  />
                                ) : (
                                  <div className="tw-bg-iron-600 tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"></div>
                                )}
                                <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
                                  <div className="tw-truncate tw-inline-flex tw-items-center tw-justify-between">
                                    <div className="tw-truncate tw-text-md tw-font-medium tw-text-white">
                                      {proxyGrantor.handle}
                                    </div>
                                    <span className="tw-pl-2 tw-pr-0.5 tw-italic tw-text-sm tw-text-iron-400 tw-font-normal">
                                      Proxy
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="tw-h-full tw-px-2 tw-pt-2">
                            <div className="tw-bg-transparent tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-md tw-font-medium tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-iron-300 tw-rounded-lg tw-relative tw-px-3 focus:tw-outline-none">
                              <svg
                                className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M16 17L21 12M21 12L16 7M21 12H9M12 17C12 17.93 12 18.395 11.8978 18.7765C11.6204 19.8117 10.8117 20.6204 9.77646 20.8978C9.39496 21 8.92997 21 8 21H7.5C6.10218 21 5.40326 21 4.85195 20.7716C4.11687 20.4672 3.53284 19.8831 3.22836 19.1481C3 18.5967 3 17.8978 3 16.5V7.5C3 6.10217 3 5.40326 3.22836 4.85195C3.53284 4.11687 4.11687 3.53284 4.85195 3.22836C5.40326 3 6.10218 3 7.5 3H8C8.92997 3 9.39496 3 9.77646 3.10222C10.8117 3.37962 11.6204 4.18827 11.8978 5.22354C12 5.60504 12 6.07003 12 7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span>Disconnect</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tw-mt-6">
              <div className="tw-relative tw-flex tw-items-start">
                <div className="tw-flex tw-h-6 tw-items-center">
                  <input
                    type="checkbox"
                    id="dontShowAgain"
                    checked={dontShowAgain}
                    onChange={() => setDontShowAgain(!dontShowAgain)}
                    className="tw-cursor-pointer tw-form-checkbox tw-h-4 tw-w-4 tw-bg-neutral-800 tw-rounded tw-border-solid tw-border-gray-600 tw-text-primary-500 focus:tw-ring-primary-500"
                  />
                </div>
                <div className="tw-ml-3 tw-text-sm tw-leading-6">
                  <label
                    htmlFor="dontShowAgain"
                    className="tw-cursor-pointer tw-font-medium tw-text-iron-300">
                    Don&apos;t show again
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
