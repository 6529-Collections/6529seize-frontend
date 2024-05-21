import Image from "next/image";
import { NextGenToken } from "../../../../entities/INextgen";
import { TraitScore } from "./NextGenTokenAbout";
import { NextGenTokenRarityType } from "../../nextgen_helpers";
import {
  cicToType,
  formatAddress,
  getRoyaltyImage,
} from "../../../../helpers/Helpers";
import {
  ETHEREUM_ICON_TEXT,
  NEXTGEN_MEDIA_BASE_URL,
} from "../../../../constants";
import Tippy from "@tippyjs/react";
import { Container, Row, Col } from "react-bootstrap";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";
import UserCICAndLevel from "../../../user/utils/UserCICAndLevel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function NextGenTokenImage(
  props: Readonly<{
    token: NextGenToken;
    hide_link?: boolean;
    hide_info?: boolean;
    info_class?: string;
    show_animation?: boolean;
    show_original?: boolean;
    token_art?: boolean;
    is_fullscreen?: boolean;
    rarity_type?: NextGenTokenRarityType;
    show_listing?: boolean;
    show_max_sale?: boolean;
    show_last_sale?: boolean;
    show_owner_info?: boolean;
    is_zoom?: boolean;
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
      const cicType = cicToType(props.token.tdh + props.token.rep_score);

      const ownerInfo = (
        <span className="d-flex align-items-center gap-2">
          <UserCICAndLevel
            level={props.token.level}
            cicType={cicType}
            color="black"
          />
          {props.token.normalised_handle ?? formatAddress(props.token.owner)}
        </span>
      );

      ownerInfoDisplay = (
        <Tippy
          content={
            <Container>
              <Row className="pt-2 pb-2">
                <Col>{ownerInfo}</Col>
              </Row>
              <Row>
                <Col>
                  Opensea:{" "}
                  {props.token.opensea_price > 0
                    ? `${props.token.opensea_price} ${ETHEREUM_ICON_TEXT}`
                    : "Not Listed"}
                </Col>
              </Row>
              <Row>
                <Col>
                  Blur:{" "}
                  {props.token.blur_price > 0
                    ? `${props.token.blur_price} ${ETHEREUM_ICON_TEXT}`
                    : "Not Listed"}
                </Col>
              </Row>
            </Container>
          }
          theme={"light"}
          placement="right"
          delay={250}>
          <FontAwesomeIcon height={18} icon="info-circle"></FontAwesomeIcon>
        </Tippy>
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
        <span className="d-flex align-items-center gap-2">
          <span className="d-flex align-items-center">
            {props.token.price > 0 ? (
              <>
                <span className="font-smaller font-color-h">Listed for</span>
                &nbsp;
                {props.token.price} {ETHEREUM_ICON_TEXT}
              </>
            ) : (
              "Not Listed"
            )}
          </span>
          {props.token.opensea_royalty > 0 && (
            <Image
              width={0}
              height={0}
              style={{ height: "20px", width: "auto" }}
              src={`/${getRoyaltyImage(props.token.opensea_royalty / 100)}`}
              alt={"pepe"}
              className="cursor-pointer"
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
          <span className="d-flex align-items-center">
            <span className="font-color-h font-smaller">{display}</span>&nbsp;
            <span className="d-flex gap-2">
              <span>
                {parseFloat(value.toFixed(5)).toLocaleString()}{" "}
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
      <span className="d-flex flex-column align-items-end gap-1">
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
          className="d-flex flex-column align-items-center justify-content-center"
          style={{
            overflow: "hidden",
            height: height,
          }}>
          <Image
            priority
            loading={"eager"}
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
            className={`pt-1 d-flex align-items-center ${
              props.rarity_type ||
              props.show_listing ||
              props.show_max_sale ||
              props.show_last_sale ||
              props.show_owner_info
                ? "justify-content-between"
                : "justify-content-center"
            }`}>
            <span className={props.info_class ?? ""}>
              #{props.token.normalised_id}
            </span>
            <span className="d-flex align-items-center gap-2">
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
      <a
        href={`/nextgen/token/${props.token.id}`}
        className="decoration-none scale-hover unselectable">
        {getContent()}
      </a>
    );
  }
}

export function getNextGenImageUrl(tokenId: number) {
  return `${NEXTGEN_MEDIA_BASE_URL}/png/${tokenId}`;
}

export function getNextGenThumbnailUrl(tokenId: number) {
  return `${NEXTGEN_MEDIA_BASE_URL}/png0.5k/${tokenId}`;
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
