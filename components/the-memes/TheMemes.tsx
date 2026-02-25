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
import NFTImage from "@/components/nft-image/NFTImage";
import { VolumeTypeDropdown } from "@/components/the-memes/MemeShared";
import styles from "@/components/the-memes/TheMemes.module.scss";
import SeasonsGridDropdown from "@/components/utils/select/dropdown/SeasonsGridDropdown";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import type { MemeSeason } from "@/entities/ISeason";
import { SortDirection } from "@/entities/ISort";
import { numberWithCommas, printMintDate } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import type { MemeLabSort } from "@/types/enums";
import { MEMES_EXTENDED_SORT, MemesSort } from "@/types/enums";

interface Meme {
  meme: number;
  meme_name: string;
}

const MEMES_SORT_TO_API: Record<MemesSort, string> = {
  [MemesSort.AGE]: MEMES_EXTENDED_SORT[0],
  [MemesSort.EDITION_SIZE]: MEMES_EXTENDED_SORT[1],
  [MemesSort.MEME]: MEMES_EXTENDED_SORT[2],
  [MemesSort.HODLERS]: MEMES_EXTENDED_SORT[3],
  [MemesSort.TDH]: MEMES_EXTENDED_SORT[4],
  [MemesSort.UNIQUE_PERCENT]: MEMES_EXTENDED_SORT[5],
  [MemesSort.UNIQUE_PERCENT_EX_MUSEUM]: MEMES_EXTENDED_SORT[6],
  [MemesSort.FLOOR_PRICE]: MEMES_EXTENDED_SORT[7],
  [MemesSort.MARKET_CAP]: MEMES_EXTENDED_SORT[8],
  [MemesSort.VOLUME]: MEMES_EXTENDED_SORT[12],
  [MemesSort.HIGHEST_OFFER]: MEMES_EXTENDED_SORT[13],
};

function getApiSort(sort: MemesSort, volumeType: VolumeType): string {
  if (sort === MemesSort.VOLUME) {
    switch (volumeType) {
      case VolumeType.HOURS_24:
        return MEMES_EXTENDED_SORT[9];
      case VolumeType.DAYS_7:
        return MEMES_EXTENDED_SORT[10];
      case VolumeType.DAYS_30:
        return MEMES_EXTENDED_SORT[11];
      default:
        return MEMES_EXTENDED_SORT[12];
    }
  }
  return MEMES_SORT_TO_API[sort];
}

export default function TheMemesComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { connectedProfile } = useContext(AuthContext);

  const [selectedSeason, setSelectedSeason] = useState<MemeSeason | null>(null);
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const handleSeasonChange = (season: MemeSeason | null) => {
    setSelectedSeason(season);
    setSeasonId(season?.id ?? null);
  };

  const [routerLoaded, setRouterLoaded] = useState(false);

  useSetTitle("The Memes | Collections");

  useEffect(() => {
    let initialSortDir = SortDirection.ASC;
    let initialSort = MemesSort.AGE;
    let initialVolume = VolumeType.ALL_TIME;
    let initialSznId: number | null = null;

    const routerSortDir = searchParams?.get("sort_dir");
    if (routerSortDir) {
      const resolvedRouterSortDir = Object.values(SortDirection).find(
        (sd) => sd.toLowerCase() === routerSortDir.toLowerCase()
      );
      if (resolvedRouterSortDir) {
        initialSortDir = resolvedRouterSortDir;
      }
    }

    const routerSort = searchParams?.get("sort");
    if (routerSort) {
      const sortLower = routerSort.toLowerCase();

      if (sortLower.startsWith("volume_")) {
        initialSort = MemesSort.VOLUME;
        const volKey = sortLower.replace("volume_", "").toUpperCase();
        const volMatch = Object.keys(VolumeType).find(
          (k) => k.toLowerCase() === volKey.toLowerCase()
        );
        if (volMatch) {
          initialVolume = VolumeType[volMatch as keyof typeof VolumeType];
        }
      } else {
        const resolvedKey = Object.keys(MemesSort).find(
          (k) => k.toLowerCase() === sortLower
        );
        if (resolvedKey) {
          initialSort = MemesSort[resolvedKey as keyof typeof MemesSort];
        }
      }
    }

    const routerSzn = searchParams?.get("szn");
    if (routerSzn) {
      const parsed = Number.parseInt(routerSzn);
      if (!Number.isNaN(parsed) && parsed > 0) {
        initialSznId = parsed;
      }
    }

    setSort(initialSort);
    setSortDir(initialSortDir);
    setSeasonId(initialSznId);
    setVolumeType(initialVolume);
    setRouterLoaded(true);
  }, [searchParams]);

  const getNftsNextPage = () => {
    const mySort = getApiSort(sort, volumeType);
    let seasonFilter = "";
    if (seasonId) {
      seasonFilter = `&season=${seasonId}`;
    }
    return `${publicEnv.API_ENDPOINT}/api/memes_extended_data?page_size=48&sort_direction=${sortDir}&sort=${mySort}${seasonFilter}`;
  };

  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<MemesSort>(MemesSort.AGE);
  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.ALL_TIME);

  const [fetching, setFetching] = useState(true);

  const [nfts, setNfts] = useState<NFTWithMemesExtendedData[]>([]);
  const [nftsNextPage, setNftsNextPage] = useState<string>();

  const [nftMemes, setNftMemes] = useState<Meme[]>([]);
  const [nftsByMeme, setNftsByMeme] = useState<
    Map<number, NFTWithMemesExtendedData[]>
  >(new Map());

  useEffect(() => {
    if (!routerLoaded) return;

    let sortParam: string;

    if (sort === MemesSort.VOLUME) {
      const volKey = Object.entries(VolumeType).find(
        ([_, value]) => value === volumeType
      )?.[0];

      if (volKey) {
        sortParam = `volume_${volKey.toLowerCase()}`;
      } else {
        sortParam = "volume_all_time"; // fallback
      }
    } else {
      const found = Object.entries(MemesSort).find(
        ([_, value]) => value === sort
      );
      sortParam = found ? found[0].toLowerCase() : sort.toLowerCase();
    }

    let queryString = `sort=${sortParam}&sort_dir=${sortDir.toLowerCase()}`;
    if (seasonId) {
      queryString += `&szn=${seasonId}`;
    }
    router.push(`the-memes?${queryString}`);
  }, [sort, sortDir, seasonId, volumeType, router, routerLoaded]);

  useEffect(() => {
    const memesMap = new Map<
      number,
      { meme: Meme; items: NFTWithMemesExtendedData[] }
    >();

    for (const nft of nfts) {
      const existing = memesMap.get(nft.meme);
      if (existing) {
        existing.items.push(nft);
      } else {
        memesMap.set(nft.meme, {
          meme: { meme: nft.meme, meme_name: nft.meme_name },
          items: [nft],
        });
      }
    }

    const sortedMemes = Array.from(memesMap.values()).map(
      (value) => value.meme
    );

    if (sortDir === SortDirection.DESC) {
      sortedMemes.sort((a, b) => b.meme - a.meme);
    } else {
      sortedMemes.sort((a, b) => a.meme - b.meme);
    }

    setNftMemes(sortedMemes);

    const nftsByMeme = new Map<number, NFTWithMemesExtendedData[]>();

    for (const [key, { items }] of Array.from(memesMap.entries())) {
      nftsByMeme.set(
        key,
        items.toSorted((a, b) => a.id - b.id)
      );
    }

    setNftsByMeme(nftsByMeme);
  }, [nfts, sortDir]);

  function fetchNfts() {
    if (!nftsNextPage) {
      setFetching(false);
      return;
    }
    fetchUrl(nftsNextPage)
      .then((responseNfts: DBResponse) => {
        setNfts((prev) => [...prev, ...(responseNfts.data ?? [])]);
        setNftsNextPage(responseNfts.next);
      })
      .catch(() => {
        // optionally surface a toast/log here
      })
      .finally(() => setFetching(false));
  }

  useEffect(() => {
    if (routerLoaded) {
      setNfts([]);
      setNftsNextPage(getNftsNextPage());
      setFetching(true);
    }
  }, [sort, sortDir, volumeType, seasonId, routerLoaded]);

  useEffect(() => {
    if (fetching && routerLoaded && nftsNextPage) {
      fetchNfts();
    }
  }, [fetching, routerLoaded, nftsNextPage]);

  useEffect(() => {
    if (!nftsNextPage) {
      return;
    }

    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (throttleTimeout) {
        return;
      }

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;

        const distanceFromBottom =
          document.documentElement.scrollHeight -
          window.innerHeight -
          window.scrollY;

        if (distanceFromBottom <= 400 && routerLoaded) {
          setFetching(true);
        }
      }, 200);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [routerLoaded, nftsNextPage]);

  function getVolume(nft: NFTWithMemesExtendedData) {
    let vol = 0;
    switch (volumeType) {
      case VolumeType.HOURS_24:
        vol = nft.total_volume_last_24_hours;
        break;
      case VolumeType.DAYS_7:
        vol = nft.total_volume_last_7_days;
        break;
      case VolumeType.DAYS_30:
        vol = nft.total_volume_last_1_month;
        break;
      case VolumeType.ALL_TIME:
        vol = nft.total_volume;
        break;
    }

    if (vol > 0) {
      return `${numberWithCommas(Math.round(vol * 100) / 100)} ETH`;
    }
    return "-";
  }

  function printNft(nft: NFTWithMemesExtendedData) {
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
          href={`/the-memes/${nft.id}`}
          className="decoration-none scale-hover"
        >
          <Container fluid>
            <Row className={connectedProfile ? styles["nftImagePadding"] : ""}>
              <NFTImage
                nft={nft}
                animation={false}
                height={300}
                showThumbnail={true}
                showBalance={true}
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
                  (sort === MemesSort.AGE || sort === MemesSort.MEME) &&
                  printMintDate(nft.mint_date)}
                {sort === MemesSort.EDITION_SIZE &&
                  `Edition Size: ${numberWithCommas(nft.supply)}`}
                {sort === MemesSort.TDH &&
                  `TDH: ${numberWithCommas(Math.round(nft.boosted_tdh))}`}
                {sort === MemesSort.HODLERS &&
                  `Collectors: ${numberWithCommas(nft.hodlers)}`}
                {sort === MemesSort.UNIQUE_PERCENT &&
                  `Unique: ${Math.round(nft.percent_unique * 100 * 10) / 10}%`}
                {sort === MemesSort.UNIQUE_PERCENT_EX_MUSEUM &&
                  `Unique Ex-Museum: ${
                    Math.round(nft.percent_unique_cleaned * 100 * 10) / 10
                  }%`}
                {sort === MemesSort.FLOOR_PRICE &&
                  (nft.floor_price > 0
                    ? `Floor Price: ${numberWithCommas(
                        Math.round(nft.floor_price * 1000) / 1000
                      )} ETH`
                    : `Floor Price: N/A`)}
                {sort === MemesSort.HIGHEST_OFFER &&
                  (nft.highest_offer > 0
                    ? `Highest Offer: ${numberWithCommas(
                        Math.round(nft.highest_offer * 1000) / 1000
                      )} ETH`
                    : `Highest Offer: N/A`)}
                {sort === MemesSort.MARKET_CAP &&
                  (nft.market_cap > 0
                    ? `Market Cap: ${numberWithCommas(
                        Math.round(nft.market_cap * 100) / 100
                      )} ETH`
                    : `Market Cap: N/A`)}
                {sort === MemesSort.VOLUME &&
                  `Volume (${volumeType}): ${getVolume(nft)}`}
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

  function getNftsForMeme(meme: Meme) {
    return nftsByMeme.get(meme.meme) ?? [];
  }

  function printMemes() {
    return nftMemes.map((meme) => {
      const memeNfts = getNftsForMeme(meme);
      return (
        <Row key={`${meme.meme}-${meme.meme_name}`}>
          <Col xs={12} className="pt-3">
            <Col>
              <h4 className="font-color">
                {meme.meme} - {meme.meme_name}
              </h4>
            </Col>
          </Col>
          {memeNfts.map((nft) => printNft(nft))}
        </Row>
      );
    });
  }

  return (
    <Container fluid className={styles["mainContainer"]}>
      <Row>
        <Col>
          <Container className="pt-4">
            <>
              {/* Page header - visible on all devices */}
              <Row>
                <Col className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <span className="d-flex align-items-center gap-3 flex-wrap">
                    <h1 className="no-wrap mb-0">The Memes</h1>
                    <LFGButton contract={MEMES_CONTRACT} />
                  </span>
                  <div className="d-none d-sm-block tw-w-40">
                    <SeasonsGridDropdown
                      selected={selectedSeason}
                      setSelected={handleSeasonChange}
                      initialSeasonId={seasonId}
                    />
                  </div>
                </Col>
              </Row>

              {/* Mobile & tablet elements - visible until xl breakpoint (1200px) */}
              <Row className="d-xl-none">
                <Col xs={12} className="mb-3">
                  <Row>
                    <Col xs={12} sm="auto">
                      <CollectionsDropdown activePage="memes" />
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} className="mb-3 d-flex d-sm-none">
                  <div className="text-start tw-w-40">
                    <SeasonsGridDropdown
                      selected={selectedSeason}
                      setSelected={handleSeasonChange}
                      initialSeasonId={seasonId}
                    />
                  </div>
                </Col>
              </Row>
              <Row className="pt-2">
                <Col>
                  Sort by&nbsp;&nbsp;
                  <FontAwesomeIcon
                    icon={faChevronCircleUp}
                    onClick={() => setSortDir(SortDirection.ASC)}
                    width={16}
                    color={sortDir != SortDirection.ASC ? "#9a9a9a" : "#fff"}
                    cursor={"pointer"}
                    className={styles["sortDirection"]}
                  />{" "}
                  <FontAwesomeIcon
                    icon={faChevronCircleDown}
                    onClick={() => setSortDir(SortDirection.DESC)}
                    width={16}
                    color={sortDir != SortDirection.DESC ? "#9a9a9a" : "#fff"}
                    cursor={"pointer"}
                    className={styles["sortDirection"]}
                  />
                </Col>
              </Row>
              <Row className="pt-2">
                <Col className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                  {Object.values(MemesSort)
                    .filter((v) => v != MemesSort.VOLUME)
                    .map((v) => (
                      <SortButton
                        key={v}
                        currentSort={sort}
                        sort={v}
                        select={() => setSort(v)}
                      />
                    ))}
                  {printVolumeTypeDropdown(
                    sort === MemesSort.VOLUME,
                    setVolumeType,
                    () => setSort(MemesSort.VOLUME),
                    volumeType
                  )}
                </Col>
              </Row>
              {nfts.length > 0 && sort === MemesSort.MEME
                ? printMemes()
                : printNfts()}
              {fetching && nftsNextPage && (
                <Row>
                  <Col className="pt-3 pb-5">
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

export function SortButton(
  props: Readonly<{
    currentSort: MemesSort | MemeLabSort;
    sort: MemesSort | MemeLabSort;
    select: () => void;
  }>
) {
  const isActive = props.currentSort === props.sort;

  return (
    <button
      type="button"
      onClick={() => props.select()}
      className={`tw-m-0 tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-no-underline tw-transition-colors tw-duration-200 ${
        isActive
          ? "tw-font-semibold tw-text-white"
          : "tw-text-gray-400 hover:tw-text-white"
      }`}
    >
      {props.sort}
    </button>
  );
}

export function printVolumeTypeDropdown(
  isVolumeSort: boolean,
  setVolumeType: (volumeType: VolumeType) => void,
  setVolumeSort: () => void,
  selectedVolumeSort: VolumeType = VolumeType.ALL_TIME
) {
  return (
    <VolumeTypeDropdown
      isVolumeSort={isVolumeSort}
      selectedVolumeSort={selectedVolumeSort}
      setVolumeType={setVolumeType}
      setVolumeSort={setVolumeSort}
    />
  );
}
