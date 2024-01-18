import styles from "../NextGen.module.scss";

import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { areEqualAddresses } from "../../../../helpers/Helpers";
import Address from "../../../address/Address";
import { useState, useEffect } from "react";
import { useAccount, useEnsName, mainnet } from "wagmi";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { commonApiFetch } from "../../../../services/api/common-api";
import { goerli, sepolia } from "viem/chains";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../../nextgen_contracts";
import Image from "next/image";

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
        <Col xs={12} className="pt-1 pb-1 d-flex flex-column">
          <span className="font-color-h">Token ID</span>
          <span>#{props.token.id}</span>
        </Col>
        <Col xs={12} className="pt-1 pb-1 d-flex flex-column">
          <span className="font-color-h">Collection</span>
          <a href={`/nextgen/collection/${props.collection.id}`}>
            #{props.collection.id} {props.collection.name}
          </a>
        </Col>
        <Col xs={12} className="pt-1 pb-1 d-flex flex-column">
          <span className="font-color-h">Artist</span>
          <a href={`/${props.collection.artist_address}`}>
            {props.collection.artist}
          </a>
        </Col>
        <Col xs={12} className="pt-1 pb-1 d-flex flex-column">
          <span className="font-color-h">Owner</span>
          <span className="d-flex">
            <Address
              wallets={[props.token.owner as `0x${string}`]}
              display={ownerProfileHandle ?? ownerENS}
            />
            {areEqualAddresses(props.token.owner, account.address) && (
              <span>(you)</span>
            )}
          </span>
        </Col>
        <Col xs={12} className="pt-1 pb-1 d-flex flex-column">
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
        <Col xs={12} className="pt-1 pb-1 d-flex flex-column">
          <span className="font-color-h">Licence</span>
          <span>{props.collection.licence}</span>
        </Col>
        <Col xs={12} className="pt-1 pb-1 d-flex flex-column">
          <span className="font-color-h">Marketplaces</span>
          <span className="d-flex align-items-center gap-1 pt-1">
            <span>
              <a
                href={`https://${
                  NEXTGEN_CHAIN_ID === sepolia.id ||
                  NEXTGEN_CHAIN_ID === goerli.id
                    ? `testnets.opensea`
                    : `opensea`
                }.io/assets/${
                  NEXTGEN_CHAIN_ID === sepolia.id
                    ? `sepolia`
                    : NEXTGEN_CHAIN_ID === goerli.id
                    ? `goerli`
                    : `ethereum`
                }/${NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}/${props.token.id}`}
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
            </span>
          </span>
        </Col>
      </Row>
    </Container>
  );
}
