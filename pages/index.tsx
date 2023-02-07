import Head from "next/head";
import styles from "../styles/Home.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import { Transaction } from "ethers";
import { MEMES_CONTRACT } from "../constants";
import { DBResponse } from "../entities/IDBResponse";
import { NFT, MemesExtendedData } from "../entities/INFT";
import Leaderboard from "../components/leaderboard/Leaderboard";
import LatestActivity from "../components/latest-activity/LatestActivity";

import dynamic from "next/dynamic";
import { getDateDisplay, numberWithCommas } from "../helpers/Helpers";
import { useAccount } from "wagmi";
import { fetchUrl } from "../services/6529api";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
});

const NFTImage = dynamic(() => import("../components/nft-image/NFTImage"), {
  ssr: false,
});

export default function Home() {
  const [nft, setNFT] = useState<NFT>();
  const [nftExtended, setnftExtended] = useState<MemesExtendedData>();
  const { address, connector, isConnected } = useAccount();
  const [nftBalance, setNftBalance] = useState<number>(0);

  const [activity, setActivity] = useState<Transaction[]>();

  useEffect(() => {
    fetchUrl(
      `${process.env.API_ENDPOINT}/api/nfts?contract=${MEMES_CONTRACT}&page_size=1`
    ).then((response: DBResponse) => {
      const nft = response.data[0];
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/memes_extended_data?id=${nft.id}`
      ).then((response: DBResponse) => {
        const nftExtended = response.data[0];
        setNFT(nft);
        setnftExtended(nftExtended);
      });
    });
  }, []);

  useEffect(() => {
    if (address && nft && nft.id) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/owners?contract=${nft.contract}&wallet=${address}&id=${nft.id}`
      ).then((response: DBResponse) => {
        if (response.data.length > 0) {
          setNftBalance(response.data[0].balance);
        }
      });
    } else {
      setNftBalance(0);
    }
  }, [address, nft]);

  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/transactions?page_size=12`).then(
      (response: DBResponse) => {
        setActivity(response.data);
      }
    );
  }, []);

  function printMintDate(nft: NFT) {
    const mintDate = new Date(nft.mint_date);
    return (
      <>
        {mintDate.toLocaleString("default", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}{" "}
        ({getDateDisplay(mintDate)})
      </>
    );
  }

  return (
    <>
      <Head>
        <title>6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Home | 6529 SEIZE" />
        <meta property="og:url" content={`${process.env.BASE_ENDPOINT}`} />
        <meta property="og:title" content="Home" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />

        {nft && nftExtended && (
          <>
            <Container className={`pt-4 ${styles.mainContainer}`}>
              <Row>
                <Col>
                  <h1>LATEST DROP</h1>
                </Col>
              </Row>
              <Row>
                <Col
                  className="pt-3 pb-3"
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 6 }}
                  lg={{ span: 6 }}>
                  <Container className="no-padding">
                    <Row>
                      {nft.animation ? (
                        <NFTImage
                          nft={nft}
                          animation={true}
                          height={650}
                          balance={nftBalance}
                        />
                      ) : (
                        <a href={`/the-memes/${nft.id}`}>
                          <NFTImage
                            nft={nft}
                            animation={true}
                            height={650}
                            balance={nftBalance}
                          />
                        </a>
                      )}
                    </Row>
                  </Container>
                </Col>
                <Col
                  className="pt-3 pb-3"
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 6 }}
                  lg={{ span: 6 }}>
                  <Container className="no-padding">
                    <Row>
                      <Col>
                        <u>
                          <h3>
                            <a href={`/the-memes/${nft.id}`}>
                              Card {nft.id} - {nft.name}
                            </a>
                          </h3>
                        </u>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <Table bordered={false}>
                          <tbody>
                            <tr>
                              <td>Edition Size</td>
                              <td>{nft.supply}</td>
                            </tr>
                            <tr>
                              <td>Collection</td>
                              <td>{nft.collection}</td>
                            </tr>
                            <tr>
                              <td>Season</td>
                              <td>{nftExtended.season}</td>
                            </tr>
                            <tr>
                              <td>Meme</td>
                              <td>{nftExtended.meme_name}</td>
                            </tr>
                            <tr>
                              <td>Artist</td>
                              <td>{nft.artist}</td>
                            </tr>
                            <tr>
                              <td>Mint Date</td>
                              <td>{printMintDate(nft)}</td>
                            </tr>
                            <tr>
                              <td>File Type</td>
                              <td>
                                {nft.animation
                                  ? nft.metadata.animation_details?.format
                                  : nft.metadata.image_details.format}
                              </td>
                            </tr>
                            <tr>
                              <td>Dimensions</td>
                              <td>
                                {nft.metadata.image_details.width} x{" "}
                                {nft.metadata.image_details.height}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <h3>Minting Approach</h3>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <a
                          href={
                            `https://github.com/6529-Collections/thememecards/tree/main/card` +
                            nft.id
                          }
                          target="_blank"
                          rel="noreferrer">
                          Distribution Plan
                        </a>
                      </Col>
                    </Row>
                    {/* <Row>
                      <Col>
                        <a
                          href={
                            `https://github.com/6529-Collections/thememecards/tree/main/card` +
                            nft.id
                          }
                          target="_blank"
                          rel="noreferrer">
                          Allowlist
                        </a>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <a
                          href={
                            `https://github.com/6529-Collections/thememecards/tree/main/card` +
                            nft.id
                          }
                          target="_blank"
                          rel="noreferrer">
                          Randomization
                        </a>
                      </Col>
                    </Row> */}
                    <Row className="pt-3">
                      <Col>
                        Mint price:{" "}
                        {nft.mint_price > 0 ? `${nft.mint_price} ETH` : `N/A`}
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        Floor Price:{" "}
                        {nft.floor_price > 0
                          ? `${numberWithCommas(
                              Math.round(nft.floor_price * 100) / 100
                            )} ETH`
                          : `N/A`}
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        Market Cap:{" "}
                        {nft.market_cap > 0
                          ? `${numberWithCommas(
                              Math.round(nft.market_cap * 100) / 100
                            )} ETH`
                          : `N/A`}
                      </Col>
                    </Row>
                    <Row className="pt-3">
                      <Col>
                        <a
                          href={`https://opensea.io/assets/ethereum/${MEMES_CONTRACT}/${nft.id}`}
                          target="_blank"
                          rel="noreferrer">
                          <img
                            className={styles.marketplace}
                            src="/opensea.png"
                            alt="opensea"
                          />
                        </a>
                        {/* <a
                          href={`https://looksrare.org/collections/${MEMES_CONTRACT}/${nft.id}`}
                          target="_blank"
                          rel="noreferrer">
                          <img
                            className={styles.marketplace}
                            src="/looksrare.png"
                          />
                        </a> */}
                        <a
                          href={`https://x2y2.io/eth/${MEMES_CONTRACT}/${nft.id}`}
                          target="_blank"
                          rel="noreferrer">
                          <img
                            className={styles.marketplace}
                            src="/x2y2.png"
                            alt="x2y2"
                          />
                        </a>
                      </Col>
                    </Row>
                  </Container>
                </Col>
              </Row>
            </Container>
            <Container className={styles.mainContainer}>
              <Row>
                <Col xs={12} sm={12} md={12} lg={12}>
                  <Leaderboard page={1} pageSize={10} showMore={false} />
                </Col>
              </Row>
            </Container>
            <Container className={styles.mainContainer}>
              <Row>
                <Col xs={12} sm={12} md={12} lg={12}>
                  <LatestActivity page={1} pageSize={12} showMore={false} />
                </Col>
              </Row>
            </Container>
          </>
        )}
      </main>
    </>
  );
}
