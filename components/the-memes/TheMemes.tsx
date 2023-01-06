import styles from "./TheMemes.module.scss";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Row, Col } from "react-bootstrap";
import { useAccount } from "wagmi";
import { MEMES_CONTRACT } from "../../constants";
import { DBResponse } from "../../entities/IDBResponse";
import { NFT, MemesExtendedData } from "../../entities/INFT";
import { Owner } from "../../entities/IOwner";
import { SortDirection } from "../../entities/ISort";
import { Crumb } from "../breadcrumb/Breadcrumb";
import { getDateDisplay, numberWithCommas } from "../../helpers/Helpers";
import { useRouter } from "next/router";

const NFTImage = dynamic(() => import("../nft-image/NFTImage"), {
  ssr: false,
});

enum Sort {
  AGE = "age",
  EDITION_SIZE = "edition-size",
  MEME = "meme",
  HODLERS = "hodlers",
  TDH = "tdh",
  UNIQUE_PERCENT = "unique",
  UNIQUE_PERCENT_EX_MUSEUM = "unique-ex-museum",
  FLOOR_PRICE = "floor-price",
  MARKET_CAP = "market-cap",
}

interface Meme {
  meme: number;
  meme_name: string;
}

interface Props {
  setCrumbs(crumbs: Crumb[]): any;
}

export default function TheMemesComponent(props: Props) {
  const router = useRouter();

  const { address, connector, isConnected } = useAccount();

  useEffect(() => {
    if (router.isReady) {
      let initialSortDir = SortDirection.ASC;
      let initialSort = Sort.AGE;
      let initialSzn = 0;

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
  const [nftMetas, setNftMetas] = useState<MemesExtendedData[]>([]);
  const [nftBalances, setNftBalances] = useState<Owner[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [nftMemes, setNftMemes] = useState<Meme[]>([]);

  function getBalance(id: number) {
    const balance = nftBalances.find((b) => b.token_id == id);
    if (balance) {
      return balance.balance;
    }
    return 0;
  }

  useEffect(() => {
    const crumbs = [];
    crumbs.push({ display: "Home", href: "/" });
    crumbs.push({ display: "The Memes" });
    if (selectedSeason > 0) {
      crumbs.push({ display: `SZN${selectedSeason}` });
    }
    props.setCrumbs(crumbs);

    if (sort && sortDir) {
      if (selectedSeason > 0) {
        router.replace({
          query: { szn: selectedSeason, sort: sort, sort_dir: sortDir },
        });
      } else {
        router.replace({
          query: { sort: sort, sort_dir: sortDir },
        });
      }
    }
  }, [selectedSeason]);

  useEffect(() => {
    const myMemes: Meme[] = [];
    [...nftMetas].map((nftm) => {
      if (!myMemes.some((m) => m.meme == nftm.meme)) {
        myMemes.push({
          meme: nftm.meme,
          meme_name: nftm.meme_name,
        });
      }
    });

    setNftMemes([...myMemes].sort((a, b) => (a.meme > b.meme ? 1 : -1)));
  }, [nftMetas]);

  useEffect(() => {
    const nftsUrl = `${process.env.API_ENDPOINT}/api/memes_extended_data`;
    fetch(nftsUrl)
      .then((res) => res.json())
      .then((response: DBResponse) => {
        const nftMetas = response.data;
        setNftMetas(nftMetas);
        if (nftMetas.length > 0) {
          const tokenIds = nftMetas.map((n: MemesExtendedData) => n.id);
          fetch(
            `${
              process.env.API_ENDPOINT
            }/api/nfts?contract=${MEMES_CONTRACT}&id=${tokenIds.join(",")}`
          )
            .then((res) => res.json())
            .then((response: DBResponse) => {
              setNfts(response.data);
              setNftsLoaded(true);
            });
        } else {
          setNfts([]);
          setNftsLoaded(true);
        }
      });
  }, []);

  useEffect(() => {
    if (address && nftMetas.length > 0) {
      fetch(
        `${process.env.API_ENDPOINT}/api/owners?contract=${MEMES_CONTRACT}&wallet=${address}`
      )
        .then((res) => res.json())
        .then((response: DBResponse) => {
          setNftBalances(response.data);
        });
    } else {
      setNftBalances([]);
    }
  }, [nftMetas, address]);

  useEffect(() => {
    if (sort && sortDir && nftsLoaded) {
      if (selectedSeason > 0) {
        router.replace({
          query: { szn: selectedSeason, sort: sort, sort_dir: sortDir },
        });
      } else {
        router.replace({
          query: { sort: sort, sort_dir: sortDir },
        });
      }

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
      if (sort == Sort.MEME) {
        if (sortDir == SortDirection.ASC) {
          setNftMemes([...nftMemes].sort((a, b) => (a.meme > b.meme ? 1 : -1)));
        } else {
          setNftMemes([...nftMemes].sort((a, b) => (a.meme > b.meme ? -1 : 1)));
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
      if (sort == Sort.TDH) {
        setNfts([...nfts].sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1)));
        if (sortDir == SortDirection.ASC) {
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
    }
  }, [sort, sortDir, nftsLoaded]);

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

  function printNft(nft: NFT) {
    const season = nft.metadata.attributes.find(
      (a: any) => a.trait_type == "Type - Season"
    ).value;
    if (selectedSeason == 0 || selectedSeason == season) {
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
              <a href={`/the-memes/${nft.id}`}>
                <NFTImage
                  nft={nft}
                  animation={false}
                  height={300}
                  balance={getBalance(nft.id)}
                  showThumbnail={true}
                />
              </a>
            </Row>
            <Row>
              <Col className="text-center pt-2">
                <a href={`/the-memes/${nft.id}`}>{nft.name}</a>
              </Col>
            </Row>
            <Row>
              <Col className="text-center pt-1">
                {sort &&
                  (sort == Sort.AGE || sort == Sort.MEME) &&
                  printMintDate(nft)}
                {sort == Sort.EDITION_SIZE && `Edition Size: ${nft.supply}`}
                {sort == Sort.TDH &&
                  `TDH: ${numberWithCommas(Math.round(nft.tdh))}`}
                {sort == Sort.HODLERS &&
                  `HODLers: ${
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
              </Col>
            </Row>
          </Container>
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
        nftMetas.find((m) => n.id == m.id && m.meme == meme.meme)
      );
      return (
        <>
          <Row className="pt-3" key={`${meme.meme}-${meme.meme_name}-row-1`}>
            <Col key={`${meme.meme}-${meme.meme_name}-row-1-col`}>
              <h4>
                {meme.meme} - {meme.meme_name}
              </h4>
            </Col>
          </Row>
          <Row key={`${meme.meme}-${meme.meme_name}-row-2`}>
            {[...memeNfts]
              .sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1))
              .map((nft: NFT) => printNft(nft))}
          </Row>
        </>
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
                  <h1>THE MEMES</h1>
                </Col>
                <Col className="d-flex align-items-center justify-content-end">
                  <h3>
                    <span
                      onClick={() => setSelectedSeason(0)}
                      className={`${styles.season} ${
                        selectedSeason > 0 ? styles.disabled : ""
                      }`}>
                      All
                    </span>
                  </h3>
                  <h3>&nbsp;&nbsp;|&nbsp;&nbsp;</h3>
                  <h3>
                    <span
                      onClick={() => setSelectedSeason(1)}
                      className={`${styles.season} ${
                        selectedSeason != 1 ? styles.disabled : ""
                      }`}>
                      SZN1
                    </span>
                  </h3>
                  <h3>&nbsp;&nbsp;|&nbsp;&nbsp;</h3>
                  <h3>
                    <span
                      onClick={() => setSelectedSeason(2)}
                      className={`${styles.season} ${
                        selectedSeason != 2 ? styles.disabled : ""
                      }`}>
                      SZN2
                    </span>
                  </h3>
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
                    HODLers
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
                </Col>
              </Row>

              {nftsLoaded &&
                (nfts.length > 0 ? (
                  sort == Sort.MEME ? (
                    printMemes()
                  ) : (
                    printNfts()
                  )
                ) : (
                  <Col>
                    <img src="/SummerGlasses.svg" className="icon-100" />{" "}
                    Nothing here yet
                  </Col>
                ))}
            </>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
