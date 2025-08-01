"use client";

import styles from "./TheMemes.module.scss";
import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Row, Col } from "react-bootstrap";
import { MEMES_CONTRACT } from "../../constants";
import { VolumeType, NFTWithMemesExtendedData } from "../../entities/INFT";
import { NftOwner } from "../../entities/IOwner";
import { SortDirection } from "../../entities/ISort";
import { numberWithCommas, printMintDate } from "../../helpers/Helpers";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import SeasonsDropdown from "../seasons-dropdown/SeasonsDropdown";
import DotLoader from "../dotLoader/DotLoader";
import { DBResponse } from "../../entities/IDBResponse";
import { MemeSeason } from "../../entities/ISeason";
import { commonApiFetch } from "../../services/api/common-api";
import { AuthContext } from "../auth/Auth";
import { MemeLabSort, MemesSort, MEMES_EXTENDED_SORT } from "../../enums";
import { LFGButton } from "../lfg-slideshow/LFGSlideshow";
import CollectionsDropdown from "../collections-dropdown/CollectionsDropdown";
import {
  faChevronCircleDown,
  faChevronCircleUp,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useSetTitle } from "@/contexts/TitleContext";
import { VolumeTypeDropdown } from "./MemeShared";

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

const API_SORT_TO_MEMES: Record<
  string,
  { sort: MemesSort; volume?: VolumeType }
> = {
  [MEMES_EXTENDED_SORT[0]]: { sort: MemesSort.AGE },
  [MEMES_EXTENDED_SORT[1]]: { sort: MemesSort.EDITION_SIZE },
  [MEMES_EXTENDED_SORT[2]]: { sort: MemesSort.MEME },
  [MEMES_EXTENDED_SORT[3]]: { sort: MemesSort.HODLERS },
  [MEMES_EXTENDED_SORT[4]]: { sort: MemesSort.TDH },
  [MEMES_EXTENDED_SORT[5]]: { sort: MemesSort.UNIQUE_PERCENT },
  [MEMES_EXTENDED_SORT[6]]: { sort: MemesSort.UNIQUE_PERCENT_EX_MUSEUM },
  [MEMES_EXTENDED_SORT[7]]: { sort: MemesSort.FLOOR_PRICE },
  [MEMES_EXTENDED_SORT[8]]: { sort: MemesSort.MARKET_CAP },
  [MEMES_EXTENDED_SORT[9]]: {
    sort: MemesSort.VOLUME,
    volume: VolumeType.HOURS_24,
  },
  [MEMES_EXTENDED_SORT[10]]: {
    sort: MemesSort.VOLUME,
    volume: VolumeType.DAYS_7,
  },
  [MEMES_EXTENDED_SORT[11]]: {
    sort: MemesSort.VOLUME,
    volume: VolumeType.DAYS_30,
  },
  [MEMES_EXTENDED_SORT[12]]: {
    sort: MemesSort.VOLUME,
    volume: VolumeType.ALL_TIME,
  },
  [MEMES_EXTENDED_SORT[13]]: { sort: MemesSort.HIGHEST_OFFER },
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
  const [connectedConsolidationKey, setConnectedConsolidationKey] =
    useState("");

  const [selectedSeason, setSelectedSeason] = useState(0);
  const [seasons, setSeasons] = useState<MemeSeason[]>([]);

  const [routerLoaded, setRouterLoaded] = useState(false);

  useSetTitle("The Memes | Collections");

  useEffect(() => {
    let initialSortDir = SortDirection.ASC;
    let initialSort = MemesSort.AGE;
    let initialVolume = VolumeType.ALL_TIME;
    let initialSzn = 0;

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
      if (Array.isArray(routerSzn)) {
        initialSzn = parseInt(routerSzn[0]);
      } else {
        initialSzn = parseInt(routerSzn);
      }
    }

    setSort(initialSort);
    setSortDir(initialSortDir);
    setSelectedSeason(initialSzn);
    setVolumeType(initialVolume);
    setRouterLoaded(true);
  }, [searchParams]);

  const getNftsNextPage = () => {
    const mySort = getApiSort(sort, volumeType);
    let seasonFilter = "";
    if (selectedSeason > 0) {
      seasonFilter = `&season=${selectedSeason}`;
    }
    return `${process.env.API_ENDPOINT}/api/memes_extended_data?page_size=48&sort_direction=${sortDir}&sort=${mySort}${seasonFilter}`;
  };

  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<MemesSort>(MemesSort.AGE);
  const [volumeType, setVolumeType] = useState<VolumeType>(VolumeType.ALL_TIME);

  const [fetching, setFetching] = useState(true);

  const [nfts, setNfts] = useState<NFTWithMemesExtendedData[]>([]);
  const [nftsNextPage, setNftsNextPage] = useState<string>();

  const [nftBalancesTokenIds, setNftBalancesTokenIds] = useState<Set<number>>(
    new Set()
  );
  const [nftBalances, setNftBalances] = useState<NftOwner[]>([]);
  const [nftMemes, setNftMemes] = useState<Meme[]>([]);

  function getBalance(id: number) {
    const balance = nftBalances.find((b) => b.token_id === id);
    if (balance) {
      return balance.balance;
    }
    const isLoaded = nftBalancesTokenIds.has(id);
    if (isLoaded) {
      return 0;
    }
    return -1;
  }

  useEffect(() => {
    commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
    }).then((response) => {
      setSeasons(response);
    });
  }, []);

  useEffect(() => {
    let sortParam: string;

    if (sort === MemesSort.VOLUME) {
      const volKey = Object.entries(VolumeType).find(
        ([key, value]) => value === volumeType
      )?.[0];

      if (volKey) {
        sortParam = `volume_${volKey.toLowerCase()}`;
      } else {
        sortParam = "volume_all_time"; // fallback
      }
    } else {
      const found = Object.entries(MemesSort).find(
        ([key, value]) => value === sort
      );
      sortParam = found ? found[0].toLowerCase() : sort.toLowerCase();
    }

    let queryString = `sort=${sortParam}&sort_dir=${sortDir.toLowerCase()}`;
    if (selectedSeason > 0) {
      queryString += `&szn=${selectedSeason}`;
    }
    router.push(`the-memes?${queryString}`);
  }, [sort, sortDir, selectedSeason, volumeType]);

  useEffect(() => {
    const myMemesMap = new Map<number, Meme>();
    [...nfts].map((nftm) => {
      myMemesMap.set(nftm.meme, {
        meme: nftm.meme,
        meme_name: nftm.meme_name,
      });
    });
    const myMemes = Array.from(myMemesMap.values());
    if (sortDir === SortDirection.DESC) {
      myMemes.sort((a, d) => d.meme - a.meme);
    } else {
      myMemes.sort((a, d) => a.meme - d.meme);
    }
    setNftMemes(myMemes);
  }, [nfts]);

  function fetchNfts() {
    if (!nftsNextPage) {
      setFetching(false);
      return;
    }
    fetchUrl(nftsNextPage).then((responseNfts: DBResponse) => {
      setNfts([...nfts, ...responseNfts.data]);
      setNftsNextPage(responseNfts.next);
      setFetching(false);
    });
  }

  useEffect(() => {
    if (routerLoaded) {
      setNfts([]);
      setNftsNextPage(getNftsNextPage());
      setFetching(true);
    }
  }, [sort, sortDir, volumeType, selectedSeason, routerLoaded]);

  useEffect(() => {
    if (fetching && routerLoaded && nftsNextPage) {
      fetchNfts();
    }
  }, [fetching, routerLoaded, nftsNextPage]);

  useEffect(() => {
    const checkScrollPosition = () => {
      const distanceFromBottom =
        document.documentElement.scrollHeight -
        window.innerHeight -
        window.scrollY;

      if (distanceFromBottom <= 400) {
        setFetching(true);
      }
    };

    window.addEventListener("scroll", checkScrollPosition);

    return () => window.removeEventListener("scroll", checkScrollPosition);
  }, []);

  useEffect(() => {
    const newTokenIds = [...nfts]
      .map((nft) => nft.id)
      .filter((id) => !nftBalances.some((b) => b.token_id === id));
    if (connectedConsolidationKey && newTokenIds.length > 0) {
      fetchAllPages(
        `${process.env.API_ENDPOINT}/api/nft-owners/consolidation/${
          connectedProfile?.consolidation_key
        }?contract=${MEMES_CONTRACT}&token_id=${newTokenIds.join(",")}`
      ).then((owners: NftOwner[]) => {
        setNftBalances([...nftBalances, ...owners]);
        setNftBalancesTokenIds(
          new Set([...Array.from(nftBalancesTokenIds), ...newTokenIds])
        );
      });
    }
  }, [connectedConsolidationKey, nfts]);

  useEffect(() => {
    setNftBalances([]);
    setNftBalancesTokenIds(new Set());
    setConnectedConsolidationKey(
      connectedProfile?.consolidation_key ??
        connectedProfile?.wallets?.[0]?.wallet ??
        ""
    );
  }, [connectedProfile]);

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
        lg={{ span: 3 }}>
        <Link
          href={`/the-memes/${nft.id}`}
          className="decoration-none scale-hover">
          <Container fluid>
            <Row className={connectedProfile ? styles.nftImagePadding : ""}>
              <NFTImage
                nft={nft}
                animation={false}
                height={300}
                balance={getBalance(nft.id)}
                showThumbnail={true}
                showUnseized={!!connectedProfile}
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
    return [...nfts].filter((n) =>
      nfts.find((m) => n.id === m.id && m.meme === meme.meme)
    );
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
          {[...memeNfts]
            .sort((a, b) => a.id - b.id)
            .map((nft) => printNft(nft))}
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
              {/* Page header - visible on all devices */}
              <Row>
                <Col className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <span className="d-flex align-items-center gap-3 flex-wrap">
                    <h1 className="no-wrap mb-0">
                      <span className="font-lightest">The</span> Memes
                    </h1>
                    <LFGButton contract={MEMES_CONTRACT} />
                  </span>
                  <div className="d-none d-sm-block">
                    <SeasonsDropdown
                      seasons={seasons.map((s) => s.id)}
                      selectedSeason={selectedSeason}
                      setSelectedSeason={setSelectedSeason}
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
                  <div className="text-start">
                    <SeasonsDropdown
                      seasons={seasons.map((s) => s.id)}
                      selectedSeason={selectedSeason}
                      setSelectedSeason={setSelectedSeason}
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
                    className={styles.sortDirection}
                  />{" "}
                  <FontAwesomeIcon
                    icon={faChevronCircleDown}
                    onClick={() => setSortDir(SortDirection.DESC)}
                    width={16}
                    color={sortDir != SortDirection.DESC ? "#9a9a9a" : "#fff"}
                    cursor={"pointer"}
                    className={styles.sortDirection}
                  />
                </Col>
              </Row>
              <Row className="pt-2">
                <Col className="tw-flex tw-gap-3 tw-items-center tw-flex-wrap">
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
      className={`tw-bg-transparent tw-border-none tw-p-0 tw-m-0 tw-no-underline tw-cursor-pointer tw-transition-colors tw-duration-200 ${
        isActive
          ? "tw-text-white tw-font-semibold"
          : "tw-text-gray-400 hover:tw-text-white"
      }`}>
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
