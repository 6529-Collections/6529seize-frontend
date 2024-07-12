import styles from "./Rememes.module.scss";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { NFT, Rememe } from "../../entities/INFT";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import RememeImage from "../nft-image/RememeImage";
import { useEnsName } from "wagmi";
import Address from "../address/Address";
import { MEMES_CONTRACT, OPENSEA_STORE_FRONT_CONTRACT } from "../../constants";
import NFTImage from "../nft-image/NFTImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  areEqualAddresses,
  formatAddress,
  isIPFS,
  isUrl,
  numberWithCommas,
  parseIpfsUrl,
  parseNftDescriptionToHtml,
} from "../../helpers/Helpers";
import NFTAttributes from "../nftAttributes/NFTAttributes";

interface Props {
  contract: string;
  id: string;
}

enum Tabs {
  LIVE = "Live",
  METADATA = "Metadata",
  REFERENCES = "References",
}

export default function RememePage(props: Readonly<Props>) {
  const [rememe, setRememe] = useState<Rememe>();

  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.LIVE);

  const [memes, setMemes] = useState<NFT[]>([]);
  const [memesLoaded, setMemesLoaded] = useState(false);

  useEffect(() => {
    if (props.contract && props.id) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/rememes?contract=${props.contract}&id=${props.id}`
      ).then((response: DBResponse) => {
        if (response.data.length === 1) {
          setRememe(response.data[0]);
        }
      });
    }
  }, [props.contract, props.id]);

  useEffect(() => {
    if (rememe) {
      fetchAllPages(
        `${
          process.env.API_ENDPOINT
        }/api/nfts?contract=${MEMES_CONTRACT}&id=${rememe.meme_references.join(
          ","
        )}`
      ).then((responseNfts: NFT[]) => {
        setMemes(responseNfts.sort((a, b) => a.id - b.id));
        setMemesLoaded(true);
      });
    }
  }, [rememe]);

  const ensResolutionDeployer = useEnsName({
    address: rememe ? (rememe.deployer as `0x${string}`) : undefined,
    query: { enabled: rememe != undefined },
    chainId: 1,
  });

  const ensResolutionAddedBy = useEnsName({
    address: rememe ? (rememe.added_by as `0x${string}`) : undefined,
    query: { enabled: rememe != undefined },
    chainId: 1,
  });

  function printContent() {
    switch (activeTab) {
      case Tabs.LIVE:
        return printLive();
      case Tabs.METADATA:
        return printMetadata();
      case Tabs.REFERENCES:
        return printReferences();
    }
  }

  function printLive() {
    if (rememe) {
      return (
        <>
          <Row className="pt-4">
            <Col sm={12} md={6}>
              <RememeImage nft={rememe} animation={true} height={650} />
            </Col>
            <Col sm={12} md={6}>
              <Container>
                <Row>
                  <Col className="font-color-h d-flex justify-content-start gap-2">
                    {areEqualAddresses(
                      rememe.contract,
                      OPENSEA_STORE_FRONT_CONTRACT
                    ) ? (
                      <span>{rememe.contract_opensea_data.collectionName}</span>
                    ) : (
                      <>
                        <span>
                          {rememe.contract_opensea_data.collectionName
                            ? rememe.contract_opensea_data.collectionName
                            : formatAddress(rememe.contract)}{" "}
                          #{rememe.id}
                        </span>
                      </>
                    )}
                  </Col>
                </Row>
                {!areEqualAddresses(
                  rememe.contract,
                  OPENSEA_STORE_FRONT_CONTRACT
                ) && (
                  <Row className="pt-3">
                    <Col>
                      created by{" "}
                      <Address
                        wallets={[rememe.deployer as `0x${string}`]}
                        display={
                          ensResolutionDeployer.data
                            ? ensResolutionDeployer.data
                            : undefined
                        }
                      />
                    </Col>
                  </Row>
                )}
                {rememe.added_by &&
                  !areEqualAddresses(rememe.deployer, rememe.added_by) && (
                    <Row className="pt-3">
                      <Col>
                        added by{" "}
                        <Address
                          wallets={[rememe.added_by as `0x${string}`]}
                          display={
                            ensResolutionAddedBy.data
                              ? ensResolutionAddedBy.data
                              : undefined
                          }
                        />
                      </Col>
                    </Row>
                  )}
                <Row className="pt-4">
                  <Col>
                    <a
                      className={styles.userLink}
                      href={`https://etherscan.io/token/${rememe.contract}/?a=${rememe.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <Image
                        width="0"
                        height="0"
                        style={{ width: "30px", height: "auto" }}
                        src="/etherscan_w.png"
                        alt={`etherscan`}
                      />
                      {rememe.contract_opensea_data.collectionName
                        ? rememe.contract_opensea_data.collectionName
                        : formatAddress(rememe.contract)}
                    </a>
                  </Col>
                </Row>
                {rememe.contract_opensea_data.externalUrl && (
                  <Row className="pt-4">
                    <Col>
                      <a
                        className={styles.userLink}
                        href={rememe.contract_opensea_data.externalUrl}>
                        <FontAwesomeIcon
                          icon="globe"
                          className={styles.globeIcon}
                        />
                        {rememe.contract_opensea_data.externalUrl}
                      </a>
                    </Col>
                  </Row>
                )}
                {rememe.contract_opensea_data.twitterUsername && (
                  <Row className="pt-4">
                    <Col>
                      <a
                        className={styles.userLink}
                        href={`https://twitter.com/${rememe.contract_opensea_data.twitterUsername}`}
                        target="_blank"
                        rel="noreferrer">
                        <Image
                          width="0"
                          height="0"
                          style={{ width: "30px", height: "auto" }}
                          src="/twitter.png"
                          alt={`${rememe.contract_opensea_data.twitterUsername} Twitter`}
                        />
                        &#64;
                        {rememe.contract_opensea_data.twitterUsername}
                      </a>
                    </Col>
                  </Row>
                )}
                <Row className="pt-5">
                  <Col>
                    <a
                      href={`https://opensea.io/assets/ethereum/${props.contract}/${props.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <Image
                        className={styles.marketplaceRememe}
                        src="/opensea.png"
                        alt="opensea"
                        width={40}
                        height={40}
                      />
                    </a>
                    <a
                      href={`https://x2y2.io/eth/${props.contract}/${props.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <Image
                        className={styles.marketplaceRememe}
                        src="/x2y2.png"
                        alt="x2y2"
                        width={40}
                        height={40}
                      />
                    </a>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
          {rememe.replicas.length > 1 && (
            <>
              <Row className="pt-3">
                <Col sm={12} md={4} className="d-flex align-items-center gap-2">
                  <h1 className="mb-0">Replicas</h1>
                  <span className="font-color-h font-larger">
                    &nbsp;(x{numberWithCommas(rememe.replicas.length)})
                  </span>
                </Col>
              </Row>
              <Row>
                <Col className="font-color-h font-smaller">
                  * Replicas are tokens with identical images
                </Col>
              </Row>
              <Row className="pt-4 pb-4">
                <Col className="d-flex align-items-center justify-content-start gap-3 flex-wrap">
                  {rememe.replicas
                    .filter((rep) => rep != parseInt(rememe.id))
                    .map((rep) => (
                      <span className={styles.replica} key={`replica-rep`}>
                        <a href={`/rememes/${rememe.contract}/${rep}`}>
                          #{rep}
                        </a>
                      </span>
                    ))}
                </Col>
              </Row>
            </>
          )}
        </>
      );
    }
  }

  function getAttributes(): any[] {
    if (rememe) {
      if (Array.isArray(rememe.metadata.attributes)) {
        return rememe.metadata.attributes;
      } else if (typeof rememe.metadata.attributes === "object") {
        const outputArray = Object.entries(rememe.metadata.attributes).map(
          ([key, value]) => ({
            trait_type: key,
            value,
          })
        );
        return outputArray;
      }
    }
    return [];
  }

  function printValue(s: string) {
    if (isUrl(s) || isIPFS(s)) {
      return (
        <a
          href={parseIpfsUrl(s)}
          target="_blank"
          rel="noreferrer"
          className={`d-inline-flex align-items-center justify-content-start ${styles.userLink}`}>
          {s}
          <FontAwesomeIcon icon="external-link" className={styles.linkIcon} />
        </a>
      );
    }
    return s;
  }

  function printMetadata() {
    if (rememe) {
      return (
        <>
          <Row className="pt-4">
            <Col>
              <Table className={styles.metadataTable}>
                <tbody>
                  <tr>
                    <td className={styles.metadataTableNoBreak}>Token URI</td>
                    <td className={styles.metadataTableBreak}>
                      <a
                        href={rememe.token_uri}
                        target="_blank"
                        rel="noreferrer"
                        className={`d-inline-flex align-items-center justify-content-start ${styles.userLink}`}>
                        {rememe.token_uri}
                        <FontAwesomeIcon
                          icon="external-link"
                          className={styles.linkIcon}
                        />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.metadataTableNoBreak}>Token Type</td>
                    <td className={styles.metadataTableBreak}>
                      {rememe.token_type}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          <Row className="pt-4">
            <Col xs={12}>
              <h1>Description</h1>
            </Col>
            <Col
              xs={12}
              dangerouslySetInnerHTML={{
                __html: parseNftDescriptionToHtml(rememe.metadata.description),
              }}></Col>
          </Row>
          <Row className="pt-4">
            <Col xs={12}>
              <h1>Metadata</h1>
            </Col>
            <Col xs={12}>
              <Table className={styles.metadataTable}>
                <tbody>
                  {Object.keys(rememe.metadata).map((k) => {
                    const value: any = rememe.metadata[k];
                    if (typeof value === "string") {
                      if (k != "name" && k != "description") {
                        return (
                          <tr key={k}>
                            <td>{k}</td>
                            <td>{printValue(value)}</td>
                          </tr>
                        );
                      }
                    } else {
                      if (k !== "attributes") {
                        return Object.keys(value).map((j: any) => {
                          if (typeof value[j] === "string") {
                            return (
                              <tr key={j}>
                                <td>
                                  {k}::{j}
                                </td>
                                <td>{value[j]}</td>
                              </tr>
                            );
                          }
                        });
                      }
                    }
                  })}
                </tbody>
              </Table>
            </Col>
          </Row>
          {rememe.metadata.attributes && (
            <Row className="pt-4">
              <Col xs={12}>
                <h1>Attributes</h1>
              </Col>
              <NFTAttributes attributes={getAttributes()} />
            </Row>
          )}
        </>
      );
    }
  }

  function printReferences() {
    return (
      <Row className="pt-4">
        <Col xs={12}>
          <h1>
            <span className="font-lightest">The Memes</span> References
          </h1>
        </Col>
        {memes.map((nft) => (
          <Col
            key={`${nft.contract}-${nft.id}`}
            className="pt-3 pb-3"
            xs={{ span: 6 }}
            sm={{ span: 4 }}
            md={{ span: 3 }}
            lg={{ span: 3 }}>
            <a
              href={`/the-memes/${nft.id}`}
              className="decoration-none scale-hover">
              <Container fluid className="no-padding">
                <Row>
                  <Col>
                    <NFTImage
                      nft={nft}
                      animation={false}
                      height={300}
                      balance={0}
                      showThumbnail={true}
                      showUnseized={false}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col className="text-center pt-2">
                    <b>
                      #{nft.id} - {nft.name}
                    </b>
                  </Col>
                </Row>
                <Row>
                  <Col className="text-center pt-2">Artist: {nft.artist}</Col>
                </Row>
              </Container>
            </a>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Container fluid className={styles.mainContainer}>
      <Row>
        <Col>
          <Container className="pt-4 pb-4">
            <Row className="pt-2 pb-2">
              <Col>
                <Image
                  loading={"eager"}
                  width="0"
                  height="0"
                  style={{ width: "250px", height: "auto" }}
                  src="/re-memes.png"
                  alt="re-memes"
                />
              </Col>
            </Row>
            {rememe && (
              <>
                <Row className="pt-4">
                  <Col>
                    <h2>
                      {rememe.metadata.name
                        ? rememe.metadata.name
                        : `${formatAddress(rememe.contract)} #${rememe.id}`}
                    </h2>
                  </Col>
                </Row>
                <Row className="pt-2">
                  <Col>
                    {Object.values(Tabs).map((k) => (
                      <span
                        className={`${styles.tabFocus} ${
                          activeTab === k ? styles.tabActive : ""
                        }`}
                        key={`${k}-tab`}
                        onClick={() => setActiveTab(k)}>
                        {k}
                      </span>
                    ))}
                  </Col>
                </Row>
                {printContent()}
              </>
            )}
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
