import styles from "./TheMemes.module.scss";
import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Row, Col, Dropdown, Button } from "react-bootstrap";
import { MEMES_CONTRACT } from "../../constants";
import { VolumeType, NFTWithMemesExtendedData } from "../../entities/INFT";
import { NftOwner } from "../../entities/IOwner";
import { SortDirection } from "../../entities/ISort";
import { Crumb } from "../breadcrumb/Breadcrumb";
import {
  capitalizeEveryWord,
  numberWithCommas,
  printMintDate,
} from "../../helpers/Helpers";
import { useRouter } from "next/router";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import SeasonsDropdown from "../seasons-dropdown/SeasonsDropdown";
import DotLoader from "../dotLoader/DotLoader";
import { DBResponse } from "../../entities/IDBResponse";
import { MemeSeason } from "../../entities/ISeason";
import { commonApiFetch } from "../../services/api/common-api";
import { AuthContext } from "../auth/Auth";
import { MemeLabSort, MemesSort } from "../../enums";
import LFGSlideshow from "../lfg-slideshow/LFGSlideshow";

interface Meme {
  meme: number;
  meme_name: string;
}

interface Props {
  setCrumbs(crumbs: Crumb[]): any;
}

export function printVolumeTypeDropdown(
  isVolumeSort: boolean,
  setVolumeType: (volumeType: VolumeType) => void,
  setVolumeSort: () => void
) {
  return (
    <Dropdown
      className={`${styles.volumeDropdown} ${
        isVolumeSort ? styles.volumeDropdownEnabled : ""
      }`}
      drop={"down-centered"}>
      <Dropdown.Toggle>Volume</Dropdown.Toggle>
      <Dropdown.Menu>
        {Object.values(VolumeType).map((vol) => (
          <Dropdown.Item
            key={vol}
            onClick={() => {
              setVolumeType(vol);
              if (!isVolumeSort) {
                setVolumeSort();
              }
            }}>
            {vol}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default function TheMemesComponent(props: Readonly<Props>) {
  const router = useRouter();

  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  const { connectedProfile } = useContext(AuthContext);
  const [connectedConsolidationKey, setConnectedConsolidationKey] =
    useState("");

  const [selectedSeason, setSelectedSeason] = useState(0);
  const [seasons, setSeasons] = useState<MemeSeason[]>([]);

  const [routerLoaded, setRouterLoaded] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      let initialSortDir = SortDirection.ASC;
      let initialSort = MemesSort.AGE;
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
        const resolvedRouterSort = Object.values(MemesSort).find(
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
      setRouterLoaded(true);
    }
  }, [router.isReady]);

  const getNftsNextPage = () => {
    let mySort: string = sort;
    if (sort === MemesSort.VOLUME) {
      switch (volumeType) {
        case VolumeType.HOURS_24:
          mySort = "total_volume_last_24_hours";
          break;
        case VolumeType.DAYS_7:
          mySort = "total_volume_last_7_days";
          break;
        case VolumeType.DAYS_30:
          mySort = "total_volume_last_1_month";
          break;
        case VolumeType.ALL_TIME:
          mySort = "total_volume";
          break;
      }
    }
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
  }, [selectedSeason]);

  useEffect(() => {
    if (routerLoaded) {
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
  }, [sort, sortDir, selectedSeason, routerLoaded]);

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
          connectedProfile?.consolidation.consolidation_key
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
      connectedProfile?.consolidation?.consolidation_key ??
        connectedProfile?.consolidation.wallets?.[0]?.wallet.address ??
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
        <a
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
        </a>
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
            .sort((a, b) => (a.mint_date > b.mint_date ? 1 : -1))
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
              <Row>
                <Col className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <span className="d-flex align-items-center gap-3">
                    <h1 className="no-wrap">
                      <span className="font-lightest">The</span> Memes
                    </h1>
                    <Button
                      onClick={() => setIsSlideshowOpen(true)}
                      className={`${styles.lfgButton} no-wrap`}>
                      LFG: Start the Show!
                    </Button>
                  </span>
                  <SeasonsDropdown
                    seasons={seasons.map((s) => s.id)}
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
                    width={16}
                    color={sortDir != SortDirection.ASC ? "#9a9a9a" : "#fff"}
                    cursor={"pointer"}
                    className={styles.sortDirection}
                  />{" "}
                  <FontAwesomeIcon
                    icon="chevron-circle-down"
                    onClick={() => setSortDir(SortDirection.DESC)}
                    width={16}
                    color={sortDir != SortDirection.DESC ? "#9a9a9a" : "#fff"}
                    cursor={"pointer"}
                    className={styles.sortDirection}
                  />
                </Col>
              </Row>
              <Row className="pt-2">
                <Col>
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
                    () => {
                      setSort(MemesSort.VOLUME);
                    }
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
      <LFGSlideshow
        contract={MEMES_CONTRACT}
        isOpen={isSlideshowOpen}
        setIsOpen={setIsSlideshowOpen}
      />
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
  const name = capitalizeEveryWord(props.sort.replace("_", " "));

  return (
    <button
      onClick={() => props.select()}
      className={`btn-link ${styles.sort} ${
        props.currentSort != props.sort ? styles.disabled : ""
      }`}>
      {name}
    </button>
  );
}
