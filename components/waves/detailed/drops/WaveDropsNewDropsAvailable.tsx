import React from "react";
import CircleLoader, { CircleLoaderSize } from "../../../distribution-plan-tool/common/CircleLoader";

interface WaveDropsNewDropsAvailableProps {
  readonly haveNewDrops: boolean;
  readonly loading: boolean;
  readonly onRefresh: () => void;
}

export const WaveDropsNewDropsAvailable: React.FC<
  WaveDropsNewDropsAvailableProps
> = ({ haveNewDrops, loading, onRefresh }) => {
  if (!haveNewDrops) return null;

  return (
    <div className="tw-absolute tw-top-2 tw-left-1/2 tw-transform -tw-translate-x-1/2 tw-z-50">
      <button
        disabled={loading}
        onClick={onRefresh}
        type="button"
        className="tw-border-none tw-bg-primary-500 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-md tw-cursor-pointer tw-transition-all hover:tw-bg-primary-600 tw-text-xs tw-font-medium tw-flex tw-items-center tw-gap-2"
      >
        New drops available {loading && <CircleLoader size={CircleLoaderSize.SMALL}/>}
      </button>
    </div>
  );
};
