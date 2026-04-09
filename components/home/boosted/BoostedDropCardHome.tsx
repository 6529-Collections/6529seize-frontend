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
import Image from "next/image";
import Link from "next/link";
import {
  memo,
  useCallback,
  useContext,
  useMemo,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import BoostedDropCardHomeContent from "./BoostedDropCardHomeContent";

type BoostedDropCardHomeVariant = "home" | "chat";

interface BoostedDropCardHomeProps {
  readonly drop: ApiDrop;
  readonly onClick?: () => void;
  readonly variant?: BoostedDropCardHomeVariant;
  readonly rank?: number;
}

const MAX_FIRE_ICONS = 5;
const CARD_CLASSES =
  "tw-group tw-relative tw-flex tw-w-full tw-cursor-pointer tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/70 tw-p-0 tw-text-left tw-transition-all tw-duration-500 tw-ease-out hover:-tw-translate-y-1.5 hover:tw-shadow-[0_0_32px_-10px_rgba(255,255,255,0.12)]";
const CARD_BORDER_CLASSES =
  "tw-pointer-events-none tw-absolute tw-inset-0 tw-z-20 tw-rounded-xl tw-border tw-border-solid tw-border-white/5";
const HEADER_CLASSES =
  "tw-absolute tw-left-3 tw-right-3 tw-top-3 tw-z-30 tw-flex tw-flex-nowrap tw-items-center tw-justify-between tw-gap-2";
const HEADER_LEFT_CLASSES =
  "tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-overflow-hidden";
const PILL_CLASSES =
  "tw-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-px-2.5 tw-py-1 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] tw-backdrop-blur-md tw-transition-colors group-hover:tw-bg-black/60";
const FOOTER_CLASSES =
  "tw-relative tw-z-10 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-900 tw-bg-black/70 tw-px-4 tw-py-3";
const AUTHOR_LINK_CLASSES =
  "tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-2 tw-no-underline tw-transition-opacity desktop-hover:hover:tw-opacity-80";
const WAVE_LINK_CLASSES =
  "tw-group/wave tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-2 tw-rounded-full tw-bg-white/5 tw-py-1 tw-pl-2.5 tw-pr-1 tw-no-underline tw-transition-all active:tw-scale-95 desktop-hover:hover:tw-bg-white/10";

const useCardKeyDown = (onClick?: () => void) =>
  useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (
        !onClick ||
        event.target !== event.currentTarget ||
        (event.key !== "Enter" && event.key !== " ")
      ) {
        return;
      }

      event.preventDefault();
      onClick();
    },
    [onClick]
  );

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
    const chatBoostButtonLabel = isBoosted ? "Boosted" : "Boost";

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
        className={`tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-transition-colors ${
          canBoost
            ? "tw-cursor-pointer tw-border-amber-500/20 tw-bg-amber-600/10 hover:tw-bg-amber-600/20"
            : "tw-cursor-default tw-border-white/10 tw-bg-white/5 tw-text-iron-500"
        } ${
          isBoosted && canBoost ? "tw-bg-amber-600/20 tw-text-amber-200" : ""
        }`}
        aria-label={isBoosted ? "Remove boost" : "Boost"}
      >
        <BoostIcon
          className="tw-size-3.5 tw-flex-shrink-0 tw-text-amber-400"
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
    rank,
    remainingBoosts,
  }: {
    readonly createdAt: ApiDrop["created_at"];
    readonly fireIconsToShow: number;
    readonly isChatVariant: boolean;
    readonly rank?: number | undefined;
    readonly remainingBoosts: number;
  }) => (
    <div className={HEADER_CLASSES}>
      <div className={HEADER_LEFT_CLASSES}>
        {isChatVariant && typeof rank === "number" && (
          <div className={PILL_CLASSES}>
            <span className="tw-text-[10px] tw-font-semibold tw-leading-4 tw-tracking-wide tw-text-iron-100">
              #{rank}
            </span>
          </div>
        )}
        <div className={PILL_CLASSES}>
          <span className="tw-text-[10px] tw-font-semibold tw-leading-4 tw-tracking-wide tw-text-iron-300">
            {getTimeAgoShort(createdAt)}
          </span>
        </div>
      </div>
      <div className={`${PILL_CLASSES} tw-gap-0.5 sm:tw-ml-auto`}>
        {Array.from({ length: fireIconsToShow }).map((_, index) => (
          <BoostIcon
            key={index}
            className="tw-size-3 tw-flex-shrink-0 tw-text-orange-400 tw-drop-shadow-sm"
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
  )
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
        className={AUTHOR_LINK_CLASSES}
      >
        <ProfileAvatar
          pfpUrl={author.pfp}
          alt={author.handle ?? "User"}
          size={ProfileBadgeSize.SMALL}
        />
        <span className="tw-break-words tw-text-sm tw-font-medium tw-text-iron-50">
          {author.handle ?? "Anonymous"}
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
              alt={waveName}
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

const BoostedDropCardHome = memo(
  ({ drop, onClick, variant = "home", rank }: BoostedDropCardHomeProps) => {
    const part = drop.parts[0];
    const { author, wave, boosts } = drop;
    const fireIconsToShow = Math.min(boosts, MAX_FIRE_ICONS);
    const remainingBoosts = boosts - MAX_FIRE_ICONS;
    const isChatVariant = variant === "chat";
    const handleCardKeyDown = useCardKeyDown(onClick);
    const waveHref = getWaveRoute({
      waveId: wave.id,
      isDirectMessage: false,
      isApp: false,
    });

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleCardKeyDown}
        className={CARD_CLASSES}
      >
        <div className={CARD_BORDER_CLASSES} />
        <BoostedDropCardHeader
          createdAt={drop.created_at}
          fireIconsToShow={fireIconsToShow}
          isChatVariant={isChatVariant}
          rank={rank}
          remainingBoosts={remainingBoosts}
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
      </div>
    );
  }
);

BoostedDropCardHome.displayName = "BoostedDropCardHome";

export default BoostedDropCardHome;
