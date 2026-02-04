import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { SingleWaveDropPosition } from "@/components/waves/drop/SingleWaveDropPosition";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import Link from "next/link";
import React, { useMemo } from "react";
import { Tooltip } from "react-tooltip";
import MyStreamWaveMyVoteInput from "./MyStreamWaveMyVoteInput";
import MyStreamWaveMyVoteVotes from "./MyStreamWaveMyVoteVotes";

interface MyStreamWaveMyVoteProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly isChecked?: boolean | undefined;
  readonly onToggleCheck?: ((dropId: string) => void) | undefined;
  readonly isResetting?: boolean | undefined;
}

const MyStreamWaveMyVote: React.FC<MyStreamWaveMyVoteProps> = ({
  drop,
  onDropClick,
  isChecked = false,
  onToggleCheck,
  isResetting = false,
}) => {
  const artWork = drop.parts.at(0)?.media.at(0);
  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );

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
      className={`tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-bg-iron-950 tw-px-5 tw-py-4 tw-shadow-md tw-transition-all tw-duration-300 tw-@container desktop-hover:hover:tw-shadow-lg ${
        isChecked
          ? "tw-border-primary-400"
          : "tw-border-iron-800 desktop-hover:hover:tw-border-iron-700"
      }`}
      onClick={handleClick}
    >
      <div className="tw-flex tw-gap-4 @xs:tw-flex-col @sm:tw-flex-col @md:tw-flex-row">
        <div
          className="tw-mr-1 tw-flex-shrink-0 tw-self-start"
          onClick={handleCheckboxClick}
        >
          <div
            className={`tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid ${
              isChecked
                ? "tw-border-primary-400 tw-bg-primary-400/20"
                : "tw-border-iron-600 tw-bg-iron-800"
            } tw-cursor-pointer tw-shadow-sm tw-transition-all tw-duration-200 hover:tw-shadow-md`}
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

        <div className="tw-relative tw-min-h-[106px] tw-min-w-[106px] tw-flex-shrink-0 tw-overflow-hidden tw-bg-iron-800 @xs:tw-h-56 @xs:tw-w-full @sm:tw-mb-2 @sm:tw-h-56 @sm:tw-w-full @md:tw-size-[106px]">
          <div className="tw-relative tw-flex tw-h-full tw-w-full tw-transform tw-items-center tw-justify-center tw-duration-300 tw-ease-out desktop-hover:hover:tw-scale-105">
            <div className="tw-absolute tw-inset-0 tw-z-[1]">
              {artWork && (
                <MediaDisplay
                  media_mime_type={artWork.mime_type}
                  media_url={artWork.url}
                  imageScale={ImageScale.AUTOx450}
                  previewImageUrl={previewImageUrl}
                  disableMediaInteraction={true}
                />
              )}
            </div>
          </div>
        </div>

        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <MediaTypeBadge
                mimeType={artWork?.mime_type}
                dropId={drop.id}
                size="sm"
              />
              <h3 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
                {drop.title}
              </h3>
            </div>
            {drop.rank && <SingleWaveDropPosition rank={drop.rank} />}
          </div>
          <div className="tw-mt-4 tw-flex tw-items-center tw-gap-2">
            <div className="tw-relative tw-size-6 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-white/10">
              {drop.author.pfp ? (
                <img
                  src={drop.author.pfp}
                  alt="Profile"
                  className="tw-h-full tw-w-full tw-bg-iron-800 tw-object-contain"
                />
              ) : (
                <div className="tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-white/10"></div>
              )}
            </div>
            <UserCICAndLevel
              level={drop.author.level || 0}
              size={UserCICAndLevelSize.SMALL}
            />
            <UserProfileTooltipWrapper
              user={drop.author.handle ?? drop.author.id}
            >
              <Link
                href={`/${drop.author.handle}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(`/${drop.author.handle}`, "_blank");
                }}
                className="tw-truncate tw-text-md tw-font-medium tw-text-iron-200 tw-no-underline tw-transition-colors tw-duration-200 desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
              >
                {drop.author.handle}
              </Link>
            </UserProfileTooltipWrapper>
          </div>
          <div className="tw-mt-3.5 tw-flex tw-flex-col tw-justify-between tw-gap-4 @lg:tw-flex-col @[42rem]:tw-flex-row xl:tw-mt-3">
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
                            className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                            src={voter.profile.pfp}
                            alt="Recent voter"
                          />
                        ) : (
                          <div className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800" />
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
                        {voter.profile.handle} -{" "}
                        {formatNumberWithCommas(voter.rating)}
                      </Tooltip>
                    </React.Fragment>
                  ))}
                </div>
                <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
                  {formatNumberWithCommas(drop.raters_count)}{" "}
                  <span className="tw-font-normal tw-text-iron-500">
                    {drop.raters_count === 1 ? "voter" : "voters"}
                  </span>
                </span>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <MyStreamWaveMyVoteInput drop={drop} isResetting={isResetting} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStreamWaveMyVote;
