import { useHoverDirty } from "react-use";
import { CommunityMemberMinimal } from "../../../entities/IProfile";
import {
  cicToType,
  formatNumberWithCommas,
  getProfileTargetRoute,
} from "../../../helpers/Helpers";
import { useEffect, useRef } from "react";
import SearchProfileModalItemHighlight from "./SearchProfileModalItemHighlight";
import UserCICAndLevel from "../../user/utils/UserCICAndLevel";
import { useRouter } from "next/router";
import { UserPageTabType } from "../../user/layout/UserPageTabs";
import Link from "next/link";
import { MemeLite } from "../../user/settings/UserSettingsImgSelectMeme";
import Image from "next/image";

export type SearchProfileModalItemType = CommunityMemberMinimal | MemeLite;

export default function SearchProfileModalItem({
  content,
  searchValue,
  isSelected,
  onHover,
  onClose,
}: {
  readonly isSelected: boolean;
  readonly searchValue: string;
  readonly content: SearchProfileModalItemType;
  readonly onHover: (state: boolean) => void;
  readonly onClose: () => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const isHovering = useHoverDirty(ref);

  const isProfile = () => {
    return content.hasOwnProperty("handle");
  };

  const getProfile = () => {
    return content as CommunityMemberMinimal;
  };

  const getMeme = () => {
    return content as MemeLite;
  };

  const getMedia = () => {
    if (isProfile()) {
      const profile = getProfile();
      const cicType = cicToType(profile.cic_rating);
      return <UserCICAndLevel level={profile.level} cicType={cicType} />;
    } else {
      const meme = getMeme();
      const imgSrc = meme.icon ?? meme.thumbnail ?? meme.scaled ?? meme.image;
      if (!imgSrc) {
        return <></>;
      }
      return (
        <Image
          priority
          loading="eager"
          width={0}
          height={25}
          style={{ height: "25px", width: "auto" }}
          src={imgSrc}
          alt={meme.name ?? `Meme ${meme.id}`}
        />
      );
    }
  };

  useEffect(() => {
    onHover(isHovering);
  }, [isHovering]);

  const getPath = () => {
    if (isProfile()) {
      const profile = getProfile();
      return getProfileTargetRoute({
        handleOrWallet: profile.handle ?? profile.wallet.toLowerCase(),
        router,
        defaultPath: UserPageTabType.IDENTITY,
      });
    } else {
      return `/the-memes/${getMeme().id}`;
    }
  };

  const getPrimaryText = () => {
    if (isProfile()) {
      return getProfile().handle ?? "-";
    } else {
      const meme = getMeme();
      const name = meme.name ?? `Meme ${meme.id}`;
      return `#${meme.id} - ${name}`;
    }
  };

  const getSecondaryText = () => {
    if (isProfile()) {
      return getProfile().display ?? "";
    } else {
      return `by ${getMeme().artist}` ?? `-`;
    }
  };

  return (
    <div
      ref={ref}
      className={`${
        isSelected ? "tw-bg-iron-800" : ""
      } tw-rounded-md tw-px-2 tw-py-2 tw-my-1 tw-transition tw-duration-300 tw-ease-out tw-w-full`}>
      <Link
        href={getPath()}
        onClick={onClose}
        className="tw-group tw-no-underline tw-select-none tw-rounded-md tw-space-x-3 tw-flex tw-items-center tw-w-full tw-text-left tw-text-sm tw-font-medium">
        {getMedia()}
        <div className="tw-w-full">
          <div className="tw-inline-flex tw-justify-between tw-w-full">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
              <SearchProfileModalItemHighlight
                text={getPrimaryText()}
                highlight={searchValue}
              />
            </span>
            {isProfile() && !!getProfile().tdh && (
              <span className="tw-inline-flex tw-items-center tw-gap-x-1 tw-text-sm tw-font-medium tw-text-iron-100">
                {formatNumberWithCommas(getProfile().tdh)}{" "}
                <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                  TDH
                </span>
              </span>
            )}
          </div>
          <p className="tw-break-all tw-mb-0 tw-text-sm tw-text-iron-400">
            <SearchProfileModalItemHighlight
              text={getSecondaryText()}
              highlight={searchValue}
            />
          </p>
        </div>
      </Link>
    </div>
  );
}
