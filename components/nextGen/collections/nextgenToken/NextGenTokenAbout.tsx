import styles from "../NextGen.module.scss";

import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  areEqualAddresses,
  cicToType,
  formatAddress,
  getRoyaltyImage,
  isNullAddress,
  numberWithCommas,
  printMintDate,
} from "../../../../helpers/Helpers";
import { useState, useEffect } from "react";
import { commonApiFetch } from "../../../../services/api/common-api";
import { NEXTGEN_CHAIN_ID } from "../../nextgen_contracts";
import Image from "next/image";
import Tippy from "@tippyjs/react";
import {
  formatNameForUrl,
  getBlurLink,
  getMagicEdenLink,
  getOpenseaLink,
} from "../../nextgen_helpers";
import { DBResponse } from "../../../../entities/IDBResponse";
import EthereumIcon from "../../../user/utils/icons/EthereumIcon";
import { displayScore } from "./NextGenTokenProperties";
import UserCICAndLevel from "../../../user/utils/UserCICAndLevel";
import { ETHEREUM_ICON_TEXT } from "../../../../constants";
import useCapacitor from "../../../../hooks/useCapacitor";
import { useSeizeConnectContext } from "../../../auth/SeizeConnectContext";
import { useIdentity } from "../../../../hooks/useIdentity";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

export default function NextgenTokenAbout(props: Readonly<Props>) {
  const capacitor = useCapacitor();
  const account = useSeizeConnectContext();
  const [tdh, setTdh] = useState<number>(0);
  const { profile } = useIdentity({
    handleOrWallet: props.token.owner,
    initialProfile: null,
  });

  useEffect(() => {
    commonApiFetch<DBResponse>({
      endpoint: `nextgen/tdh?token_id=${props.token.id}`,
    }).then((result) => {
      if (result.data.length === 1) {
        setTdh(result.data[0].boosted_tdh);
      }
    });
  }, [props.token.owner]);

  return (
    <Container className="no-padding">
      <Row>
        <Col className="pb-3">
          <h3 className="mb-0">About</h3>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Collection Token ID:</span>
          <span>{props.token.normalised_id}</span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Contract Token ID:</span>
          <span>{props.token.id}</span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Minted:</span>
          <span>{printMintDate(props.token.mint_date)}</span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Mint Price:</span>
          <span>
            {props.token.mint_price ? (
              <span className="d-flex align-items-center">
                {props.token.mint_price}
                <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50">
                  <EthereumIcon />
                </div>
              </span>
            ) : (
              "Free"
            )}
          </span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-2">
          <span className="font-color-h">Collector:</span>
          <span className="d-flex gap-1 align-items-center">
            {(props.token.burnt || isNullAddress(props.token.owner)) && (
              <Tippy content={"Burnt"} theme={"light"} delay={100}>
                <FontAwesomeIcon
                  icon="fire"
                  style={{ height: "22px", color: "#c51d34" }}
                />
              </Tippy>
            )}
            {profile?.level && profile?.cic ? (
              <a
                href={`/${profile?.handle ?? props.token.owner}`}
                className="d-flex gap-2 decoration-hover-underline align-items-center"
              >
                <UserCICAndLevel
                  level={profile.level}
                  cicType={cicToType(profile.cic)}
                />
                <span className="decoration-underline">
                  {profile?.handle ??
                    profile?.display ??
                    formatAddress(props.token.owner)}
                </span>
              </a>
            ) : (
              <a href={`/${profile?.handle ?? props.token.owner}`}>
                <span>
                  {profile?.handle ??
                    profile?.display ??
                    formatAddress(props.token.owner)}
                </span>
              </a>
            )}
            {areEqualAddresses(props.token.owner, account.address) && (
              <span>(you)</span>
            )}
          </span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-2">
          <span className="font-color-h">Collector TDH:</span>
          <span className="d-flex gap-1 align-items-center">
            {numberWithCommas(Math.round((profile?.tdh ?? 0) * 100) / 100)}
          </span>
        </Col>
      </Row>
      {capacitor.platform !== "ios" && (
        <Row>
          <Col className="pb-3 d-flex flex-column">
            <span className="font-color-h">Listed:</span>
            <span className="d-flex flex-column align-items-start gap-2 pt-1">
              <span>
                <Tippy
                  content={
                    <Container>
                      <Row>
                        <Col>
                          Opensea:{" "}
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
                  delay={250}
                >
                  <a
                    href={getOpenseaLink(NEXTGEN_CHAIN_ID, props.token.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="d-flex gap-2 align-items-center decoration-none"
                  >
                    <Image
                      className={styles.marketplace}
                      src="/opensea.png"
                      alt="opensea"
                      width={24}
                      height={24}
                    />
                    {props.token.opensea_price > 0 ? (
                      <span className="d-flex gap-2 align-items-center">
                        <span className="d-flex align-items-center">
                          <span>{props.token.opensea_price}</span>
                          <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50">
                            <EthereumIcon />
                          </div>
                        </span>
                        {props.token.opensea_royalty > 0 && (
                          <Image
                            width={0}
                            height={0}
                            style={{ height: "25px", width: "auto" }}
                            src={`/${getRoyaltyImage(
                              props.token.opensea_royalty / 100
                            )}`}
                            alt={"pepe"}
                            className="cursor-pointer"
                          />
                        )}
                      </span>
                    ) : (
                      "No"
                    )}
                  </a>
                </Tippy>
              </span>
              <span>
                <Tippy
                  content={
                    <Container>
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
                  delay={250}
                >
                  <a
                    href={getBlurLink(props.token.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="d-flex gap-2 align-items-center decoration-none"
                  >
                    <Image
                      className={styles.marketplace}
                      src="/blur.png"
                      alt="blur"
                      width={24}
                      height={24}
                    />
                    {props.token.blur_price > 0 ? (
                      <span className="d-flex gap-2 align-items-center">
                        <span className="d-flex align-items-center">
                          <span>{props.token.blur_price}</span>
                          <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50">
                            <EthereumIcon />
                          </div>
                        </span>
                      </span>
                    ) : (
                      "No"
                    )}
                  </a>
                </Tippy>
              </span>
              <span>
                <Tippy
                  content={
                    <Container>
                      <Row>
                        <Col>
                          Magic Eden:{" "}
                          {props.token.me_price > 0
                            ? `${props.token.me_price} ${ETHEREUM_ICON_TEXT}`
                            : "Not Listed"}
                        </Col>
                      </Row>
                      {props.token.me_price > 0 && (
                        <Row>
                          <Col>Royalties: {props.token.me_royalty}%</Col>
                        </Row>
                      )}
                    </Container>
                  }
                  theme={"light"}
                  placement="right"
                  delay={250}
                >
                  <a
                    href={getMagicEdenLink(props.token.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="d-flex gap-2 align-items-center decoration-none"
                  >
                    <Image
                      className={styles.marketplace}
                      src="/magiceden.svg"
                      alt="magiceden"
                      width={24}
                      height={24}
                    />
                    {props.token.me_price > 0 ? (
                      <span className="d-flex gap-2 align-items-center">
                        <span className="d-flex align-items-center">
                          <span>{props.token.me_price}</span>
                          <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50">
                            <EthereumIcon />
                          </div>
                        </span>
                        {props.token.me_royalty > 0 && (
                          <Image
                            width={0}
                            height={0}
                            style={{ height: "25px", width: "auto" }}
                            src={`/${getRoyaltyImage(
                              props.token.me_royalty / 100
                            )}`}
                            alt={"pepe"}
                            className="cursor-pointer"
                          />
                        )}
                      </span>
                    ) : (
                      "No"
                    )}
                  </a>
                </Tippy>
              </span>
            </span>
          </Col>
        </Row>
      )}
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Collection:</span>
          <span>
            <a
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}`}
            >
              {props.collection.name}
            </a>
          </span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Artist:</span>
          <span>
            <a href={`/${props.collection.artist_address}`}>
              {props.collection.artist}
            </a>
          </span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">TDH Rate:</span>
          <span>
            {numberWithCommas(Math.round(props.token.hodl_rate * 100) / 100)}
          </span>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <span className="font-color-h">TDH:</span>
          <span>{numberWithCommas(Math.round(tdh * 100) / 100)}</span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Image Licence:</span>
          <span>{props.collection.licence}</span>
        </Col>
      </Row>
    </Container>
  );
}

export function TraitScore(
  props: Readonly<{
    score: number;
    rank: number;
    places?: number;
  }>
) {
  return (
    <span className="d-flex flex-column">
      <span className="d-flex gap-2">
        <span className="no-wrap d-flex align-items-center">
          <span className="font-smaller font-color-h">Score</span>&nbsp;
          {displayScore(props.score)}
        </span>
        <span className="font-color-h">|</span>
        <span className="no-wrap d-flex align-items-center">
          <span className="font-smaller font-color-h">Rank</span>&nbsp;#
          {props.rank.toLocaleString()}
        </span>
      </span>
    </span>
  );
}
