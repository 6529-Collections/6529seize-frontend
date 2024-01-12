import styles from "./NextGen.module.scss";
import { mainnet, useAccount, useContractRead, useEnsName } from "wagmi";
import { Col, Container, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import { NextGenTokenImage } from "./NextGenTokenImage";
import Address from "../../address/Address";
import Image from "next/image";
import { goerli } from "wagmi/chains";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextgen_contracts";
import NextGenCollectionHeader from "./collectionParts/NextGenCollectionHeader";
import { areEqualAddresses, isUrl } from "../../../helpers/Helpers";
import {
  useSharedState,
  useCollectionPhasesHook,
  useCollectionAdditionalHook,
  useCollectionInfoHook,
} from "../nextgen_helpers";
import DotLoader from "../../dotLoader/DotLoader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { IAttribute } from "../../../entities/INFT";
import { NextGenCollection, NextGenToken } from "../../../entities/INextgen";
import { fetchUrl } from "../../../services/6529api";
import { commonApiFetch } from "../../../services/api/common-api";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import NextGenTokenProvenance from "./collectionParts/NextGenTokenProvenance";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

export default function NextGenToken(props: Readonly<Props>) {
  const account = useAccount();

  const [ownerENS, setOwnerENS] = useState<string>();
  const [attributes, setAttributes] = useState<IAttribute[]>([]);
  const [codeCopied, setCodeCopied] = useState(false);

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

  function printToken() {
    return (
      <>
        <Container fluid className={`${styles.tokenContainer} pt-4 pb-4`}>
          <Row>
            <Col>
              <Container>
                <Row>
                  <Col className="d-flex align-items-center justify-content-between">
                    <h2>{props.token.name}</h2>
                    <span className="d-flex gap-4">
                      <a
                        href={`https://${
                          NEXTGEN_CHAIN_ID === goerli.id
                            ? `testnets.opensea`
                            : `opensea`
                        }.io/assets/${
                          NEXTGEN_CHAIN_ID === goerli.id ? `goerli` : `ethereum`
                        }/${NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}/${props.token.id}`}
                        target="_blank"
                        rel="noreferrer">
                        <Image
                          className={styles.marketplace}
                          src="/opensea.png"
                          alt="opensea"
                          width={32}
                          height={32}
                        />
                      </a>
                    </span>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col className="text-center">
                    <NextGenTokenImage
                      token={props.token}
                      hide_info={true}
                      hide_link={true}
                      show_animation={true}
                    />
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
        <Container className="pt-3 pb-3">
          <Row>
            <Col>
              <h4>About</h4>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex align-items-center gap-5">
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Token ID</span>
                <span>#{props.token.id}</span>
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Collection</span>
                <a href={`/nextgen/collection/${props.collection.id}`}>
                  #{props.collection.id} {props.collection.name}
                </a>
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Artist</span>
                <a href={`/${props.collection.artist_address}`}>
                  {props.collection.artist}
                </a>
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
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
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Metadata</span>
                <span className="d-flex align-items-center gap-1">
                  <span>
                    {props.collection.on_chain ? "On-Chain" : "Off-Chain"}{" "}
                    <a
                      href={props.token.metadata_url}
                      target="_blank"
                      rel="noreferrer">
                      <FontAwesomeIcon
                        className={styles.copyIcon}
                        icon="external-link-square"></FontAwesomeIcon>
                    </a>
                  </span>
                </span>
              </span>
            </Col>
          </Row>
        </Container>
        <Container className="pt-3 pb-3">
          {attributes.length > 0 && (
            <Row>
              <Col>
                <Container className="no-padding">
                  <Row>
                    <Col>
                      <h4>Properties</h4>
                    </Col>
                  </Row>
                  <Row>
                    {attributes.map((a) => (
                      <Col
                        key={a.trait_type}
                        xs={{ span: 6 }}
                        sm={{ span: 3 }}
                        md={{ span: 2 }}
                        lg={{ span: 2 }}
                        className="pt-2 pb-2">
                        <Container>
                          <Row>
                            <Col className={styles.nftAttribute}>
                              <span>{a.trait_type}</span>
                              <br />
                              <span title={a.value}>{a.value}</span>
                            </Col>
                          </Row>
                        </Container>
                      </Col>
                    ))}
                  </Row>
                </Container>
              </Col>
            </Row>
          )}
        </Container>
        <Container className="pt-3 pb-3">
          <Row>
            <Col>
              <NextGenTokenProvenance token_id={props.token.id} />
            </Col>
          </Row>
        </Container>
      </>
    );
  }

  return (
    <>
      <Container className="pt-4 pb-4">
        <NextGenCollectionHeader
          collection={props.collection}
          collection_link={true}
        />
      </Container>
      {printToken()}
    </>
  );
}
