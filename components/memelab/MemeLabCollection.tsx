"use client";

import styles from "./MemeLab.module.scss";

import {
  faChevronCircleDown,
  faChevronCircleUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { MEMES_CONTRACT } from "../../constants";
import { LabExtendedData, LabNFT, VolumeType } from "../../entities/INFT";
import { NftOwner } from "../../entities/IOwner";
import { SortDirection } from "../../entities/ISort";
import { MemeLabSort } from "../../enums";
import { addProtocol } from "../../helpers/Helpers";
import { fetchAllPages } from "../../services/6529api";
import { AuthContext } from "../auth/Auth";
import NFTImage from "../nft-image/NFTImage";
import NothingHereYetSummer from "../nothingHereYet/NothingHereYetSummer";
import {
  getInitialRouterValues,
  printNftContent,
  printSortButtons,
  sortChanged,
} from "./MemeLab";

export default function LabCollection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { connectedProfile } = useContext(AuthContext);

  const [collectionName, setCollectionName] = useState<string>();
  const [website, setWebsite] = useState<string>();

  const [nfts, setNfts] = useState<LabNFT[]>([]);
  const [nftMetas, setNftMetas] = useState<LabExtendedData[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [nftBalances, setNftBalances] = useState<NftOwner[]>([]);

  const [sortDir, setSortDir] = useState<SortDirection>();
  const [sort, setSort] = useState<MemeLabSort>(MemeLabSort.AGE);

  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.HOURS_24);

  useEffect(() => {
    const collectionParam = params?.collection as string | undefined;
    if (collectionParam) {
      let c = collectionParam.replaceAll("-", " ");
      setCollectionName(c);

      const { initialSortDir, initialSort } = getInitialRouterValues(
        searchParams?.get("sort_dir") ?? null,
        searchParams?.get("sort") ?? null
      );

      setSortDir(initialSortDir);
      setSort(initialSort);
    }
  }, [params, searchParams]);

  useEffect(() => {
    if (collectionName) {
      const nftsUrl = `${
        process.env.API_ENDPOINT
      }/api/lab_extended_data?collection=${encodeURIComponent(collectionName)}`;
      fetchAllPages(nftsUrl).then((responseNftMetas: LabExtendedData[]) => {
        setNftMetas(responseNftMetas);
        if (responseNftMetas.length > 0) {
          const tokenIds = responseNftMetas.map((n: LabExtendedData) => n.id);
          fetchAllPages(
            `${process.env.API_ENDPOINT}/api/nfts_memelab?id=${tokenIds.join(
              ","
            )}`
          ).then((responseNfts: any[]) => {
            setNfts(responseNfts);
            setNftsLoaded(true);
          });
          let collectionSecondaryLink: string = "";
          responseNftMetas.map((nftm) => {
            if (
              nftm.website &&
              !collectionSecondaryLink.includes(nftm.website)
            ) {
              collectionSecondaryLink += nftm.website;
            }
          });
          setWebsite(collectionSecondaryLink);
        } else {
          setNfts([]);
          setNftsLoaded(true);
        }
      });
    }
  }, [collectionName]);

  useEffect(() => {
    if (connectedProfile?.consolidation_key) {
      fetchAllPages(
        `${process.env.API_ENDPOINT}/api/nft-owners/consolidation/${connectedProfile?.consolidation_key}?contract=${MEMES_CONTRACT}`
      ).then((owners: NftOwner[]) => {
        setNftBalances(owners);
      });
    } else {
      setNftBalances([]);
    }
  }, [connectedProfile]);

  useEffect(() => {
    if (sort && sortDir && nftsLoaded) {
      sortChanged(
        router,
        sort,
        sortDir,
        volumeType,
        nfts,
        nftMetas,
        collectionName,
        setNfts
      );
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
        <Container fluid className="no-padding">
          <Row>
            <a
              href={`/meme-lab/${nft.id}`}
              className={connectedProfile ? styles.nftImagePadding : ""}>
              <NFTImage
                nft={nft}
                animation={false}
                height={300}
                balance={getBalance(nft.id)}
                showThumbnail={true}
                showUnseized={!!connectedProfile}
              />
            </a>
          </Row>
          <Row>
            <Col className="text-center pt-2">
              <a href={`/the-memes/${nft.id}`}>{nft.name}</a>
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
                  <h1>
                    <span className="font-lightest">Meme</span> Lab Collections
                  </h1>
                </Col>
              </Row>
              <Row className="pt-3">
                <Col>
                  <h2 className="font-color">{collectionName}</h2>
                </Col>
              </Row>
              {website && (
                <Row className="pb-3">
                  <Col>
                    {website.split(" ").map((w) => (
                      <>
                        <a
                          href={addProtocol(w)}
                          target="_blank"
                          rel="noreferrer">
                          {w}
                        </a>
                        &nbsp;&nbsp;
                      </>
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
                <Col>
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
