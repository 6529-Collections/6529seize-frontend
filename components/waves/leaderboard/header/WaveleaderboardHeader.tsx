import React, { useContext } from "react";
import { AuthContext } from "../../../auth/Auth";
import PrimaryButton from "../../../utils/button/PrimaryButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList, faTableCells } from "@fortawesome/free-solid-svg-icons";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { useWave } from "../../../../hooks/useWave";
import { WaveleaderboardSort } from "./WaveleaderboardSort";
import { WaveDropsLeaderboardSort } from "../../../../hooks/useWaveDropsLeaderboard";
interface WaveLeaderboardHeaderProps {
  readonly wave: ApiWave;
  readonly onCreateDrop: () => void;
  readonly viewMode: "list" | "grid";
  readonly onViewModeChange: (mode: "list" | "grid") => void;
  readonly sort: WaveDropsLeaderboardSort;
  readonly onSortChange: (sort: WaveDropsLeaderboardSort) => void;
}

export const WaveLeaderboardHeader: React.FC<WaveLeaderboardHeaderProps> = ({
  wave,
  onCreateDrop,
  viewMode = "list",
  onViewModeChange,
  sort,
  onSortChange,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { isMemesWave } = useWave(wave);

  return (
    <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-y-4 tw-@container">
      <div className="tw-flex tw-items-start sm:tw-items-center tw-justify-between tw-pb-4">
        <div className="tw-flex tw-items-center tw-gap-x-4 tw-mt-2 sm:tw-mt-0">
          {isMemesWave && (
            <div className="tw-flex tw-items-center tw-whitespace-nowrap tw-h-9 tw-px-1 tw-text-xs tw-border tw-border-iron-800 tw-border-solid tw-rounded-lg tw-overflow-hidden">
              <button
                className={`tw-px-2.5 tw-py-1.5 ${
                  viewMode === "list"
                    ? "tw-bg-iron-800 tw-text-iron-300 tw-font-medium"
                    : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent"
                } tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out`}
                onClick={() => onViewModeChange("list")}
              >
                <FontAwesomeIcon icon={faList} className="tw-w-4 tw-h-4" />
              </button>
              <button
                className={`tw-px-2.5 tw-py-1.5 ${
                  viewMode === "grid"
                    ? "tw-bg-iron-800 tw-text-iron-300 tw-font-medium"
                    : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent"
                } tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out`}
                onClick={() => onViewModeChange("grid")}
              >
                <FontAwesomeIcon
                  icon={faTableCells}
                  className="tw-w-4 tw-h-4"
                />
              </button>
            </div>
          )}
          {isMemesWave && (
            <WaveleaderboardSort sort={sort} onSortChange={onSortChange} />
          )}
        </div>
        {!isMemesWave && connectedProfile && (
          <div className="tw-w-auto tw-ml-auto">
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
              <span className="tw-hidden tw-sm:tw-block">Drop</span>
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
};
