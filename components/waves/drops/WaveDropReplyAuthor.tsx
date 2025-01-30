import React from "react";
import Link from "next/link";
import { ApiDrop } from "../../../generated/models/ApiDrop";

interface WaveDropReplyAuthorProps {
  isFetching: boolean;
  drop?: ApiDrop;
}

const WaveDropReplyAuthor: React.FC<WaveDropReplyAuthorProps> = ({
  isFetching,
  drop,
}) => {
  if (isFetching) {
    return (
      <div className="tw-flex tw-items-center tw-gap-x-1.5">
        <div className="tw-h-6 tw-w-6 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-md z-10">
          <div className="tw-h-full tw-w-full tw-animate-pulse tw-bg-iron-700 tw-rounded-md" />
        </div>
        <p className="tw-mb-0 tw-text-sm tw-text-iron-200 tw-font-semibold tw-animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  if (drop?.author.handle) {
    return (
      <Link
        href={`/${drop.author.handle}`}
        className="tw-no-underline tw-flex tw-items-center tw-gap-x-1.5"
      >
        <div className="tw-h-6 tw-w-6 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-md z-10">
          {drop.author.pfp ? (
            <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-md tw-overflow-hidden tw-bg-iron-900">
              <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-md tw-overflow-hidden">
                <img
                  src={drop.author.pfp}
                  alt={`${drop.author.handle}`}
                  className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-rounded-md tw-ring-1 tw-ring-inset tw-ring-white/10" />
          )}
        </div>
        <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out">
          {drop.author.handle}
        </p>
      </Link>
    );
  }

  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      <div className="tw-h-6 tw-w-6 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-md z-10">
        <div className="tw-h-full tw-w-full tw-bg-iron-800 tw-rounded-md" />
      </div>
      <p className="tw-mb-0 tw-text-sm tw-text-iron-200 tw-font-semibold">
        Unknown Author
      </p>
    </div>
  );
};

export default WaveDropReplyAuthor;
