import styles from "./6529Gradient.module.scss";

import { useContext, useEffect, useState } from "react";
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
import LatestActivityRow from "../latest-activity/LatestActivityRow";
import { Transaction } from "../../entities/ITransaction";
import { useRouter } from "next/router";
import { fetchUrl } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import Address from "../address/Address";
import ArtistProfileHandle from "../the-memes/ArtistProfileHandle";
import { AuthContext } from "../auth/Auth";
import { NftPageStats } from "../nftAttributes/NftStats";
import useCapacitor from "../../hooks/useCapacitor";
import NFTMarketplaceLinks from "../nft-marketplace-links/NFTMarketplaceLinks";
import { faExpandAlt } from "@fortawesome/free-solid-svg-icons";
import NftNavigation from "../nft-navigation/NftNavigation";

interface NftWithOwner extends NFT {
  owner: string;
  owner_display: string;
}

export default function GradientPage() {
  const router = useRouter();
  const capacitor = useCapacitor();
  const { connectedProfile } = useContext(AuthContext);
  const fullscreenElementId = "the-art-fullscreen-img";

  const [nftId, setNftId] = useState<string>();

  const [nft, setNft] = useState<NftWithOwner>();
  const [isOwner, setIsOwner] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [allNfts, setAllNfts] = useState<NftWithOwner[]>([]);
  const [collectionCount, setCollectionCount] = useState(-1);
  const [collectionRank, setCollectionRank] = useState(-1);

  useEffect(() => {
    if (router.isReady) {
      if (router.query.id) {
        setNftId(router.query.id as string);
      }
    }
  }, [router.isReady, router.query.id]);

  useEffect(() => {
    setIsOwner(
      connectedProfile?.wallets?.some((w) =>
        areEqualAddresses(w.wallet, nft?.owner)
      ) ?? false
    );
  }, [nft, connectedProfile]);

  useEffect(() => {
    async function fetchNfts(url: string, mynfts: NftWithOwner[]) {
      return fetchUrl(url).then((response: DBResponse) => {
        if (response.next) {
          fetchNfts(response.next, [...mynfts].concat(response.data));
        } else {
          const newnfts = [...mynfts]
            .concat(response.data)
            .filter((value, index, self) => {
              return self.findIndex((v) => v.id === value.id) === index;
            });
          setAllNfts(newnfts);
        }
      });
    }
    if (router.isReady && nftId) {
      const initialUrlNfts = `${process.env.API_ENDPOINT}/api/nfts/gradients?&page_size=101`;
      fetchNfts(initialUrlNfts, []);
    }
  }, [router.isReady, nftId]);

  useEffect(() => {
    const rankedNFTs = allNfts.sort((a, b) =>
      a.tdh_rank > b.tdh_rank ? 1 : -1
    );
    setCollectionCount(allNfts.length);
    if (nftId) {
      setNft(rankedNFTs.find((n) => n.id === parseInt(nftId)));
      setCollectionRank(
        rankedNFTs.map((r) => r.id).indexOf(parseInt(nftId)) + 1
      );
    }
  }, [allNfts, nftId]);

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
            {nft && (
              <NFTImage
                id={fullscreenElementId}
                nft={nft}
                animation={false}
                height={650}
                balance={0}
                showOwned={isOwner}
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
                      {isOwner ? "*" : ""}
                      <Address
                        wallets={[nft.owner as `0x${string}`]}
                        display={nft.owner_display}
                      />
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
                          <td>Artist</td>
                          <td>
                            <ArtistProfileHandle nft={nft} />
                          </td>
                        </tr>
                        <NftPageStats nft={nft} hide_mint_price={true} />
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
                {capacitor.platform !== "ios" && (
                  <Row className="pt-4">
                    <Col>
                      <NFTMarketplaceLinks
                        contract={nft.contract}
                        id={nft.id}
                      />
                    </Col>
                  </Row>
                )}
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
                        nft={nft}
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
        icon={faExpandAlt}
        className={styles.fullScreen}
        onClick={() =>
          fullscreenElementId && enterArtFullScreen(fullscreenElementId)
        }
      />
    );
  }

  return (
    <Container fluid className={styles.mainContainer}>
      <Row>
        <Col>
          <Container className="pt-4 pb-4">
            <Row>
              <Col>
                <h1>
                  <span className="font-lightest">6529</span> Gradient
                </h1>
              </Col>
            </Row>
            {nft && (
              <>
                <Row className="pt-2">
                  <Col className="d-flex align-items-center justify-content-between">
                    <NftNavigation
                      nftId={nft.id}
                      path="/6529-gradient"
                      startIndex={0}
                      endIndex={100}
                      fullscreenElementId={fullscreenElementId}
                    />
                  </Col>
                </Row>
                <Row className="pt-2">
                  <Col>
                    <h2 className={styles.subheading}>{nft?.name}</h2>
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
  );
}
