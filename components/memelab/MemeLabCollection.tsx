import styles from "./MemeLab.module.scss";

import { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Container, Row, Col, Dropdown } from "react-bootstrap";
import { useAccount } from "wagmi";
import { LabNFT, LabExtendedData, VolumeType } from "../../entities/INFT";
import {
  getDateDisplay,
  getValuesForVolumeType,
  numberWithCommas,
} from "../../helpers/Helpers";
import { useRouter } from "next/router";
import { fetchAllPages } from "../../services/6529api";
import { Owner } from "../../entities/IOwner";
import { SortDirection } from "../../entities/ISort";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const NFTImage = dynamic(() => import("../nft-image/NFTImage"), {
  ssr: false,
});

enum Sort {
  AGE = "age",
  EDITION_SIZE = "edition-size",
  HODLERS = "collectors",
  UNIQUE_PERCENT = "unique",
  UNIQUE_PERCENT_EX_MUSEUM = "unique-ex-museum",
  FLOOR_PRICE = "floor-price",
  MARKET_CAP = "market-cap",
  VOLUME = "volume",
}

export default function LabCollection() {
  const router = useRouter();
  const [collectionName, setCollectionName] = useState<string>();

  const { address, connector, isConnected } = useAccount();

  const [nfts, setNfts] = useState<LabNFT[]>([]);
  const [nftMetas, setNftMetas] = useState<LabExtendedData[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [nftBalances, setNftBalances] = useState<Owner[]>([]);

  const [sortDir, setSortDir] = useState<SortDirection>();
  const [sort, setSort] = useState<Sort>();

  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.HOURS_24);

  useEffect(() => {
    if (router.isReady) {
      if (router.query.collection) {
        let c = router.query.collection as string;
        c = c.replaceAll("-", " ");
        setCollectionName(c);

        let initialSortDir = SortDirection.ASC;
        let initialSort = Sort.AGE;

        const routerSortDir = router.query.sort_dir;
        if (routerSortDir) {
          const resolvedRouterSortDir = Object.values(SortDirection).find(
            (sd) => sd == routerSortDir
          );
          if (resolvedRouterSortDir) {
            initialSortDir = resolvedRouterSortDir;
          }
        }

        const routerSort = router.query.sort;
        if (routerSort) {
          const resolvedRouterSort = Object.values(Sort).find(
            (sd) => sd == routerSort
          );
          if (resolvedRouterSort) {
            initialSort = resolvedRouterSort;
          }
        }

        setSort(initialSort);
        setSortDir(initialSortDir);
      }
    }
  }, [router.isReady]);

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
        } else {
          setNfts([]);
          setNftsLoaded(true);
        }
      });
    }
  }, [collectionName]);

  useEffect(() => {
    if (address && nftMetas.length > 0) {
      fetchAllPages(
        `${process.env.API_ENDPOINT}/api/owners_memelab?wallet=${address}`
      ).then((owners: Owner[]) => {
        setNftBalances(owners);
      });
    } else {
      setNftBalances([]);
    }
  }, [nftMetas, address]);

  useEffect(() => {
    if (sort && sortDir && nftsLoaded) {
      router.replace(
        {
          query: {
            collection: collectionName?.replaceAll(" ", "-"),
            sort: sort,
            sort_dir: sortDir,
          },
        },
        undefined,
        { shallow: true }
      );

      if (sort == Sort.AGE) {
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => (a.mint_date > b.mint_date ? -1 : 1))
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1))
          );
        }
      }
      if (sort == Sort.EDITION_SIZE) {
        setNfts([...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1)));
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.supply > b.supply) return 1;
              if (a.supply < b.supply) return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.supply > b.supply) return -1;
              if (a.supply < b.supply) return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
      if (sort == Sort.HODLERS) {
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id == t1.id)!.hodlers >
                nftMetas.find((t2) => b.id == t2.id)!.hodlers
              )
                return 1;
              if (
                nftMetas.find((t1) => a.id == t1.id)!.hodlers <
                nftMetas.find((t2) => b.id == t2.id)!.hodlers
              )
                return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id == t1.id)!.hodlers >
                nftMetas.find((t2) => b.id == t2.id)!.hodlers
              )
                return -1;
              if (
                nftMetas.find((t1) => a.id == t1.id)!.hodlers <
                nftMetas.find((t2) => b.id == t2.id)!.hodlers
              )
                return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
      if (sort == Sort.UNIQUE_PERCENT) {
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id == t1.id)!.percent_unique >
                nftMetas.find((t2) => b.id == t2.id)!.percent_unique
              )
                return 1;
              if (
                nftMetas.find((t1) => a.id == t1.id)!.percent_unique <
                nftMetas.find((t2) => b.id == t2.id)!.percent_unique
              )
                return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id == t1.id)!.percent_unique >
                nftMetas.find((t2) => b.id == t2.id)!.percent_unique
              )
                return -1;
              if (
                nftMetas.find((t1) => a.id == t1.id)!.percent_unique <
                nftMetas.find((t2) => b.id == t2.id)!.percent_unique
              )
                return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
      if (sort == Sort.UNIQUE_PERCENT_EX_MUSEUM) {
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id == t1.id)!.percent_unique_cleaned >
                nftMetas.find((t2) => b.id == t2.id)!.percent_unique_cleaned
              )
                return 1;
              if (
                nftMetas.find((t1) => a.id == t1.id)!.percent_unique_cleaned <
                nftMetas.find((t2) => b.id == t2.id)!.percent_unique_cleaned
              )
                return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id == t1.id)!.percent_unique_cleaned >
                nftMetas.find((t2) => b.id == t2.id)!.percent_unique_cleaned
              )
                return -1;
              if (
                nftMetas.find((t1) => a.id == t1.id)!.percent_unique_cleaned <
                nftMetas.find((t2) => b.id == t2.id)!.percent_unique_cleaned
              )
                return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
      if (sort == Sort.FLOOR_PRICE) {
        setNfts([...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1)));
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.floor_price > b.floor_price) return 1;
              if (a.floor_price < b.floor_price) return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.floor_price > b.floor_price) return -1;
              if (a.floor_price < b.floor_price) return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
      if (sort == Sort.MARKET_CAP) {
        setNfts([...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1)));
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.market_cap > b.market_cap) return 1;
              if (a.market_cap < b.market_cap) return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.market_cap > b.market_cap) return -1;
              if (a.market_cap < b.market_cap) return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
      if (sort == Sort.VOLUME) {
        setNfts([...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1)));
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              const aVolume = getValuesForVolumeType(volumeType, a);
              const bVolume = getValuesForVolumeType(volumeType, b);

              if (aVolume > bVolume) return -1;
              if (aVolume < bVolume) return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              const aVolume = getValuesForVolumeType(volumeType, a);
              const bVolume = getValuesForVolumeType(volumeType, b);
              if (aVolume > bVolume) return 1;
              if (aVolume < bVolume) return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
    }
  }, [sort, sortDir, nftsLoaded]);

  function getBalance(id: number) {
    const balance = nftBalances.find((b) => b.token_id == id);
    if (balance) {
      return balance.balance;
    }
    return 0;
  }

  function printMintDate(nft: LabNFT) {
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
              className={address && styles.nftImagePadding}>
              <NFTImage
                nft={nft}
                animation={false}
                height={300}
                balance={getBalance(nft.id)}
                showThumbnail={true}
                showUnseized={address != undefined && address != null}
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
              {sort && sort == Sort.AGE && printMintDate(nft)}
              {sort == Sort.EDITION_SIZE && `Edition Size: ${nft.supply}`}
              {sort == Sort.HODLERS &&
                `Collectors: ${
                  nftMetas.find((nftm) => nftm.id == nft.id)?.hodlers
                }`}
              {sort == Sort.UNIQUE_PERCENT &&
                `Unique: ${
                  Math.round(
                    nftMetas.find((nftm) => nftm.id == nft.id)
                      ?.percent_unique! *
                      100 *
                      10
                  ) / 10
                }%`}
              {sort == Sort.UNIQUE_PERCENT_EX_MUSEUM &&
                `Unique Ex-Museum: ${
                  Math.round(
                    nftMetas.find((nftm) => nftm.id == nft.id)
                      ?.percent_unique_cleaned! *
                      100 *
                      10
                  ) / 10
                }%`}
              {sort == Sort.FLOOR_PRICE &&
                (nft.floor_price > 0
                  ? `Floor Price: ${numberWithCommas(
                      Math.round(nft.floor_price * 100) / 100
                    )} ETH`
                  : `Floor Price: N/A`)}
              {sort == Sort.MARKET_CAP &&
                (nft.market_cap > 0
                  ? `Market Cap: ${numberWithCommas(
                      Math.round(nft.market_cap * 100) / 100
                    )} ETH`
                  : `Market Cap: N/A`)}
              {sort == Sort.VOLUME &&
                (nft.total_volume_last_7_days > 0
                  ? `Volume (${volumeType}): ${numberWithCommas(
                      Math.round(
                        (volumeType == VolumeType.HOURS_24
                          ? nft.total_volume_last_24_hours
                          : volumeType == VolumeType.DAYS_7
                          ? nft.total_volume_last_7_days
                          : volumeType == VolumeType.DAYS_30
                          ? nft.total_volume_last_1_month
                          : nft.total_volume) * 100
                      ) / 100
                    )} ETH`
                  : `Volume: N/A`)}
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
                  <h1>MEME LAB COLLECTIONS</h1>
                </Col>
              </Row>
              <Row className="pt-3">
                <Col>
                  <h2 className="font-color">{collectionName}</h2>
                </Col>
              </Row>
              <Row className="pt-2">
                <Col>
                  Sort by&nbsp;&nbsp;
                  <FontAwesomeIcon
                    icon="chevron-circle-up"
                    onClick={() => setSortDir(SortDirection.ASC)}
                    className={`${styles.sortDirection} ${
                      sortDir != SortDirection.ASC ? styles.disabled : ""
                    }`}
                  />{" "}
                  <FontAwesomeIcon
                    icon="chevron-circle-down"
                    onClick={() => setSortDir(SortDirection.DESC)}
                    className={`${styles.sortDirection} ${
                      sortDir != SortDirection.DESC ? styles.disabled : ""
                    }`}
                  />
                </Col>
              </Row>
              <Row className="pt-2">
                <Col>
                  <span
                    onClick={() => setSort(Sort.AGE)}
                    className={`${styles.sort} ${
                      sort != Sort.AGE ? styles.disabled : ""
                    }`}>
                    Age
                  </span>
                  <span
                    onClick={() => setSort(Sort.EDITION_SIZE)}
                    className={`${styles.sort} ${
                      sort != Sort.EDITION_SIZE ? styles.disabled : ""
                    }`}>
                    Edition Size
                  </span>
                  <span
                    onClick={() => setSort(Sort.HODLERS)}
                    className={`${styles.sort} ${
                      sort != Sort.HODLERS ? styles.disabled : ""
                    }`}>
                    Collectors
                  </span>
                  <span
                    onClick={() => setSort(Sort.UNIQUE_PERCENT)}
                    className={`${styles.sort} ${
                      sort != Sort.UNIQUE_PERCENT ? styles.disabled : ""
                    }`}>
                    Unique %
                  </span>
                  <span
                    onClick={() => setSort(Sort.UNIQUE_PERCENT_EX_MUSEUM)}
                    className={`${styles.sort} ${
                      sort != Sort.UNIQUE_PERCENT_EX_MUSEUM
                        ? styles.disabled
                        : ""
                    }`}>
                    Unique % Ex-Museum
                  </span>
                  <span
                    onClick={() => setSort(Sort.FLOOR_PRICE)}
                    className={`${styles.sort} ${
                      sort != Sort.FLOOR_PRICE ? styles.disabled : ""
                    }`}>
                    Floor Price
                  </span>
                  <span
                    onClick={() => setSort(Sort.MARKET_CAP)}
                    className={`${styles.sort} ${
                      sort != Sort.MARKET_CAP ? styles.disabled : ""
                    }`}>
                    Market Cap
                  </span>
                  <span>
                    <Dropdown
                      className={`${styles.volumeDropdown} ${
                        sort == Sort.VOLUME ? styles.volumeDropdownEnabled : ""
                      }`}
                      drop={"down-centered"}>
                      <Dropdown.Toggle>Volume</Dropdown.Toggle>
                      <Dropdown.Menu>
                        {Object.values(VolumeType).map((vol) => (
                          <Dropdown.Item
                            key={vol}
                            onClick={() => {
                              setVolumeType(vol);
                              if (sort != Sort.VOLUME) {
                                setSort(Sort.VOLUME);
                              }
                            }}>
                            {vol}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </span>
                </Col>
              </Row>
              {nftsLoaded &&
                (nfts.length > 0 ? (
                  printNfts()
                ) : (
                  <Col>
                    <Image
                      loading={"lazy"}
                      width="0"
                      height="0"
                      style={{ height: "auto", width: "100px" }}
                      src="/SummerGlasses.svg"
                      alt="SummerGlasses"
                    />{" "}
                    Nothing here yet
                  </Col>
                ))}
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
}
