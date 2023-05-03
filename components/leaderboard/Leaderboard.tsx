import { useState, useEffect } from "react";
import { Container, Row, Col, Table, Dropdown, Form } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { TDHCalc, TDHMetrics, BaseTDHMetrics } from "../../entities/ITDH";
import styles from "./Leaderboard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  formatAddress,
  nextTdh,
  numberWithCommas,
} from "../../helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "../../entities/ISort";
import { useRouter } from "next/router";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import { MEMES_CONTRACT } from "../../constants";
import { MemesExtendedData } from "../../entities/INFT";
import Tippy from "@tippyjs/react";
import ConsolidationSwitch from "../consolidation-switch/ConsolidationSwitch";
import Address from "../address/Address";
import SearchModal from "../searchModal/SearchModal";

interface Props {
  page: number;
  pageSize: number;
  showMore?: boolean;
  showLastTdh?: boolean;
}

enum VIEW {
  CONSOLIDATION,
  WALLET,
}

enum Sort {
  tdh_rank = "tdh_rank",
  boosted_tdh = "boosted_tdh",
  tdh = "tdh",
  tdh__raw = "tdh__raw",
  memes_tdh = "memes_tdh",
  boosted_memes_tdh = "boosted_memes_tdh",
  memes_tdh__raw = "memes_tdh__raw",
  szn1_tdh = "memes_tdh_season1",
  boosted_szn1_tdh = "boosted_memes_tdh_season1",
  szn1_tdh__raw = "memes_tdh_season1__raw",
  szn2_tdh = "memes_tdh_season2",
  boosted_szn2_tdh = "boosted_memes_tdh_season2",
  szn2_tdh__raw = "memes_tdh_season2__raw",
  szn3_tdh = "memes_tdh_season3",
  boosted_szn3_tdh = "boosted_memes_tdh_season3",
  szn3_tdh__raw = "memes_tdh_season3__raw",
  gradients_tdh = "gradients_tdh",
  boosted_gradients_tdh = "boosted_gradients_tdh",
  gradients_tdh__raw = "gradients_tdh__raw",
  total_balance = "balance",
  memes_balance = "memes_balance",
  szn1_balance = "memes_balance_season1",
  szn2_balance = "memes_balance_season2",
  szn3_balance = "memes_balance_season3",
  gradients_balance = "gradients_balance",
  purchases_value = "purchases_value",
  purchases_count = "purchases_count",
  sales_value = "sales_value",
  sales_count = "sales_count",
  purchases_count_memes = "purchases_count_memes",
  purchases_count_memes_season1 = "purchases_count_memes_season1",
  purchases_count_memes_season2 = "purchases_count_memes_season2",
  purchases_count_memes_season3 = "purchases_count_memes_season3",
  purchases_count_gradients = "purchases_count_gradients",
  purchases_value_memes = "purchases_value_memes",
  purchases_value_memes_season1 = "purchases_value_memes_season1",
  purchases_value_memes_season2 = "purchases_value_memes_season2",
  purchases_value_memes_season3 = "purchases_value_memes_season3",
  purchases_value_gradients = "purchases_value_gradients",
  sales_count_memes = "sales_count_memes",
  sales_count_memes_season1 = "sales_count_memes_season1",
  sales_count_memes_season2 = "sales_count_memes_season2",
  sales_count_memes_season3 = "sales_count_memes_season3",
  sales_count_gradients = "sales_count_gradients",
  sales_value_memes = "sales_value_memes",
  sales_value_memes_season1 = "sales_value_memes_season1",
  sales_value_memes_season2 = "sales_value_memes_season2",
  sales_value_memes_season3 = "sales_value_memes_season3",
  sales_value_gradients = "sales_value_gradients",
  transfers_in = "transfers_in",
  transfers_in_memes = "transfers_in_memes",
  transfers_in_memes_season1 = "transfers_in_memes_season1",
  transfers_in_memes_season2 = "transfers_in_memes_season2",
  transfers_in_memes_season3 = "transfers_in_memes_season3",
  transfers_in_gradients = "transfers_in_gradients",
  transfers_out = "transfers_out",
  transfers_out_memes = "transfers_out_memes",
  transfers_out_memes_season1 = "transfers_out_memes_season1",
  transfers_out_memes_season2 = "transfers_out_memes_season2",
  transfers_out_memes_season3 = "transfers_out_memes_season3",
  transfers_out_gradients = "transfers_out_gradients",
  boosted_memes_tdh_season1 = "boosted_memes_tdh_season1",
  boosted_memes_tdh_season2 = "boosted_memes_tdh_season2",
  boosted_memes_tdh_season3 = "boosted_memes_tdh_season3",
  memes_cards_sets = "memes_cards_sets",
  memes_cards_sets_szn1 = "memes_cards_sets_szn1",
  memes_cards_sets_szn2 = "memes_cards_sets_szn2",
  memes_cards_sets_szn3 = "memes_cards_sets_szn3",
  memes_cards_sets_minus1 = "memes_cards_sets_minus1",
  memes_cards_sets_minus2 = "memes_cards_sets_minus2",
  memes_cards_sets_genesis = "genesis",
  unique_memes = "unique_memes",
  unique_memes_szn1 = "unique_memes_szn1",
  unique_memes_szn2 = "unique_memes_szn2",
  unique_memes_szn3 = "unique_memes_szn3",
}

enum Content {
  ALL = "All",
  MEMES = "Memes",
  MEMES1 = "SZN1",
  MEMES2 = "SZN2",
  MEMES3 = "SZN3",
  GRADIENTS = "Gradient",
}

enum OwnerTagFilter {
  ALL = "All",
  MEMES = "Memes",
  MEMES_SETS = "Meme Set",
  MEMES_SETS_MINUS1 = "Meme Set -1",
  MEMES_SETS_SZN1 = "SZN1 Set",
  MEMES_SETS_SZN2 = "SZN2 Set",
  MEMES_SETS_SZN3 = "SZN3 Set",
  GENESIS = "Genesis Set",
  GRADIENTS = "Gradient",
}

enum Focus {
  TDH = "Cards Collected",
  INTERACTIONS = "Interactions",
  SETS = "Sets",
}

export default function Leaderboard(props: Props) {
  const router = useRouter();

  const [view, setView] = useState<VIEW>(VIEW.CONSOLIDATION);
  const [content, setContent] = useState<Content>(Content.ALL);
  const [ownerTagFilter, setOwnerTagFilter] = useState<OwnerTagFilter>(
    OwnerTagFilter.ALL
  );
  const [focus, setFocus] = useState<Focus>(Focus.TDH);
  const [hideMuseum, setHideMuseum] = useState(false);
  const [hideTeam, setHideTeam] = useState(false);

  const [memesCount, setMemesCount] = useState<number>();
  const [memesCountS1, setMemesCountS1] = useState<number>();
  const [memesCountS2, setMemesCountS2] = useState<number>();
  const [memesCountS3, setMemesCountS3] = useState<number>();

  const [pageProps, setPageProps] = useState<Props>(props);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<BaseTDHMetrics[]>();
  const [lastTDH, setLastTDH] = useState<TDHCalc>();
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.total_balance, sort_direction: SortDirection.DESC });
  const [showViewAll, setShowViewAll] = useState(
    !window.location.pathname.includes("community")
  );

  const [showLoader, setShowLoader] = useState(false);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  if (props.showLastTdh) {
    printNextTdhCountdown();
  }

  async function fetchResults() {
    setShowLoader(true);
    let tagFilter = "";
    switch (ownerTagFilter) {
      case OwnerTagFilter.MEMES:
        tagFilter = "&filter=memes";
        break;
      case OwnerTagFilter.MEMES_SETS:
        tagFilter = "&filter=memes_set";
        break;
      case OwnerTagFilter.MEMES_SETS_MINUS1:
        tagFilter = "&filter=memes_set_minus1";
        break;
      case OwnerTagFilter.MEMES_SETS_SZN1:
        tagFilter = "&filter=memes_set_szn1";
        break;
      case OwnerTagFilter.MEMES_SETS_SZN2:
        tagFilter = "&filter=memes_set_szn2";
        break;
      case OwnerTagFilter.MEMES_SETS_SZN3:
        tagFilter = "&filter=memes_set_szn3";
        break;
      case OwnerTagFilter.GENESIS:
        tagFilter = "&filter=memes_genesis";
        break;
      case OwnerTagFilter.GRADIENTS:
        tagFilter = "&filter=gradients";
        break;
    }
    let museumFilter = hideMuseum ? "&hide_museum=true" : "";
    let teamFilter = hideTeam ? "&hide_team=true" : "";
    let walletFilter = "";
    if (searchWallets) {
      walletFilter = `&wallet=${searchWallets.join(",")}`;
    }
    const url = `${process.env.API_ENDPOINT}/api/${
      view == VIEW.WALLET ? "owner_metrics" : "consolidated_owner_metrics"
    }`;
    fetchUrl(
      `${url}?page_size=${props.pageSize}&page=${pageProps.page}&sort=${sort.sort}&sort_direction=${sort.sort_direction}${tagFilter}${museumFilter}${teamFilter}${walletFilter}`
    ).then((response: DBResponse) => {
      setTotalResults(response.count);
      setLeaderboard(response.data);
      setShowLoader(false);
    });
  }

  useEffect(() => {
    if (sort && ownerTagFilter && router.isReady && content) {
      if (pageProps.page == 1) {
        fetchResults();
      } else {
        setPageProps({ ...pageProps, page: 1 });
      }
    }
  }, [
    sort,
    ownerTagFilter,
    router.isReady,
    content,
    hideMuseum,
    hideTeam,
    searchWallets,
    view,
  ]);

  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/blocks?page_size=${1}`).then(
      (response: DBResponse) => {
        if (response.data.length > 0) {
          setLastTDH({
            block: response.data[0].block_number,
            date: new Date(response.data[0].timestamp),
          });
        }
      }
    );

    fetchAllPages(
      `${process.env.API_ENDPOINT}/api/memes_extended_data?contract=${MEMES_CONTRACT}`
    ).then((newNfts: MemesExtendedData[]) => {
      setMemesCount(newNfts.length);
      setMemesCountS1([...newNfts].filter((n) => n.season == 1).length);
      setMemesCountS2([...newNfts].filter((n) => n.season == 2).length);
      setMemesCountS3([...newNfts].filter((n) => n.season == 3).length);
    });
  }, []);

  useEffect(() => {
    fetchResults();
    var top = document.getElementById(`leaderboard-page`)?.offsetTop;
    if (top && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, [pageProps.page]);

  useEffect(() => {
    if (content) {
      if (
        [
          Sort.total_balance,
          Sort.memes_balance,
          Sort.szn1_balance,
          Sort.szn2_balance,
          Sort.szn3_balance,
          Sort.gradients_balance,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getBalanceSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.boosted_tdh,
          Sort.boosted_memes_tdh,
          Sort.boosted_szn1_tdh,
          Sort.boosted_szn2_tdh,
          Sort.boosted_szn3_tdh,
          Sort.boosted_gradients_tdh,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getBoostedTdhSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.tdh,
          Sort.memes_tdh,
          Sort.szn1_tdh,
          Sort.szn2_tdh,
          Sort.szn3_tdh,
          Sort.gradients_tdh,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getTdhSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.tdh__raw,
          Sort.memes_tdh__raw,
          Sort.szn1_tdh__raw,
          Sort.szn2_tdh__raw,
          Sort.szn3_tdh__raw,
          Sort.gradients_tdh__raw,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getTdhRawSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.purchases_value,
          Sort.purchases_value_memes,
          Sort.purchases_value_memes_season1,
          Sort.purchases_value_memes_season2,
          Sort.purchases_value_memes_season3,
          Sort.purchases_value_gradients,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getPurchasesvalueSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.purchases_count,
          Sort.purchases_count_memes,
          Sort.purchases_count_memes_season1,
          Sort.purchases_count_memes_season2,
          Sort.purchases_count_memes_season3,
          Sort.purchases_count_gradients,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getPurchasesCountSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.sales_count,
          Sort.sales_count_memes,
          Sort.sales_count_memes_season1,
          Sort.sales_count_memes_season2,
          Sort.sales_count_memes_season3,
          Sort.sales_count_gradients,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getSalesCountSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.sales_value,
          Sort.sales_value_memes,
          Sort.sales_value_memes_season1,
          Sort.sales_value_memes_season2,
          Sort.sales_value_memes_season3,
          Sort.sales_value_gradients,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getSalesValueSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.transfers_in,
          Sort.transfers_in_memes,
          Sort.transfers_in_memes_season1,
          Sort.transfers_in_memes_season2,
          Sort.transfers_in_memes_season3,
          Sort.transfers_in_gradients,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getTransfersInSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.transfers_out,
          Sort.transfers_out_memes,
          Sort.transfers_out_memes_season1,
          Sort.transfers_out_memes_season2,
          Sort.transfers_out_memes_season3,
          Sort.transfers_out_gradients,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getTransfersOutSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.memes_cards_sets,
          Sort.memes_cards_sets_szn1,
          Sort.memes_cards_sets_szn2,
          Sort.memes_cards_sets_szn3,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getSetsSort(),
          sort_direction: sort.sort_direction,
        });
      }
      if (
        [
          Sort.unique_memes,
          Sort.unique_memes_szn1,
          Sort.unique_memes_szn2,
          Sort.unique_memes_szn3,
        ].includes(sort.sort)
      ) {
        setSort({
          sort: getUniqueMemesSetsSort(),
          sort_direction: sort.sort_direction,
        });
      }
    }
  }, [content]);

  useEffect(() => {
    if (focus == Focus.TDH) {
      if (sort.sort != getBalanceSort()) {
        setSort({
          sort: getBalanceSort(),
          sort_direction: sort.sort_direction,
        });
      }
    }
    if (focus == Focus.INTERACTIONS) {
      if (sort.sort != getPurchasesCountSort()) {
        setSort({
          sort: getPurchasesCountSort(),
          sort_direction: sort.sort_direction,
        });
      }
    }
    if (focus == Focus.SETS) {
      if (sort.sort != Sort.memes_cards_sets) {
        setSort({
          sort: Sort.memes_cards_sets,
          sort_direction: sort.sort_direction,
        });
      }
    }
  }, [focus]);

  function getWallets(lead: any) {
    if (lead.wallets) {
      return lead.wallets;
    }
    return [lead.wallet];
  }

  function getDisplay(lead: any) {
    if (lead.consolidation_display) {
      return lead.consolidation_display;
    }
    return lead.wallet_display;
  }

  function getCardsHodled(lead: TDHMetrics) {
    switch (content) {
      case Content.MEMES:
        return lead.memes_balance;
      case Content.MEMES1:
        return lead.memes_balance_season1;
      case Content.MEMES2:
        return lead.memes_balance_season2;
      case Content.MEMES3:
        return lead.memes_balance_season3;
      case Content.GRADIENTS:
        return lead.gradients_balance;
      default:
        return lead.balance;
    }
  }

  function getPurchasesCount(lead: TDHMetrics) {
    let count = 0;
    switch (content) {
      case Content.MEMES:
        count = lead.purchases_count_memes;
        break;
      case Content.MEMES1:
        count = lead.purchases_count_memes_season1;
        break;
      case Content.MEMES2:
        count = lead.purchases_count_memes_season2;
        break;
      case Content.MEMES3:
        count = lead.purchases_count_memes_season3;
        break;
      case Content.GRADIENTS:
        count = lead.purchases_count_gradients;
        break;
      default:
        count = lead.purchases_count;
    }

    if (count > 0) {
      return `x${numberWithCommas(count)}`;
    }
    return "-";
  }

  function getPurchasesValue(lead: TDHMetrics) {
    let value = 0;
    switch (content) {
      case Content.MEMES:
        value = lead.purchases_value_memes;
        break;
      case Content.MEMES1:
        value = lead.purchases_value_memes_season1;
        break;
      case Content.MEMES2:
        value = lead.purchases_value_memes_season2;
        break;
      case Content.MEMES3:
        value = lead.purchases_value_memes_season3;
        break;
      case Content.GRADIENTS:
        value = lead.purchases_value_gradients;
        break;
      default:
        value = lead.purchases_value;
    }

    if (value > 0) {
      return `${numberWithCommas(Math.round(value * 100) / 100)}`;
    }
    return "-";
  }

  function getSalesCount(lead: TDHMetrics) {
    let count = 0;
    switch (content) {
      case Content.MEMES:
        count = lead.sales_count_memes;
        break;
      case Content.MEMES1:
        count = lead.sales_count_memes_season1;
        break;
      case Content.MEMES2:
        count = lead.sales_count_memes_season2;
        break;
      case Content.MEMES3:
        count = lead.sales_count_memes_season3;
        break;
      case Content.GRADIENTS:
        count = lead.sales_count_gradients;
        break;
      default:
        count = lead.sales_count;
    }

    if (count > 0) {
      return `x${numberWithCommas(count)}`;
    }
    return "-";
  }

  function getSalesValue(lead: TDHMetrics) {
    let value = 0;
    switch (content) {
      case Content.MEMES:
        value = lead.sales_value_memes;
        break;
      case Content.MEMES1:
        value = lead.sales_value_memes_season1;
        break;
      case Content.MEMES2:
        value = lead.sales_value_memes_season2;
        break;
      case Content.MEMES3:
        value = lead.sales_value_memes_season3;
        break;
      case Content.GRADIENTS:
        value = lead.sales_value_gradients;
        break;
      default:
        value = lead.sales_value;
    }

    if (value > 0) {
      return `${numberWithCommas(Math.round(value * 100) / 100)}`;
    }
    return "-";
  }

  function getTransfersIn(lead: TDHMetrics) {
    let trf = 0;
    switch (content) {
      case Content.MEMES:
        trf = lead.transfers_in_memes;
        break;
      case Content.MEMES1:
        trf = lead.transfers_in_memes_season1;
        break;
      case Content.MEMES2:
        trf = lead.transfers_in_memes_season2;
        break;
      case Content.MEMES3:
        trf = lead.transfers_in_memes_season3;
        break;
      case Content.GRADIENTS:
        trf = lead.transfers_in_gradients;
        break;
      default:
        trf = lead.transfers_in;
        break;
    }

    if (trf > 0) {
      return `x${numberWithCommas(trf)}`;
    }
    return "-";
  }

  function getTransfersOut(lead: TDHMetrics) {
    let trf = 0;
    switch (content) {
      case Content.MEMES:
        trf = lead.transfers_out_memes;
        break;
      case Content.MEMES1:
        trf = lead.transfers_out_memes_season1;
        break;
      case Content.MEMES2:
        trf = lead.transfers_out_memes_season2;
        break;
      case Content.MEMES3:
        trf = lead.transfers_out_memes_season3;
        break;
      case Content.GRADIENTS:
        trf = lead.transfers_out_gradients;
        break;
      default:
        trf = lead.transfers_out;
        break;
    }

    if (trf > 0) {
      return `x${numberWithCommas(trf)}`;
    }
    return "-";
  }

  function getUniqueMemes(lead: TDHMetrics) {
    let unique;
    let uniqueTotal;
    switch (content) {
      case Content.MEMES1:
        unique = lead.unique_memes_szn1;
        uniqueTotal = memesCountS1;
        break;
      case Content.MEMES2:
        unique = lead.unique_memes_szn2;
        uniqueTotal = memesCountS2;
        break;
      case Content.MEMES3:
        unique = lead.unique_memes_szn3;
        uniqueTotal = memesCountS3;
        break;
      default:
        unique = lead.unique_memes;
        uniqueTotal = memesCount;
        break;
    }
    if (unique > 0 && uniqueTotal) {
      return `${numberWithCommas(unique)}/${uniqueTotal} (${Math.round(
        (unique / uniqueTotal) * 100
      )}%)`;
    }

    return "-";
  }

  function getSets(lead: TDHMetrics) {
    let sets;
    switch (content) {
      case Content.MEMES1:
        sets = lead.memes_cards_sets_szn1;
        break;
      case Content.MEMES2:
        sets = lead.memes_cards_sets_szn2;
        break;
      case Content.MEMES3:
        sets = lead.memes_cards_sets_szn3;
        break;
      default:
        sets = lead.memes_cards_sets;
        break;
    }
    if (sets > 0) {
      return `x${numberWithCommas(sets)}`;
    }
    return "-";
  }

  function getDaysHodledTdhBoosted(lead: TDHMetrics) {
    switch (content) {
      case Content.MEMES:
        return lead.boosted_memes_tdh;
      case Content.MEMES1:
        return lead.boosted_memes_tdh_season1;
      case Content.MEMES2:
        return lead.boosted_memes_tdh_season2;
      case Content.MEMES3:
        return lead.boosted_memes_tdh_season3;
      case Content.GRADIENTS:
        return lead.boosted_gradients_tdh;
      default:
        return lead.boosted_tdh;
    }
  }

  function getDaysHodledTdh(lead: TDHMetrics) {
    switch (content) {
      case Content.MEMES:
        return lead.memes_tdh;
      case Content.MEMES1:
        return lead.memes_tdh_season1;
      case Content.MEMES2:
        return lead.memes_tdh_season2;
      case Content.MEMES3:
        return lead.memes_tdh_season3;
      case Content.GRADIENTS:
        return lead.gradients_tdh;
      default:
        return lead.tdh;
    }
  }

  function getDaysHodledTdhRaw(lead: TDHMetrics) {
    switch (content) {
      case Content.MEMES:
        return lead.memes_tdh__raw;
      case Content.MEMES1:
        return lead.memes_tdh_season1__raw;
      case Content.MEMES2:
        return lead.memes_tdh_season2__raw;
      case Content.MEMES3:
        return lead.memes_tdh_season3__raw;
      case Content.GRADIENTS:
        return lead.gradients_tdh__raw;
      default:
        return lead.tdh__raw;
    }
  }

  function getBalanceSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.memes_balance;
      case Content.MEMES1:
        return Sort.szn1_balance;
      case Content.MEMES2:
        return Sort.szn2_balance;
      case Content.MEMES3:
        return Sort.szn3_balance;
      case Content.GRADIENTS:
        return Sort.gradients_balance;
      default:
        return Sort.total_balance;
    }
  }

  function getUniqueMemesSetsSort() {
    switch (content) {
      case Content.MEMES1:
        return Sort.unique_memes_szn1;
      case Content.MEMES2:
        return Sort.unique_memes_szn2;
      case Content.MEMES3:
        return Sort.unique_memes_szn3;
      default:
        return Sort.unique_memes;
    }
  }

  function getSetsSort() {
    switch (content) {
      case Content.MEMES1:
        return Sort.memes_cards_sets_szn1;
      case Content.MEMES2:
        return Sort.memes_cards_sets_szn2;
      case Content.MEMES3:
        return Sort.memes_cards_sets_szn3;
      default:
        return Sort.memes_cards_sets;
    }
  }

  function getBoostedTdhSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.boosted_memes_tdh;
      case Content.MEMES1:
        return Sort.boosted_szn1_tdh;
      case Content.MEMES2:
        return Sort.boosted_szn2_tdh;
      case Content.MEMES3:
        return Sort.boosted_szn3_tdh;
      case Content.GRADIENTS:
        return Sort.boosted_gradients_tdh;
      default:
        return Sort.boosted_tdh;
    }
  }

  function getTdhSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.memes_tdh;
      case Content.MEMES1:
        return Sort.szn1_tdh;
      case Content.MEMES2:
        return Sort.szn2_tdh;
      case Content.MEMES3:
        return Sort.szn3_tdh;
      case Content.GRADIENTS:
        return Sort.gradients_tdh;
      default:
        return Sort.tdh;
    }
  }

  function getTdhRawSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.memes_tdh__raw;
      case Content.MEMES1:
        return Sort.szn1_tdh__raw;
      case Content.MEMES2:
        return Sort.szn2_tdh__raw;
      case Content.MEMES3:
        return Sort.szn3_tdh__raw;
      case Content.GRADIENTS:
        return Sort.gradients_tdh__raw;
      default:
        return Sort.tdh__raw;
    }
  }

  function getPurchasesCountSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.purchases_count_memes;
      case Content.MEMES1:
        return Sort.purchases_count_memes_season1;
      case Content.MEMES2:
        return Sort.purchases_count_memes_season2;
      case Content.MEMES3:
        return Sort.purchases_count_memes_season3;
      case Content.GRADIENTS:
        return Sort.purchases_count_gradients;
      default:
        return Sort.purchases_count;
    }
  }

  function getPurchasesvalueSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.purchases_value_memes;
      case Content.MEMES1:
        return Sort.purchases_value_memes_season1;
      case Content.MEMES2:
        return Sort.purchases_value_memes_season2;
      case Content.MEMES3:
        return Sort.purchases_value_memes_season3;
      case Content.GRADIENTS:
        return Sort.purchases_value_gradients;
      default:
        return Sort.purchases_value;
    }
  }

  function getSalesCountSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.sales_count_memes;
      case Content.MEMES1:
        return Sort.sales_count_memes_season1;
      case Content.MEMES2:
        return Sort.sales_count_memes_season2;
      case Content.MEMES3:
        return Sort.sales_count_memes_season3;
      case Content.GRADIENTS:
        return Sort.sales_count_gradients;
      default:
        return Sort.sales_count;
    }
  }

  function getSalesValueSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.sales_value_memes;
      case Content.MEMES1:
        return Sort.sales_value_memes_season1;
      case Content.MEMES2:
        return Sort.sales_value_memes_season2;
      case Content.MEMES3:
        return Sort.sales_value_memes_season3;
      case Content.GRADIENTS:
        return Sort.sales_value_gradients;
      default:
        return Sort.sales_value;
    }
  }

  function getTransfersInSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.transfers_in_memes;
      case Content.MEMES1:
        return Sort.transfers_in_memes_season1;
      case Content.MEMES2:
        return Sort.transfers_in_memes_season2;
      case Content.MEMES3:
        return Sort.transfers_in_memes_season3;
      case Content.GRADIENTS:
        return Sort.transfers_in_gradients;
      default:
        return Sort.transfers_in;
    }
  }

  function printNextTdhCountdown() {
    var tdhDiv1 = document.getElementById("next-tdh-div-1");
    var tdhDiv2 = document.getElementById("next-tdh-div-2");

    setInterval(function () {
      if (tdhDiv1) {
        tdhDiv1.innerHTML = nextTdh();
      }
      if (tdhDiv2) {
        tdhDiv2.innerHTML = nextTdh();
      }
    }, 1000);
  }

  function getTransfersOutSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.transfers_out_memes;
      case Content.MEMES1:
        return Sort.transfers_out_memes_season1;
      case Content.MEMES2:
        return Sort.transfers_out_memes_season2;
      case Content.MEMES3:
        return Sort.transfers_out_memes_season3;
      case Content.GRADIENTS:
        return Sort.transfers_out_gradients;
      default:
        return Sort.transfers_out;
    }
  }

  function printHodlersDropdown() {
    return (
      <Dropdown className={styles.contentDropdown} drop={"down-centered"}>
        <Dropdown.Toggle>Collectors: {ownerTagFilter}</Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.values(OwnerTagFilter).map((tagFilter) => (
            <Dropdown.Item
              key={tagFilter}
              onClick={() => setOwnerTagFilter(tagFilter)}>
              {[
                OwnerTagFilter.MEMES_SETS,
                OwnerTagFilter.MEMES_SETS_MINUS1,
                OwnerTagFilter.MEMES_SETS_SZN1,
                OwnerTagFilter.MEMES_SETS_SZN2,
                OwnerTagFilter.MEMES_SETS_SZN3,
                OwnerTagFilter.GENESIS,
              ].includes(tagFilter) ? (
                <>&nbsp;&nbsp;{tagFilter}</>
              ) : (
                tagFilter
              )}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  function printCollectionsDropdown() {
    return (
      <Dropdown className={styles.contentDropdown} drop={"down-centered"}>
        <Dropdown.Toggle>Collection: {content}</Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => setContent(Content.ALL)}>
            {Content.ALL}
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setContent(Content.MEMES)}>
            {Content.MEMES}
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setContent(Content.MEMES1)}>
            &nbsp;&nbsp;{Content.MEMES1}
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setContent(Content.MEMES2)}>
            &nbsp;&nbsp;{Content.MEMES2}
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setContent(Content.MEMES3)}>
            &nbsp;&nbsp;{Content.MEMES3}
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setContent(Content.GRADIENTS)}>
            {Content.GRADIENTS}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  function printLoader() {
    if (showLoader) {
      return <span className={styles.loader}></span>;
    }
  }

  return (
    <Container className={`no-padding pt-4`} id={`leaderboard-page`}>
      <Row>
        <Col
          className={`d-flex align-items-center`}
          xs={{ span: showViewAll ? 12 : 6 }}
          sm={{ span: 6 }}
          md={{ span: 4 }}
          lg={{ span: 4 }}>
          <h1>
            COMMUNITY{" "}
            {showViewAll && (
              <a href="/community">
                <span className={styles.viewAllLink}>VIEW ALL</span>
              </a>
            )}
          </h1>
        </Col>
        <Col
          className={`d-flex justify-content-center align-items-center d-none ${styles.dMdFlex}`}
          xs={4}>
          <ConsolidationSwitch
            view={view}
            onSetView={(v) => setView(v)}
            plural={true}
          />
        </Col>
        {lastTDH && props.showLastTdh && (
          <Col
            className={`${styles.lastTDH} d-flex align-items-center justify-content-end`}
            xs={{ span: 6 }}
            sm={{ span: 6 }}
            md={{ span: 4 }}
            lg={{ span: 4 }}>
            * TDH Block&nbsp;
            <a
              href={`https://etherscan.io/block/${lastTDH.block}`}
              rel="noreferrer"
              target="_blank">
              {lastTDH.block}
            </a>
            {/* &nbsp;|&nbsp;Next Calculation&nbsp;
            <span id="next-tdh-div-1">{nextTdh()}</span> */}
          </Col>
        )}
        <Col
          className={`pt-2 d-flex justify-content-center align-items-center d-block ${styles.dMdNone}`}
          xs={12}>
          <ConsolidationSwitch
            view={view}
            onSetView={(v) => setView(v)}
            plural={true}
          />
        </Col>
      </Row>
      {!showViewAll && (
        <>
          <Row className="pt-2 pb-2">
            <Col
              className={`${styles.pageHeader} text-center`}
              xs={{ span: 6 }}
              sm={{ span: 6 }}
              md={{ span: 3 }}
              lg={{ span: 3 }}>
              {printHodlersDropdown()}
            </Col>
            <Col
              className={`${styles.pageHeader} text-center`}
              xs={{ span: 6 }}
              sm={{ span: 6 }}
              md={{ span: 3 }}
              lg={{ span: 3 }}>
              {printCollectionsDropdown()}
            </Col>
            <Col
              className={`${styles.pageHeader}`}
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 6 }}
              lg={{ span: 6 }}>
              <div
                className={`${styles.headerMenuFocus} d-flex justify-content-center align-items-center`}>
                <span>
                  <span
                    onClick={() => setFocus(Focus.TDH)}
                    className={`${styles.focus} ${
                      focus != Focus.TDH ? styles.disabled : ""
                    }`}>
                    {Focus.TDH}
                  </span>
                </span>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <span>
                  <span
                    onClick={() => setFocus(Focus.INTERACTIONS)}
                    className={`${styles.focus} ${
                      focus != Focus.INTERACTIONS ? styles.disabled : ""
                    }`}>
                    {Focus.INTERACTIONS}
                  </span>
                </span>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <span>
                  <span
                    onClick={() => setFocus(Focus.SETS)}
                    className={`${styles.focus} ${
                      focus != Focus.SETS ? styles.disabled : ""
                    }`}>
                    {Focus.SETS}
                  </span>
                </span>
              </div>
            </Col>
          </Row>
          <Row className="pt-1 pb-1">
            <Col
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 6 }}
              lg={{ span: 4 }}
              className={`${styles.pageHeader} d-flex justify-content-center align-items-center`}>
              <Container className="no-padding">
                <Row>
                  <Col className="d-flex align-items-center justify-content-center">
                    <Form.Check
                      type="switch"
                      checked={hideMuseum}
                      className={`${styles.museumToggle}`}
                      label={`Hide 6529Museum`}
                      onChange={() => setHideMuseum(!hideMuseum)}
                    />
                    <Form.Check
                      type="switch"
                      checked={hideTeam}
                      className={`${styles.museumToggle}`}
                      label={`Hide 6529Team`}
                      onChange={() => setHideTeam(!hideTeam)}
                    />
                  </Col>
                </Row>
              </Container>
            </Col>
            <Col
              className={`d-flex justify-content-end align-items-center`}
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 6 }}
              lg={{ span: 8 }}>
              <>
                <span>
                  {searchWallets.length > 0 &&
                    searchWallets.map((sw) => (
                      <span
                        className={styles.searchWalletDisplayWrapper}
                        key={sw}>
                        <Tippy
                          delay={250}
                          content={"Clear"}
                          placement={"top"}
                          theme={"dark"}>
                          <span
                            className={styles.searchWalletDisplayBtn}
                            onClick={() =>
                              setSearchWallets((sr) =>
                                sr.filter((s) => s != sw)
                              )
                            }>
                            x
                          </span>
                        </Tippy>
                        <span className={styles.searchWalletDisplay}>
                          {sw.endsWith(".eth") ? sw : formatAddress(sw)}
                        </span>
                      </span>
                    ))}
                </span>
                {searchWallets.length > 0 && (
                  <Tippy
                    delay={250}
                    content={"Clear All"}
                    placement={"top"}
                    theme={"dark"}>
                    <span>
                      <FontAwesomeIcon
                        onClick={() => setSearchWallets([])}
                        className={styles.clearSearchBtnIcon}
                        icon="times-circle"></FontAwesomeIcon>
                    </span>
                  </Tippy>
                )}
                <span
                  onClick={() => setShowSearchModal(true)}
                  className={`${styles.searchBtn} ${
                    searchWallets.length > 0 ? styles.searchBtnActive : ""
                  } d-inline-flex align-items-center justify-content-center`}>
                  {" "}
                  <FontAwesomeIcon
                    className={styles.searchBtnIcon}
                    icon="search"></FontAwesomeIcon>
                </span>
              </>
            </Col>
          </Row>
        </>
      )}
      <Row className={`${styles.scrollContainer} pt-2`}>
        <Col>
          {leaderboard && leaderboard.length > 0 && (
            <Table bordered={false} className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th className={styles.rank}>Rank</th>
                  <th className={`${styles.hodler}`}>
                    Collector&nbsp;&nbsp;
                    <span className={styles.totalResults}>
                      x{totalResults}
                    </span>{" "}
                    {printLoader()}
                  </th>
                  {focus == Focus.TDH && (
                    <th className={styles.tdhSub}>
                      <span className="d-flex align-items-center justify-content-center">
                        Cards Collected&nbsp;
                        <span className="d-flex flex-column">
                          <FontAwesomeIcon
                            icon="square-caret-up"
                            onClick={() =>
                              setSort({
                                sort: getBalanceSort(),
                                sort_direction: SortDirection.ASC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.ASC ||
                              sort.sort != getBalanceSort()
                                ? styles.disabled
                                : ""
                            }`}
                          />
                          <FontAwesomeIcon
                            icon="square-caret-down"
                            onClick={() =>
                              setSort({
                                sort: getBalanceSort(),
                                sort_direction: SortDirection.DESC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.DESC ||
                              sort.sort != getBalanceSort()
                                ? styles.disabled
                                : ""
                            }`}
                          />
                        </span>
                      </span>
                    </th>
                  )}
                  {focus == Focus.INTERACTIONS && (
                    <>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Purchases&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getPurchasesCountSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getPurchasesCountSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getPurchasesCountSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getPurchasesCountSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Purchases (ETH)&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getPurchasesvalueSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getPurchasesvalueSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getPurchasesvalueSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getPurchasesvalueSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Sales&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getSalesCountSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getSalesCountSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getSalesCountSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getSalesCountSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Sales (ETH)&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getSalesValueSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getSalesValueSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getSalesValueSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getSalesValueSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Transfers In&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getTransfersInSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getTransfersInSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getTransfersInSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getTransfersInSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Transfers Out&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getTransfersOutSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getTransfersOutSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getTransfersOutSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getTransfersOutSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                    </>
                  )}
                  {focus == Focus.TDH && (
                    <>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Unique Memes&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getUniqueMemesSetsSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getUniqueMemesSetsSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getUniqueMemesSetsSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getUniqueMemesSetsSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          {content == Content.MEMES1
                            ? "SZN1"
                            : content == Content.MEMES2
                            ? "SZN2"
                            : content == Content.MEMES3
                            ? "SZN3"
                            : "Meme"}{" "}
                          Sets&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getSetsSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getSetsSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getSetsSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getSetsSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          TDH&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getBoostedTdhSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getBoostedTdhSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getBoostedTdhSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getBoostedTdhSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          TDH&nbsp;
                          <span className={styles.tdhSubNote}>(unboosted)</span>
                          &nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getTdhSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getTdhSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getTdhSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getTdhSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          TDH&nbsp;
                          <span className={styles.tdhSubNote}>
                            (unweighted)
                          </span>
                          &nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: getTdhRawSort(),
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != getTdhRawSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: getTdhRawSort(),
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != getTdhRawSort()
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                    </>
                  )}
                  {focus == Focus.SETS && (
                    <>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Meme Sets&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets,
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != Sort.memes_cards_sets
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets,
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != Sort.memes_cards_sets
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Meme Sets -1&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_minus1,
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != Sort.memes_cards_sets_minus1
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_minus1,
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != Sort.memes_cards_sets_minus1
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Meme Sets -2&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_minus2,
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != Sort.memes_cards_sets_minus2
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_minus2,
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != Sort.memes_cards_sets_minus2
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          SZN1 Sets&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_szn1,
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != Sort.memes_cards_sets_szn1
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_szn1,
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != Sort.memes_cards_sets_szn1
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          SZN3 Sets&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_szn3,
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != Sort.memes_cards_sets_szn3
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_szn3,
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != Sort.memes_cards_sets_szn3
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          SZN2 Sets&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_szn2,
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != Sort.memes_cards_sets_szn2
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_szn2,
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != Sort.memes_cards_sets_szn2
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                      <th className={styles.tdhSub}>
                        <span className="d-flex align-items-center justify-content-center">
                          Genesis Sets&nbsp;
                          <span className="d-flex flex-column">
                            <FontAwesomeIcon
                              icon="square-caret-up"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_genesis,
                                  sort_direction: SortDirection.ASC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.ASC ||
                                sort.sort != Sort.memes_cards_sets_genesis
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                            <FontAwesomeIcon
                              icon="square-caret-down"
                              onClick={() =>
                                setSort({
                                  sort: Sort.memes_cards_sets_genesis,
                                  sort_direction: SortDirection.DESC,
                                })
                              }
                              className={`${styles.caret} ${
                                sort.sort_direction != SortDirection.DESC ||
                                sort.sort != Sort.memes_cards_sets_genesis
                                  ? styles.disabled
                                  : ""
                              }`}
                            />
                          </span>
                        </span>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {leaderboard &&
                  leaderboard.map((lead, index) => {
                    if (lead.balance > 0) {
                      return (
                        <tr key={`wallet-${index}`}>
                          <td className={styles.rank}>
                            {/* {lead.tdh_rank} */}
                            {searchWallets.length > 0 && lead.dense_rank_sort
                              ? lead.dense_rank_sort
                              : index +
                                1 +
                                (pageProps.page - 1) * pageProps.pageSize}
                          </td>
                          <td className={styles.hodler}>
                            <Address
                              wallets={getWallets(lead)}
                              display={getDisplay(lead)}
                              tags={{
                                memesCardsSets: lead.memes_cards_sets,
                                memesCardsSetS1: lead.memes_cards_sets_szn1,
                                memesCardsSetS2: lead.memes_cards_sets_szn2,
                                memesCardsSetS3: lead.memes_cards_sets_szn3,
                                memesBalance: lead.unique_memes,
                                gradientsBalance: lead.gradients_balance,
                                genesis: lead.genesis,
                              }}
                            />
                          </td>
                          {focus == Focus.TDH && (
                            <td className={styles.tdhSub}>
                              {numberWithCommas(getCardsHodled(lead))}
                            </td>
                          )}
                          {focus == Focus.INTERACTIONS && (
                            <>
                              <td className={styles.tdhSub}>
                                {getPurchasesCount(lead)}
                              </td>
                              <td className={styles.tdhSub}>
                                {getPurchasesValue(lead)}
                              </td>
                              <td className={styles.tdhSub}>
                                {getSalesCount(lead)}
                              </td>
                              <td className={styles.tdhSub}>
                                {getSalesValue(lead)}
                              </td>
                              <td className={styles.tdhSub}>
                                {getTransfersIn(lead)}
                              </td>
                              <td className={styles.tdhSub}>
                                {getTransfersOut(lead)}
                              </td>
                            </>
                          )}
                          {focus == Focus.TDH && (
                            <>
                              <td className={styles.tdhSub}>
                                {getUniqueMemes(lead)}
                              </td>
                              <td className={styles.tdhSub}>{getSets(lead)}</td>
                              <td className={styles.tdhSub}>
                                {numberWithCommas(
                                  Math.round(getDaysHodledTdhBoosted(lead))
                                )}
                              </td>
                              <td className={styles.tdhSub}>
                                {numberWithCommas(
                                  Math.round(getDaysHodledTdh(lead))
                                )}
                                {lead.boost && (
                                  <span className={styles.tdhBoost}>
                                    &nbsp;(x{lead.boost})
                                  </span>
                                )}
                              </td>
                              <td className={styles.tdhSub}>
                                {numberWithCommas(
                                  Math.round(getDaysHodledTdhRaw(lead))
                                )}
                              </td>
                            </>
                          )}
                          {focus == Focus.SETS && (
                            <>
                              <td className={styles.tdhSub}>
                                {lead.memes_cards_sets > 0
                                  ? `x${numberWithCommas(
                                      lead.memes_cards_sets
                                    )}`
                                  : "-"}
                              </td>
                              <td className={styles.tdhSub}>
                                {lead.memes_cards_sets_minus1 > 0
                                  ? `x${numberWithCommas(
                                      lead.memes_cards_sets_minus1
                                    )}`
                                  : "-"}
                              </td>
                              <td className={styles.tdhSub}>
                                {lead.memes_cards_sets_minus2 > 0
                                  ? `x${numberWithCommas(
                                      lead.memes_cards_sets_minus2
                                    )}`
                                  : "-"}
                              </td>
                              <td className={styles.tdhSub}>
                                {lead.memes_cards_sets_szn1 > 0
                                  ? `x${numberWithCommas(
                                      lead.memes_cards_sets_szn1
                                    )}`
                                  : "-"}
                              </td>
                              <td className={styles.tdhSub}>
                                {lead.memes_cards_sets_szn2 > 0
                                  ? `x${numberWithCommas(
                                      lead.memes_cards_sets_szn2
                                    )}`
                                  : "-"}
                              </td>
                              <td className={styles.tdhSub}>
                                {lead.memes_cards_sets_szn3 > 0
                                  ? `x${numberWithCommas(
                                      lead.memes_cards_sets_szn3
                                    )}`
                                  : "-"}
                              </td>
                              <td className={styles.tdhSub}>
                                {lead.genesis > 0
                                  ? `x${numberWithCommas(lead.genesis)}`
                                  : "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    }
                  })}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
      {props.showMore && totalResults > pageProps.pageSize && leaderboard && (
        <Row className="text-center pt-2 pb-3">
          <Pagination
            page={pageProps.page}
            pageSize={pageProps.pageSize}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPageProps({ ...pageProps, page: newPage });
            }}
          />
        </Row>
      )}
      <SearchModal
        show={showSearchModal}
        searchWallets={searchWallets}
        setShow={function (show: boolean) {
          setShowSearchModal(show);
        }}
        addSearchWallet={function (newW: string) {
          setSearchWallets((searchWallets) => [...searchWallets, newW]);
        }}
        removeSearchWallet={function (removeW: string) {
          setSearchWallets([...searchWallets].filter((sw) => sw != removeW));
        }}
        clearSearchWallets={function () {
          setSearchWallets([]);
        }}
      />
    </Container>
  );
}
