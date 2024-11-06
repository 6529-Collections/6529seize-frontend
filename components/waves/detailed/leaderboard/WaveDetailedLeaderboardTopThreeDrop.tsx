import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";

interface WaveDetailedLeaderboardTopThreeDropProps {
  readonly drop: ExtendedDrop;
}

export const WaveDetailedLeaderboardTopThreeDrop: React.FC<
  WaveDetailedLeaderboardTopThreeDropProps
> = ({ drop }) => {
  const thropyIcon = (rank: number | null) => {
    if (rank === 1) {
      return (
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
      );
    }

    if (rank === 2) {
      return (
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
      );
    }

    if (rank === 3) {
      return (
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
      );
    }

    return <></>
  };

  return (
    <li className="tw-flex tw-flex-col tw-rounded-lg tw-bg-iron-900 tw-p-3">
      <div className="tw-flex tw-items-start tw-gap-x-3">
        {thropyIcon(drop.rank)}
        <div className="tw-flex-1">
          <div className="tw-text-iron-50 tw-font-normal tw-mb-2 tw-line-clamp-3">
          {drop.parts[0].content}
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-2">
            {drop.author.pfp ? (
              <img
                className="tw-size-5 tw-rounded-md tw-bg-iron-800"
                src={drop.author.pfp}
                alt=""
              />
            ) : (
              <div className="tw-size-5 tw-rounded-md tw-bg-iron-800" />
            )}
            <span className="tw-inline-flex tw-items-center tw-gap-x-2">
              <span className="tw-text-iron-50 tw-text-xs tw-font-semibold">
                {drop.author.handle}
              </span>
              <span className="tw-flex-shrink-0 tw-block tw-rounded-full tw-h-1.5 tw-w-1.5 tw-bg-[#3CCB7F]"></span>
            </span>
            <div className="tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-rounded-full tw-bg-iron-800">
              {drop.rating} Rep
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
