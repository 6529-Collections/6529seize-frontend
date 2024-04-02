import styles from "./TheMemes.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import { NULL_ADDRESS } from "../../constants";
import { NFT, NftRank, NftTDH } from "../../entities/INFT";
import {
  areEqualAddresses,
  numberWithCommas,
  printMintDate,
} from "../../helpers/Helpers";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import { Transaction } from "../../entities/ITransaction";
import { ConsolidatedTDH } from "../../entities/ITDH";
import LatestActivityRow from "../latest-activity/LatestActivityRow";

export function MemePageYourCardsRightMenu(props: {
  show: boolean;
  transactions: Transaction[];
  wallets: string[];
  nft: NFT | undefined;
  nftBalance: number;
  myOwner: ConsolidatedTDH | undefined;
  myTDH: NftTDH | undefined;
  myRank: NftRank | undefined;
}) {
  function getTokenCount(transactions: Transaction[]) {
    let count = 0;
    [...transactions].map((e) => {
      count += e.token_count;
    });
    return count;
  }

  if (props.show) {
    const firstAcquired = [...props.transactions].sort((a, b) =>
      a.transaction_date > b.transaction_date ? 1 : -1
    )[0];

    const airdropped = props.transactions.filter(
      (t) => t.value === 0 && areEqualAddresses(t.from_address, NULL_ADDRESS)
    );

    const transferredIn =
      props.wallets.length === 0
        ? []
        : props.transactions.filter(
            (t) =>
              !areEqualAddresses(t.from_address, NULL_ADDRESS) &&
              props.wallets.some((w) => areEqualAddresses(t.to_address, w)) &&
              t.value === 0
          );

    const transferredOut =
      props.wallets.length === 0
        ? []
        : props.transactions.filter(
            (t) =>
              props.wallets.some((w) => areEqualAddresses(t.from_address, w)) &&
              t.value === 0
          );

    const bought =
      props.wallets.length === 0
        ? []
        : props.transactions.filter(
            (t) =>
              props.wallets.some((w) => areEqualAddresses(t.to_address, w)) &&
              t.value > 0
          );

    let boughtSum = 0;
    bought.map((b) => {
      boughtSum += b.value;
    });

    const sold =
      props.wallets.length === 0
        ? []
        : props.transactions.filter(
            (t) =>
              props.wallets.some((w) => areEqualAddresses(t.from_address, w)) &&
              t.value > 0
          );

    let soldSum = 0;
    sold.map((b) => {
      soldSum += b.value;
    });

    return (
      <Col
        xs={{ span: 12 }}
        sm={{ span: 12 }}
        md={{ span: 6 }}
        lg={{ span: 6 }}>
        <Container className="p-0">
          <Row>
            {props.wallets.length === 0 && (
              <Row className="pt-2">
                <Col>
                  <h4>Connect your wallet to view your cards.</h4>
                </Col>
              </Row>
            )}
            {props.nftBalance === 0 &&
              props.wallets.length > 0 &&
              props.nft && (
                <Row className="pt-2">
                  <Col>
                    <h3>
                      You don&apos;t own any editions of Card {props.nft.id}
                    </h3>
                  </Col>
                </Row>
              )}
            {props.transactions.length > 0 && props.wallets.length > 0 && (
              <>
                {props.nftBalance > 0 && props.myOwner && (
                  <>
                    <Row className="pt-2">
                      <Col
                        xs={{ span: 12 }}
                        sm={{ span: 12 }}
                        md={{ span: 12 }}
                        lg={{ span: 8 }}>
                        <Table bordered={false}>
                          <tbody>
                            <tr className={`${styles.overviewColumn}`}>
                              <td>Cards</td>
                              <td className="text-right">{`x${props.nftBalance}`}</td>
                            </tr>
                            {/* <tr className={`pt-1 ${styles.overviewColumn}`}>
                              <td>Rank</td>
                              <td className="text-right">
                                {`#${numberWithCommas(
                                  myOwner.dense_rank_balance
                                )}`}
                              </td>
                            </tr> */}
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                    {props.myRank && props.nft && props.myTDH ? (
                      <Row className="pt-2">
                        <Col
                          xs={{ span: 12 }}
                          sm={{ span: 12 }}
                          md={{ span: 12 }}
                          lg={{ span: 8 }}>
                          <Table bordered={false}>
                            <tbody>
                              <tr className={`pt-1 ${styles.overviewColumn}`}>
                                <td>TDH</td>
                                <td className="text-right">
                                  {numberWithCommas(
                                    Math.round(props.myTDH.tdh)
                                  )}
                                </td>
                              </tr>
                              <tr className={`${styles.overviewColumn}`}>
                                <td>Rank</td>
                                <td className="text-right">
                                  #{props.myRank?.rank}
                                </td>
                              </tr>
                            </tbody>
                          </Table>
                        </Col>
                      </Row>
                    ) : (
                      <Row className="pb-3">
                        <Col className={`pt-1 ${styles.overviewColumn}`}>
                          No TDH accrued
                        </Col>
                      </Row>
                    )}
                  </>
                )}
                <Row className="pt-2 pb-2">
                  <Col>
                    <h3>Overview</h3>
                  </Col>
                </Row>
                <Row className={`pb-2 ${styles.overviewColumn}`}>
                  <Col>
                    First acquired{" "}
                    {printMintDate(new Date(firstAcquired.transaction_date))}
                  </Col>
                </Row>
                {airdropped.length > 0 && (
                  <Row className={`pt-1 ${styles.overviewColumn}`}>
                    <Col>
                      {getTokenCount(airdropped)} card
                      {getTokenCount(airdropped) > 1 && "s"} airdropped
                    </Col>
                  </Row>
                )}
                {bought.length > 0 && (
                  <Row className={`pt-1 ${styles.overviewColumn}`}>
                    <Col>
                      {getTokenCount(bought)} card
                      {getTokenCount(bought) > 1 && "s"} bought for {boughtSum}{" "}
                      ETH
                    </Col>
                  </Row>
                )}
                {transferredIn.length > 0 && (
                  <Row className={`pt-1 ${styles.overviewColumn}`}>
                    <Col>
                      {getTokenCount(transferredIn)} card
                      {getTokenCount(transferredIn) > 1 && "s"} transferred in
                    </Col>
                  </Row>
                )}
                {sold.length > 0 && (
                  <Row className={`pt-1 ${styles.overviewColumn}`}>
                    <Col>
                      {getTokenCount(sold)} card
                      {getTokenCount(sold) > 1 && "s"} sold for {soldSum} eth
                    </Col>
                  </Row>
                )}
                {transferredOut.length > 0 && (
                  <Row className={`pt-1 ${styles.overviewColumn}`}>
                    <Col>
                      {getTokenCount(transferredOut)} card
                      {getTokenCount(transferredOut) > 1 && "s"} transferred out
                    </Col>
                  </Row>
                )}
              </>
            )}
          </Row>
        </Container>
      </Col>
    );
  } else {
    return <></>;
  }
}
export function MemePageLiveSubMenu(props: {
  show: boolean;
  nft: NFT | undefined;
}) {
  const [memeLabNftsLoaded, setMemeLabNftsLoaded] = useState(false);
  const [memeLabNfts, setMemeLabNfts] = useState<NFT[]>([]);

  useEffect(() => {
    if (props.nft) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/nfts_memelab?sort_direction=asc&meme_id=${props.nft.id}`
      ).then((response: DBResponse) => {
        setMemeLabNfts(response.data);
        setMemeLabNftsLoaded(true);
      });
    }
  }, [props.nft]);

  if (props.show) {
    return (
      <>
        <Row className="pt-3">
          <Col>
            <Image
              width="0"
              height="0"
              style={{ width: "250px", height: "auto" }}
              src="/memelab.png"
              alt="memelab"
            />
          </Col>
        </Row>
        <Row className="pt-4 pb-4">
          <Col>
            The Meme Lab is the lab for Meme Artists to release work that is
            related to The Meme Cards.
            {memeLabNftsLoaded && memeLabNfts.length === 0 && (
              <>
                <br />
                Meme Lab NFTs that reference this NFT will appear here once the
                Meme Lab is launched.
              </>
            )}
          </Col>
        </Row>
        {memeLabNfts.length > 0 && (
          <Row className="pt-2 pb-2">
            {memeLabNfts.map((nft) => {
              return (
                <Col
                  key={`${nft.contract}-${nft.id}`}
                  className="pt-3 pb-3"
                  xs={{ span: 6 }}
                  sm={{ span: 4 }}
                  md={{ span: 3 }}
                  lg={{ span: 3 }}>
                  <Container fluid className="no-padding">
                    <Row>
                      <Col>
                        <a href={`/meme-lab/${nft.id}`}>
                          <NFTImage
                            nft={nft}
                            animation={false}
                            height={300}
                            balance={0}
                            showThumbnail={true}
                            showUnseized={false}
                          />
                        </a>
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
                        Artists: {nft.artist}
                      </Col>
                    </Row>
                  </Container>
                </Col>
              );
            })}
          </Row>
        )}
        <Row className="pt-5">
          <Col>
            <Image
              width="0"
              height="0"
              style={{ width: "250px", height: "auto" }}
              src="/re-memes.png"
              alt="re-memes"
            />
          </Col>
        </Row>
        <Row className="pt-4 pb-4">
          <Col>
            ReMemes are community-driven derivatives inspired by the Meme Cards.
            We hope to display them here once we find a &quot;safe&quot; way to
            do so.
            <br />
            Learn more{" "}
            <a href="/rememes" target="_blank">
              here
            </a>
            .
          </Col>
        </Row>
      </>
    );
  } else {
    return <></>;
  }
}

export function MemePageYourCardsSubMenu(props: {
  show: boolean;
  transactions: Transaction[];
}) {
  if (props.show) {
    return (
      <>
        {props.transactions.length > 0 && (
          <>
            <Row className="pt-4">
              <Col>
                <h3>Your Transaction History</h3>
              </Col>
            </Row>
            <Row className={`pt-4 ${styles.transactionsScrollContainer}`}>
              <Col>
                <Table bordered={false} className={styles.transactionsTable}>
                  <tbody>
                    {props.transactions.map((tr) => (
                      <LatestActivityRow
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
  } else {
    return <></>;
  }
}
