import React, { useContext } from "react";
import { AuthContext } from "../../../auth/Auth";
import PrimaryButton from "../../../utils/button/PrimaryButton";

interface WaveLeaderboardHeaderProps {
  readonly onCreateDrop: () => void;
}

export const WaveLeaderboardHeader: React.FC<WaveLeaderboardHeaderProps> = ({
  onCreateDrop,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  return (
    <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-y-4 tw-@container">
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-border-t tw-border-iron-700/40 tw-pb-4">
        <div className="tw-hidden md:tw-block">
          <h3 className="tw-text-xl md:tw-text-2xl tw-font-semibold tw-text-iron-200 tw-mb-0">
            Leaderboard
          </h3>
          <p className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-mb-0">
            Ranked by wave votes
          </p>
        </div>
        <div className="tw-w-full">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-w-full tw-gap-y-2 tw-gap-x-4">
            <div className="md:tw-hidden tw-flex tw-flex-col">
              <h3 className="tw-text-xl md:tw-text-2xl tw-font-semibold tw-text-iron-200 tw-mb-0">
                Leaderboard
              </h3>
              <p className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-mb-0">
                Ranked by wave votes
              </p>
            </div>
            <div className="md:tw-ml-auto tw-flex tw-items-center tw-gap-x-4 tw-mt-2 sm:tw-mt-0">
              {/*  <div
                id="tabsId"
                className="tw-flex tw-items-center tw-whitespace-nowrap tw-h-9 tw-px-1 tw-text-xs tw-border tw-border-iron-800 tw-border-solid tw-rounded-lg tw-overflow-hidden"
              >
                <button className="tw-px-2.5 tw-py-1.5 tw-bg-iron-800 tw-text-iron-300 tw-font-medium tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out">
                  Current Vote
                </button>
                <button className="tw-px-2.5 tw-py-1.5 tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent tw-border-0 tw-rounded-md tw-transition tw-duration-300 tw-ease-out">
                  24-Hour Vote
                </button>
              </div> */}
              <div className="tw-w-auto">
                {connectedProfile && (
                  <PrimaryButton
                    loading={false}
                    disabled={false}
                    onClicked={onCreateDrop}
                    padding="tw-px-3 tw-py-1.5"
                  >
                    <svg
                      className="tw-w-4 tw-h-4 tw-flex-shrink-0 -tw-ml-1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Drop</span>
                  </PrimaryButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
