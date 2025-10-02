"use client";

import styles from "./Rememes.module.scss";

import { publicEnv } from "@/config/env";
import { useTitle } from "@/contexts/TitleContext";
import { faExternalLink, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import { useEnsName } from "wagmi";
import { MEMES_CONTRACT, OPENSEA_STORE_FRONT_CONTRACT } from "@/constants";
import { DBResponse } from "@/entities/IDBResponse";
import { NFT, Rememe } from "@/entities/INFT";
import {
  areEqualAddresses,
  formatAddress,
  isIPFS,
  isUrl,
  numberWithCommas,
  parseIpfsUrl,
  parseNftDescriptionToHtml,
} from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import Address from "../address/Address";
import { useCookieConsent } from "../cookies/CookieConsentContext";
import DotLoader from "../dotLoader/DotLoader";
import NFTImage from "../nft-image/NFTImage";
import RememeImage from "../nft-image/RememeImage";
import NFTMarketplaceLinks from "../nft-marketplace-links/NFTMarketplaceLinks";
import NFTAttributes from "../nftAttributes/NFTAttributes";
import NothingHereYetSummer from "../nothingHereYet/NothingHereYetSummer";
import ArtistProfileHandle from "../the-memes/ArtistProfileHandle";

interface Props {
  contract: string;
  id: string;
}

enum Tabs {
  LIVE = "Live",
  METADATA = "Metadata",
  REFERENCES = "References",
}

export function printMemeReferences(
  memes: NFT[],
  routerPath: string,
  memesLoaded: boolean = true,
  hideTitle: boolean = false
) {
  return (
    <Row className="pt-2">
      {!hideTitle && (
        <Col xs={12} className="pt-2">
          <h1>
            <span className="font-lightest">The Memes</span> References
          </h1>
        </Col>
      )}
      {memesLoaded ? (
        <>
          {memes.length > 0 ? (
            <>
              {memes.map((nft) => {
                return (
                  <Col
                    key={`${nft.contract}-${nft.id}`}
                    className="pt-3 pb-3"
                    xs={{ span: 6 }}
                    sm={{ span: 4 }}
                    md={{ span: 3 }}
                    lg={{ span: 3 }}>
                    <a
                      href={`/${routerPath}/${nft.id}`}
                      className="decoration-none scale-hover">
                      <Container fluid className="no-padding">
                        <Row>
                          <Col>
                            <NFTImage
                              nft={nft}
                              animation={false}
                              height={300}
                              showBalance={false}
                              showThumbnail={true}
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
                          <Col className="text-center pt-2">
                            Artist Name: {nft.artist}
                          </Col>
                        </Row>
                        <Row>
                          <Col className="text-center pt-2">
                            Artist Profile: <ArtistProfileHandle nft={nft} />
                          </Col>
                        </Row>
                      </Container>
                    </a>
                  </Col>
                );
              })}
            </>
          ) : (
            <Col>
              <NothingHereYetSummer />
            </Col>
          )}
        </>
      ) : (
        <Col>
          Fetching references <DotLoader />
        </Col>
      )}
    </Row>
  );
}

export default function RememePage(props: Readonly<Props>) {
  const { setTitle } = useTitle();
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const [rememe, setRememe] = useState<Rememe>();

  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.LIVE);

  const [memes, setMemes] = useState<NFT[]>([]);

  useEffect(() => {
    if (props.contract && props.id) {
      fetchUrl(
        `${publicEnv.API_ENDPOINT}/api/rememes?contract=${props.contract}&id=${props.id}`
      ).then((response: DBResponse) => {
        if (response.data.length === 1) {
          setRememe(response.data[0]);
          if (response.data[0].metadata?.name) {
            const title = `${response.data[0].metadata.name} | ReMemes | 6529.io`;
            setTitle(title);
          }
        }
      });
    }
  }, [props.contract, props.id]);

  useEffect(() => {
    if (rememe) {
      fetchAllPages(
        `${
          publicEnv.API_ENDPOINT
        }/api/nfts?contract=${MEMES_CONTRACT}&id=${rememe.meme_references.join(
          ","
        )}`
      ).then((responseNfts: NFT[]) => {
        setMemes(responseNfts.sort((a, b) => a.id - b.id));
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
        return printMemeReferences(memes, "the-memes");
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
                      rel="noopener noreferrer">
                      <Image
                        unoptimized
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
                          icon={faGlobe}
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
                        href={`https://x.com/${rememe.contract_opensea_data.twitterUsername}`}
                        target="_blank"
                        rel="noopener noreferrer">
                        <Image
                          unoptimized
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
                {(!capacitor.isIos || country === "US") && (
                  <Row className="pt-5">
                    <Col>
                      <NFTMarketplaceLinks
                        contract={rememe.contract}
                        id={rememe.id}
                      />
                    </Col>
                  </Row>
                )}
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
                        <Link href={`/rememes/${rememe.contract}/${rep}`}>
                          #{rep}
                        </Link>
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
          rel="noopener noreferrer"
          className={`d-inline-flex align-items-center justify-content-start ${styles.userLink}`}>
          {s}
          <FontAwesomeIcon icon={faExternalLink} className={styles.linkIcon} />
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
                        rel="noopener noreferrer"
                        className={`d-inline-flex align-items-center justify-content-start ${styles.userLink}`}>
                        {rememe.token_uri}
                        <FontAwesomeIcon
                          icon={faExternalLink}
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

  return (
    <Container fluid className={styles.mainContainer}>
      <Row>
        <Col>
          <Container className="pt-4 pb-4">
            <Row className="pt-2 pb-2">
              <Col>
                <Image
                  unoptimized
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
