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
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
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
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
          }}
          aria-label="More info"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <FontAwesomeIcon
            height={18}
            icon={faInfoCircle}
            data-tooltip-id={`owner-info-${props.token.id}`}
          />
          <Tooltip
            id={`owner-info-${props.token.id}`}
            place="right"
            delayShow={250}
            style={{
              backgroundColor: "#26272B",
              color: "#F4F4F5",
              padding: "10px 12px",
              maxWidth: "min(280px, calc(100vw - 24px))",
              fontSize: "12px",
              lineHeight: "1.35",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
              ...({ "--rt-opacity": 1 } as CSSProperties),
            }}
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
                width={0}
                height={0}
                style={{ height: "20px", width: "auto" }}
                src={`/${getRoyaltyImage(props.token.opensea_royalty / 100)}`}
                alt={"pepe"}
                className="tw-cursor-pointer"
              />
            )}
          {props.token.me_price == props.token.price &&
            props.token.me_price > 0 && (
              <Image
                unoptimized
                width={0}
                height={0}
                style={{ height: "20px", width: "auto" }}
                src={`/${getRoyaltyImage(props.token.me_royalty / 100)}`}
                alt={"pepe"}
                className="tw-cursor-pointer"
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
                {Number.parseFloat(value.toFixed(5)).toLocaleString()}{" "}
                {ETHEREUM_ICON_TEXT}
              </span>
              <span>{new Date(date).toLocaleDateString()}</span>
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
    let height = "auto";
    if (props.token_art) {
      if (isMobileScreen) {
        height = "55vh";
      } else {
        height = "85vh";
      }
    } else if (props.is_fullscreen) {
      height = "100vh";
    }

    return (
      <>
        <span
          className="tw-flex tw-flex-col tw-items-center tw-justify-center"
          style={{
            overflow: "hidden",
            height: height,
          }}
        >
          <Image
            quality={100}
            priority
            unoptimized
            width="0"
            height="0"
            style={{
              height: "auto",
              width: "auto",
              maxHeight: "100%",
              maxWidth: "100%",
            }}
            src={getImageUrl()}
            alt={props.token.name}
            onError={(e) => {
              e.currentTarget.src = "/pebbles-loading.jpeg";
            }}
          />
        </span>
        {!props.hide_info && (
          <span
            className={`tw-flex tw-items-center tw-pt-1 ${
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
      return (
        <iframe
          style={{
            width: "100%",
            height: props.is_fullscreen
              ? "100vh"
              : isMobileScreen
                ? "60vh"
                : "85vh",
            marginBottom: "-8px",
          }}
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
