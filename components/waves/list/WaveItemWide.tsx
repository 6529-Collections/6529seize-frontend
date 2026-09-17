"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useCallback, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getRandomColorWithSeed } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import WaveItemFollow from "./WaveItemFollow";

const CARD_BASE_CLASSES =
  "tw-@container/wave tw-group tw-relative tw-isolate tw-rounded-xl tw-border tw-border-solid tw-border-iron-700/70 tw-bg-iron-950 tw-shadow-sm tw-shadow-black/20 tw-transition-colors tw-duration-200";
const CARD_INTERACTIVE_CLASSES =
  "desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900/70";

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
  }`;

  return (
    <div className={className}>
      {isInteractive && href && (
        <Link
          href={href}
          prefetch={false}
          className="tw-absolute tw-inset-0 tw-rounded-xl focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
          aria-label={ariaLabel}
          {...(onClick ? { onClick } : {})}
          onKeyDown={onKeyDown}
        />
      )}
      <div className="tw-pointer-events-none tw-relative">{children}</div>
    </div>
  );
}

function getCardLabel(href?: string, label?: string | null) {
  if (!href) {
    return undefined;
  }
  return label ? `View wave ${label}` : "View wave";
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
  const locale = useBrowserLocale();
  const authorLevelId = useId();
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
      width={24}
      height={24}
      className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-object-cover tw-ring-1 tw-ring-white/10"
    />
  ) : (
    <div className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/10" />
  );

  const authorLevelBadge = (
    <div className="tw-inline-flex tw-flex-shrink-0">
      <span id={authorLevelId} className="tw-sr-only">
        {t(locale, "waves.preview.level", {
          level: formatInteger(locale, authorLevel),
        })}
      </span>
      <span aria-hidden="true" className="tw-inline-flex">
        <UserCICAndLevel level={authorLevel} size={UserCICAndLevelSize.SMALL} />
      </span>
    </div>
  );

  const authorWrapperClass =
    "tw-pointer-events-auto tw-relative tw-col-span-2 tw-row-start-2 tw-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-self-start";

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
      className={`${authorWrapperClass} tw-cursor-pointer tw-rounded-md tw-border-none tw-bg-transparent tw-p-0 tw-text-left tw-text-iron-200 tw-transition-colors focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-opacity-80`}
      aria-label={
        author?.handle ? `View @${author.handle}` : "View author profile"
      }
      aria-describedby={authorLevelId}
    >
      {authorAvatar}
      <span className="tw-truncate tw-text-sm tw-font-semibold tw-leading-5">
        {author?.handle ?? userPlaceholder}
      </span>
      {authorLevelBadge}
    </button>
  ) : (
    <div className={authorWrapperClass}>
      {authorAvatar}
      <span className="tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-200">
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
  const dropsMessageKey =
    new Intl.PluralRules(locale).select(dropsCount) === "one"
      ? "waves.preview.drops.one"
      : "waves.preview.drops.other";

  return (
    <CardContainer
      isInteractive={isInteractive}
      href={waveHref}
      ariaLabel={cardLabel}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-[13px] tw-p-2 @md/wave:tw-grid-cols-[auto_minmax(0,1fr)]">
        <div className="tw-relative tw-aspect-[4/3] tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 @md/wave:tw-aspect-auto @md/wave:tw-min-h-24 @md/wave:tw-w-36 @md/wave:tw-self-stretch">
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
              sizes="(max-width: 479px) 100vw, 430px"
              className="tw-object-cover"
            />
          )}
        </div>

        <div className="tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_auto] tw-gap-x-[13px] tw-gap-y-2 tw-p-[5px] @md/wave:tw-pl-0">
          <span className="tw-row-start-1 tw-line-clamp-3 tw-self-center tw-break-words tw-text-base tw-font-semibold tw-leading-6 tw-tracking-tight tw-text-iron-50 @md/wave:tw-text-lg">
            {wave?.name ?? titlePlaceholder}
          </span>
          {authorSection}

          {wave && (
            <>
              <div className="tw-col-span-2 tw-row-start-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-[13px] tw-gap-y-[5px] tw-text-xs tw-leading-5 tw-text-iron-400">
                <span className="tw-inline-flex tw-items-center tw-gap-[5px]">
                  <ChatBubbleLeftRightIcon
                    aria-hidden="true"
                    className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-400"
                  />
                  <span className="tw-inline-flex tw-gap-[5px]">
                    {tRich(locale, dropsMessageKey, {
                      count: (
                        <span
                          key="count"
                          className="tw-font-medium tw-tabular-nums tw-text-iron-200"
                        >
                          {formatInteger(locale, dropsCount)}
                        </span>
                      ),
                    })}
                  </span>
                </span>
                <span className="tw-inline-flex tw-items-center tw-gap-[5px]">
                  <UserGroupIcon
                    aria-hidden="true"
                    className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-400"
                  />
                  <span className="tw-inline-flex tw-gap-[5px]">
                    {tRich(locale, "waves.preview.joined", {
                      count: (
                        <span
                          key="count"
                          className="tw-font-medium tw-tabular-nums tw-text-iron-200"
                        >
                          {formatInteger(locale, subscribersCount)}
                        </span>
                      ),
                    })}
                  </span>
                </span>
              </div>
              <div
                data-wave-item-interactive="true"
                className="tw-pointer-events-auto tw-relative tw-col-start-2 tw-row-start-1 tw-self-center"
              >
                <WaveItemFollow wave={wave} />
              </div>
            </>
          )}
        </div>
      </div>
    </CardContainer>
  );
}
