import { FC } from "react";
import Tippy from "@tippyjs/react";
import { WaveDetailedDropsSortBy, WaveDetailedDropsView } from "./WaveDetailed";
import useIsMobileDevice from "../../../hooks/isMobileDevice";

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
  const isMobile = useIsMobileDevice();

  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-1.5 tw-bg-iron-950/70 tw-backdrop-blur-md tw-border-solid tw-border-b tw-border-iron-800 tw-border-x-0 tw-border-t-0 tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-z-10">
      <div className="tw-flex tw-space-x-3 tw-items-center">
        <div className="tw-flex tw-space-x-2 tw-items-center">
          <button
            onClick={() => setDropsView(WaveDetailedDropsView.ALL)}
            className={`tw-px-3 tw-py-1.5 tw-border-0 tw-rounded-full tw-text-xs tw-font-medium ${
              dropsView === WaveDetailedDropsView.ALL
                ? "tw-bg-primary-400 tw-text-white desktop-hover:hover:tw-bg-primary-500"
                : "tw-bg-iron-800 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-white"
            } focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 tw-transition-colors`}
          >
            All
          </button>
          <button
            onClick={() => {
              setDropsView(WaveDetailedDropsView.DROPS);
              setDropsSortBy(WaveDetailedDropsSortBy.CREATION_TIME);
            }}
            className={`tw-px-3 tw-py-1.5 tw-border-0 tw-rounded-full tw-text-xs tw-font-medium ${
              dropsView === WaveDetailedDropsView.DROPS
                ? "tw-bg-primary-400 tw-text-white"
                : "tw-bg-iron-800 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-white"
            } focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 tw-transition-colors`}
          >
            Drops
          </button>
        </div>

        {dropsView === WaveDetailedDropsView.DROPS && (
          <>
            <div className="tw-w-px tw-h-6 tw-bg-iron-700 tw-mx-1" />
            <Tippy
              disabled={isMobile}
              content={<span className="tw-text-xs">Top</span>}
            >
              <button
                onClick={() =>
                  setDropsSortBy(
                    dropsSortBy === WaveDetailedDropsSortBy.RANK
                      ? WaveDetailedDropsSortBy.CREATION_TIME
                      : WaveDetailedDropsSortBy.RANK
                  )
                }
                className={`tw-h-7 tw-w-7 tw-border-0 tw-rounded-full tw-text-xs tw-font-medium ${
                  dropsSortBy === WaveDetailedDropsSortBy.RANK
                    ? "tw-bg-primary-400 tw-text-iron-50 desktop-hover:hover:tw-bg-primary-500"
                    : "tw-bg-iron-800 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700"
                } focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 tw-transition-colors`}
              >
                <svg
                  className="tw-size-4 tw-flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512"
                >
                  <path
                    fill="currentColor"
                    d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                  />
                </svg>
              </button>
            </Tippy>
          </>
        )}
      </div>
    </div>
  );
};

export default WaveDetailedDropsHeaderNav;
