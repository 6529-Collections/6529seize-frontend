import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import MyStreamWaveMyVoteVotes from "./MyStreamWaveMyVoteVotes";
import MyStreamWaveMyVoteInput from "./MyStreamWaveMyVoteInput";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { SingleWaveDropPosition } from "@/components/waves/drop/SingleWaveDropPosition";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import Link from "next/link";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { ImageScale } from "@/helpers/image.helpers";
import { Tooltip } from "react-tooltip";

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
                  imageScale={ImageScale.AUTOx450}
                  isCompetitionDrop={true}
                />
              )}
            </div>
          </div>
        </div>

        <div className="tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
            <h3 className="tw-text-base tw-font-semibold tw-text-iron-50 tw-mb-0">
              {drop.title}
            </h3>
            {drop.rank && <SingleWaveDropPosition rank={drop.rank} />}
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
              <div className="tw-flex tw-items-center tw-gap-2">
                <div className="tw-flex tw-items-center -tw-space-x-2">
                  {drop.top_raters?.slice(0, 3).map((voter) => (
                    <React.Fragment key={voter.profile.handle}>
                      <Link
                        href={`/${voter.profile.handle}`}
                        onClick={(e) => e.stopPropagation()}
                        data-tooltip-id={`my-vote-voter-${drop.id}-${voter.profile.handle}`}
                      >
                        {voter.profile.pfp ? (
                          <img
                            className="tw-w-6 tw-h-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                            src={voter.profile.pfp}
                            alt="Recent voter"
                          />
                        ) : (
                          <div className="tw-w-6 tw-h-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800" />
                        )}
                      </Link>
                      <Tooltip
                        id={`my-vote-voter-${drop.id}-${voter.profile.handle}`}
                        place="top"
                        offset={8}
                        opacity={1}
                        style={{
                          padding: "4px 8px",
                          background: "#37373E",
                          color: "white",
                          fontSize: "13px",
                          fontWeight: 500,
                          borderRadius: "6px",
                          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                          zIndex: 99999,
                          pointerEvents: "none",
                        }}
                      >
                        {voter.profile.handle} - {formatNumberWithCommas(voter.rating)}
                      </Tooltip>
                    </React.Fragment>
                  ))}
                </div>
                <span className="tw-text-iron-200 tw-font-semibold tw-text-sm">
                  {formatNumberWithCommas(drop.raters_count)}{" "}
                  <span className="tw-text-iron-500 tw-font-normal">
                    {drop.raters_count === 1 ? "voter" : "voters"}
                  </span>
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
