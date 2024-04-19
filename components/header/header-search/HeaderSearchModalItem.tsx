import { useHoverDirty } from "react-use";
import { CommunityMemberMinimal } from "../../../entities/IProfile";
import {
  cicToType,
  formatNumberWithCommas,
  getProfileTargetRoute,
} from "../../../helpers/Helpers";
import { useEffect, useRef } from "react";
import HeaderSearchModalItemHighlight from "./HeaderSearchModalItemHighlight";
import UserCICAndLevel from "../../user/utils/UserCICAndLevel";
import { useRouter } from "next/router";
import { UserPageTabType } from "../../user/layout/UserPageTabs";
import Link from "next/link";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../../../constants";
import {
  NEXTGEN_CORE,
  NEXTGEN_CHAIN_ID,
} from "../../nextGen/nextgen_contracts";
import HeaderSearchModalItemMedia from "./HeaderSearchModalItemMedia";

export interface NFTSearchResult {
  id: number;
  name: string;
  contract: string;
  icon_url: string;
  thumbnail_url: string;
  image_url: string;
}

export type HeaderSearchModalItemType =
  | CommunityMemberMinimal
  | NFTSearchResult;

export default function HeaderSearchModalItem({
  content,
  searchValue,
  isSelected,
  onHover,
  onClose,
}: {
  readonly isSelected: boolean;
  readonly searchValue: string;
  readonly content: HeaderSearchModalItemType;
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

  const getNft = () => {
    return content as NFTSearchResult;
  };

  const getNftCollectionMap = () => {
    return {
      [MEMES_CONTRACT.toLowerCase()]: {
        title: "The Memes",
        path: "/the-memes",
      },
      [MEMELAB_CONTRACT.toLowerCase()]: {
        title: "Meme Lab",
        path: "/meme-lab",
      },
      [GRADIENT_CONTRACT.toLowerCase()]: {
        title: "6529 Gradient",
        path: "/6529-gradient",
      },
      [NEXTGEN_CORE[NEXTGEN_CHAIN_ID].toLowerCase()]: {
        title: "NextGen",
        path: "/nextgen/token",
      },
    };
  };

  const getMedia = () => {
    if (isProfile()) {
      const profile = getProfile();
      const cicType = cicToType(profile.cic_rating);
      return <UserCICAndLevel level={profile.level} cicType={cicType} />;
    } else {
      const nft = getNft();
      return <HeaderSearchModalItemMedia nft={nft} />;
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
      const nft = getNft();
      const collectionMap = getNftCollectionMap();
      return `${collectionMap[nft.contract].path}/${nft.id}`;
    }
  };

  const getPrimaryText = () => {
    if (isProfile()) {
      return getProfile().handle ?? "-";
    } else {
      return getNft().name;
    }
  };

  const getSecondaryText = () => {
    if (isProfile()) {
      return getProfile().display ?? "";
    } else {
      const nft = getNft();
      const collectionMap = getNftCollectionMap();
      return `${collectionMap[nft.contract].title} #${nft.id}`;
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
              <HeaderSearchModalItemHighlight
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
            <HeaderSearchModalItemHighlight
              text={getSecondaryText()}
              highlight={searchValue}
            />
          </p>
        </div>
      </Link>
    </div>
  );
}
