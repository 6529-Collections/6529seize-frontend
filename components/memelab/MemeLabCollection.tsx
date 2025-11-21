"use client";

import styles from "./MemeLab.module.scss";

import { AuthContext } from "@/components/auth/Auth";
import NFTImage from "@/components/nft-image/NFTImage";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants";
import { LabExtendedData, LabNFT, VolumeType } from "@/entities/INFT";
import { NftOwner } from "@/entities/IOwner";
import { SortDirection } from "@/entities/ISort";
import { MemeLabSort } from "@/enums";
import { addProtocol } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import {
  faChevronCircleDown,
  faChevronCircleUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import {
  getInitialRouterValues,
  printNftContent,
  printSortButtons,
  sortChanged,
} from "./MemeLab";

interface Props {
  wallets: string[];
}

export default function LabCollection({
  collectionName,
}: {
  readonly collectionName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connectedProfile } = useContext(AuthContext);

  const [websites, setWebsites] = useState<string[]>([]);

  const [nfts, setNfts] = useState<LabNFT[]>([]);
  const [nftMetas, setNftMetas] = useState<LabExtendedData[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [nftBalances, setNftBalances] = useState<NftOwner[]>([]);

  const [sortDir, setSortDir] = useState<SortDirection>();
  const [sort, setSort] = useState<MemeLabSort>(MemeLabSort.AGE);

  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.HOURS_24);

  useEffect(() => {
    const { initialSortDir, initialSort } = getInitialRouterValues(
      searchParams?.get("sortDir") ?? null,
      searchParams?.get("sort") ?? null
    );
    setSortDir(initialSortDir);
    setSort(initialSort);
    setVolumeType(VolumeType.HOURS_24);
  }, []);

  useEffect(() => {
    if (!collectionName) {
      setNftMetas([]);
      setNfts([]);
      setWebsites([]);
      setNftsLoaded(true);
      return;
    }

    let cancelled = false;
    setNftsLoaded(false);

    const loadCollection = async () => {
      try {
        const nftsUrl = `${
          publicEnv.API_ENDPOINT
        }/api/lab_extended_data?collection=${encodeURIComponent(collectionName)}`;
        const responseNftMetas = await fetchAllPages<LabExtendedData>(nftsUrl);
        if (cancelled) {
          return;
        }
        setNftMetas(responseNftMetas);
        if (responseNftMetas.length > 0) {
          const tokenIds = responseNftMetas.map((n: LabExtendedData) => n.id);
          const uniqueWebsites = Array.from(
            new Set(
              responseNftMetas
                .map((nftm) => nftm.website?.trim())
                .filter(
                  (site): site is string =>
                    typeof site === "string" && site.length > 0
                )
            )
          );
          if (cancelled) {
            return;
          }
          setWebsites(uniqueWebsites);
          const responseNfts = await fetchAllPages<LabNFT>(
            `${publicEnv.API_ENDPOINT}/api/nfts_memelab?id=${tokenIds.join(
              ","
            )}`
          );
          if (cancelled) {
            return;
          }
          setNfts(responseNfts);
        } else {
          if (cancelled) {
            return;
          }
          setNfts([]);
          setWebsites([]);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error(`Failed to fetch Meme Lab collection ${collectionName}`, error);
        setNftMetas([]);
        setNfts([]);
        setWebsites([]);
      } finally {
        if (!cancelled) {
          setNftsLoaded(true);
        }
      }
    };

    loadCollection();

    return () => {
      cancelled = true;
    };
  }, [collectionName]);

  useEffect(() => {
    let cancelled = false;
    const consolidationKey = connectedProfile?.consolidation_key;

    if (consolidationKey) {
      fetchAllPages<NftOwner>(
        `${publicEnv.API_ENDPOINT}/api/nft-owners/consolidation/${consolidationKey}?contract=${MEMES_CONTRACT}`
      )
        .then((owners) => {
          if (cancelled) {
            return;
          }
          setNftBalances(owners);
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }
          console.error("Failed to fetch Meme Lab balances for user", error);
          setNftBalances([]);
        });
    } else {
      setNftBalances([]);
    }

    return () => {
      cancelled = true;
    };
  }, [connectedProfile]);

  useEffect(() => {
    if (sort && sortDir && nftsLoaded) {
      sortChanged(router, sort, sortDir, volumeType, nfts, nftMetas, setNfts);
    }
  }, [sort, sortDir, nftsLoaded]);

  function getBalance(id: number) {
    const balance = nftBalances.find((b) => b.token_id === id);
    if (balance) {
      return balance.balance;
    }
    return 0;
  }

  function printNft(nft: LabNFT) {
    return (
      <Col
        key={`${nft.contract}-${nft.id}`}
        className="pt-3 pb-3"
        xs={{ span: 6 }}
        sm={{ span: 4 }}
        md={{ span: 3 }}
        lg={{ span: 3 }}>
        <Link
          href={`/meme-lab/${nft.id}`}
          className="decoration-none scale-hover">
          <Container fluid>
            <Row className={connectedProfile ? styles.nftImagePadding : ""}>
              <NFTImage
                nft={nft}
                animation={false}
                height={300}
                showBalance={true}
                showThumbnail={true}
              />
            </Row>
            <Row>
              <Col className="text-center pt-2">
                #{nft.id} - {nft.name}
              </Col>
            </Row>
            <Row>
              <Col className="text-center pt-2">Artists: {nft.artist}</Col>
            </Row>
            <Row>
              <Col className="text-center pt-1">
                {printNftContent(nft, sort, nftMetas, volumeType)}
              </Col>
            </Row>
          </Container>
        </Link>
      </Col>
    );
  }

  function printNfts() {
    return <Row className="pt-2">{nfts.map((nft) => printNft(nft))}</Row>;
  }

  return (
    <>
      <Container fluid className={styles.mainContainer}>
        <Row>
          <Col>
            <Container className="pt-4 pb-4">
              <Row>
                <Col>
                  <h1>Meme Lab Collections</h1>
                </Col>
              </Row>
              <Row className="pt-3">
                <Col>
                  <h2 className="font-color">{collectionName}</h2>
                </Col>
              </Row>
              {websites.length > 0 && (
                <Row className="pb-3">
                  <Col className="tw-flex tw-gap-3 tw-flex-wrap tw-items-center">
                    {websites.map((website) => (
                      <a
                        key={website}
                        href={addProtocol(website)}
                        target="_blank"
                        rel="noopener noreferrer">
                        {website}
                      </a>
                    ))}
                  </Col>
                </Row>
              )}
              <Row className="pt-2">
                <Col>
                  Sort by&nbsp;&nbsp;
                  <FontAwesomeIcon
                    icon={faChevronCircleUp}
                    onClick={() => setSortDir(SortDirection.ASC)}
                    className={`${styles.sortDirection} ${
                      sortDir != SortDirection.ASC ? styles.disabled : ""
                    }`}
                  />{" "}
                  <FontAwesomeIcon
                    icon={faChevronCircleDown}
                    onClick={() => setSortDir(SortDirection.DESC)}
                    className={`${styles.sortDirection} ${
                      sortDir != SortDirection.DESC ? styles.disabled : ""
                    }`}
                  />
                </Col>
              </Row>
              <Row className="pt-2">
                <Col className="tw-flex tw-gap-3 tw-items-center tw-flex-wrap">
                  {printSortButtons(
                    sort,
                    volumeType,
                    setSort,
                    setVolumeType,
                    true
                  )}
                </Col>
              </Row>
              {nftsLoaded &&
                (nfts.length > 0 ? (
                  printNfts()
                ) : (
                  <Col>
                    <NothingHereYetSummer />
                  </Col>
                ))}
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
}
