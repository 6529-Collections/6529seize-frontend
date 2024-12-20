import { FC, useState } from "react";
import { ApiWaveLog } from "../../../../../generated/models/ApiWaveLog";
import { ExtendedDrop } from "../../../../../helpers/waves/wave-drops.helpers";
import { useDrop } from "../../../../../hooks/useDrop";

export type WaveLeaderboardRightSidebarActivityLogDropProps = {
  readonly log: ApiWaveLog;
  readonly onDropClick: (drop: ExtendedDrop) => void;
};

export const WaveLeaderboardRightSidebarActivityLogDrop: FC<
  WaveLeaderboardRightSidebarActivityLogDropProps
> = ({ log, onDropClick }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { drop, prefetchDrop, refetch } = useDrop({
    dropId: log.drop_id,
    enabled: false,
  });
  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (drop) {
        // If drop data is already available, use it
        onDropClick(drop as ExtendedDrop);
      } else {
        // Fetch the drop data on demand
        const { data: fetchedDrop } = await refetch();
        if (fetchedDrop) {
          onDropClick(fetchedDrop as ExtendedDrop);
        } else {
          // Handle the case where fetching the drop fails
          console.error("Failed to fetch the drop data.");
        }
      }
    } catch (error) {
      console.error("An error occurred while fetching the drop data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={prefetchDrop}
      disabled={isLoading}
      title="View drop details"
      className="tw-bg-transparent tw-border-none tw-flex tw-items-center tw-gap-1.5 tw-text-iron-400 hover:tw-text-iron-300 tw-transition-colors tw-duration-200 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
    >
      {isLoading ? (
        <svg
          className="tw-w-4 tw-h-4 tw-animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="tw-opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="tw-opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg
          className="tw-w-4 tw-h-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};
