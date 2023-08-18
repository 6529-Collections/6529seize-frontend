import styles from "./TheMemes.module.scss";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Row, Col, Dropdown } from "react-bootstrap";
import { MEMES_CONTRACT } from "../../constants";
import { NFT, MemesExtendedData, VolumeType } from "../../entities/INFT";
import { Owner } from "../../entities/IOwner";
import { SortDirection } from "../../entities/ISort";
import { Crumb } from "../breadcrumb/Breadcrumb";
import {
  areEqualAddresses,
  getValuesForVolumeType,
  numberWithCommas,
  printMintDate,
} from "../../helpers/Helpers";
import { useRouter } from "next/router";
import { fetchAllPages } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import SeasonsDropdown from "../seasons-dropdown/SeasonsDropdown";
import DotLoader from "../dotLoader/DotLoader";

enum Sort {
  AGE = "age",
  EDITION_SIZE = "edition-size",
  MEME = "meme",
  HODLERS = "collectors",
  TDH = "tdh",
  UNIQUE_PERCENT = "unique",
  UNIQUE_PERCENT_EX_MUSEUM = "unique-ex-museum",
  FLOOR_PRICE = "floor-price",
  MARKET_CAP = "market-cap",
  VOLUME = "volume",
}

interface Meme {
  meme: number;
  meme_name: string;
}

interface Props {
  setCrumbs(crumbs: Crumb[]): any;
  wallets: string[];
}

export default function TheMemesComponent(props: Props) {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      let initialSortDir = SortDirection.ASC;
      let initialSort = Sort.AGE;
      let initialSzn = 0;

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

      const routerSzn = router.query.szn;
      if (routerSzn) {
        if (Array.isArray(routerSzn)) {
          initialSzn = parseInt(routerSzn[0]);
        } else {
          initialSzn = parseInt(routerSzn);
        }
      }

      setSort(initialSort);
      setSortDir(initialSortDir);
      setSelectedSeason(initialSzn);
    }
  }, [router.isReady]);

  const [sortDir, setSortDir] = useState<SortDirection>();
  const [sort, setSort] = useState<Sort>();

  const [selectedSeason, setSelectedSeason] = useState(0);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [nftMetas, setNftMetas] = useState<MemesExtendedData[]>([]);
  const [nftBalances, setNftBalances] = useState<Owner[]>([]);
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const [nftMetassLoaded, setNftMetasLoaded] = useState(false);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [nftMemes, setNftMemes] = useState<Meme[]>([]);

  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.HOURS_24);

  function getBalance(id: number) {
    const balance = nftBalances.find((b) => b.token_id === id);
    if (balance) {
      return balance.balance;
    }
    return 0;
  }

  useEffect(() => {
    const crumbs = [];
    crumbs.push({ display: "Home", href: "/" });

    if (selectedSeason > 0) {
      crumbs.push({
        display: "The Memes",
        href: `/the-memes?sort=${sort}&sort_dir=${sortDir}`,
      });
      crumbs.push({ display: `SZN${selectedSeason}` });
    } else {
      crumbs.push({ display: "The Memes" });
    }
    props.setCrumbs(crumbs);

    if (sort && sortDir) {
      if (selectedSeason > 0) {
        router.replace(
          {
            query: { szn: selectedSeason, sort: sort, sort_dir: sortDir },
          },
          undefined,
          { shallow: true }
        );
      } else {
        router.replace(
          {
            query: { sort: sort, sort_dir: sortDir },
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, [selectedSeason]);

  useEffect(() => {
    const myMemes: Meme[] = [];
    [...nftMetas].map((nftm) => {
      if (!myMemes.some((m) => m.meme === nftm.meme)) {
        myMemes.push({
          meme: nftm.meme,
          meme_name: nftm.meme_name,
        });
      }
    });

    setNftMemes([...myMemes].sort((a, b) => (a.meme > b.meme ? 1 : -1)));
  }, [nftMetas]);

  useEffect(() => {
    const extendedDataUrl = `${process.env.API_ENDPOINT}/api/memes_extended_data?page_size=100`;
    fetchAllPages(extendedDataUrl).then((responseNftMetas: any[]) => {
      setNftMetas(responseNftMetas);
      setSeasons(
        Array.from(new Set(responseNftMetas.map((meme) => meme.season))).sort(
          (a, b) => a - b
        )
      );
      setNftMetasLoaded(true);
    });
  }, []);

  useEffect(() => {
    fetchAllPages(
      `${process.env.API_ENDPOINT}/api/nfts?contract=${MEMES_CONTRACT}&page_size=100`
    ).then((responseNfts: any[]) => {
      setNfts(responseNfts);
      setNftsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (props.wallets.length > 0 && nftMetas.length > 0) {
      fetchAllPages(
        `${
          process.env.API_ENDPOINT
        }/api/owners?contract=${MEMES_CONTRACT}&wallet=${props.wallets.join(
          ","
        )}`
      ).then((owners: Owner[]) => {
        const mergedOwners = owners.reduce(
          (accumulator: Owner[], currentOwner: Owner) => {
            const existingOwner = accumulator.find(
              (owner) =>
                areEqualAddresses(owner.contract, currentOwner.contract) &&
                owner.token_id === currentOwner.token_id
            );

            if (existingOwner) {
              existingOwner.balance += currentOwner.balance;
            } else {
              accumulator.push(currentOwner);
            }

            return accumulator;
          },
          [] as Owner[]
        );
        setNftBalances(mergedOwners);
        setBalancesLoaded(true);
      });
    } else {
      setNftBalances([]);
    }
  }, [nftMetas, props.wallets]);

  useEffect(() => {
    if (sort && sortDir && nftsLoaded && nftMetassLoaded) {
      if (selectedSeason > 0) {
        router.replace(
          {
            query: { szn: selectedSeason, sort: sort, sort_dir: sortDir },
          },
          undefined,
          { shallow: true }
        );
      } else {
        router.replace(
          {
            query: { sort: sort, sort_dir: sortDir },
          },
          undefined,
          { shallow: true }
        );
      }

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
      if (sort === Sort.MEME) {
        if (sortDir === SortDirection.ASC) {
          setNftMemes([...nftMemes].sort((a, b) => (a.meme > b.meme ? 1 : -1)));
        } else {
          setNftMemes([...nftMemes].sort((a, b) => (a.meme > b.meme ? -1 : 1)));
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
      if (sort === Sort.TDH) {
        setNfts([...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1)));
        if (sortDir === SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.tdh > b.tdh) return 1;
              if (a.tdh < b.tdh) return -1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.tdh > b.tdh) return -1;
              if (a.tdh < b.tdh) return 1;
              return a.mint_date > b.mint_date ? 1 : -1;
            })
          );
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
  }, [sort, sortDir, nftsLoaded, nftMetassLoaded, volumeType]);

  function printNft(nft: NFT) {
    const meta = nftMetas.find((a) => a.id === nft.id);
    if (meta && (selectedSeason === 0 || selectedSeason === meta.season)) {
      return (
        <Col
          key={`${nft.contract}-${nft.id}`}
          className="pt-3 pb-3"
          xs={{ span: 6 }}
          sm={{ span: 4 }}
          md={{ span: 3 }}
          lg={{ span: 3 }}>
          <a
            href={`/the-memes/${nft.id}`}
            className="decoration-none scale-hover">
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
                    (sort === Sort.AGE || sort === Sort.MEME) &&
                    printMintDate(nft.mint_date)}
                  {sort === Sort.EDITION_SIZE && `Edition Size: ${nft.supply}`}
                  {sort === Sort.TDH &&
                    `TDH: ${numberWithCommas(Math.round(nft.tdh))}`}
                  {sort === Sort.HODLERS &&
                    `Collectors: ${
                      nftMetas.find((nftm) => nftm.id === nft.id)?.hodlers
                    }`}
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
  }

  function printNfts() {
    return <Row className="pt-2">{nfts.map((nft) => printNft(nft))}</Row>;
  }

  function printMemes() {
    return nftMemes.map((meme) => {
      const memeNfts = [...nfts].filter((n) =>
        nftMetas.find((m) => n.id === m.id && m.meme === meme.meme)
      );
      return (
        <Row key={`${meme.meme}-${meme.meme_name}`}>
          <Col xs={12} className="pt-3">
            <Col>
              <h4>
                {meme.meme} - {meme.meme_name}
              </h4>
            </Col>
          </Col>
          {[...memeNfts]
            .sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1))
            .map((nft: NFT) => printNft(nft))}
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
                <Col className="d-flex align-items-center justify-content-start">
                  <h1>THE MEMES</h1>
                </Col>
                <Col className="d-flex align-items-center justify-content-end">
                  <SeasonsDropdown
                    seasons={seasons}
                    selectedSeason={selectedSeason}
                    setSelectedSeason={setSelectedSeason}
                  />
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
                    onClick={() => setSort(Sort.MEME)}
                    className={`${styles.sort} ${
                      sort != Sort.MEME ? styles.disabled : ""
                    }`}>
                    Meme
                  </span>
                  <span
                    onClick={() => setSort(Sort.HODLERS)}
                    className={`${styles.sort} ${
                      sort != Sort.HODLERS ? styles.disabled : ""
                    }`}>
                    Collectors
                  </span>
                  <span
                    onClick={() => setSort(Sort.TDH)}
                    className={`${styles.sort} ${
                      sort != Sort.TDH ? styles.disabled : ""
                    }`}>
                    TDH
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
              {nftsLoaded && nftMetassLoaded ? (
                nfts.length > 0 ? (
                  sort === Sort.MEME ? (
                    printMemes()
                  ) : (
                    printNfts()
                  )
                ) : (
                  <Row>
                    <Col>
                      <Image
                        width="0"
                        height="0"
                        style={{ height: "auto", width: "100px" }}
                        src="/SummerGlasses.svg"
                        alt="SummerGlasses"
                      />{" "}
                      Nothing here yet
                    </Col>
                  </Row>
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
