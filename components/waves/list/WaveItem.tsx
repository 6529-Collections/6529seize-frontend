"use client";

import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useId,
} from "react";
import { Tooltip } from "react-tooltip";

import type { ApiWave } from "@/generated/models/ApiWave";
import { getRandomColorWithSeed, numberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";

import WaveItemDropped from "./WaveItemDropped";
import WaveItemFollow from "./WaveItemFollow";

import type {
  KeyboardEvent,
  MouseEvent,
  ReactNode} from "react";

const LEVEL_CLASSES: ReadonlyArray<{
  readonly minLevel: number;
  readonly classes: string;
}> = [
  { minLevel: 80, classes: "tw-text-[#55B075] tw-ring-[#55B075]" },
  { minLevel: 60, classes: "tw-text-[#AABE68] tw-ring-[#AABE68]" },
  { minLevel: 40, classes: "tw-text-[#DAC660] tw-ring-[#DAC660]" },
  { minLevel: 20, classes: "tw-text-[#DAAC60] tw-ring-[#DAAC60]" },
  { minLevel: 0, classes: "tw-text-[#DA8C60] tw-ring-[#DA8C60]" },
];

const DEFAULT_LEVEL_CLASS = LEVEL_CLASSES.at(-1)?.classes ?? "";
const CARD_BASE_CLASSES =
  "tw-@container/wave tw-group tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-950 tw-backdrop-blur-sm tw-shadow-sm tw-shadow-black/20 tw-transition-all tw-duration-300 tw-ease-out";
const CARD_INTERACTIVE_CLASSES =
  "tw-cursor-pointer desktop-hover:hover:tw-shadow-lg desktop-hover:hover:tw-shadow-black/40 desktop-hover:hover:tw-translate-y-[-1px] focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900 focus-visible:tw-outline-none";

const INTERACTIVE_TAGS = new Set([
  "A",
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "LABEL",
]);

const shouldSkipNavigation = (
  target: HTMLElement | null,
  root: HTMLElement
): boolean => {
  let current: HTMLElement | null = target;

  while (current) {
    if (current === root) {
      break;
    }

    if (current.dataset?.["waveItemInteractive"] === "true") {
      return true;
    }

    if (INTERACTIVE_TAGS.has(current.tagName)) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
};

type CardContainerProps = {
  readonly isInteractive: boolean;
  readonly href?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly children: ReactNode;
  readonly onClick?:
    | ((event: MouseEvent<HTMLAnchorElement>) => void)
    | undefined;
  readonly onKeyDown?:
    | ((event: KeyboardEvent<HTMLAnchorElement>) => void)
    | undefined;
};

function CardContainer({
  isInteractive,
  href,
  ariaLabel,
  onClick,
  onKeyDown,
  children,
}: CardContainerProps) {
  const className = `${CARD_BASE_CLASSES} ${
    isInteractive ? CARD_INTERACTIVE_CLASSES : ""
  } tw-no-underline`;

  if (isInteractive && href) {
    return (
      <Link
        href={href}
        prefetch={false}
        className={className}
        aria-label={ariaLabel}
        {...(onClick ? { onClick } : {})}
        onKeyDown={onKeyDown}
      >
        {children}
      </Link>
    );
  }

  return (
    <div className={className} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

function getCardLabel(href?: string, label?: string | null) {
  if (!href) {
    return undefined;
  }
  return label ? `View wave ${label}` : "View wave";
}

function resolveLevelClasses(level?: number | null) {
  return (
    LEVEL_CLASSES.find((levelClass) => levelClass.minLevel <= (level ?? 0))
      ?.classes ?? DEFAULT_LEVEL_CLASS
  );
}

export default function WaveItem({
  wave,
  userPlaceholder,
  titlePlaceholder,
}: {
  readonly wave?: ApiWave | undefined;
  readonly userPlaceholder?: string | undefined;
  readonly titlePlaceholder?: string | undefined;
}) {
  const router = useRouter();
  const author = wave?.author;
  const authorHref = author?.handle ? `/${author.handle}` : undefined;
  const authorLevel = author?.level ?? 0;
  const tooltipBaseId = useId();

  const banner1 =
    author?.banner1_color ??
    getRandomColorWithSeed(author?.handle ?? userPlaceholder ?? "");

  const banner2 =
    author?.banner2_color ??
    getRandomColorWithSeed(author?.handle ?? userPlaceholder ?? "");

  const isDirectMessage = wave?.chat?.scope?.group?.is_direct_message ?? false;

  const waveHref = wave
    ? getWaveRoute({
        waveId: wave.id,
        isDirectMessage,
        isApp: false,
      })
    : undefined;

  const labelValue = wave?.name ?? wave?.id;
  const cardLabel = getCardLabel(waveHref, labelValue);
  const isInteractive = Boolean(waveHref);
  const followersTooltipId = wave ? `${tooltipBaseId}-followers` : undefined;

  const followersContent = (
    <>
      <UserGroupIcon
        aria-hidden="true"
        className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400"
      />
      <span className="tw-font-medium">
        {numberWithCommas(wave?.metrics.subscribers_count ?? 0)}
      </span>
      <span className="tw-text-iron-400 xl:tw-hidden">Joined</span>
    </>
  );

  const authorAvatar = author?.pfp ? (
    <img
      className="tw-h-full tw-w-full tw-rounded-md tw-object-cover tw-bg-iron-800 tw-ring-1 tw-ring-white/10 desktop-hover:group-hover/author:tw-ring-white/30 desktop-hover:group-hover/author:tw-ring-offset-1 desktop-hover:group-hover/author:tw-ring-offset-iron-950 tw-transition tw-duration-300 tw-ease-out"
      src={getScaledImageUri(author.pfp, ImageScale.W_200_H_200)}
      alt={author?.handle ? `${author.handle} avatar` : "Author avatar"}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div className="tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-white/10" />
  );

  const authorLevelBadge = (
    <div
      className={`${resolveLevelClasses(
        author?.level
      )} tw-border-none tw-inline-flex tw-items-center tw-rounded-xl tw-bg-transparent tw-px-2 tw-py-1 tw-font-semibold tw-ring-2 tw-ring-inset tw-text-[0.625rem] tw-leading-3 tw-whitespace-nowrap`}
    >
      Level {authorLevel}
    </div>
  );

  const authorWrapperClass =
    "tw-group/author tw-flex tw-items-center tw-transition-opacity hover:tw-opacity-80";
  const linkedAuthorNameClass =
    "tw-text-sm tw-font-bold tw-text-white tw-truncate tw-min-w-0";
  const staticAuthorNameClass =
    "tw-text-sm tw-font-bold tw-text-white tw-truncate tw-min-w-0";

  const handleAuthorClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!authorHref) {
        return;
      }
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        window.open(authorHref, "_blank", "noopener,noreferrer");
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      router.push(authorHref);
    },
    [authorHref, router]
  );

  const handleAuthorAuxClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!authorHref || event.button !== 1) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      window.open(authorHref, "_blank", "noopener,noreferrer");
    },
    [authorHref]
  );

  let authorSection: ReactNode;
  if (!wave) {
    authorSection = (
      <span className="tw-group/author tw-flex tw-items-center tw-transition-opacity hover:tw-opacity-80">
        <div className="tw-h-8 tw-w-8 tw-relative tw-flex-shrink-0 tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700 tw-mr-3" />
        <span className="tw-text-sm tw-font-bold tw-text-white tw-truncate tw-max-w-[120px]">
          {userPlaceholder}
        </span>
      </span>
    );
  } else if (authorHref) {
    authorSection = (
      <button
        type="button"
        data-wave-item-interactive="true"
        onClick={handleAuthorClick}
        onAuxClick={handleAuthorAuxClick}
        className={`${authorWrapperClass} tw-cursor-pointer tw-bg-transparent tw-border-none tw-p-0 tw-text-left tw-relative tw-z-10 tw-min-w-0 tw-w-fit`}
        aria-label={
          author?.handle ? `View @${author.handle}` : "View author profile"
        }
      >
        <div className="tw-h-8 tw-w-8 tw-relative tw-flex-shrink-0 tw-mr-3">
          {authorAvatar}
        </div>
        <span className={linkedAuthorNameClass}>
          {author?.handle ?? userPlaceholder}
        </span>
        <div className="tw-ml-1.5 tw-flex tw-items-center">
          {authorLevelBadge}
        </div>
      </button>
    );
  } else {
    authorSection = (
      <div className={`${authorWrapperClass} tw-min-w-0`}>
        <div className="tw-h-8 tw-w-8 tw-relative tw-flex-shrink-0 tw-mr-3">
          {authorAvatar}
        </div>
        <span className={staticAuthorNameClass}>
          {author?.handle ?? userPlaceholder}
        </span>
        <div className="tw-ml-1.5 tw-flex tw-items-center">
          {authorLevelBadge}
        </div>
      </div>
    );
  }

  const handleCardClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!waveHref) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (shouldSkipNavigation(target, event.currentTarget)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.button === 1 || event.metaKey || event.ctrlKey) {
        return;
      }
      if (!event.defaultPrevented) {
        event.preventDefault();
        router.push(waveHref);
      }
    },
    [router, waveHref]
  );

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (!waveHref || event.target !== event.currentTarget) {
        return;
      }
      if (event.key === "Enter" || event.key === " " || event.key === "Space") {
        event.preventDefault();
        router.push(waveHref);
      }
    },
    [router, waveHref]
  );
  return (
    <CardContainer
      isInteractive={isInteractive}
      href={waveHref}
      ariaLabel={cardLabel}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="tw-relative tw-overflow-hidden tw-rounded-t-xl tw-aspect-[16/8.5] sm:tw-aspect-[16/9] tw-border tw-border-solid tw-border-b-0 tw-border-white/[0.003]">
        <div
          className="tw-absolute tw-inset-0 tw-rounded-xl"
          style={{
            background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
            opacity: wave?.picture ? 0.35 : 1,
          }}
        />
        {wave?.picture && (
          <img
            src={getScaledImageUri(wave.picture, ImageScale.AUTOx450)}
            alt={wave?.name ? `Wave ${wave.name}` : "Wave picture"}
            loading="lazy"
            decoding="async"
            className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-cover tw-transition-transform tw-duration-500 tw-will-change-transform desktop-hover:group-hover:tw-scale-[1.015]"
          />
        )}
        <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-t tw-from-black/90 tw-via-black/40 tw-to-transparent" />
        <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-flex tw-items-end tw-justify-between tw-gap-3">
          <div className="tw-flex tw-min-w-0 tw-items-end tw-px-4 tw-pb-5">
            <div className="tw-min-w-0">
              <span className="tw-text-base sm:tw-text-lg tw-font-bold tw-text-white tw-leading-tight tw-drop-shadow-lg tw-line-clamp-2">
                {wave?.name ?? titlePlaceholder}
              </span>
            </div>
          </div>
          <div className="tw-hidden sm:tw-block" />
        </div>
      </div>

      <div className="tw-p-4 tw-gap-3 tw-flex tw-flex-col">
        <div className="tw-flex tw-flex-col tw-gap-y-4 @[380px]/wave:tw-flex-row @[380px]/wave:tw-items-center @[380px]/wave:tw-justify-between @[380px]/wave:tw-gap-2">
          {authorSection}

          <div className="tw-flex tw-items-center tw-gap-4 tw-flex-shrink-0">
            <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-iron-400">
              <ChatBubbleLeftRightIcon
                aria-hidden="true"
                className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400"
              />
              <span className="tw-font-medium">Chat</span>
            </div>

            {waveHref && followersTooltipId ? (
              <span
                className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-no-underline tw-relative tw-z-20 tw-pointer-events-auto"
                data-tooltip-id={followersTooltipId}
              >
                {followersContent}
              </span>
            ) : (
              <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs">
                {followersContent}
              </div>
            )}
          </div>

          {wave && followersTooltipId && (
            <Tooltip
              id={followersTooltipId}
              place="top"
              positionStrategy="fixed"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
                zIndex: 50,
              }}
            >
              <span className="tw-text-xs">Joined</span>
            </Tooltip>
          )}
        </div>

        <div className="tw-w-full tw-h-px tw-bg-white/5 tw-my-1"></div>

        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
          <div className="tw-min-w-0 tw-flex-1">
            {wave && (
              <div className="tw-overflow-hidden tw-min-w-0">
                <WaveItemDropped wave={wave} />
              </div>
            )}
          </div>

          <div className="tw-flex tw-items-center">
            {wave && (
              <div
                data-wave-item-interactive="true"
                className="tw-relative tw-z-20 tw-pointer-events-auto"
              >
                <WaveItemFollow wave={wave} />
              </div>
            )}
          </div>
        </div>
      </div>
    </CardContainer>
  );
}
