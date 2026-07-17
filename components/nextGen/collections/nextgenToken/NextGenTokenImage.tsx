import type { NextGenTokenRarityType } from "@/components/nextGen/nextgen_helpers";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import {
  ETHEREUM_ICON_TEXT,
  NEXTGEN_MEDIA_BASE_URL,
} from "@/constants/constants";
import type { NextGenToken } from "@/entities/INextgen";
import { formatAddress, getRoyaltyImage } from "@/helpers/Helpers";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatNumber } from "@/i18n/format";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import { TraitScore } from "./NextGenTokenAbout";

export function NextGenTokenImage(
  props: Readonly<{
    token: NextGenToken;
    hide_link?: boolean | undefined;
    hide_info?: boolean | undefined;
    info_class?: string | undefined;
    show_animation?: boolean | undefined;
    show_original?: boolean | undefined;
    token_art?: boolean | undefined;
    is_fullscreen?: boolean | undefined;
    rarity_type?: NextGenTokenRarityType | undefined;
    show_listing?: boolean | undefined;
    show_max_sale?: boolean | undefined;
    show_last_sale?: boolean | undefined;
    show_owner_info?: boolean | undefined;
    is_zoom?: boolean | undefined;
  }>
) {
  const isMobileScreen = useIsMobileScreen();
  const locale = useBrowserLocale();
  function getImageUrl() {
    if (props.show_original) {
      return props.token.image_url;
    }
    return props.token.thumbnail_url ?? props.token.image_url;
  }

  function getOwnerInfo() {
    let ownerInfoDisplay;
    if (props.show_owner_info) {
      const handleOrWallet =
        props.token.normalised_handle ?? formatAddress(props.token.owner);
      const profileHref = `/${props.token.normalised_handle ?? props.token.owner}`;
      const initial = handleOrWallet.trim().charAt(0) || "?";
      const ownerInfo = (
        <div className="tailwind-scope tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2.5">
          <ProfileAvatar
            pfpUrl={undefined}
            size={ProfileBadgeSize.SMALL}
            alt={`${handleOrWallet} profile`}
            fallbackContent={
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-300">
                {initial}
              </span>
            }
          />
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2">
            <Link
              href={profileHref}
              onClick={(e) => e.stopPropagation()}
              className="tw-truncate tw-text-sm tw-font-semibold tw-leading-none tw-text-iron-50 tw-no-underline desktop-hover:hover:tw-text-iron-200"
            >
              {handleOrWallet}
            </Link>
            <UserCICAndLevel
              level={props.token.level}
              size={UserCICAndLevelSize.SMALL}
            />
          </div>
        </div>
      );

      ownerInfoDisplay = (
        <button
          type="button"
          className="tw-flex tw-h-10 tw-w-10 tw-cursor-pointer tw-items-center tw-justify-end tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          aria-label="More info"
          data-tooltip-id={`owner-info-${props.token.id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="tw-h-5 tw-w-5"
            aria-hidden="true"
          />
          <Tooltip
            id={`owner-info-${props.token.id}`}
            place="right"
            delayShow={250}
            opacity={1}
            className="!tw-max-w-[min(280px,calc(100vw-24px))] !tw-rounded-lg !tw-border !tw-border-solid !tw-border-white/15 !tw-bg-iron-800 !tw-px-3 !tw-py-2.5 !tw-text-sm !tw-leading-[1.5] !tw-text-iron-50 !tw-shadow-lg"
          >
            <div className="tw-flex tw-flex-col tw-gap-1.5 tw-text-left">
              <div className="tw-border-b tw-border-white/10 tw-pb-1.5">
                {ownerInfo}
              </div>
              <div className="tw-flex tw-flex-col tw-gap-1 tw-font-semibold">
                <span>
                  Opensea:{" "}
                  {props.token.opensea_price > 0
                    ? `${props.token.opensea_price} ${ETHEREUM_ICON_TEXT}`
                    : "Not Listed"}
                </span>
                <span>
                  Blur:{" "}
                  {props.token.blur_price > 0
                    ? `${props.token.blur_price} ${ETHEREUM_ICON_TEXT}`
                    : "Not Listed"}
                </span>
                <span>
                  Magic Eden:{" "}
                  {props.token.me_price > 0
                    ? `${props.token.me_price} ${ETHEREUM_ICON_TEXT}`
                    : "Not Listed"}
                </span>
              </div>
            </div>
          </Tooltip>
        </button>
      );
    }

    return ownerInfoDisplay;
  }

  function getExtraInfo() {
    let rarityDisplay;
    if (props.rarity_type) {
      const rarityType = props.rarity_type.toLowerCase();
      const score = rarityType as keyof NextGenToken;
      const rank = `${rarityType}_rank` as keyof NextGenToken;

      rarityDisplay = (
        <TraitScore
          score={props.token[score] as number}
          rank={props.token[rank] as number}
        />
      );
    }

    let listingDisplay;
    if (props.show_listing) {
      listingDisplay = (
        <span className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-flex tw-items-center">
            {props.token.price > 0 ? (
              <>
                <span className="tw-text-sm tw-text-[#9a9a9a]">Listed for</span>
                &nbsp;
                {props.token.price} {ETHEREUM_ICON_TEXT}
              </>
            ) : (
              "Not Listed"
            )}
          </span>
          {props.token.opensea_price == props.token.price &&
            props.token.opensea_royalty > 0 && (
              <Image
                unoptimized
                width={20}
                height={20}
                className="tw-h-5 tw-w-auto tw-cursor-pointer"
                src={`/${getRoyaltyImage(props.token.opensea_royalty / 100)}`}
                alt="Royalty indicator"
              />
            )}
          {props.token.me_price == props.token.price &&
            props.token.me_price > 0 && (
              <Image
                unoptimized
                width={20}
                height={20}
                className="tw-h-5 tw-w-auto tw-cursor-pointer"
                src={`/${getRoyaltyImage(props.token.me_royalty / 100)}`}
                alt="Royalty indicator"
              />
            )}
        </span>
      );
    }

    let saleDisplay;
    if (props.show_max_sale || props.show_last_sale) {
      const display = props.show_max_sale ? "Max sale" : "Last sale";
      const value = props.show_max_sale
        ? props.token.max_sale_value
        : props.token.last_sale_value;
      const date = props.show_max_sale
        ? props.token.max_sale_date
        : props.token.last_sale_date;

      if (value && date) {
        saleDisplay = (
          <span className="tw-flex tw-items-center">
            <span className="tw-text-sm tw-text-[#9a9a9a]">{display}</span>
            &nbsp;
            <span className="tw-flex tw-gap-2">
              <span>
                {formatNumber(locale, Number.parseFloat(value.toFixed(5)), {
                  maximumFractionDigits: 5,
                })}{" "}
                {ETHEREUM_ICON_TEXT}
              </span>
              <span>{formatDate(locale, date)}</span>
            </span>
          </span>
        );
      } else {
        saleDisplay = <span>Not Sold</span>;
      }
    }
    return (
      <span className="tw-flex tw-flex-col tw-items-end tw-gap-1">
        {rarityDisplay}
        {saleDisplay}
        {listingDisplay}
      </span>
    );
  }
  function getImage() {
    let heightClassName = "tw-h-auto";
    if (props.is_fullscreen) {
      heightClassName =
        "tw-h-[calc(100dvh-2rem)] tw-w-[calc(100vw-2rem)]";
    } else if (props.token_art) {
      if (isMobileScreen) {
        heightClassName = "tw-h-[55vh]";
      } else {
        heightClassName = "tw-h-[85vh]";
      }
    }

    return (
      <>
        <span
          className={`tw-flex tw-flex-col tw-items-center tw-justify-center tw-overflow-hidden ${heightClassName}`}
        >
          <Image
            quality={100}
            priority
            unoptimized
            width={0}
            height={0}
            className="tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full"
            src={getImageUrl()}
            alt={props.token.name}
            onError={(e) => {
              e.currentTarget.src = "/pebbles-loading.jpeg";
            }}
          />
        </span>
        {!props.hide_info && (
          <span
            className={`tw-flex tw-w-full tw-items-center tw-pt-1 ${
              props.rarity_type ||
              props.show_listing ||
              props.show_max_sale ||
              props.show_last_sale ||
              props.show_owner_info
                ? "tw-justify-between"
                : "tw-justify-center"
            }`}
          >
            <span className={props.info_class ?? ""}>
              #{props.token.normalised_id}
            </span>
            <span className="tw-flex tw-items-center tw-gap-2">
              {getExtraInfo()}
              {getOwnerInfo()}
            </span>
          </span>
        )}
      </>
    );
  }

  function getContent() {
    if (props.show_animation && props.token.animation_url) {
      let animationHeightClassName = "tw-h-[85vh]";
      if (props.is_fullscreen) {
        animationHeightClassName = "tw-h-screen";
      } else if (isMobileScreen) {
        animationHeightClassName = "tw-h-[60vh]";
      }

      return (
        <iframe
          className={`-tw-mb-2 tw-w-full ${animationHeightClassName}`}
          src={props.token.animation_url ?? props.token.generator?.html}
          title={props.token.name}
        />
      );
    } else {
      return getImage();
    }
  }

  if (props.hide_link) {
    return getContent();
  } else {
    return (
      <Link
        href={`/nextgen/token/${props.token.id}`}
        className="tw-select-none tw-no-underline [&_img]:tw-transition-transform [&_img]:tw-duration-300 hover:[&_img]:tw-scale-[1.02]"
      >
        {getContent()}
      </Link>
    );
  }
}

export function getNextGenImageUrl(tokenId: number) {
  return `${NEXTGEN_MEDIA_BASE_URL}/png/${tokenId}`;
}

export function getNextGenIconUrl(tokenId: number) {
  return `${NEXTGEN_MEDIA_BASE_URL}/thumbnail/${tokenId}`;
}

export function get8KUrl(tokenId: number) {
  return `${NEXTGEN_MEDIA_BASE_URL}/png8k/${tokenId}`;
}

export function get16KUrl(tokenId: number) {
  return `${NEXTGEN_MEDIA_BASE_URL}/png16k/${tokenId}`;
}
