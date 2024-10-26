import React from "react";
import { motion } from "framer-motion";

interface WaveDetailedRightSidebarProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

const WaveDetailedRightSidebar: React.FC<WaveDetailedRightSidebarProps> = ({
  isOpen,
  onToggle,
}) => {
  return (
    <motion.div
      className="tw-fixed tw-right-0 tw-top-0 tw-h-screen tw-z-40 tw-bg-iron-950 tw-border-l tw-border-iron-800 tw-border-solid tw-border-y-0 tw-border-r-0 tw-flex tw-flex-col tw-w-full lg:tw-w-[20.5rem]"
      initial={false}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={onToggle}
        className="tw-border-0 tw-absolute tw-left-2 lg:-tw-left-7 tw-z-50 tw-top-28 tw-text-iron-500 hover:tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-800 tw-rounded-r-lg lg:tw-rounded-r-none tw-rounded-l-lg tw-size-7 tw-flex tw-items-center tw-justify-center tw-shadow-lg hover:tw-shadow-primary-400/20"
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          aria-hidden="true"
          stroke="currentColor"
          className="tw-size-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-ease-in-out"
          animate={{ rotate: isOpen ? 0 : 180 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </motion.svg>
      </button>
      <div className="tw-pt-[5.6rem] xl:tw-pt-[6.25rem] tw-text-iron-500 tw-text-sm tw-overflow-y-auto horizontal-menu-hide-scrollbar tw-h-full">
        <div className="tw-h-full tw-divide-y tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
          <div className="tw-p-4">
            <h2 className="tw-text-iron-50 tw-text-lg tw-font-semibold tw-mb-3">
              Leaderboard
            </h2>
            <ul className="tw-space-y-2 tw-pl-0">
              <li className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-bg-iron-900 tw-py-2.5 tw-px-2">
                <div className="tw-flex tw-items-center tw-space-x-4">
                  <svg
                    className="tw-size-4 tw-flex-shrink-0 tw-text-[#E8D48A]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                  >
                    {/* Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
                    <path
                      fill="currentColor"
                      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                    />
                  </svg>
                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    <div className="tw-flex">
                      <img
                        className="tw-size-7 tw-object-contain tw-rounded-md tw-bg-iron-900"
                        src="#"
                        alt="Profile image"
                      />
                    </div>
                    <span className="tw-text-iron-50">CryptoKING</span>
                    <div className="tw-relative">
                      <div className="tw-flex tw-items-center tw-justify-center tw-leading-3 tw-font-bold tw-rounded-full tw-ring-1 tw-ring-iron-300 tw-h-4 tw-w-4 tw-text-[9px]">
                        33
                      </div>
                      <span className="tw-flex-shrink-0 tw-absolute -tw-right-1 tw-block tw-rounded-full -tw-top-[0.1875rem] tw-h-2 tw-w-2 tw-bg-[#3CCB7F]"></span>
                    </div>
                  </div>
                </div>
                <button className="tw-size-6 tw-text-iron-400 hover:tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-800 tw-ring-1 tw-ring-iron-700 hover:tw-ring-iron-650 tw-rounded-lg tw-bg-iron-800 tw-text-sm tw-font-semibold tw-shadow-sm hover:tw-bg-iron-700 hover:tw-border-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="tw-size-4 tw-flex-shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </button>
              </li>
              <li className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-bg-iron-900 tw-py-2.5 tw-px-2">
                <div className="tw-flex tw-items-center tw-space-x-4">
                  <svg
                    className="tw-size-4 tw-flex-shrink-0 tw-text-[#DDDDDD]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                  >
                    {/* Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
                    <path
                      fill="currentColor"
                      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                    />
                  </svg>
                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    <div className="tw-flex">
                      <img
                        className="tw-size-7 tw-object-contain tw-rounded-md tw-bg-iron-900"
                        src="#"
                        alt="Profile image"
                      />
                    </div>
                    <span className="tw-text-iron-50">BlockchainQueen</span>
                    <div className="tw-relative">
                      <div className="tw-flex tw-items-center tw-justify-center tw-leading-3 tw-font-bold tw-rounded-full tw-ring-1 tw-ring-iron-300 tw-h-4 tw-w-4 tw-text-[9px]">
                        33
                      </div>
                      <span className="tw-flex-shrink-0 tw-absolute -tw-right-1 tw-block tw-rounded-full -tw-top-[0.1875rem] tw-h-2 tw-w-2 tw-bg-[#3CCB7F]"></span>
                    </div>
                  </div>
                </div>
                <button className="tw-size-6 tw-text-iron-400 hover:tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-800 tw-ring-1 tw-ring-iron-700 hover:tw-ring-iron-650 tw-rounded-lg tw-bg-iron-800 tw-text-sm tw-font-semibold tw-shadow-sm hover:tw-bg-iron-700 hover:tw-border-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="tw-size-4 tw-flex-shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </button>
              </li>
              <li className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-bg-iron-900 tw-py-2.5 tw-px-2">
                <div className="tw-flex tw-items-center tw-space-x-4">
                  <svg
                    className="tw-size-4 tw-flex-shrink-0 tw-text-[#D9A962]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                  >
                    {/* Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
                    <path
                      fill="currentColor"
                      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                    />
                  </svg>

                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    <div className="tw-flex">
                      <img
                        className="tw-size-7 tw-object-contain tw-rounded-md tw-bg-iron-900"
                        src="#"
                        alt="Profile image"
                      />
                    </div>
                    <span className="tw-text-iron-50">TokenMaster</span>
                    <div className="tw-relative">
                      <div className="tw-flex tw-items-center tw-justify-center tw-leading-3 tw-font-bold tw-rounded-full tw-ring-1 tw-ring-iron-300 tw-h-4 tw-w-4 tw-text-[9px]">
                        33
                      </div>
                      <span className="tw-flex-shrink-0 tw-absolute -tw-right-1 tw-block tw-rounded-full -tw-top-[0.1875rem] tw-h-2 tw-w-2 tw-bg-[#3CCB7F]"></span>
                    </div>
                  </div>
                </div>
                <button className="tw-size-6 tw-text-iron-400 hover:tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-800 tw-ring-1 tw-ring-iron-700 hover:tw-ring-iron-650 tw-rounded-lg tw-bg-iron-800 tw-text-sm tw-font-semibold tw-shadow-sm hover:tw-bg-iron-700 hover:tw-border-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="tw-size-4 tw-flex-shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </button>
              </li>
              <li className="tw-flex tw-items-center tw-justify-between tw-px-2">
                <div className="tw-flex tw-items-center tw-space-x-4">
                  <div className="tw-text-iron-500 tw-font-medium tw-w-4 tw-flex tw-justify-center">
                    4
                  </div>
                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    <div className="tw-flex">
                      <img
                        className="tw-size-7 tw-object-contain tw-rounded-md tw-bg-iron-900"
                        src="#"
                        alt="Profile image"
                      />
                    </div>
                    <span className="tw-text-iron-50">Web3Wizard</span>
                    <div className="tw-relative">
                      <div className="tw-flex tw-items-center tw-justify-center tw-leading-3 tw-font-bold tw-rounded-full tw-ring-1 tw-ring-iron-300 tw-h-4 tw-w-4 tw-text-[9px]">
                        33
                      </div>
                      <span className="tw-flex-shrink-0 tw-absolute -tw-right-1 tw-block tw-rounded-full -tw-top-[0.1875rem] tw-h-2 tw-w-2 tw-bg-[#3CCB7F]"></span>
                    </div>
                  </div>
                </div>
                <button className="tw-size-6 tw-text-iron-400 hover:tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-800 tw-ring-1 tw-ring-iron-700 hover:tw-ring-iron-650 tw-rounded-lg tw-bg-iron-800 tw-text-sm tw-font-semibold tw-shadow-sm hover:tw-bg-iron-700 hover:tw-border-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="tw-size-4 tw-flex-shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </button>
              </li>
            </ul>
          </div>

          <div className="tw-p-4">
            <h2 className="tw-text-iron-50 tw-text-lg tw-font-semibold tw-mb-3">
              Outcome
            </h2>
            <div className="tw-space-y-2">
              <div className="tw-grid tw-grid-cols-3 tw-px-2">
                <span className="tw-pr-2"></span>
                <span className="tw-px-2 tw-text-iron-500 tw-font-normal tw-uppercase tw-text-[10px] tw-leading-3 tw-tracking-wide tw-text-right">
                  Winners
                </span>
                <span className="tw-pl-2 tw-text-iron-500 tw-font-normal tw-uppercase tw-text-[10px] tw-leading-3 tw-text-right tw-tracking-wide">
                  Prize
                </span>
              </div>
              <div className="tw-grid tw-grid-cols-3 tw-items-center tw-bg-iron-900 tw-rounded-lg tw-px-2 tw-py-2.5">
                <div className="tw-text-iron-50 tw-whitespace-nowrap tw-pr-2">
                  Rep Category
                </div>
                <div className="tw-flex tw-items-center tw-justify-end tw-space-x-2 tw-px-2">
                  <svg
                    className="tw-size-4 tw-flex-shrink-0 tw-text-primary-300"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                  >
                    {/* Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
                    <path
                      fill="currentColor"
                      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                    />
                  </svg>
                  <span className="tw-text-primary-300 tw-font-semibold tw-text-sm">
                    1
                  </span>
                </div>
                <div className="tw-ml-2 tw-whitespace-nowrap tw-bg-iron-800 tw-text-iron-50 tw-text-sm tw-rounded-full tw-px-3 tw-py-1 tw-text-right">
                  100k Rep
                </div>
              </div>
              <div className="tw-grid tw-grid-cols-3 tw-items-center tw-bg-iron-900 tw-rounded-lg tw-p-3">
                <span className="tw-text-iron-50 tw-pr-2">NIC</span>
                <div className="tw-flex tw-items-center tw-justify-end tw-space-x-2 tw-px-2">
                  <svg
                    className="tw-size-4 tw-flex-shrink-0 tw-text-primary-300"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                  >
                    {/* Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
                    <path
                      fill="currentColor"
                      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                    />
                  </svg>
                  <span className="tw-text-primary-300 tw-font-semibold tw-text-sm">
                    10
                  </span>
                </div>
                <span className="tw-ml-2 tw-whitespace-nowrap tw-bg-iron-800 tw-text-iron-50 tw-text-sm tw-rounded-full tw-px-3 tw-py-1 tw-text-right">
                  1000 NIC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WaveDetailedRightSidebar;
