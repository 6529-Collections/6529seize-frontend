import styles from "./MemeLab.module.scss";
import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Row, Col, Dropdown } from "react-bootstrap";
import { LabNFT, LabExtendedData, VolumeType } from "../../entities/INFT";
import { NftOwner } from "../../entities/IOwner";
import { SortDirection } from "../../entities/ISort";
import {
  getValuesForVolumeType,
  numberWithCommas,
  printMintDate,
} from "../../helpers/Helpers";
import { useRouter } from "next/router";
import { fetchAllPages } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import DotLoader from "../dotLoader/DotLoader";
import { AuthContext } from "../auth/Auth";
import NothingHereYetSummer from "../nothingHereYet/NothingHereYetSummer";
import { MEMELAB_CONTRACT } from "../../constants";

enum Sort {
  AGE = "age",
  EDITION_SIZE = "edition-size",
  HODLERS = "collectors",
  ARTISTS = "artists",
  COLLECTIONS = "collections",
  UNIQUE_PERCENT = "unique",
  UNIQUE_PERCENT_EX_MUSEUM = "unique-ex-museum",
  FLOOR_PRICE = "floor-price",
  MARKET_CAP = "market-cap",
  VOLUME = "volume",
}

interface Props {
  wallets: string[];
}

export default function MemeLabComponent(props: Readonly<Props>) {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);

  useEffect(() => {
    if (router.isReady) {
      let initialSortDir = SortDirection.ASC;
      let initialSort = Sort.AGE;

      const routerSortDir = router.query.sort_dir;
      if (routerSortDir) {
        const resolvedRouterSortDir = Object.values(SortDirection).find(
          (sd) => sd === routerSortDir
        );
        if (resolvedRouterSortDir) {
          initialSortDir = resolvedRouterSortDir;
        }
      }

      const routerSort = router.query.sort;
      if (routerSort) {
        const resolvedRouterSort = Object.values(Sort).find(
          (sd) => sd === routerSort
        );
        if (resolvedRouterSort) {
          initialSort = resolvedRouterSort;
        }
      }

      setSort(initialSort);
      setSortDir(initialSortDir);
    }
  }, [router.isReady]);

  const [sortDir, setSortDir] = useState<SortDirection>();
  const [sort, setSort] = useState<Sort>();

  const [nfts, setNfts] = useState<LabNFT[]>([]);
  const [nftMetas, setNftMetas] = useState<LabExtendedData[]>([]);
  const [nftBalances, setNftBalances] = useState<NftOwner[]>([]);
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [labArtists, setLabArtists] = useState<string[]>([]);
  const [labCollections, setLabCollections] = useState<string[]>([]);

  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.HOURS_24);

  function getBalance(id: number) {
    const balance = nftBalances.find((b) => b.token_id === id);
    if (balance) {
      return balance.balance;
    }
    return 0;
  }

  useEffect(() => {
    const nftsUrl = `${process.env.API_ENDPOINT}/api/lab_extended_data`;
    fetchAllPages(nftsUrl).then((responseNftMetas: LabExtendedData[]) => {
      setNftMetas(responseNftMetas);
      const myCollections: string[] = [];
      [...responseNftMetas].map((nftMeta) => {
        if (!myCollections.includes(nftMeta.metadata_collection)) {
          myCollections.push(nftMeta.metadata_collection);
        }
      });
      setLabCollections(myCollections.sort());
      if (responseNftMetas.length > 0) {
        const tokenIds = responseNftMetas.map((n: LabExtendedData) => n.id);
        fetchAllPages(
          `${process.env.API_ENDPOINT}/api/nfts_memelab?id=${tokenIds.join(
            ","
          )}`
        ).then((responseNfts: any[]) => {
          setNfts(responseNfts);
        });
      } else {
        setNfts([]);
        setNftsLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    const connected =
      connectedProfile?.consolidation?.consolidation_key ??
      connectedProfile?.consolidation.wallets?.[0]?.wallet.address;
    if (connected) {
      fetchAllPages(
        `${process.env.API_ENDPOINT}/api/nft-owners/consolidation/${connected}?contract=${MEMELAB_CONTRACT}`
      ).then((owners: NftOwner[]) => {
        setNftBalances(owners);
        setBalancesLoaded(true);
      });
    } else {
      setNftBalances([]);
    }
  }, [connectedProfile]);

  useEffect(() => {
    if (nfts && nfts.length > 0) {
      const myArtists: string[] = [];
      [...nfts].map((nft) => {
        if (!myArtists.includes(nft.artist)) {
          myArtists.push(nft.artist);
        }
      });
      setLabArtists(myArtists.sort());
      setNftsLoaded(true);
    }
  }, [nfts]);

  useEffect(() => {
    if (sort && sortDir && nftsLoaded) {
      router.replace(
        {
          query: { sort: sort, sort_dir: sortDir },
        },
        undefined,
        { shallow: true }
      );

      if (sort === Sort.AGE) {
        if (sortDir === SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => (a.mint_date > b.mint_date ? -1 : 1))
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1))
          );
        }
      }
      if (sort === Sort.EDITION_SIZE) {
        setNfts([...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1)));
        if (sortDir === SortDirection.ASC) {
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
      if (sort === Sort.HODLERS) {
        if (sortDir === SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id === t1.id)!.hodlers >
                nftMetas.find((t2) => b.id === t2.id)!.hodlers
              )
                return 1;
              if (
                nftMetas.find((t1) => a.id === t1.id)!.hodlers <
                nftMetas.find((t2) => b.id === t2.id)!.hodlers
              )
                return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id === t1.id)!.hodlers >
                nftMetas.find((t2) => b.id === t2.id)!.hodlers
              )
                return -1;
              if (
                nftMetas.find((t1) => a.id === t1.id)!.hodlers <
                nftMetas.find((t2) => b.id === t2.id)!.hodlers
              )
                return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
      if (sort === Sort.ARTISTS) {
        if (sortDir === SortDirection.ASC) {
          setLabArtists([...labArtists].sort());
        } else {
          setLabArtists([...labArtists].reverse());
        }
      }
      if (sort === Sort.COLLECTIONS) {
        if (sortDir === SortDirection.ASC) {
          setLabCollections([...labCollections].sort());
        } else {
          setLabCollections([...labCollections].reverse());
        }
      }
      if (sort === Sort.UNIQUE_PERCENT) {
        if (sortDir === SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id === t1.id)!.percent_unique >
                nftMetas.find((t2) => b.id === t2.id)!.percent_unique
              )
                return 1;
              if (
                nftMetas.find((t1) => a.id === t1.id)!.percent_unique <
                nftMetas.find((t2) => b.id === t2.id)!.percent_unique
              )
                return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id === t1.id)!.percent_unique >
                nftMetas.find((t2) => b.id === t2.id)!.percent_unique
              )
                return -1;
              if (
                nftMetas.find((t1) => a.id === t1.id)!.percent_unique <
                nftMetas.find((t2) => b.id === t2.id)!.percent_unique
              )
                return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
      if (sort === Sort.UNIQUE_PERCENT_EX_MUSEUM) {
        if (sortDir === SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id === t1.id)!.percent_unique_cleaned >
                nftMetas.find((t2) => b.id === t2.id)!.percent_unique_cleaned
              )
                return 1;
              if (
                nftMetas.find((t1) => a.id === t1.id)!.percent_unique_cleaned <
                nftMetas.find((t2) => b.id === t2.id)!.percent_unique_cleaned
              )
                return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (
                nftMetas.find((t1) => a.id === t1.id)!.percent_unique_cleaned >
                nftMetas.find((t2) => b.id === t2.id)!.percent_unique_cleaned
              )
                return -1;
              if (
                nftMetas.find((t1) => a.id === t1.id)!.percent_unique_cleaned <
                nftMetas.find((t2) => b.id === t2.id)!.percent_unique_cleaned
              )
                return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
      if (sort === Sort.FLOOR_PRICE) {
        setNfts([...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1)));
        if (sortDir === SortDirection.ASC) {
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
      if (sort === Sort.MARKET_CAP) {
        setNfts([...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1)));
        if (sortDir === SortDirection.ASC) {
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
      if (sort === Sort.VOLUME) {
        setNfts([...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1)));
        if (sortDir === SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              const aVolume = getValuesForVolumeType(volumeType, a);
              const bVolume = getValuesForVolumeType(volumeType, b);

              if (aVolume > bVolume) return 1;
              if (aVolume < bVolume) return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              const aVolume = getValuesForVolumeType(volumeType, a);
              const bVolume = getValuesForVolumeType(volumeType, b);
              if (aVolume > bVolume) return -1;
              if (aVolume < bVolume) return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        }
      }
    }
  }, [sort, sortDir, nftsLoaded, volumeType]);

  function printNft(nft: LabNFT) {
    return (
      <Col
        key={`${nft.contract}-${nft.id}`}
        className="pt-3 pb-3"
        xs={{ span: 6 }}
        sm={{ span: 4 }}
        md={{ span: 3 }}
        lg={{ span: 3 }}>
        <a href={`/meme-lab/${nft.id}`} className="decoration-none scale-hover">
          <Container fluid>
            <Row
              className={
                props.wallets.length > 0 ? styles.nftImagePadding : ""
              }>
              <NFTImage
                nft={nft}
                animation={false}
                height={300}
                balance={balancesLoaded ? getBalance(nft.id) : -1}
                showThumbnail={true}
                showUnseized={props.wallets.length > 0}
              />
            </Row>
            <Row>
              <Col className="text-center pt-2">
                #{nft.id} - {nft.name}
              </Col>
            </Row>
            <Row>
              <Col className="text-center pt-1">
                {sort &&
                  (sort === Sort.AGE || sort === Sort.ARTISTS) &&
                  printMintDate(nft.mint_date)}
                {sort === Sort.COLLECTIONS && `Artists: ${nft.artist}`}
                {sort === Sort.EDITION_SIZE &&
                  `Edition Size: ${numberWithCommas(nft.supply)}`}
                {sort === Sort.HODLERS &&
                  `Collectors: ${numberWithCommas(
                    nftMetas.find((nftm) => nftm.id === nft.id)!.hodlers
                  )}`}
                {sort === Sort.UNIQUE_PERCENT &&
                  `Unique: ${
                    Math.round(
                      nftMetas.find((nftm) => nftm.id === nft.id)
                        ?.percent_unique! *
                        100 *
                        10
                    ) / 10
                  }%`}
                {sort === Sort.UNIQUE_PERCENT_EX_MUSEUM &&
                  `Unique Ex-Museum: ${
                    Math.round(
                      nftMetas.find((nftm) => nftm.id === nft.id)
                        ?.percent_unique_cleaned! *
                        100 *
                        10
                    ) / 10
                  }%`}
                {sort === Sort.FLOOR_PRICE &&
                  (nft.floor_price > 0
                    ? `Floor Price: ${numberWithCommas(
                        Math.round(nft.floor_price * 100) / 100
                      )} ETH`
                    : `Floor Price: N/A`)}
                {sort === Sort.MARKET_CAP &&
                  (nft.market_cap > 0
                    ? `Market Cap: ${numberWithCommas(
                        Math.round(nft.market_cap * 100) / 100
                      )} ETH`
                    : `Market Cap: N/A`)}
                {sort === Sort.VOLUME &&
                  `Volume (${volumeType}): ${numberWithCommas(
                    Math.round(
                      (volumeType === VolumeType.HOURS_24
                        ? nft.total_volume_last_24_hours
                        : volumeType === VolumeType.DAYS_7
                        ? nft.total_volume_last_7_days
                        : volumeType === VolumeType.DAYS_30
                        ? nft.total_volume_last_1_month
                        : nft.total_volume) * 100
                    ) / 100
                  )} ETH`}
              </Col>
            </Row>
          </Container>
        </a>
      </Col>
    );
  }

  function printNfts() {
    return <Row className="pt-2">{nfts.map((nft) => printNft(nft))}</Row>;
  }

  function printArtists() {
    return labArtists.map((artist) => {
      const artistNfts = [...nfts].filter((n) => n.artist === artist);
      return (
        <Row key={`${artist}-row`}>
          <Col xs={12} className="pt-3">
            <h4>{artist}</h4>
          </Col>
          {[...artistNfts]
            .sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1))
            .map((nft: LabNFT) => printNft(nft))}
        </Row>
      );
    });
  }

  function printCollections() {
    return labCollections.map((collection) => {
      const collectionNftsMetas = [...nftMetas].filter(
        (n) => n.metadata_collection === collection
      );
      const collectionNfts = [...nfts].filter((n) =>
        collectionNftsMetas.some((a) => a.id === n.id)
      );
      return (
        <Row key={`${collection}-row`}>
          <Col xs={12} className="pt-3">
            <h4>
              {collection}&nbsp;
              <a
                className={styles.collectionLink}
                href={`/meme-lab/collection/${encodeURIComponent(
                  collection.replace(" ", "-")
                )}`}>
                view
              </a>
            </h4>
          </Col>
          {[...collectionNfts]
            .sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1))
            .map((nft: LabNFT) => printNft(nft))}
        </Row>
      );
    });
  }

  return (
    <Container fluid className={styles.mainContainer}>
      <Row>
        <Col>
          <Container className="pt-4">
            <>
              <Row>
                <Col>
                  <h1>
                    <span className="font-lightest">Meme</span> Lab
                  </h1>
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
                    onClick={() => setSort(Sort.ARTISTS)}
                    className={`${styles.sort} ${
                      sort != Sort.ARTISTS ? styles.disabled : ""
                    }`}>
                    Artists
                  </span>
                  <span
                    onClick={() => setSort(Sort.COLLECTIONS)}
                    className={`${styles.sort} ${
                      sort != Sort.COLLECTIONS ? styles.disabled : ""
                    }`}>
                    Collections
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
                        sort === Sort.VOLUME ? styles.volumeDropdownEnabled : ""
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
              {nftsLoaded ? (
                nfts.length > 0 ? (
                  sort === Sort.ARTISTS ? (
                    printArtists()
                  ) : sort === Sort.COLLECTIONS ? (
                    printCollections()
                  ) : (
                    printNfts()
                  )
                ) : (
                  <Col>
                    <NothingHereYetSummer />
                  </Col>
                )
              ) : (
                <Row>
                  <Col className="pt-3">
                    Fetching <DotLoader />
                  </Col>
                </Row>
              )}
            </>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
