import { FC } from "react";
import { WaveDetailedDropsSortBy, WaveDetailedDropsView } from "./WaveDetailed";

interface WaveDetailedDropsHeaderNavProps {
  readonly dropsView: WaveDetailedDropsView;
  readonly setDropsView: (view: WaveDetailedDropsView) => void;
  readonly dropsSortBy: WaveDetailedDropsSortBy;
  readonly setDropsSortBy: (sortBy: WaveDetailedDropsSortBy) => void;
}

const WaveDetailedDropsHeaderNav: FC<WaveDetailedDropsHeaderNavProps> = ({
  dropsView,
  setDropsView,
  dropsSortBy,
  setDropsSortBy,
}) => {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-1.5 tw-bg-iron-950/70 tw-backdrop-blur-md tw-border-solid tw-border-b tw-border-iron-800 tw-border-x-0 tw-border-t-0 tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-z-10">
      <div className="tw-flex tw-space-x-2">
        <button
          onClick={() => setDropsView(WaveDetailedDropsView.ALL)}
          className={`tw-px-3 tw-py-1.5 tw-border-0 tw-rounded-full tw-text-xs tw-font-medium ${
            dropsView === WaveDetailedDropsView.ALL
              ? "tw-bg-primary-400 tw-text-white hover:tw-bg-primary-500"
              : "tw-bg-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-text-white"
          } focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 tw-transition-colors`}
        >
          All
        </button>
        <button
          onClick={() => setDropsView(WaveDetailedDropsView.DROPS)}
          className={`tw-px-3 tw-py-1.5 tw-border-0 tw-rounded-full tw-text-xs tw-font-medium ${
            dropsView === WaveDetailedDropsView.DROPS
              ? "tw-bg-primary-400 tw-text-white hover:tw-bg-primary-500"
              : "tw-bg-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-text-white"
          } focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 tw-transition-colors`}
        >
          Drops
        </button>

        {dropsView === WaveDetailedDropsView.DROPS && (
          <>
            <div className="tw-w-px tw-h-6 tw-bg-iron-700 tw-mx-1" />
            <button
              onClick={() => setDropsSortBy(WaveDetailedDropsSortBy.CREATION_TIME)}
              className={`tw-px-3 tw-py-1.5 tw-border-0 tw-rounded-full tw-text-xs tw-font-medium ${
                dropsSortBy === WaveDetailedDropsSortBy.CREATION_TIME
                  ? "tw-bg-iron-700 tw-text-white"
                  : "tw-bg-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-text-white"
              } focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 tw-transition-colors`}
            >
              Latest
            </button>
            <button
              onClick={() => setDropsSortBy(WaveDetailedDropsSortBy.RANK)}
              className={`tw-px-3 tw-py-1.5 tw-border-0 tw-rounded-full tw-text-xs tw-font-medium ${
                dropsSortBy === WaveDetailedDropsSortBy.RANK
                  ? "tw-bg-iron-700 tw-text-white"
                  : "tw-bg-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-text-white"
              } focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 tw-transition-colors`}
            >
              Top
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WaveDetailedDropsHeaderNav;
