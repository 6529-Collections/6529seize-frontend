"use client";

import { AuthContext } from "@/components/auth/Auth";
import BoostIcon from "@/components/common/icons/BoostIcon";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropBoostMutation } from "@/hooks/drops/useDropBoostMutation";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import Image from "next/image";
import Link from "next/link";
import {
  memo,
  useCallback,
  useContext,
  useMemo,
  type MouseEvent as ReactMouseEvent,
} from "react";
import BoostedDropCardHomeContent from "./BoostedDropCardHomeContent";
import {
  getBoostedDropAuthorLabel,
  getBoostedDropBoostLabel,
  getBoostedDropOpenLabel,
} from "./boostedDropText";

type BoostedDropCardHomeVariant = "home" | "chat";

interface BoostedDropCardHomeProps {
  readonly drop: ApiDrop;
  readonly onClick?: () => void;
  readonly variant?: BoostedDropCardHomeVariant;
  readonly rank?: number;
}

const MAX_FIRE_ICONS = 5;
const HOME_CARD_CLASSES =
  "tw-group tw-relative tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/70 tw-p-0 tw-text-left tw-transition-all tw-duration-500 tw-ease-out hover:-tw-translate-y-1.5 hover:tw-shadow-[0_0_32px_-10px_rgba(255,255,255,0.12)]";
const CHAT_CARD_CLASSES =
  "tw-group tw-relative tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/80 tw-bg-iron-950/95 tw-p-0 tw-text-left tw-shadow-[0_14px_36px_-28px_rgba(0,0,0,0.85)] tw-transition-colors tw-duration-300 tw-ease-out hover:tw-border-iron-700 hover:tw-bg-iron-950";
const CLICKABLE_CARD_CLASS = "tw-cursor-pointer";
const CARD_BORDER_CLASSES =
  "tw-pointer-events-none tw-absolute tw-inset-0 tw-z-20 tw-rounded-xl tw-border tw-border-solid tw-border-white/5";
const HEADER_CLASSES =
  "tw-pointer-events-none tw-absolute tw-left-3 tw-right-3 tw-top-3 tw-z-30 tw-flex tw-flex-nowrap tw-items-center tw-justify-between tw-gap-2";
const CHAT_HEADER_CLASSES =
  "tw-pointer-events-none tw-relative tw-z-30 tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/80 tw-bg-iron-950/90 tw-px-4 tw-py-2.5";
const HEADER_LEFT_CLASSES =
  "tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-overflow-hidden";
const PILL_CLASSES =
  "tw-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-px-2.5 tw-py-1 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] tw-backdrop-blur-md tw-transition-colors group-hover:tw-bg-black/60";
const FOOTER_CLASSES =
  "tw-relative tw-z-30 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-900 tw-bg-black/70 tw-px-4 tw-py-3";
const PROFILE_LINK_CLASSES =
  "tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-2 tw-rounded-md tw-no-underline tw-transition-opacity desktop-hover:hover:tw-opacity-80 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const WAVE_LINK_CLASSES =
  "tw-group/wave tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-2 tw-rounded-full tw-bg-white/5 tw-py-1 tw-pl-2.5 tw-pr-1 tw-no-underline tw-transition-all active:tw-scale-95 desktop-hover:hover:tw-bg-white/10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const OPEN_DROP_BUTTON_CLASSES =
  "tw-absolute tw-inset-0 tw-z-20 tw-m-0 tw-block tw-h-full tw-w-full tw-cursor-pointer tw-rounded-[inherit] tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

const BoostedDropCardChatBoostButton = memo(
  ({ drop }: { readonly drop: ApiDrop }) => {
    const { connectedProfile } = useContext(AuthContext);
    const { toggleBoost, isPending } = useDropBoostMutation();

    const extendedDrop = useMemo(
      () => convertApiDropToExtendedDrop(drop),
      [drop]
    );

    const isBoosted = drop.context_profile_context?.boosted ?? false;
    const canBoost = !!connectedProfile && !drop.id.startsWith("temp-");
    const chatBoostButtonLabel = isBoosted
      ? t(DEFAULT_LOCALE, "home.boostedDrop.boosted")
      : t(DEFAULT_LOCALE, "home.boostedDrop.boost");

    const handleBoostClick = useCallback(
      (event: ReactMouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (canBoost && !isPending) {
          toggleBoost(extendedDrop);
        }
      },
      [canBoost, extendedDrop, isPending, toggleBoost]
    );

    return (
      <button
        type="button"
        onClick={handleBoostClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.stopPropagation();
          }
        }}
        disabled={!canBoost || isPending}
        className={`tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-px-3 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-5 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
          canBoost
            ? "tw-cursor-pointer tw-border-iron-700 tw-bg-iron-900/70 tw-text-iron-300 hover:tw-border-amber-500/40 hover:tw-bg-amber-500/10 hover:tw-text-amber-100"
            : "tw-cursor-default tw-border-iron-800 tw-bg-iron-900/50 tw-text-iron-600"
        } ${
          isBoosted && canBoost
            ? "tw-border-amber-500/40 tw-bg-amber-500/15 tw-text-amber-100"
            : ""
        }`}
        aria-label={
          isBoosted
            ? t(DEFAULT_LOCALE, "home.boostedDrop.removeBoostFromDrop", {
                author: getBoostedDropAuthorLabel(drop.author.handle),
              })
            : t(DEFAULT_LOCALE, "home.boostedDrop.boostDrop", {
                author: getBoostedDropAuthorLabel(drop.author.handle),
              })
        }
      >
        <BoostIcon
          aria-hidden="true"
          className="tw-size-3.5 tw-flex-shrink-0 tw-text-amber-400"
          focusable="false"
          variant={isBoosted ? "filled" : "outlined"}
        />
        <span>{chatBoostButtonLabel}</span>
      </button>
    );
  }
);

BoostedDropCardChatBoostButton.displayName = "BoostedDropCardChatBoostButton";

const BoostedDropCardHeader = memo(
  ({
    createdAt,
    fireIconsToShow,
    isChatVariant,
    remainingBoosts,
    totalBoosts,
  }: {
    readonly createdAt: ApiDrop["created_at"];
    readonly fireIconsToShow: number;
    readonly isChatVariant: boolean;
    readonly remainingBoosts: number;
    readonly totalBoosts: number;
  }) => {
    if (isChatVariant) {
      return (
        <div className={CHAT_HEADER_CLASSES}>
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <span className="tw-flex tw-size-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-amber-500/20 tw-bg-amber-500/10">
              <BoostIcon
                aria-hidden="true"
                className="tw-size-3.5 tw-text-amber-300"
                focusable="false"
                variant="filled"
              />
            </span>
            <span className="tw-truncate tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-wide tw-text-iron-300">
              {t(DEFAULT_LOCALE, "home.boostedDrop.badge")}
            </span>
          </div>
          <span className="tw-flex tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-black/30 tw-px-2 tw-py-1 tw-text-[11px] tw-font-medium tw-leading-4 tw-text-iron-400">
            {getBoostedDropBoostLabel(totalBoosts)}
          </span>
        </div>
      );
    }

    return (
      <div className={HEADER_CLASSES}>
        <div className={HEADER_LEFT_CLASSES}>
          <div className={PILL_CLASSES}>
            <span className="tw-text-[10px] tw-font-semibold tw-leading-4 tw-tracking-wide tw-text-iron-300">
              {getTimeAgoShort(createdAt)}
            </span>
          </div>
        </div>
        <div
          className={`${PILL_CLASSES} tw-gap-0.5 sm:tw-ml-auto`}
          aria-label={getBoostedDropBoostLabel(totalBoosts)}
        >
          {Array.from({ length: fireIconsToShow }).map((_, index) => (
            <BoostIcon
              key={index}
              aria-hidden="true"
              className="tw-size-3 tw-flex-shrink-0 tw-text-orange-400 tw-drop-shadow-sm"
              focusable="false"
              variant="filled"
            />
          ))}
          {remainingBoosts > 0 && (
            <span className="tw-ml-1 tw-text-[10px] tw-font-bold tw-tabular-nums tw-leading-4 tw-text-iron-50">
              +{remainingBoosts}
            </span>
          )}
        </div>
      </div>
    );
  }
);

BoostedDropCardHeader.displayName = "BoostedDropCardHeader";

const BoostedDropCardFooter = memo(
  ({
    author,
    drop,
    isChatVariant,
    waveHref,
    waveName,
    wavePicture,
  }: {
    readonly author: ApiDrop["author"];
    readonly drop: ApiDrop;
    readonly isChatVariant: boolean;
    readonly waveHref: string;
    readonly waveName: string;
    readonly wavePicture: string | null | undefined;
  }) => (
    <div className={FOOTER_CLASSES}>
      <Link
        href={author.handle ? `/${author.handle}` : "#"}
        onClick={(event) => event.stopPropagation()}
        className={PROFILE_LINK_CLASSES}
        aria-label={t(DEFAULT_LOCALE, "home.boostedDrop.viewAuthor", {
          author: getBoostedDropAuthorLabel(author.handle),
        })}
      >
        <ProfileAvatar
          pfpUrl={author.pfp}
          alt=""
          size={ProfileBadgeSize.SMALL}
        />
        <span className="tw-break-words tw-text-sm tw-font-medium tw-text-iron-50">
          {getBoostedDropAuthorLabel(author.handle)}
        </span>
      </Link>

      {isChatVariant ? (
        <BoostedDropCardChatBoostButton drop={drop} />
      ) : (
        <Link
          href={waveHref}
          onClick={(event) => event.stopPropagation()}
          className={WAVE_LINK_CLASSES}
        >
          <span className="tw-break-words tw-text-[11px] tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:group-hover/wave:tw-text-iron-200">
            {waveName}
          </span>
          {wavePicture && (
            <Image
              src={getScaledImageUri(wavePicture, ImageScale.W_AUTO_H_50)}
              alt=""
              width={20}
              height={20}
              className="tw-size-5 tw-shrink-0 tw-rounded-full tw-object-cover tw-ring-1 tw-ring-white/10"
            />
          )}
        </Link>
      )}
    </div>
  )
);

BoostedDropCardFooter.displayName = "BoostedDropCardFooter";

const BoostedDropCardOpenButton = memo(
  ({
    label,
    onClick,
  }: {
    readonly label: string;
    readonly onClick?: (() => void) | undefined;
  }) => {
    if (!onClick) {
      return null;
    }

    return (
      <button
        type="button"
        className={OPEN_DROP_BUTTON_CLASSES}
        onClick={onClick}
      >
        <span className="tw-sr-only">{label}</span>
      </button>
    );
  }
);

BoostedDropCardOpenButton.displayName = "BoostedDropCardOpenButton";

const BoostedDropCardHome = memo(
  ({ drop, onClick, variant = "home" }: BoostedDropCardHomeProps) => {
    const part = drop.parts[0];
    const { author, wave, boosts } = drop;
    const fireIconsToShow = Math.min(boosts, MAX_FIRE_ICONS);
    const remainingBoosts = Math.max(boosts - MAX_FIRE_ICONS, 0);
    const isChatVariant = variant === "chat";
    const openDropLabel = getBoostedDropOpenLabel(author.handle);
    const waveHref = getWaveRoute({
      waveId: wave.id,
      isDirectMessage: false,
      isApp: false,
    });

    return (
      <article
        className={`${isChatVariant ? CHAT_CARD_CLASSES : HOME_CARD_CLASSES} ${
          onClick ? CLICKABLE_CARD_CLASS : ""
        }`}
      >
        <BoostedDropCardOpenButton label={openDropLabel} onClick={onClick} />
        {!isChatVariant && <div className={CARD_BORDER_CLASSES} />}
        <BoostedDropCardHeader
          createdAt={drop.created_at}
          fireIconsToShow={fireIconsToShow}
          isChatVariant={isChatVariant}
          remainingBoosts={remainingBoosts}
          totalBoosts={boosts}
        />
        <BoostedDropCardHomeContent isChatVariant={isChatVariant} part={part} />
        <BoostedDropCardFooter
          author={author}
          drop={drop}
          isChatVariant={isChatVariant}
          waveHref={waveHref}
          waveName={wave.name}
          wavePicture={wave.picture}
        />
      </article>
    );
  }
);

BoostedDropCardHome.displayName = "BoostedDropCardHome";

export default BoostedDropCardHome;
