"use client";

import styles from "./6529Gradient.module.scss";

import Address from "@/components/address/Address";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import { NftPageStats } from "@/components/nft-attributes/NftStats";
import NFTImage from "@/components/nft-image/NFTImage";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import NftNavigation from "@/components/nft-navigation/NftNavigation";
import TransferSingle from "@/components/nft-transfer/TransferSingle";
import ArtistProfileHandle from "@/components/the-memes/ArtistProfileHandle";
import YouOwnNftBadge from "@/components/you-own-nft-badge/YouOwnNftBadge";
import { publicEnv } from "@/config/env";
import { GRADIENT_CONTRACT } from "@/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import { CollectedCollectionType } from "@/entities/IProfile";
import type { Transaction } from "@/entities/ITransaction";
import { ContractType } from "@/enums";
import {
  areEqualAddresses,
  numberWithCommas,
  printMintDate,
} from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { fetchUrl } from "@/services/6529api";
import { useCallback, useContext, useEffect, useState } from "react";
import { Col, Container, Row, Table } from "react-bootstrap";

interface NftWithOwner extends NFT {
  owner: string;
  owner_display: string;
}

export default function GradientPageComponent({ id }: { readonly id: string }) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { address: connectedAddress } = useSeizeConnectContext();
  const { connectedProfile } = useContext(AuthContext);
  const fullscreenElementId = "the-art-fullscreen-img";

  useSetTitle(`6529 Gradient #${id}`);

  const [nft, setNft] = useState<NftWithOwner>();
  const [isOwner, setIsOwner] = useState(false);
  const [isConnectedAddressOwner, setIsConnectedAddressOwner] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [allNfts, setAllNfts] = useState<NftWithOwner[]>([]);
  const [collectionCount, setCollectionCount] = useState(-1);
  const [collectionRank, setCollectionRank] = useState(-1);

  const fetchNfts = useCallback(
    async function fetchNftsInner(
      url: string,
      mynfts: NftWithOwner[],
      signal?: AbortSignal
    ): Promise<void> {
      if (signal?.aborted) {
        return;
      }
      try {
        const response = await fetchUrl(url, { ...(signal !== undefined ? { signal: signal } : {}) });
        const combined = [...mynfts, ...response.data];
        if (response.next) {
          await fetchNftsInner(response.next, combined, signal);
        } else {
          if (signal?.aborted) {
            return;
          }
          const uniqueById = new Map<number, NftWithOwner>();
          combined.forEach((nftItem) => uniqueById.set(nftItem.id, nftItem));
          setAllNfts(Array.from(uniqueById.values()));
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch gradient NFTs", error);
        setAllNfts([]);
      }
    },
    [setAllNfts]
  );

  useEffect(() => {
    setIsOwner(
      connectedProfile?.wallets?.some((w) =>
        areEqualAddresses(w.wallet, nft?.owner)
      ) ?? false
    );
  }, [nft, connectedProfile]);

  useEffect(() => {
    setIsConnectedAddressOwner(areEqualAddresses(connectedAddress, nft?.owner));
  }, [nft, connectedAddress]);

  useEffect(() => {
    const abortController = new AbortController();
    const initialUrlNfts = `${publicEnv.API_ENDPOINT}/api/nfts/gradients?&page_size=101`;
    fetchNfts(initialUrlNfts, [], abortController.signal);
    return () => abortController.abort();
  }, [fetchNfts]);

  useEffect(() => {
    const rankedNFTs = [...allNfts].sort((a, b) =>
      a.tdh_rank > b.tdh_rank ? 1 : -1
    );
    setCollectionCount(allNfts.length);
    const parsedId = Number.parseInt(id, 10);
    setNft(rankedNFTs.find((n) => n.id === parsedId));
    const rankIndex = rankedNFTs.findIndex((r) => r.id === parsedId);
    setCollectionRank(rankIndex > -1 ? rankIndex + 1 : -1);
  }, [allNfts, id]);

  useEffect(() => {
    if (!id) {
      setTransactions([]);
      return;
    }

    const abortController = new AbortController();
    setTransactions([]);
    fetchUrl(
      `${publicEnv.API_ENDPOINT}/api/transactions?contract=${GRADIENT_CONTRACT}&id=${id}`,
      { signal: abortController.signal }
    )
      .then((response: DBResponse) => {
        if (abortController.signal.aborted) {
          return;
        }
        setTransactions(response.data);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error(`Failed to fetch gradient transactions for id ${id}`, error);
        setTransactions([]);
      });
    return () => abortController.abort();
  }, [id]);

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
                showBalance={false}
              />
            )}
          </Col>
          {nft && (
            <Col xs={12} sm={12} md={6} lg={6} className="pt-2">
              <Container>
                <Row>
                  <Col
                    xs={isConnectedAddressOwner ? 7 : 12}
                    className="tw-flex tw-items-center tw-gap-2">
                    <Container className="no-padding">
                      <Row>
                        <Col>
                          <h3>Owner</h3>
                        </Col>
                      </Row>
                      <Row>
                        <Col className="d-flex align-items-center gap-1">
                          <h4 className="tw-mb-0">
                            <Address
                              wallets={[nft.owner as `0x${string}`]}
                              display={nft.owner_display}
                            />
                          </h4>
                          {isOwner && <YouOwnNftBadge />}
                        </Col>
                      </Row>
                    </Container>
                  </Col>
                  {isConnectedAddressOwner && (
                    <Col xs={5}>
                      <TransferSingle
                        collectionType={CollectedCollectionType.GRADIENTS}
                        contractType={ContractType.ERC721}
                        contract={GRADIENT_CONTRACT}
                        tokenId={nft.id}
                        max={1}
                        title={nft.name ?? `6529 Gradient #${nft.id}`}
                        thumbUrl={nft.thumbnail}
                      />
                    </Col>
                  )}
                </Row>
                <Row className="pt-4">
                  <Col>
                    <h3>NFT</h3>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Table bordered={false} className={styles["gradientTable"]}>
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
                    <Table bordered={false} className={styles["gradientTable"]}>
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
                {(!capacitor.isIos || country === "US") && (
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
            <Row className={`pt-3 ${styles["transactionsScrollContainer"]}`}>
              <Col>
                <Table bordered={false} className={styles["transactionsTable"]}>
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

  return (
    <Container fluid className={styles["mainContainer"]}>
      <Row>
        <Col>
          <Container className="pt-4 pb-4">
            <Row>
              <Col>
                <h1>
                  6529 Gradient
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
                <Row className="pt-4">
                  <Col>
                    <h2>{nft?.name}</h2>
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
