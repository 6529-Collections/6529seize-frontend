import Image from "next/image";
import { NextGenToken } from "../../../../entities/INextgen";
import { TraitScore } from "./NextGenTokenAbout";
import { NextGenTokenRarityType } from "../../nextgen_helpers";
import { getRoyaltyImage } from "../../../../helpers/Helpers";
import {
  ETHEREUM_ICON_TEXT,
  NEXTGEN_MEDIA_BASE_URL,
} from "../../../../constants";
import Tippy from "@tippyjs/react";
import { Container, Row, Col } from "react-bootstrap";
import { useRef, useState } from "react";
import { Spinner } from "../../../dotLoader/DotLoader";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";

export function ZoomableImage(
  props: Readonly<{
    token: NextGenToken;
    is_fullscreen?: boolean;
  }>
) {
  const isMobileScreen = useIsMobileScreen();
  const isMobileDevice = useIsMobileDevice();

  const [isZoomed, setIsZoomed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loading, setLoading] = useState(true);

  function updateObjectPosition(e: any) {
    const img = imgRef.current;
    if (!img) return;

    const { left, top, width, height } = img.getBoundingClientRect();
    const pageXOffset = window.scrollX;
    const pageYOffset = window.scrollY;
    const x = ((e.pageX - left - pageXOffset) / width) * 100;
    const y = ((e.pageY - top - pageYOffset) / height) * 100;
    setObjectPosition(`${x}% ${y}%`);
  }

  const handleImageClick = (e: any) => {
    updateObjectPosition(e);
    setIsZoomed(!isZoomed);
  };

  const [objectPosition, setObjectPosition] = useState<string>();

  const handleMouseMove = (e: any) => {
    if (!isZoomed) return;
    updateObjectPosition(e);
  };

  function getImageUrl() {
    if (isMobileDevice) {
      return get8KUrl(props.token.id);
    }
    return get16KUrl(props.token.id);
  }

  return (
    <span
      className="d-flex align-items-center justify-content-center"
      style={{
        height: props.is_fullscreen
          ? "100vh"
          : isMobileScreen
          ? "60vh"
          : "85vh",
        width: "auto",
        maxHeight: props.is_fullscreen ? "100vh" : "85vh",
        maxWidth: "100%",
        overflow: "hidden",
      }}>
      {loading && (
        <span className="d-flex flex-column gap-3 align-items-center">
          <span className="d-flex flex-wrap text-cennter">
            {isMobileDevice ? "8K" : "16K"} Pebbles are very large
          </span>
          <span className="d-flex flex-wrap text-cennter">
            Chill while we download you into the Pebbles multiverse
          </span>
          <span className="font-larger">
            <Spinner dimension={36} />
          </span>
        </span>
      )}
      <Image
        ref={imgRef}
        priority
        loading={"eager"}
        width="0"
        height="0"
        style={{
          display: loading ? "none" : "initial",
          height: "100%",
          width: "auto",
          transition: "transform 0.2s ease-out",
          objectFit: isZoomed ? "none" : "contain",
          objectPosition: isZoomed ? objectPosition : "center",
          cursor: isZoomed ? "zoom-out" : "zoom-in",
        }}
        onLoad={() => setLoading(false)}
        onClick={handleImageClick}
        onMouseMove={handleMouseMove}
        src={getImageUrl()}
        alt={props.token.name}
        onError={(e) => {
          e.currentTarget.src = "/pebbles-loading.jpeg";
        }}
      />
    </span>
  );
}

export function NextGenTokenImage(
  props: Readonly<{
    token: NextGenToken;
    hide_link?: boolean;
    hide_info?: boolean;
    info_class?: string;
    show_animation?: boolean;
    show_original?: boolean;
    is_fullscreen?: boolean;
    rarity_type?: NextGenTokenRarityType;
    show_listing?: boolean;
    show_max_sale?: boolean;
    show_last_sale?: boolean;
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
  function getInfo() {
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
        <Tippy
          content={
            <Container>
              <Row>
                <Col>
                  Opensea -{" "}
                  {props.token.opensea_price > 0
                    ? `${props.token.opensea_price} ${ETHEREUM_ICON_TEXT}`
                    : "Not Listed"}
                </Col>
              </Row>
              {props.token.opensea_price > 0 && (
                <Row>
                  <Col>Royalties: {props.token.opensea_royalty}%</Col>
                </Row>
              )}
            </Container>
          }
          theme={"light"}
          placement="right"
          delay={250}>
          <span className="d-flex align-items-center gap-2">
            <span className="d-flex align-items-center">
              {props.token.opensea_price > 0 ? (
                <>
                  <span className="font-smaller font-color-h">Listed for</span>
                  &nbsp;
                  {props.token.opensea_price} {ETHEREUM_ICON_TEXT}
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
        </Tippy>
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
    return (
      <>
        <span className="d-flex flex-column align-items-center">
          {props.is_zoom ? (
            <ZoomableImage
              token={props.token}
              is_fullscreen={props.is_fullscreen}
            />
          ) : (
            <Image
              priority
              loading={"eager"}
              width="0"
              height="0"
              style={{
                height: props.is_fullscreen ? "100vh" : "auto",
                width: "auto",
                maxHeight: props.is_fullscreen ? "100vh" : "85vh",
                maxWidth: "100%",
              }}
              src={getImageUrl()}
              alt={props.token.name}
              onError={(e) => {
                e.currentTarget.src = "/pebbles-loading.jpeg";
              }}
            />
          )}
        </span>
        {!props.hide_info && (
          <span
            className={`pt-1 d-flex align-items-center ${
              props.rarity_type ||
              props.show_listing ||
              props.show_max_sale ||
              props.show_last_sale
                ? "justify-content-between"
                : "justify-content-center"
            }`}>
            <span className={props.info_class ?? ""}>
              #{props.token.normalised_id}
            </span>
            {getInfo()}
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
