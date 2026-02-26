"use client";

import {
  faChevronCircleDown,
  faChevronCircleUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { AuthContext } from "@/components/auth/Auth";
import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import styles from "@/components/memelab/MemeLab.module.scss";
import NFTImage from "@/components/nft-image/NFTImage";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import {
  printVolumeTypeDropdown,
  SortButton,
} from "@/components/the-memes/TheMemes";
import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import {
  getValuesForVolumeType,
  numberWithCommas,
  printMintDate,
} from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import { MemeLabSort } from "@/types/enums";

export function getInitialRouterValues(
  sortDir: string | null,
  sort: string | null
) {
  let initialSortDir = SortDirection.ASC;
  let initialSort = MemeLabSort.AGE;

  const routerSortDir = sortDir;
  if (routerSortDir) {
    const routerSortDirStr = Array.isArray(routerSortDir)
      ? routerSortDir[0]
      : routerSortDir;
    const resolvedRouterSortDir = Object.values(SortDirection).find(
      (sd) => sd.toLowerCase() === routerSortDirStr.toLowerCase()
    );
    if (resolvedRouterSortDir) {
      initialSortDir = resolvedRouterSortDir;
    }
  }

  const routerSort = sort;
  if (routerSort) {
    const routerSortStr = Array.isArray(routerSort)
      ? routerSort[0]
      : routerSort;
    const resolvedKey = Object.keys(MemeLabSort).find(
      (k) => k.toLowerCase() === routerSortStr.toLowerCase()
    );
    if (resolvedKey) {
      initialSort = MemeLabSort[resolvedKey as keyof typeof MemeLabSort];
    } else {
      const resolvedVal = Object.values(MemeLabSort).find(
        (v) => v.toLowerCase() === routerSortStr.toLowerCase()
      );
      if (resolvedVal) {
        initialSort = resolvedVal as MemeLabSort;
      }
    }
  }

  return { initialSortDir, initialSort };
}

export function printSortButtons(
  sort: MemeLabSort,
  volumeType: VolumeType,
  setSort: (sort: MemeLabSort) => void,
  setVolumeType: (volumeType: VolumeType) => void,
  isCollection?: boolean
) {
  let enumValues = Object.values(MemeLabSort).filter(
    (v) => v != MemeLabSort.VOLUME
  );

  if (isCollection) {
    enumValues = enumValues.filter(
      (v) => v != MemeLabSort.ARTISTS && v != MemeLabSort.COLLECTIONS
    );
  }

  return (
    <>
      {enumValues.map((v) => (
        <SortButton
          key={v}
          currentSort={sort}
          sort={v}
          select={() => setSort(v)}
        />
      ))}
      {printVolumeTypeDropdown(
        sort === MemeLabSort.VOLUME,
        setVolumeType,
        () => setSort(MemeLabSort.VOLUME),
        volumeType
      )}
    </>
  );
}

export function printNftContent(
  nft: LabNFT,
  sort: MemeLabSort,
  nftMetas: LabExtendedData[],
  volumeType: VolumeType
) {
  return (
    <>
      {sort &&
        (sort === MemeLabSort.AGE || sort === MemeLabSort.ARTISTS) &&
        printMintDate(nft.mint_date)}
      {sort === MemeLabSort.COLLECTIONS && `Artists: ${nft.artist}`}
      {sort === MemeLabSort.EDITION_SIZE &&
        `Edition Size: ${numberWithCommas(nft.supply)}`}
      {sort === MemeLabSort.HODLERS &&
        `Collectors: ${numberWithCommas(
          nftMetas.find((nftm) => nftm.id === nft.id)!.hodlers
        )}`}
      {sort === MemeLabSort.UNIQUE_PERCENT &&
        `Unique: ${
          Math.round(
            nftMetas.find((nftm) => nftm.id === nft.id)?.percent_unique! *
              100 *
              10
          ) / 10
        }%`}
      {sort === MemeLabSort.UNIQUE_PERCENT_EX_MUSEUM &&
        `Unique Ex-Museum: ${
          Math.round(
            nftMetas.find((nftm) => nftm.id === nft.id)
              ?.percent_unique_cleaned! *
              100 *
              10
          ) / 10
        }%`}
      {sort === MemeLabSort.FLOOR_PRICE &&
        (nft.floor_price > 0
          ? `Floor Price: ${numberWithCommas(
              Math.round(nft.floor_price * 100) / 100
            )} ETH`
          : `Floor Price: N/A`)}
      {sort === MemeLabSort.MARKET_CAP &&
        (nft.market_cap > 0
          ? `Market Cap: ${numberWithCommas(
              Math.round(nft.market_cap * 100) / 100
            )} ETH`
          : `Market Cap: N/A`)}
      {sort === MemeLabSort.HIGHEST_OFFER &&
        (nft.highest_offer > 0
          ? `Highest Offer: ${numberWithCommas(
              Math.round(nft.highest_offer * 1000) / 1000
            )} ETH`
          : `Highest Offer: N/A`)}
      {sort === MemeLabSort.VOLUME &&
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
    </>
  );
}

export function sortChanged(
  router: ReturnType<typeof useRouter>,
  sort: MemeLabSort,
  sortDir: SortDirection,
  volumeType: VolumeType,
  nfts: LabNFT[],
  nftMetas: LabExtendedData[],
  setNfts: (nfts: LabNFT[]) => void,
  labArtists?: string[],
  labCollections?: string[],
  setLabArtists?: (artists: string[]) => void,
  setLabCollections?: (collections: string[]) => void
) {
  const sortKey =
    Object.keys(MemeLabSort)
      .find((k) => MemeLabSort[k as keyof typeof MemeLabSort] === sort)
      ?.toLowerCase() ?? "";
  const newQuery: any = {
    sort: sortKey,
    sort_dir: sortDir.toLowerCase(),
  };

  router.replace(`?${new URLSearchParams(newQuery).toString()}`);

  if (sort === MemeLabSort.AGE) {
    if (sortDir === SortDirection.ASC) {
      setNfts([...nfts].sort((a, b) => b.id - a.id));
    } else {
      setNfts([...nfts].sort((a, b) => a.id - b.id));
    }
  }
  if (sort === MemeLabSort.EDITION_SIZE) {
    setNfts([...nfts].sort((a, b) => a.id - b.id));
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.supply > b.supply) return 1;
          if (a.supply < b.supply) return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.supply > b.supply) return -1;
          if (a.supply < b.supply) return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.HODLERS) {
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
          return a.id - b.id;
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
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.ARTISTS && labArtists && setLabArtists) {
    if (sortDir === SortDirection.ASC) {
      setLabArtists([...labArtists].sort());
    } else {
      setLabArtists([...labArtists].reverse());
    }
  }
  if (sort === MemeLabSort.COLLECTIONS && labCollections && setLabCollections) {
    if (sortDir === SortDirection.ASC) {
      setLabCollections([...labCollections].sort());
    } else {
      setLabCollections([...labCollections].reverse());
    }
  }
  if (sort === MemeLabSort.UNIQUE_PERCENT) {
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
          return a.id - b.id;
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
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.UNIQUE_PERCENT_EX_MUSEUM) {
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
          return a.id - b.id;
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
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.FLOOR_PRICE) {
    setNfts([...nfts].sort((a, b) => a.id - b.id));
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.floor_price > b.floor_price) return 1;
          if (a.floor_price < b.floor_price) return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.floor_price > b.floor_price) return -1;
          if (a.floor_price < b.floor_price) return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.MARKET_CAP) {
    setNfts([...nfts].sort((a, b) => a.id - b.id));
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.market_cap > b.market_cap) return 1;
          if (a.market_cap < b.market_cap) return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.market_cap > b.market_cap) return -1;
          if (a.market_cap < b.market_cap) return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.HIGHEST_OFFER) {
    setNfts([...nfts].sort((a, b) => a.id - b.id));
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.highest_offer > b.highest_offer) return 1;
          if (a.highest_offer < b.highest_offer) return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          if (a.highest_offer > b.highest_offer) return -1;
          if (a.highest_offer < b.highest_offer) return 1;
          return a.id - b.id;
        })
      );
    }
  }
  if (sort === MemeLabSort.VOLUME) {
    setNfts([...nfts].sort((a, b) => a.id - b.id));
    if (sortDir === SortDirection.ASC) {
      setNfts(
        [...nfts].sort((a, b) => {
          const aVolume = getValuesForVolumeType(volumeType, a);
          const bVolume = getValuesForVolumeType(volumeType, b);

          if (aVolume > bVolume) return 1;
          if (aVolume < bVolume) return -1;
          return a.id - b.id;
        })
      );
    } else {
      setNfts(
        [...nfts].sort((a, b) => {
          const aVolume = getValuesForVolumeType(volumeType, a);
          const bVolume = getValuesForVolumeType(volumeType, b);
          if (aVolume > bVolume) return -1;
          if (aVolume < bVolume) return 1;
          return a.id - b.id;
        })
      );
    }
  }
}

export default function MemeLabComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connectedProfile } = useContext(AuthContext);
  const isConnected = !!connectedProfile;

  useSetTitle("Meme Lab | Collections");

  useEffect(() => {
    const { initialSortDir, initialSort } = getInitialRouterValues(
      searchParams?.get("sort_dir") ?? null,
      searchParams?.get("sort") ?? null
    );
    setSortDir(initialSortDir);
    setSort(initialSort);
  }, []);

  const [sortDir, setSortDir] = useState<SortDirection>();
  const [sort, setSort] = useState<MemeLabSort>(MemeLabSort.AGE);

  const [nfts, setNfts] = useState<LabNFT[]>([]);
  const [nftMetas, setNftMetas] = useState<LabExtendedData[]>([]);

  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [labArtists, setLabArtists] = useState<string[]>([]);
  const [labCollections, setLabCollections] = useState<string[]>([]);

  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.HOURS_24);

  useEffect(() => {
    const loadMemeLabData = async () => {
      try {
        const nftsUrl = `${publicEnv.API_ENDPOINT}/api/lab_extended_data`;
        const responseNftMetas = await fetchAllPages<LabExtendedData>(nftsUrl);
        setNftMetas(responseNftMetas);
        const myCollections: string[] = [];
        [...responseNftMetas].map((nftMeta) => {
          if (!myCollections.includes(nftMeta.metadata_collection)) {
            myCollections.push(nftMeta.metadata_collection);
          }
        });
        setLabCollections(myCollections.sort());
        if (responseNftMetas.length > 0) {
          const tokenIds = responseNftMetas.map((n) => n.id);
          const responseNfts = await fetchAllPages<LabNFT>(
            `${publicEnv.API_ENDPOINT}/api/nfts_memelab?id=${tokenIds.join(",")}`
          );
          setNfts(responseNfts);
        } else {
          setNfts([]);
        }
      } catch (error) {
        console.error("Failed to fetch Meme Lab collections", error);
        setNftMetas([]);
        setLabCollections([]);
        setNfts([]);
      } finally {
        setNftsLoaded(true);
      }
    };

    loadMemeLabData();
  }, []);

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
      sortChanged(
        router,
        sort,
        sortDir,
        volumeType,
        nfts,
        nftMetas,
        setNfts,
        labArtists,
        labCollections,
        setLabArtists,
        setLabCollections
      );
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
        lg={{ span: 3 }}
      >
        <Link
          href={`/meme-lab/${nft.id}`}
          className="decoration-none scale-hover"
        >
          <Container fluid>
            <Row className={isConnected ? styles["nftImagePadding"] : ""}>
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

  function printArtists() {
    return labArtists.map((artist) => {
      const artistNfts = [...nfts].filter((n) => n.artist === artist);
      return (
        <Row key={`${artist}-row`}>
          <Col xs={12} className="pt-3">
            <h4>{artist}</h4>
          </Col>
          {[...artistNfts]
            .sort((a, b) => a.id - b.id)
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
                className={styles["collectionLink"]}
                href={`/meme-lab/collection/${encodeURIComponent(
                  collection.replace(" ", "-")
                )}`}
              >
                view
              </a>
            </h4>
          </Col>
          {[...collectionNfts]
            .sort((a, b) => a.id - b.id)
            .map((nft: LabNFT) => printNft(nft))}
        </Row>
      );
    });
  }

  function printNftsContent() {
    let content;

    if (nftsLoaded) {
      if (nfts.length > 0) {
        if (sort === MemeLabSort.ARTISTS) {
          content = printArtists();
        } else if (sort === MemeLabSort.COLLECTIONS) {
          content = printCollections();
        } else {
          content = printNfts();
        }
      } else {
        content = (
          <Col>
            <NothingHereYetSummer />
          </Col>
        );
      }
    } else {
      content = (
        <Row>
          <Col className="pt-3">
            Fetching <DotLoader />
          </Col>
        </Row>
      );
    }

    return content;
  }

  return (
    <Container fluid className={styles["mainContainer"]}>
      <Row>
        <Col>
          <Container className="pt-4">
            <>
              {/* Page header - visible on all devices */}
              <Row>
                <Col className="d-flex align-items-center justify-content-between mb-3">
                  <span className="d-flex align-items-center gap-3 flex-wrap">
                    <h1 className="mb-0">Meme Lab</h1>
                    <LFGButton contract={MEMELAB_CONTRACT} />
                  </span>
                </Col>
              </Row>

              {/* Mobile & tablet elements - visible until xl breakpoint (1200px) */}
              <Row className="d-xl-none">
                <Col xs={12} className="mb-3">
                  <Row>
                    <Col xs={12} sm="auto">
                      <CollectionsDropdown activePage="memelab" />
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row className="pt-2">
                <Col>
                  Sort by&nbsp;&nbsp;
                  <FontAwesomeIcon
                    icon={faChevronCircleUp}
                    onClick={() => setSortDir(SortDirection.ASC)}
                    className={`${styles["sortDirection"]} ${
                      sortDir != SortDirection.ASC ? styles["disabled"] : ""
                    }`}
                  />{" "}
                  <FontAwesomeIcon
                    icon={faChevronCircleDown}
                    onClick={() => setSortDir(SortDirection.DESC)}
                    className={`${styles["sortDirection"]} ${
                      sortDir != SortDirection.DESC ? styles["disabled"] : ""
                    }`}
                  />
                </Col>
              </Row>
              <Row className="pt-2">
                <Col className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                  {printSortButtons(sort, volumeType, setSort, setVolumeType)}
                </Col>
              </Row>
              {printNftsContent()}
            </>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
