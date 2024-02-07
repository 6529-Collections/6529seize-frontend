import styles from "./6529Gradient.module.scss";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Row, Col, Table } from "react-bootstrap";
import { GRADIENT_CONTRACT } from "../../constants";
import { DBResponse } from "../../entities/IDBResponse";
import { NFT } from "../../entities/INFT";
import {
  areEqualAddresses,
  enterArtFullScreen,
  fullScreenSupported,
  numberWithCommas,
  printMintDate,
} from "../../helpers/Helpers";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import LatestActivityRow from "../latest-activity/LatestActivityRow";
import { Transaction } from "../../entities/ITransaction";
import { useRouter } from "next/router";
import { Owner } from "../../entities/IOwner";
import { fetchUrl } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import Address from "../address/Address";

interface Props {
  wallets: string[];
}

export default function GradientPage(props: Readonly<Props>) {
  const router = useRouter();

  const [nftId, setNftId] = useState<string>();
  const [fullscreenElementId, setFullscreenElementId] = useState<string>(
    "the-art-fullscreen-img"
  );

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const [nft, setNft] = useState<NFT>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [nftOwner, setNftOwner] = useState<Owner>();

  const [collectionCount, setCollectionCount] = useState(-1);
  const [collectionRank, setCollectionRank] = useState(-1);

  const [nfts, setNfts] = useState<NFT[]>([]);

  useEffect(() => {
    if (router.isReady) {
      if (router.query.id) {
        setNftId(router.query.id as string);
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    if (nftId) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/nfts?id=${nftId}&contract=${GRADIENT_CONTRACT}`
      ).then((response: DBResponse) => {
        setNft(response.data[0]);
        setBreadcrumbs([
          { display: "Home", href: "/" },
          { display: "6529 Gradient", href: "/6529-gradient" },
          { display: `${response.data[0].name}` },
        ]);
      });
    } else {
      setBreadcrumbs([
        { display: "Home", href: "/" },
        { display: "6529 Gradient", href: "/6529-gradient" },
        { display: `${nftId}` },
      ]);
    }
  }, [nftId]);

  useEffect(() => {
    if (nftId) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/owners?id=${nftId}&contract=${GRADIENT_CONTRACT}`
      ).then((response: DBResponse) => {
        setNftOwner(response.data[0]);
      });
    }
  }, [nftId]);

  useEffect(() => {
    async function fetchNfts(url: string, mynfts: NFT[]) {
      return fetchUrl(url).then((response: DBResponse) => {
        if (response.next) {
          fetchNfts(response.next, [...mynfts].concat(response.data));
        } else {
          const newnfts = [...mynfts]
            .concat(response.data)
            .filter((value, index, self) => {
              return self.findIndex((v) => v.id === value.id) === index;
            });

          const rankedNFTs = newnfts.sort((a, b) =>
            a.tdh_rank > b.tdh_rank ? 1 : -1
          );
          setNfts(newnfts);
          setCollectionCount(newnfts.length);
          if (nftId) {
            setCollectionRank(
              rankedNFTs.map((r) => r.id).indexOf(parseInt(nftId)) + 1
            );
          }
        }
      });
    }
    if (router.isReady && nftId) {
      const initialUrlNfts = `${process.env.API_ENDPOINT}/api/nfts/gradients?&page_size=101`;
      fetchNfts(initialUrlNfts, []);
    }
  }, [router.isReady, nftId]);

  useEffect(() => {
    if (nftId) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/transactions?contract=${GRADIENT_CONTRACT}&id=${nftId}`
      ).then((response: DBResponse) => {
        setTransactions(response.data);
      });
    }
  }, [nftId]);

  function printLive() {
    return (
      <>
        <Row>
          <Col
            xs={{ span: 12 }}
            sm={{ span: 12 }}
            md={{ span: 6 }}
            lg={{ span: 6 }}
            className="pt-2 position-relative">
            {nft && fullScreenSupported() && printFullScreen()}
            {nft && (
              <NFTImage
                id={fullscreenElementId}
                nft={nft}
                animation={false}
                height={650}
                balance={0}
                showOwned={
                  props.wallets.length > 0 &&
                  nftOwner &&
                  props.wallets.some((w) =>
                    areEqualAddresses(w, nftOwner.wallet)
                  )
                }
                showUnseized={false}
              />
            )}
          </Col>
          {nft && (
            <Col
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 6 }}
              lg={{ span: 6 }}
              className="pt-2">
              <Container>
                <Row>
                  <Col>
                    <h3>Owner</h3>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <h4 className={styles.subheading}>
                      {nftOwner &&
                      props.wallets.some((w) =>
                        areEqualAddresses(w, nftOwner.wallet)
                      )
                        ? "*"
                        : ""}
                      {nftOwner && (
                        <Address
                          wallets={[nftOwner.wallet]}
                          display={nftOwner.wallet_display}
                        />
                      )}
                    </h4>
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col>
                    <h3>NFT</h3>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Table bordered={false} className={styles.gradientTable}>
                      <tbody>
                        <tr>
                          <td>Mint Date</td>
                          <td>{printMintDate(nft.mint_date)}</td>
                        </tr>
                        <tr>
                          <td>TDH Rate</td>
                          <td>
                            {numberWithCommas(
                              Math.round(nft.hodl_rate * 100) / 100
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td>Floor Price</td>
                          <td>
                            {nft.floor_price > 0
                              ? `${numberWithCommas(
                                  Math.round(nft.floor_price * 100) / 100
                                )} ETH`
                              : `N/A`}
                          </td>
                        </tr>
                        <tr>
                          <td>Market Cap</td>
                          <td>
                            {nft.market_cap > 0
                              ? `${numberWithCommas(
                                  Math.round(nft.market_cap * 100) / 100
                                )} ETH`
                              : `N/A`}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    <Row className="pt-2">
                      <Col>
                        <h3>TDH</h3>
                      </Col>
                    </Row>
                    <Table bordered={false} className={styles.gradientTable}>
                      <tbody>
                        <tr>
                          <td>TDH</td>
                          <td>
                            {numberWithCommas(
                              Math.round(nft.boosted_tdh * 100) / 100
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td>Unweighted TDH</td>
                          <td>
                            {numberWithCommas(
                              Math.round(nft.tdh__raw * 100) / 100
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td>Gradient Rank</td>
                          <td>
                            {collectionRank > -1 && collectionCount > -1
                              ? `${collectionRank}/${collectionCount}`
                              : "..."}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col>
                    <a
                      href={`https://opensea.io/assets/ethereum/${GRADIENT_CONTRACT}/${nft.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <Image
                        className={styles.marketplace}
                        src="/opensea.png"
                        alt="opensea"
                        width={40}
                        height={40}
                      />
                    </a>
                    {/* <a
                      href={`https://looksrare.org/collections/${GRADIENT_CONTRACT}/${nft.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <Image
                        className={styles.marketplace}
                        src="/looksrare.png"
                        alt="looksrare"
                        width={40}
                        height={40}
                      />
                    </a> */}
                    <a
                      href={`https://x2y2.io/eth/${GRADIENT_CONTRACT}/${nft.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <Image
                        className={styles.marketplace}
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
          )}
        </Row>
        {transactions.length > 0 && (
          <>
            <Row className="pt-5">
              <Col>
                <h3>Transaction History</h3>
              </Col>
            </Row>
            <Row className={`pt-3 ${styles.transactionsScrollContainer}`}>
              <Col>
                <Table bordered={false} className={styles.transactionsTable}>
                  <tbody>
                    {transactions.map((tr) => (
                      <LatestActivityRow
                        nft={nfts.find((n) => n.id === tr.token_id)}
                        tr={tr}
                        key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
                      />
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </>
        )}
      </>
    );
  }

  function printFullScreen() {
    return (
      <FontAwesomeIcon
        icon="expand-alt"
        className={styles.fullScreen}
        onClick={() =>
          fullscreenElementId && enterArtFullScreen(fullscreenElementId)
        }
      />
    );
  }

  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container fluid className={styles.mainContainer}>
        <Row>
          <Col>
            <Container className="pt-4 pb-4">
              <Row>
                <Col>
                  <h1>6529 Gradient</h1>
                </Col>
              </Row>
              <Row className="pt-2">
                <Col>
                  <h2 className={styles.subheading}>{nft?.name}</h2>
                </Col>
              </Row>
              {nft && (
                <>
                  <Row className="pt-2">
                    <Col>
                      {nftId && (
                        <>
                          <h2>
                            <a
                              href={`/6529-gradient/${parseInt(nftId) - 1}`}
                              className={`${styles.nextPreviousNft} ${
                                parseInt(nftId) === 0
                                  ? styles.nftPreviousdisabled
                                  : ""
                              }`}>
                              <FontAwesomeIcon icon="chevron-circle-left" />
                            </a>
                          </h2>
                          <h2>
                            &nbsp;
                            <a
                              href={`/6529-gradient/${parseInt(nftId) + 1}`}
                              className={`${styles.nextPreviousNft} ${
                                parseInt(nftId) === 100
                                  ? styles.nftPreviousdisabled
                                  : ""
                              }`}>
                              <FontAwesomeIcon icon="chevron-circle-right" />
                            </a>
                          </h2>
                        </>
                      )}
                    </Col>
                  </Row>
                  <Row className="pt-2">
                    <Col>{printLive()}</Col>
                  </Row>
                </>
              )}
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
}
