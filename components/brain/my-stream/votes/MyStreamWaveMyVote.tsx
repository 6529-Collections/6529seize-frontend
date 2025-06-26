import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";
import MyStreamWaveMyVoteVotes from "./MyStreamWaveMyVoteVotes";
import MyStreamWaveMyVoteInput from "./MyStreamWaveMyVoteInput";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../user/utils/UserCICAndLevel";
import { SingleWaveDropPosition } from "../../../waves/drop/SingleWaveDropPosition";
import { cicToType } from "../../../../helpers/Helpers";
import Link from "next/link";
import UserProfileTooltipWrapper from "../../../utils/tooltip/UserProfileTooltipWrapper";

interface MyStreamWaveMyVoteProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly isChecked?: boolean;
  readonly onToggleCheck?: (dropId: string) => void;
  readonly isResetting?: boolean;
}

const MyStreamWaveMyVote: React.FC<MyStreamWaveMyVoteProps> = ({
  drop,
  onDropClick,
  isChecked = false,
  onToggleCheck,
  isResetting = false,
}) => {
  const artWork = drop.parts.at(0)?.media.at(0);
  const cicType = cicToType(drop.author.cic || 0);

  const handleClick = () => {
    if (window.getSelection()?.toString()) {
      return;
    }
    onDropClick(drop);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCheck) {
      onToggleCheck(drop.id);
    }
  };

  return (
    <div
      key={drop.id}
      className={`tw-bg-iron-950 tw-rounded-xl tw-px-5 tw-py-4 tw-border tw-border-solid tw-transition-all tw-duration-300 tw-cursor-pointer tw-shadow-md desktop-hover:hover:tw-shadow-lg tw-@container ${
        isChecked
          ? "tw-border-primary-400"
          : "tw-border-iron-800 desktop-hover:hover:tw-border-iron-700"
      }`}
      onClick={handleClick}
    >
      <div className="tw-flex @md:tw-flex-row @sm:tw-flex-col @xs:tw-flex-col tw-gap-4">
        <div
          className="tw-flex-shrink-0 tw-self-start tw-mr-1"
          onClick={handleCheckboxClick}
        >
          <div
            className={`tw-size-5 tw-flex tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid ${
              isChecked
                ? "tw-border-primary-400 tw-bg-primary-400/20"
                : "tw-border-iron-600 tw-bg-iron-800"
            } tw-cursor-pointer tw-shadow-sm hover:tw-shadow-md tw-transition-all tw-duration-200`}
          >
            {isChecked && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="tw-size-4 tw-text-primary-400"
              >
                <path
                  fillRule="evenodd"
                  d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>

        <div className="tw-flex-shrink-0 tw-overflow-hidden tw-bg-iron-800 tw-min-h-[106px] tw-min-w-[106px] @md:tw-size-[106px] @xs:tw-w-full @xs:tw-h-56 @sm:tw-w-full @sm:tw-h-56 @sm:tw-mb-2 tw-relative">
          <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-relative desktop-hover:hover:tw-scale-105 tw-transform tw-duration-300 tw-ease-out">
            <div className="tw-absolute tw-inset-0 tw-z-[1]">
              {artWork && (
                <DropListItemContentMedia
                  media_mime_type={artWork.mime_type}
                  media_url={artWork.url}
                />
              )}
            </div>
          </div>
        </div>

        <div className="tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
          <div className="tw-flex tw-flex-col @md:tw-flex-row @sm:tw-flex-col tw-gap-y-2 tw-gap-x-3">
            <div>
              {drop.rank && <SingleWaveDropPosition rank={drop.rank} />}
            </div>
            <h3 className="tw-text-base tw-font-semibold tw-text-iron-50 tw-mb-0">
              {drop.title}
            </h3>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2 tw-mt-4">
            <div className="tw-size-6 tw-relative tw-flex-shrink-0 tw-rounded-md tw-overflow-hidden tw-ring-1 tw-ring-white/10 tw-bg-iron-800">
              {drop.author.pfp ? (
                <img
                  src={drop.author.pfp}
                  alt="Profile"
                  className="tw-h-full tw-w-full tw-object-contain tw-bg-iron-800"
                />
              ) : (
                <div className="tw-h-full tw-w-full tw-bg-iron-800 tw-rounded-md tw-ring-1 tw-ring-white/10"></div>
              )}
            </div>
            <UserCICAndLevel
              level={drop.author.level || 0}
              cicType={cicType}
              size={UserCICAndLevelSize.SMALL}
            />
            <UserProfileTooltipWrapper user={drop.author.handle ?? drop.author.id}>
              <Link
                href={`/${drop.author.handle}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(`/${drop.author.handle}`, "_blank");
                }}
                className="tw-text-md tw-text-iron-200 desktop-hover:hover:tw-text-opacity-80 tw-transition-colors tw-duration-200 tw-no-underline desktop-hover:hover:tw-underline tw-font-medium tw-truncate"
              >
                {drop.author.handle}
              </Link>
            </UserProfileTooltipWrapper>
          </div>
          <div className="tw-flex tw-flex-col @lg:tw-flex-col @[42rem]:tw-flex-row tw-justify-between tw-gap-4 tw-mt-3.5 xl:tw-mt-3">
            <div className="tw-flex tw-items-center tw-gap-x-6">
              <div onClick={(e) => e.stopPropagation()}>
                <MyStreamWaveMyVoteVotes drop={drop} />
              </div>
              <div className="tw-flex tw-items-center tw-gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
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
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <MyStreamWaveMyVoteInput
                drop={drop}
                isResetting={isResetting}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStreamWaveMyVote;
