import styles from "../NextGen.module.scss";

import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { areEqualAddresses, isNullAddress } from "../../../../helpers/Helpers";
import Address from "../../../address/Address";
import { useState, useEffect } from "react";
import { useAccount, useEnsName, mainnet } from "wagmi";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { commonApiFetch } from "../../../../services/api/common-api";
import { goerli, sepolia } from "viem/chains";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../../nextgen_contracts";
import Image from "next/image";
import Tippy from "@tippyjs/react";
import { getOpenseaLink } from "../../nextgen_helpers";

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
        <Col xs={6} sm={4} md={3} className="pb-4 d-flex gap-5">
          <TraitScore
            trait="Rarity Score"
            score={props.token.rarity_score}
            rank={props.token.rarity_score_rank}
          />
        </Col>
        <Col xs={6} sm={4} md={3} className="pb-4 d-flex gap-5">
          <TraitScore
            trait="Normalized Rarity Score"
            score={props.token.rarity_score_normalised}
            rank={props.token.rarity_score_normalised_rank}
          />
        </Col>
        <Col xs={6} sm={4} md={3} className="pb-4 d-flex gap-5">
          <TraitScore
            trait="Statistical Score"
            score={props.token.statistical_score}
            rank={props.token.statistical_score_rank}
            places={3}
          />
        </Col>
      </Row>
      <Row>
        <Col xs={6} sm={4} md={3} className="pb-4 d-flex flex-column">
          <span className="font-color-h">Contract Token ID</span>
          <span>#{props.token.id}</span>
        </Col>
        <Col xs={6} sm={4} md={3} className="pb-4 d-flex flex-column">
          <span className="font-color-h">Collection</span>
          <a href={`/nextgen/collection/${props.collection.id}`}>
            #{props.collection.id} {props.collection.name}
          </a>
        </Col>
        <Col xs={6} sm={4} md={3} className="pb-4 d-flex flex-column">
          <span className="font-color-h">Artist</span>
          <a href={`/${props.collection.artist_address}`}>
            {props.collection.artist}
          </a>
        </Col>
        <Col xs={6} sm={4} md={3} className="pb-4 d-flex flex-column">
          <span className="font-color-h">Owner</span>
          <span className="d-flex gap-2 align-items-center">
            {(props.token.burnt || isNullAddress(props.token.owner)) && (
              <FontAwesomeIcon
                icon="fire"
                style={{ height: "22px", color: "#c51d34" }}
              />
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
        <Col xs={6} sm={4} md={3} className="pb-4 d-flex flex-column">
          <span className="font-color-h">Metadata</span>
          <span className="d-flex align-items-center gap-1">
            <span>{props.collection.on_chain ? "On-Chain" : "Off-Chain"}</span>
            <a href={props.token.metadata_url} target="_blank" rel="noreferrer">
              <FontAwesomeIcon
                className={styles.copyIcon}
                icon="external-link-square"></FontAwesomeIcon>
            </a>
          </span>
        </Col>
        <Col xs={6} sm={4} md={3} className="pb-4 d-flex flex-column">
          <span className="font-color-h">License</span>
          <span>{props.collection.licence}</span>
        </Col>
        <Col xs={6} sm={4} md={3} className="pb-4 d-flex flex-column">
          <span className="font-color-h">Marketplaces</span>
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
      <span className="d-flex gap-2">
        <span>
          {Number(props.score.toFixed(props.places ?? 2)).toLocaleString()}
        </span>
        <span>#{props.rank.toLocaleString()}</span>
      </span>
    </span>
  );
}
