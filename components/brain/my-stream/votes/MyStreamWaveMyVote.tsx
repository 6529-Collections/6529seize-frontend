import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";
import MyStreamWaveMyVoteVotes from "./MyStreamWaveMyVoteVotes";
import MyStreamWaveMyVoteInput from "./MyStreamWaveMyVoteInput";

interface MyStreamWaveMyVoteProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWaveMyVote: React.FC<MyStreamWaveMyVoteProps> = ({
  drop,
  onDropClick,
}) => {
  const artWork = drop.parts.at(0)?.media.at(0);
  return (
    <div
      key={drop.id}
      className="tw-bg-iron-900 tw-rounded-lg tw-p-3 tw-border tw-border-iron-800 tw-border-solid hover:tw-border-iron-700 tw-transition-colors tw-cursor-pointer"
      onClick={() => onDropClick(drop)}
    >
      <div className="tw-grid tw-grid-cols-12 tw-gap-x-6">
        <div className="tw-col-span-4 tw-flex tw-items-center">
          <div className="tw-w-14 tw-h-14 tw-flex-shrink-0 tw-mr-3 tw-bg-iron-800 tw-overflow-hidden">
            {artWork && (
              <DropListItemContentMedia
                media_mime_type={artWork.mime_type}
                media_url={artWork.url}
              />
            )}
          </div>
          <div className="tw-flex tw-flex-col">
            <h3 className="tw-text-sm tw-font-medium tw-text-iron-50 tw-truncate">
              {drop.title}
            </h3>
            <span className="tw-text-sm tw-text-iron-400 tw-truncate">
              {drop.author.handle}
            </span>
          </div>
        </div>
        <div className="tw-col-span-8 tw-flex tw-items-center tw-justify-between tw-gap-x-4">
          <div className="tw-flex tw-justify-end tw-ml-auto tw-text-left">
            <MyStreamWaveMyVoteVotes drop={drop} />
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-4">
            <div className="tw-flex tw-items-center tw-gap-x-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.25"
                stroke="currentColor"
                className="tw-size-4 tw-text-iron-400 tw-flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                />
              </svg>
              <span className="tw-text-sm tw-font-medium tw-text-iron-200">
                {drop.raters_count}
              </span>
            </div>
            <MyStreamWaveMyVoteInput drop={drop} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStreamWaveMyVote;
