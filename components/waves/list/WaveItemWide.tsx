"use client";

import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { ApiWave } from "@/generated/models/ApiWave";
import { getRandomColorWithSeed, numberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";

import WaveItemFollow from "./WaveItemFollow";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

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
  "tw-@container/wave tw-group tw-rounded-xl tw-bg-iron-950 tw-backdrop-blur-sm tw-shadow-sm tw-shadow-black/20 tw-transition-all tw-duration-300 tw-ease-out";
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

    if (current.dataset["waveItemInteractive"] === "true") {
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

export default function WaveItemWide({
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

  const banner1 =
    author?.banner1_color ??
    getRandomColorWithSeed(author?.handle ?? userPlaceholder ?? "");

  const banner2 =
    author?.banner2_color ??
    getRandomColorWithSeed(author?.handle ?? userPlaceholder ?? "");

  const isDirectMessage = wave?.chat.scope.group?.is_direct_message ?? false;

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

  const authorAvatar = author?.pfp ? (
    <Image
      src={getScaledImageUri(author.pfp, ImageScale.W_200_H_200)}
      alt={`${author.handle ?? author.primary_address} avatar`}
      width={28}
      height={28}
      className="tw-h-7 tw-w-7 tw-rounded-md tw-bg-iron-800 tw-object-cover tw-ring-1 tw-ring-white/10"
    />
  ) : (
    <div className="tw-h-7 tw-w-7 tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-white/10" />
  );

  const authorLevelBadge = (
    <div
      className={`${resolveLevelClasses(
        author?.level
      )} tw-inline-flex tw-items-center tw-whitespace-nowrap tw-rounded-xl tw-border-none tw-bg-transparent tw-px-2 tw-py-0.5 tw-text-[0.625rem] tw-font-semibold tw-leading-3 tw-ring-2 tw-ring-inset`}
    >
      Level {authorLevel}
    </div>
  );

  const authorWrapperClass = "tw-flex tw-items-center tw-gap-2 tw-min-w-0";

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

  const authorSection = authorHref ? (
    <button
      type="button"
      data-wave-item-interactive="true"
      onClick={handleAuthorClick}
      onAuxClick={handleAuthorAuxClick}
      className={`${authorWrapperClass} tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-left`}
      aria-label={
        author?.handle ? `View @${author.handle}` : "View author profile"
      }
    >
      {authorAvatar}
      <span className="tw-truncate tw-text-xs tw-font-semibold tw-text-white">
        {author?.handle ?? userPlaceholder}
      </span>
      {authorLevelBadge}
    </button>
  ) : (
    <div className={authorWrapperClass}>
      {authorAvatar}
      <span className="tw-truncate tw-text-xs tw-font-semibold tw-text-white">
        {author?.handle ?? userPlaceholder}
      </span>
      {authorLevelBadge}
    </div>
  );

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
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.code === "Space"
      ) {
        event.preventDefault();
        router.push(waveHref);
      }
    },
    [router, waveHref]
  );

  const dropsCount = wave?.metrics.drops_count ?? 0;
  const subscribersCount = wave?.metrics.subscribers_count ?? 0;

  return (
    <CardContainer
      isInteractive={isInteractive}
      href={waveHref}
      ariaLabel={cardLabel}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="tw-flex tw-gap-3 tw-p-3 sm:tw-p-4">
        <div className="tw-relative tw-aspect-[4/3] tw-w-24 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 sm:tw-w-28 md:tw-w-32">
          <div
            className="tw-absolute tw-inset-0"
            style={{
              background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
              opacity: wave?.picture ? 0.35 : 1,
            }}
          />
          {wave?.picture && (
            <Image
              src={getScaledImageUri(wave.picture, ImageScale.AUTOx450)}
              alt={`Wave ${wave.name}`}
              fill
              sizes="(max-width: 639px) 96px, (max-width: 1023px) 112px, 128px"
              className="tw-object-cover tw-transition-transform tw-duration-500 tw-will-change-transform desktop-hover:group-hover:tw-scale-[1.02]"
            />
          )}
        </div>

        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-2">
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
            <span className="tw-line-clamp-2 tw-text-sm tw-font-bold tw-leading-tight tw-text-white sm:tw-text-base">
              {wave?.name ?? titlePlaceholder}
            </span>
            {wave && (
              <div
                data-wave-item-interactive="true"
                className="tw-pointer-events-auto tw-relative tw-z-10"
              >
                <WaveItemFollow wave={wave} />
              </div>
            )}
          </div>

          {authorSection}

          {wave && (
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-[11px] tw-text-iron-400">
              <span className="tw-inline-flex tw-items-center tw-gap-1">
                <ChatBubbleLeftRightIcon
                  aria-hidden="true"
                  className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-400"
                />
                <span className="tw-font-medium">
                  {numberWithCommas(dropsCount)}
                </span>
                <span className="tw-text-iron-500">
                  {dropsCount === 1 ? "Drop" : "Drops"}
                </span>
              </span>
              <span className="tw-inline-flex tw-items-center tw-gap-1">
                <UserGroupIcon
                  aria-hidden="true"
                  className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-400"
                />
                <span className="tw-font-medium">
                  {numberWithCommas(subscribersCount)}
                </span>
                <span className="tw-text-iron-500">Joined</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </CardContainer>
  );
}
