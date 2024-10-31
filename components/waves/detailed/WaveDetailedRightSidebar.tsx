import React from "react";
import { motion } from "framer-motion";
import { ApiWave } from "../../../generated/models/ObjectSerializer";
import { WaveDetailedOutcomes } from "./outcome/WaveDetailedOutcomes";

interface WaveDetailedRightSidebarProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onToggle: () => void;
}

const WaveDetailedRightSidebar: React.FC<WaveDetailedRightSidebarProps> = ({
  isOpen,
  wave,
  onToggle,
}) => {
  return (
    <motion.div
      className="tw-fixed tw-right-0 tw-top-0 tw-h-screen tw-z-40 tw-bg-iron-950 tw-flex tw-flex-col tw-w-full lg:tw-w-[20.5rem] tw-border-solid tw-border-l-2 tw-border-iron-800 tw-border-y-0 tw-border-b-0 tw-border-r-0"
      initial={false}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={onToggle}
        className="tw-border-0 tw-absolute tw-left-2 lg:-tw-left-7 tw-z-50 tw-top-[7.5rem] tw-text-iron-500 hover:tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-800 tw-rounded-r-lg lg:tw-rounded-r-none tw-rounded-l-lg tw-size-7 tw-flex tw-items-center tw-justify-center tw-shadow-lg hover:tw-shadow-primary-400/20"
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
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
            <ul className="tw-space-y-3 tw-pl-0">
              <li className="tw-flex tw-flex-col tw-rounded-lg tw-bg-iron-900 tw-p-3">
                <div className="tw-flex tw-items-start tw-gap-x-3">
                  <svg
                    className="tw-size-4 tw-flex-shrink-0 tw-mt-1 tw-text-[#E8D48A]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                  >
                    <path
                      fill="currentColor"
                      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                    />
                  </svg>
                  <div className="tw-flex-1">
                    <div className="tw-text-iron-50 tw-font-normal tw-mb-2 tw-line-clamp-3">
                      Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                      Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      <img
                        className="tw-size-5 tw-rounded-md tw-bg-iron-800"
                        src="#"
                        alt=""
                      />
                      <span className="tw-inline-flex tw-items-center tw-gap-x-2">
                        <span className="tw-text-iron-50 tw-text-xs tw-font-semibold">
                          CryptoKing
                        </span>
                        <span className="tw-flex-shrink-0 tw-block tw-rounded-full tw-h-1.5 tw-w-1.5 tw-bg-[#3CCB7F]"></span>
                      </span>
                      <div className="tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-rounded-full tw-bg-iron-800">
                        500 Rep
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li className="tw-flex tw-flex-col tw-rounded-lg tw-bg-iron-900 tw-p-3">
                <div className="tw-flex tw-items-start tw-gap-x-3">
                  <svg
                    className="tw-size-4 tw-flex-shrink-0 tw-mt-1 tw-text-[#DDDDDD]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                  >
                    <path
                      fill="currentColor"
                      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                    />
                  </svg>
                  <div className="tw-flex-1">
                    <div className="tw-text-iron-50 tw-font-normal tw-mb-2 tw-line-clamp-3">
                      The future of DeFi lies in cross-chain interoperability
                      and zero-knowledge proofs.
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      <img
                        className="tw-size-5 tw-rounded-md tw-bg-iron-800"
                        src="#"
                        alt=""
                      />
                      <span className="tw-inline-flex tw-items-center tw-gap-x-2">
                        <span className="tw-text-iron-50 tw-text-xs tw-font-semibold">
                          BlockchainQueen
                        </span>
                        <span className="tw-flex-shrink-0 tw-block tw-rounded-full tw-h-1.5 tw-w-1.5 tw-bg-[#3CCB7F]"></span>
                      </span>
                      <div className="tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-rounded-full tw-bg-iron-800">
                        400 Rep
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li className="tw-flex tw-flex-col tw-rounded-lg tw-bg-iron-900 tw-p-3">
                <div className="tw-flex tw-items-start tw-gap-x-3">
                  <svg
                    className="tw-size-4 tw-flex-shrink-0 tw-mt-1 tw-text-[#D9A962]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                  >
                    <path
                      fill="currentColor"
                      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                    />
                  </svg>
                  <div className="tw-flex-1">
                    <img
                      className="tw-w-full tw-h-24 tw-object-cover tw-rounded-md tw-mb-2"
                      src="#"
                      alt=""
                    />
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      <img
                        className="tw-size-5 tw-rounded-md tw-bg-iron-800"
                        src="#"
                        alt=""
                      />
                      <span className="tw-inline-flex tw-items-center tw-gap-x-2">
                        <span className="tw-text-iron-50 tw-text-xs tw-font-semibold">
                          TokenMaster
                        </span>
                        <span className="tw-flex-shrink-0 tw-block tw-rounded-full tw-h-1.5 tw-w-1.5 tw-bg-[#3CCB7F]"></span>
                      </span>
                      <div className="tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-rounded-full tw-bg-iron-800">
                        300 Rep
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li className="tw-flex tw-items-center tw-justify-between tw-px-3">
                <div className="tw-flex tw-gap-x-3">
                  <div className="tw-text-iron-500 tw-font-semibold tw-w-4 tw-flex tw-justify-center">
                    4
                  </div>
                  <div className="tw-flex tw-flex-col">
                    <div className="tw-text-iron-50 tw-font-normal tw-mb-1 tw-line-clamp-3">
                      Web3 will revolutionize...
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      <img
                        className="tw-size-5 tw-rounded-md tw-bg-iron-800"
                        src="#"
                        alt=""
                      />
                      <span className="tw-inline-flex tw-items-center tw-gap-x-2">
                        <span className="tw-text-iron-50 tw-text-xs tw-font-semibold">
                          Web3Wizard
                        </span>
                        <span className="tw-flex-shrink-0 tw-block tw-rounded-full tw-h-1.5 tw-w-1.5 tw-bg-[#3CCB7F]"></span>
                      </span>
                      <div className="tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-rounded-full tw-bg-iron-800/50">
                        150 Rep
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
            <button className="tw-border-0 tw-w-full tw-rounded-lg tw-px-4 tw-py-2 tw-text-left tw-bg-iron-950 tw-text-primary-300/80 tw-text-xs hover:tw-text-primary-300 tw-transition-colors tw-duration-300 hover:tw-bg-iron-900">
              View more
            </button>
          </div>

          <WaveDetailedOutcomes wave={wave} />
        </div>
      </div>
    </motion.div>
  );
};

export default WaveDetailedRightSidebar;
