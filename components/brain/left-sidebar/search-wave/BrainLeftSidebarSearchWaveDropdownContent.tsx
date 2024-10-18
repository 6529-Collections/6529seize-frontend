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
      <li className="tw-py-2 tw-w-full tw-h-full tw-text-sm tw-font-normal tw-text-iron-300 tw-rounded-lg tw-relative tw-select-none tw-px-2 tw-flex tw-items-center tw-gap-x-2">
        <svg
          aria-hidden="true"
          role="status"
          className="tw-flex-shrink-0 tw-size-4 tw-inline tw-text-primary-400 tw-animate-spin"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="tw-text-primary-400/30"
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          ></path>
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentColor"
          ></path>
        </svg>
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
              className="hover:tw-bg-iron-800 tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            >
              <div className="tw-w-full tw-flex tw-justify-between tw-items-center">
                <div className="tw-flex tw-space-x-3 tw-items-center">
                  {wave.picture && (
                    <div className="tw-h-8 tw-w-8 tw-rounded-full tw-overflow-hidden tw-ring-2 tw-ring-inset tw-ring-white/10 tw-bg-iron-900">
                      <img
                        src={getScaledImageUri(
                          wave.picture,
                          ImageScale.W_AUTO_H_50
                        )}
                        alt="Wave Picture"
                        className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-object-cover"
                      />
                    </div>
                  )}
                  <div className="tw-w-[14rem] tw-truncate">
                    <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-50 tw-truncate tw-whitespace-nowrap">
                      {wave.name}
                    </p>
                    <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400 tw-truncate tw-whitespace-nowrap">
                      By {wave.author.handle}
                    </p>
                  </div>
                </div>
                <svg
                  className="tw-flex-shrink-0 tw-size-5 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
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
              </div>
            </button>
          </li>
        ))}
      </>
    );
  }

  return (
    <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
      No results
    </li>
  );
};

export default BrainLeftSidebarSearchWaveDropdownContent;
