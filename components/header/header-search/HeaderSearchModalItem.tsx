"use client";

import { useHoverDirty } from "react-use";
import { CommunityMemberMinimal } from "@/entities/IProfile";
import {
  cicToType,
  formatNumberWithCommas,
  getProfileTargetRoute,
} from "@/helpers/Helpers";
import { useEffect, useRef } from "react";
import HeaderSearchModalItemHighlight from "./HeaderSearchModalItemHighlight";
import UserCICAndLevel from "@/components/user/utils/UserCICAndLevel";
import { usePathname, useSearchParams } from "next/navigation";
import { UserPageTabType } from "@/components/user/layout/UserPageTabs";
import Link from "next/link";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants";
import {
  NEXTGEN_CORE,
  NEXTGEN_CHAIN_ID,
} from "@/components/nextGen/nextgen_contracts";
import HeaderSearchModalItemMedia from "./HeaderSearchModalItemMedia";
import type { ApiWave } from "@/generated/models/ApiWave";

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
  | NFTSearchResult
  | ApiWave;

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);
  const isHovering = useHoverDirty(ref as React.RefObject<HTMLDivElement>);

  const supportsHover =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(hover: hover)").matches;

  const isProfile = () => content.hasOwnProperty("handle");
  const isNft = () => content.hasOwnProperty("contract");
  const getWave = () => content as ApiWave;

  const getProfile = () => content as CommunityMemberMinimal;
  const getNft = () => content as NFTSearchResult;

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
    } else if (isNft()) {
      const nft = getNft();
      return <HeaderSearchModalItemMedia nft={nft} />;
    } else {
      const wave = getWave();
      return (
        <HeaderSearchModalItemMedia
          src={wave.picture}
          alt={wave.name}
          roundedFull
        />
      );
    }
  };

  useEffect(() => {
    if (supportsHover) {
      onHover(isHovering);
    }
  }, [isHovering, supportsHover]);

  const getPath = () => {
    if (isProfile()) {
      const profile = getProfile();
      return getProfileTargetRoute({
        handleOrWallet: profile.handle ?? profile.wallet.toLowerCase(),
        pathname: pathname ?? "",
        defaultPath: UserPageTabType.IDENTITY,
      });
    } else if (isNft()) {
      const nft = getNft();
      const collectionMap = getNftCollectionMap();
      return `${collectionMap[nft.contract].path}/${nft.id}`;
    } else {
      const wave = getWave();
      const currentWaveId = searchParams?.get("wave") as string | undefined;
      return currentWaveId === wave.id
        ? "/my-stream"
        : `/my-stream?wave=${wave.id}`;
    }
  };

  const getPrimaryText = () => {
    if (isProfile()) {
      return getProfile().handle ?? "-";
    } else if (isNft()) {
      return getNft().name;
    } else {
      return getWave().name;
    }
  };

  const getSecondaryText = () => {
    if (isProfile()) {
      return getProfile().display ?? "";
    } else if (isNft()) {
      const nft = getNft();
      const collectionMap = getNftCollectionMap();
      return `${collectionMap[nft.contract].title} #${nft.id}`;
    } else {
      const wave = getWave();
      return `Wave #${wave.serial_no}`;
    }
  };

  return (
    <div
      ref={ref}
      className={`${
        isSelected ? "tw-bg-iron-800" : ""
      } tw-rounded-lg tw-px-2 tw-py-2 tw-my-1 tw-transition tw-duration-300 tw-ease-out tw-w-full`}>
      <Link
        href={getPath()}
        onClick={onClose}
        className="tw-group tw-no-underline tw-select-none tw-rounded-md tw-space-x-3 tw-flex tw-items-center tw-w-full tw-text-left tw-text-sm tw-font-medium">
        {getMedia()}
        <div className="tw-w-full">
          <div className="tw-inline-flex tw-justify-between tw-w-full">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
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
