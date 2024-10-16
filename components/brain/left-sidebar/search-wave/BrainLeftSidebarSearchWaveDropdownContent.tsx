import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";

interface BrainLeftSidebarSearchWaveDropdownContentProps {
  readonly loading: boolean;
  readonly waves: ApiWave[];
}

const BrainLeftSidebarSearchWaveDropdownContent: React.FC<
  BrainLeftSidebarSearchWaveDropdownContentProps
> = ({ loading, waves }) => {
  if (loading) {
    return (
      <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
        Loading...
      </li>
    );
  }

  if (waves.length) {
    return (
      <>
        {waves.map((wave) => (
          <li className="tw-h-full" key={wave.id}>
            <button
              type="button"
              className="hover:tw-bg-iron-700 tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            >
              <div className="tw-w-full tw-flex tw-justify-between tw-items-center">
                <div className="tw-flex tw-space-x-2 tw-items-center">
                  {wave.picture && (
                    <div className="tw-h-6 tw-w-6 tw-rounded-md tw-overflow-hidden tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-900">
                      <div className="tw-h-full tw-w-full tw-max-w-full">
                        <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center">
                          <img
                            src={getScaledImageUri(
                              wave.picture,
                              ImageScale.W_AUTO_H_50
                            )}
                            alt="Wave Picture"
                            className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="tw-w-[12rem] tw-truncate">
                    <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-white tw-truncate tw-whitespace-nowrap">
                      {wave.name}
                    </p>
                    <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400 tw-truncate tw-whitespace-nowrap">
                      By {wave.author.handle}
                    </p>
                  </div>
                </div>
                {true && (
                  <svg
                    className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          </li>
        ))}
      </>
    );
  }

  return (
    <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
      No results
    </li>
  );
};

export default BrainLeftSidebarSearchWaveDropdownContent;
