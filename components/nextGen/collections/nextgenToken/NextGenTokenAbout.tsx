import styles from "../NextGen.module.scss";

import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  areEqualAddresses,
  isNullAddress,
  numberWithCommas,
  printMintDate,
} from "../../../../helpers/Helpers";
import Address from "../../../address/Address";
import { useState, useEffect } from "react";
import { useAccount, useEnsName, mainnet } from "wagmi";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { commonApiFetch } from "../../../../services/api/common-api";
import { NEXTGEN_CHAIN_ID } from "../../nextgen_contracts";
import Image from "next/image";
import Tippy from "@tippyjs/react";
import { formatNameForUrl, getOpenseaLink } from "../../nextgen_helpers";
import NextGenTokenDownload, { Quality } from "./NextGenTokenDownload";
import { Time } from "../../../../helpers/time";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

export default function NextgenTokenAbout(props: Readonly<Props>) {
  const account = useAccount();
  const [ownerENS, setOwnerENS] = useState<string>();
  const [ownerProfileHandle, setOwnerProfileHandle] = useState<string>();

  useEffect(() => {
    commonApiFetch<IProfileAndConsolidations>({
      endpoint: `profiles/${props.token.owner}`,
    }).then((profile) => {
      if (profile.profile?.handle) {
        setOwnerProfileHandle(profile.profile.handle);
      }
    });
  }, [props.token.owner]);

  useEnsName({
    address: props.token.owner as `0x${string}`,
    chainId: mainnet.id,
    onSettled(data: any, error: any) {
      if (data) {
        setOwnerENS(data);
      }
    },
  });

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
          <span className="font-color-h">Owner:</span>
          <span className="d-flex gap-1 align-items-center">
            {(props.token.burnt || isNullAddress(props.token.owner)) && (
              <Tippy content={"Burnt"} theme={"light"} delay={100}>
                <FontAwesomeIcon
                  icon="fire"
                  style={{ height: "22px", color: "#c51d34" }}
                />
              </Tippy>
            )}
            <Address
              wallets={[props.token.owner as `0x${string}`]}
              display={ownerProfileHandle ?? ownerENS}
            />
            {areEqualAddresses(props.token.owner, account.address) && (
              <span>(you)</span>
            )}
          </span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1 align-items-center">
          <span className="font-color-h">Marketplaces:</span>
          <span className="d-flex align-items-center gap-2 pt-1">
            <span>
              <Tippy content={"Opensea"} theme={"light"} delay={250}>
                <a
                  href={getOpenseaLink(NEXTGEN_CHAIN_ID, props.token.id)}
                  target="_blank"
                  rel="noreferrer">
                  <Image
                    className={styles.marketplace}
                    src="/opensea.png"
                    alt="opensea"
                    width={28}
                    height={28}
                  />
                </a>
              </Tippy>
            </span>
          </span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Collection:</span>
          <span>
            <a
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}`}>
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
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Image Licence:</span>
          <span>{props.collection.licence}</span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex flex-column gap-2">
          <span className="font-color-h">Rendered Versions:</span>
          <NextGenTokenDownload token={props.token} quality={Quality["2K"]} />
          <NextGenTokenDownload token={props.token} quality={Quality["4K"]} />
          <NextGenTokenDownload token={props.token} quality={Quality["8K"]} />
          <NextGenTokenDownload token={props.token} quality={Quality["16K"]} />
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Order Print:</span>
          <span>Coming Soon</span>
        </Col>
      </Row>
      <Row>
        <Col className="pb-3 d-flex gap-1">
          <span className="font-color-h">Visualize:</span>
          <span>Coming Soon</span>
        </Col>
      </Row>
    </Container>
  );
}

export function TraitScore(
  props: Readonly<{
    trait: string;
    score: number;
    rank: number;
    places?: number;
  }>
) {
  return (
    <span className="d-flex flex-column">
      <span className="font-color-h">{props.trait}</span>
      <span className="d-flex gap-3">
        <span>
          Score{" "}
          {Number(props.score.toFixed(props.places ?? 2)).toLocaleString()}
        </span>
        <span>|</span>
        <span>Rank #{props.rank.toLocaleString()}</span>
      </span>
    </span>
  );
}
