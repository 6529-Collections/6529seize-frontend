"use client";

import {
  ChevronRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

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
  icon?: ComponentType<{ className?: string | undefined }>;
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
}): string =>
  getWaveRoute({
    waveId: wave.id,
    isDirectMessage: isHeaderSearchWaveDirectMessage(wave),
    isApp,
  });

export const getNftCollectionMap = () => ({
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
});

const isPageResult = (
  content: HeaderSearchModalItemType
): content is PageSearchResult => "type" in content;

const isNftResult = (
  content: HeaderSearchModalItemType
): content is NFTSearchResult => "contract" in content;

const isProfileResult = (
  content: HeaderSearchModalItemType
): content is CommunityMemberMinimal => "wallet" in content;

const isWaveResult = (content: HeaderSearchModalItemType): content is ApiWave =>
  "serial_no" in content;

const renderHighlightedText = (text: string, query: string): ReactNode => {
  const needle = query.trim();
  if (!needle) return text;

  const normalizedText = text.toLocaleLowerCase();
  const normalizedNeedle = needle.toLocaleLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = normalizedText.indexOf(normalizedNeedle, cursor);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) parts.push(text.slice(cursor, matchIndex));
    const matchEnd = matchIndex + needle.length;
    parts.push(
      <mark
        key={`match-${matchIndex}`}
        className="tw-rounded-sm tw-bg-primary-400/20 tw-px-0.5 tw-text-inherit"
      >
        {text.slice(matchIndex, matchEnd)}
      </mark>
    );
    cursor = matchEnd;
    matchIndex = normalizedText.indexOf(normalizedNeedle, cursor);
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};

export default function HeaderSearchModalItem({
  content,
  searchValue,
  isSelected,
  optionId,
  onHover,
  onClose,
  onWaveSelect,
}: {
  readonly isSelected: boolean;
  readonly searchValue: string;
  readonly optionId?: string | undefined;
  readonly content: HeaderSearchModalItemType;
  readonly onHover: (state: boolean) => void;
  readonly onClose: () => void;
  readonly onWaveSelect?: (wave: ApiWave) => void;
}) {
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();

  const getMediaIcon = (
    Icon: ComponentType<{ className?: string | undefined }>
  ) => (
    <div className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900">
      <Icon className="tw-h-5 tw-w-5" />
    </div>
  );

  const getMedia = () => {
    if (isProfileResult(content)) {
      return <HeaderSearchModalPfp level={content.level} src={content.pfp} />;
    }
    if (isNftResult(content)) {
      return <HeaderSearchModalItemMedia nft={content} />;
    }
    if (isPageResult(content)) {
      return getMediaIcon(content.icon ?? DocumentTextIcon);
    }
    if (content.picture) {
      return (
        <HeaderSearchModalItemMedia
          src={content.picture}
          alt={content.name}
          roundedFull
        />
      );
    }
    return getMediaIcon(
      isHeaderSearchWaveDirectMessage(content) ? ChatBubbleIcon : WavesIcon
    );
  };

  const getPath = (): string => {
    if (isProfileResult(content)) {
      return getProfileTargetRoute({
        handleOrWallet: content.handle ?? content.wallet.toLowerCase(),
        pathname,
        defaultPath: USER_PAGE_TAB_IDS.REP,
      });
    }
    if (isNftResult(content)) {
      const collection = getNftCollectionMap()[content.contract.toLowerCase()];
      return collection ? `${collection.path}/${content.id}` : "#";
    }
    if (isPageResult(content)) return content.href;
    return getHeaderSearchWavePath({ wave: content, isApp });
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isWaveResult(content) || !onWaveSelect || event.defaultPrevented) {
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
    onWaveSelect(content);
  };

  const getPrimaryText = (): string => {
    if (isProfileResult(content)) return content.handle ?? "-";
    if (isNftResult(content)) return content.name;
    if (isPageResult(content)) return content.title;
    return content.name;
  };

  const getSecondaryText = (): string => {
    if (isProfileResult(content)) {
      return `TDH: ${formatStatFloor(content.tdh)} - Level: ${content.level}`;
    }
    if (isNftResult(content)) {
      const collection = getNftCollectionMap()[content.contract.toLowerCase()];
      return `${collection?.title ?? "NFT"} #${content.id}`;
    }
    if (isPageResult(content)) {
      return content.breadcrumbs.length > 0
        ? content.breadcrumbs.join(" • ")
        : content.href;
    }
    const authorCandidate = (content as Partial<ApiWave>).author;
    const author =
      authorCandidate?.handle ?? authorCandidate?.primary_address ?? null;
    return author ? `by ${author}` : `Wave #${content.serial_no}`;
  };

  const primaryText = getPrimaryText();
  const secondaryText = getSecondaryText();
  const secondaryClassName = isWaveResult(content)
    ? "tw-text-xs tw-text-iron-500"
    : "tw-text-sm tw-text-iron-400";

  return (
    <div
      onMouseEnter={() => onHover(true)}
      className={`${
        isSelected
          ? "tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-primary-400/30"
          : "desktop-hover:hover:tw-bg-iron-900"
      } tw-w-full tw-rounded-lg tw-transition tw-duration-150 tw-ease-out`}
    >
      <Link
        id={optionId}
        role="option"
        aria-selected={isSelected}
        tabIndex={-1}
        href={getPath()}
        onClick={handleClick}
        className="tw-group tw-flex tw-min-h-14 tw-w-full tw-min-w-0 tw-select-none tw-items-center tw-gap-3 tw-rounded-lg tw-px-2.5 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-no-underline focus:tw-outline-none"
      >
        {getMedia()}
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-0.5">
          <span
            className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-text-white"
            title={primaryText}
          >
            {renderHighlightedText(primaryText, searchValue)}
          </span>
          <span
            className={`tw-min-w-0 tw-truncate ${secondaryClassName}`}
            title={secondaryText}
          >
            {renderHighlightedText(secondaryText, searchValue)}
          </span>
        </div>
        <ChevronRightIcon
          className={`tw-size-4 tw-flex-shrink-0 tw-transition tw-duration-150 ${
            isSelected
              ? "tw-translate-x-0 tw-text-primary-300"
              : "-tw-translate-x-1 tw-text-iron-600 group-hover:tw-translate-x-0 group-hover:tw-text-iron-300"
          }`}
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}
