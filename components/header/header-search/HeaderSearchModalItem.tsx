"use client";

import { DocumentTextIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, useEffect, useRef } from "react";
import { useHoverDirty } from "react-use";
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
} from "@/constants/constants";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import { formatStatFloor, getProfileTargetRoute } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
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
  searchTerms?: string[];
  icon?: ComponentType<{ className?: string | undefined }> | undefined;
}

export type HeaderSearchModalItemType =
  | CommunityMemberMinimal
  | NFTSearchResult
  | ApiWave
  | PageSearchResult;

type HeaderSearchWaveDirectMessageCandidate = {
  readonly chat?: {
    readonly scope?: {
      readonly group?: {
        readonly is_direct_message?: boolean | null | undefined;
      } | null;
    } | null;
  } | null;
};

export const isHeaderSearchWaveDirectMessage = (wave: ApiWave): boolean =>
  Boolean(
    (wave as HeaderSearchWaveDirectMessageCandidate).chat?.scope?.group
      ?.is_direct_message
  );

export const getHeaderSearchWavePath = ({
  wave,
  isApp,
}: {
  readonly wave: ApiWave;
  readonly isApp: boolean;
}): string => {
  const isDirectMessage = isHeaderSearchWaveDirectMessage(wave);

  return getWaveRoute({
    waveId: wave.id,
    isDirectMessage,
    isApp,
  });
};

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
  onWaveSelect,
}: {
  readonly isSelected: boolean;
  readonly searchValue: string;
  readonly content: HeaderSearchModalItemType;
  readonly onHover: (state: boolean) => void;
  readonly onClose: () => void;
  readonly onWaveSelect?: (wave: ApiWave) => void;
}) {
  const pathname = usePathname();
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
  const isWave = () => Object.hasOwn(content, "serial_no");
  const getWave = () => content as ApiWave;

  const getProfile = () => content as CommunityMemberMinimal;
  const getNft = () => content as NFTSearchResult;
  const getPage = () => content as PageSearchResult;

  const getMediaIcon = (
    Icon: ComponentType<{ className?: string | undefined }>
  ) => {
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
    } else if (isWave()) {
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

    return getMediaIcon(DocumentTextIcon);
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
        defaultPath: USER_PAGE_TAB_IDS.REP,
      });
    } else if (isNft()) {
      const nft = getNft();
      const collectionMap = getNftCollectionMap();
      const key = nft.contract.toLowerCase();
      return `${collectionMap[key]?.path}/${nft.id}`;
    } else if (isPage()) {
      return getPage().href;
    } else if (isWave()) {
      const wave = getWave();
      return getHeaderSearchWavePath({
        wave,
        isApp,
      });
    }

    return "#";
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isWave() || !onWaveSelect || event.defaultPrevented) {
      onClose();
      return;
    }

    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button === 1 ||
      event.button === 2
    ) {
      onClose();
      return;
    }

    event.preventDefault();
    onWaveSelect(getWave());
  };

  const getPrimaryText = () => {
    if (isProfile()) {
      return getProfile().handle ?? "-";
    } else if (isNft()) {
      return getNft().name;
    } else if (isPage()) {
      return getPage().title;
    } else if (isWave()) {
      return getWave().name;
    }

    return "-";
  };

  const getSecondaryText = () => {
    if (isProfile()) {
      const profile = getProfile();
      return `TDH: ${formatStatFloor(profile.tdh)} - Level: ${profile.level}`;
    } else if (isNft()) {
      const nft = getNft();
      const collectionMap = getNftCollectionMap();
      const key = nft.contract.toLowerCase();
      return `${collectionMap[key]?.title} #${nft.id}`;
    } else if (isPage()) {
      const page = getPage();
      if (page.breadcrumbs.length > 0) {
        return page.breadcrumbs.join(" • ");
      }
      return page.href;
    } else if (isWave()) {
      const wave = getWave();
      const author = wave.author?.handle ?? wave.author?.primary_address;
      return author ? `by ${author}` : `Wave #${wave.serial_no}`;
    }

    return null;
  };

  const getSecondaryTextClassName = () => {
    const baseClassName =
      "tw-mb-0 tw-min-w-0 tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap";

    if (isWave()) {
      return `${baseClassName} tw-text-xs tw-text-iron-500`;
    }

    return `${baseClassName} tw-text-sm tw-text-iron-400`;
  };

  const primaryText = getPrimaryText();
  const secondaryText = getSecondaryText();
  const primaryTextClassName = `tw-min-w-0 tw-flex-1 tw-font-semibold tw-text-white ${
    isWave() ? "tw-text-base" : "tw-text-sm"
  }`;

  return (
    <div
      ref={ref}
      className={`${
        isSelected ? "tw-bg-iron-800" : ""
      } tw-my-1 tw-w-full tw-rounded-lg tw-px-2 tw-py-2 tw-transition tw-duration-300 tw-ease-out`}
    >
      <Link
        href={getPath()}
        onClick={handleClick}
        className="tw-group tw-flex tw-w-full tw-min-w-0 tw-select-none tw-items-center tw-gap-3 tw-text-left tw-text-sm tw-font-medium tw-no-underline"
      >
        {getMedia()}
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
            <span className={primaryTextClassName} title={primaryText}>
              <span className="tw-block tw-min-w-0 tw-truncate">
                {primaryText}
              </span>
            </span>
          </div>
          {secondaryText && (
            <p className={getSecondaryTextClassName()} title={secondaryText}>
              {secondaryText}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
