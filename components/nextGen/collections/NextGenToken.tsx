import styles from "./NextGen.module.scss";
import { mainnet, useAccount, useContractRead, useEnsName } from "wagmi";
import { Col, Container, Row } from "react-bootstrap";
import { useState } from "react";
import { NextGenTokenImage, getTokenName } from "./NextGenTokenImage";
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

interface Props {
  collection: number;
  token_id: number;
}

export default function NextGenToken(props: Readonly<Props>) {
  const account = useAccount();

  const {
    info,
    setInfo,
    phaseTimes,
    setPhaseTimes,
    additionalData,
    setAdditionalData,
  } = useSharedState();

  const [owner, setOwner] = useState<`0x${string}`>();
  const [ownerENS, setOwnerENS] = useState<string>();
  const [metadata, setMetadata] = useState<any>();
  const [attributes, setAttributes] = useState<IAttribute[]>([]);
  const [name, setName] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [codeCopied, setCodeCopied] = useState(false);

  useCollectionPhasesHook(props.collection, setPhaseTimes);
  useCollectionAdditionalHook(props.collection, setAdditionalData);
  useCollectionInfoHook(props.collection, setInfo);

  useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "ownerOf",
    watch: true,
    args: [props.token_id],
    onSettled(data: any, error: any) {
      if (data) {
        setOwner(data);
      }
    },
  });

  useEnsName({
    address: owner,
    chainId: mainnet.id,
    onSettled(data: any, error: any) {
      if (data) {
        setOwnerENS(data);
      }
    },
  });

  function printMetadata() {
    if (metadata) {
      if (isUrl(metadata)) {
        return (
          <span className="d-flex align-items-center gap-1">
            <span>Off-Chain</span>
            <a href={metadata} target="_blank" rel="noreferrer">
              <FontAwesomeIcon
                className={styles.copyIcon}
                icon="external-link-square"></FontAwesomeIcon>
            </a>
          </span>
        );
      }
      return (
        <span className="d-flex align-items-center gap-1">
          <span>On-Chain</span>
          <Tippy
            content={
              codeCopied
                ? "Copied - Paste in brower search bar to view"
                : "Copy Image Data to Clipboard"
            }
            placement={"right"}
            theme={"light"}
            hideOnClick={false}>
            <FontAwesomeIcon
              className={styles.copyIcon}
              icon="copy"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(metadata);
                  setCodeCopied(true);
                  setTimeout(() => {
                    setCodeCopied(false);
                  }, 1500);
                }
              }}></FontAwesomeIcon>
          </Tippy>
        </span>
      );
    }

    return printFetching();
  }

  function printFetching() {
    return (
      <span className="font-color-h">
        Fetching <DotLoader />
      </span>
    );
  }

  function printToken() {
    return (
      <>
        <Container fluid className={`${styles.tokenContainer} pt-4 pb-4`}>
          <Row>
            <Col>
              <Container>
                <Row>
                  <Col className="d-flex align-items-center justify-content-between">
                    <h2>
                      {getTokenName(props.collection, props.token_id, name)}
                    </h2>
                    <span className="d-flex gap-4">
                      <a
                        href={`https://${
                          NEXTGEN_CHAIN_ID === goerli.id
                            ? `testnets.opensea`
                            : `opensea`
                        }.io/assets/${
                          NEXTGEN_CHAIN_ID === goerli.id ? `goerli` : `ethereum`
                        }/${NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}/${props.token_id}`}
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
                      <a
                        href={`https://${
                          NEXTGEN_CHAIN_ID === goerli.id
                            ? `goerli.x2y2`
                            : `x2y2`
                        }.io/eth/${NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}/${
                          props.token_id
                        }`}
                        target="_blank"
                        rel="noreferrer">
                        <Image
                          className={styles.marketplace}
                          src="/x2y2.png"
                          alt="x2y2"
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
                      collection={props.collection}
                      token_id={props.token_id}
                      hide_info={true}
                      hide_link={true}
                      show_animation={true}
                      setName={setName}
                      setDescription={setDescription}
                      setMetadata={setMetadata}
                      setAttributes={setAttributes}
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
                <span>#{props.token_id}</span>
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Collection</span>
                <a href={`/nextgen/collection/${props.collection}`}>
                  #{props.collection} {info ? `- ${info.name}` : ``}
                </a>
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Artist</span>
                {info?.artist ?? printFetching()}
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Owner</span>
                {owner ? (
                  <span>
                    <Address wallets={[owner]} display={ownerENS} />
                    {areEqualAddresses(owner, account.address) && (
                      <span>(you)</span>
                    )}
                  </span>
                ) : (
                  printFetching()
                )}
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Metadata</span>
                {printMetadata()}
              </span>
            </Col>
          </Row>
        </Container>
        <Container className="pt-3 pb-3">
          <Row>
            <Col>
              <h4>Description</h4>
            </Col>
          </Row>
          <Row>
            <Col>{description ?? printFetching()}</Col>
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
      </>
    );
  }

  if (!info || !phaseTimes || !additionalData) {
    return (
      <Container className="pt-5">
        <Row>
          <Col className="text-center">
            <h4 className="mb-0 float-none">
              Fetching Token <DotLoader />
            </h4>
          </Col>
        </Row>
      </Container>
    );
  }
  return (
    <>
      <Container className="pt-4 pb-4">
        <NextGenCollectionHeader
          collection={props.collection}
          info={info}
          phase_times={phaseTimes}
          additional_data={additionalData}
          collection_link={true}
        />
      </Container>
      {printToken()}
    </>
  );
}
