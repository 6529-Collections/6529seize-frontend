import Image from "next/image";
import { NextGenToken } from "../../../../entities/INextgen";
import { TraitScore } from "./NextGenTokenAbout";
import { NextGenTokenRarityType } from "../../nextgen_helpers";
import { getRoyaltyImage } from "../../../../helpers/Helpers";
import { ETHEREUM_ICON_TEXT } from "../../../../constants";
import Tippy from "@tippyjs/react";
import { Container, Row, Col } from "react-bootstrap";

export function NextGenTokenImage(
  props: Readonly<{
    token: NextGenToken;
    hide_link?: boolean;
    hide_info?: boolean;
    info_class?: string;
    show_animation?: boolean;
    is_fullscreen?: boolean;
    rarity_type?: NextGenTokenRarityType;
    show_listing?: boolean;
    show_max_sale?: boolean;
    show_last_sale?: boolean;
  }>
) {
  function getTraitScore() {
    if (!props.rarity_type) {
      return <></>;
    }
    const rarityType = props.rarity_type.toLowerCase();
    const score = rarityType as keyof NextGenToken;
    const rank = `${rarityType}_rank` as keyof NextGenToken;

    return (
      <TraitScore
        score={props.token[score] as number}
        rank={props.token[rank] as number}
      />
    );
  }
  function getInfo() {
    if (props.show_listing) {
      return (
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
            <span>
              {props.token.opensea_price > 0
                ? `${props.token.opensea_price} ${ETHEREUM_ICON_TEXT}`
                : "Not Listed"}
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
    if (props.show_max_sale || props.show_last_sale) {
      const value = props.show_max_sale
        ? props.token.max_sale_value
        : props.token.last_sale_value;
      const date = props.show_max_sale
        ? props.token.max_sale_date
        : props.token.last_sale_date;

      return (
        <span>
          {value} {ETHEREUM_ICON_TEXT} - {new Date(date).toLocaleDateString()}
        </span>
      );
    }
    return <></>;
  }
  function getImage() {
    return (
      <>
        <span className="d-flex flex-column align-items-center">
          <Image
            priority
            loading={"eager"}
            width="0"
            height="0"
            style={{
              height: props.is_fullscreen ? "100vh" : "auto",
              width: "auto",
              maxHeight: "90vh",
              maxWidth: "100%",
            }}
            src={props.token.image_url}
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
              props.show_last_sale
                ? "justify-content-between"
                : "justify-content-center"
            }`}>
            <span className={props.info_class ?? ""}>
              #{props.token.normalised_id}
            </span>
            {getTraitScore()}
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
            height: props.is_fullscreen ? "100vh" : "90vh",
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
