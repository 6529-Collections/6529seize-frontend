"use client";

import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants";
import { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import { formatStatFloor, getProfileTargetRoute } from "@/helpers/Helpers";
import { getWaveHomeRoute, getWaveRoute } from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ComponentType } from "react";
import { useHoverDirty } from "react-use";
import HeaderSearchModalItemMedia from "./HeaderSearchModalItemMedia";
import HeaderSearchModalPfp from "./HeaderSearchModalPfp";

export interface NFTSearchResult {
  id: number;
  name: string;
  contract: string;
  icon_url: string;
  thumbnail_url: string;
  image_url: string;
}

export interface PageSearchResult {
  type: "PAGE";
  title: string;
  href: string;
  breadcrumbs: string[];
  icon?: ComponentType<{ className?: string }>;
}

export type HeaderSearchModalItemType =
  | CommunityMemberMinimal
  | NFTSearchResult
  | ApiWave
  | PageSearchResult;

export const getNftCollectionMap = () => {
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

export default function HeaderSearchModalItem({
  content,
  searchValue: _searchValue,
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
  const { isApp } = useDeviceInfo();

  const supportsHover =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(hover: hover)").matches;

  const isPage = () => (content as PageSearchResult).type === "PAGE";
  const isProfile = () => Object.hasOwn(content, "handle");
  const isNft = () => Object.hasOwn(content, "contract");
  const getWave = () => content as ApiWave;

  const getProfile = () => content as CommunityMemberMinimal;
  const getNft = () => content as NFTSearchResult;
  const getPage = () => content as PageSearchResult;

  const getMediaIcon = (Icon: ComponentType<{ className?: string }>) => {
    return (
      <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900">
        <Icon className="tw-h-5 tw-w-5" />
      </div>
    );
  };

  const getMedia = () => {
    if (isProfile()) {
      const profile = getProfile();
      return <HeaderSearchModalPfp level={profile.level} src={profile.pfp} />;
    } else if (isNft()) {
      const nft = getNft();
      return <HeaderSearchModalItemMedia nft={nft} />;
    } else if (isPage()) {
      const page = getPage();
      const Icon = page.icon ?? DocumentTextIcon;
      return getMediaIcon(Icon);
    } else {
      const wave = getWave();
      if (wave.picture) {
        return (
          <HeaderSearchModalItemMedia
            src={wave.picture}
            alt={wave.name}
            roundedFull
          />
        );
      }
      const isDm = wave.wave.admin_group.group?.is_direct_message;
      if (isDm) {
        return getMediaIcon(ChatBubbleIcon);
      }
      return getMediaIcon(WavesIcon);
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
        defaultPath: USER_PAGE_TAB_IDS.IDENTITY,
      });
    } else if (isNft()) {
      const nft = getNft();
      const collectionMap = getNftCollectionMap();
      const key = nft.contract.toLowerCase();
      return `${collectionMap[key].path}/${nft.id}`;
    } else if (isPage()) {
      return getPage().href;
    } else {
      const wave = getWave();
      const currentWaveId = searchParams?.get("wave") ?? undefined;
      const isDirectMessage =
        wave.chat?.scope?.group?.is_direct_message ?? false;

      if (currentWaveId === wave.id) {
        return getWaveHomeRoute({
          isDirectMessage,
          isApp,
        });
      }

      return getWaveRoute({
        waveId: wave.id,
        isDirectMessage,
        isApp,
      });
    }
  };

  const getPrimaryText = () => {
    if (isProfile()) {
      return getProfile().handle ?? "-";
    } else if (isNft()) {
      return getNft().name;
    } else if (isPage()) {
      return getPage().title;
    } else {
      return getWave().name;
    }
  };

  const getSecondaryText = () => {
    if (isProfile()) {
      const profile = getProfile();
      return `TDH: ${formatStatFloor(profile.tdh)} - Level: ${profile.level}`;
    } else if (isNft()) {
      const nft = getNft();
      const collectionMap = getNftCollectionMap();
      const key = nft.contract.toLowerCase();
      return `${collectionMap[key].title} #${nft.id}`;
    } else if (isPage()) {
      const page = getPage();
      if (page.breadcrumbs.length > 0) {
        return page.breadcrumbs.join(" • ");
      }
      return page.href;
    } else {
      const wave = getWave();
      return `Wave #${wave.serial_no}`;
    }
  };

  const primaryText = getPrimaryText();
  const secondaryText = getSecondaryText();

  return (
    <div
      ref={ref}
      className={`${
        isSelected ? "tw-bg-iron-800" : ""
      } tw-rounded-lg tw-px-2 tw-py-2 tw-my-1 tw-transition tw-duration-300 tw-ease-out tw-w-full`}>
      <Link
        href={getPath()}
        onClick={onClose}
        className="tw-group tw-no-underline tw-select-none tw-flex tw-items-center tw-gap-3 tw-w-full tw-min-w-0 tw-text-left tw-text-sm tw-font-medium">
        {getMedia()}
        <div className="tw-flex-1 tw-min-w-0">
          <div className="tw-flex tw-items-center tw-gap-3 tw-min-w-0">
            <span
              className="tw-flex-1 tw-min-w-0 tw-text-sm tw-font-semibold tw-text-white"
              title={primaryText}>
              <span className="tw-block tw-truncate tw-min-w-0">
                {primaryText}
              </span>
            </span>
          </div>
          <p
            className="tw-mb-0 tw-text-sm tw-text-iron-400 tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-min-w-0"
            title={secondaryText || undefined}>
            {secondaryText}
          </p>
        </div>
      </Link>
    </div>
  );
}
