import { useState, useEffect } from "react";
import { Container, Row, Col, Table, Dropdown, Form } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { TDHCalc, TDHMetrics } from "../../entities/ITDH";
import styles from "./Leaderboard.module.scss";
import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getDateDisplay,
  nextTdh,
  numberWithCommas,
} from "../../helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "../../entities/ISort";
import { useRouter } from "next/router";

const Address = dynamic(() => import("../address/Address"), { ssr: false });

interface Props {
  page: number;
  pageSize: number;
  showMore?: boolean;
  showLastTdh?: boolean;
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
  gradients_tdh = "gradients_tdh",
  boosted_gradients_tdh = "boosted_gradients_tdh",
  gradients_tdh__raw = "gradients_tdh__raw",
  total_balance = "balance",
  memes_balance = "memes_balance",
  szn1_balance = "memes_balance_season1",
  szn2_balance = "memes_balance_season2",
  gradients_balance = "gradients_balance",
  purchases_value = "purchases_value",
  purchases_count = "purchases_count",
  sales_value = "sales_value",
  sales_count = "sales_count",
  purchases_count_memes = "purchases_count_memes",
  purchases_count_memes_season1 = "purchases_count_memes_season1",
  purchases_count_memes_season2 = "purchases_count_memes_season2",
  purchases_count_gradients = "purchases_count_gradients",
  purchases_value_memes = "purchases_value_memes",
  purchases_value_memes_season1 = "purchases_value_memes_season1",
  purchases_value_memes_season2 = "purchases_value_memes_season2",
  purchases_value_gradients = "purchases_value_gradients",
  sales_count_memes = "sales_count_memes",
  sales_count_memes_season1 = "sales_count_memes_season1",
  sales_count_memes_season2 = "sales_count_memes_season2",
  sales_count_gradients = "sales_count_gradients",
  sales_value_memes = "sales_value_memes",
  sales_value_memes_season1 = "sales_value_memes_season1",
  sales_value_memes_season2 = "sales_value_memes_season2",
  sales_value_gradients = "sales_value_gradients",
  transfers_in = "transfers_in",
  transfers_in_memes = "transfers_in_memes",
  transfers_in_memes_season1 = "transfers_in_memes_season1",
  transfers_in_memes_season2 = "transfers_in_memes_season2",
  transfers_in_gradients = "transfers_in_gradients",
  transfers_out = "transfers_out",
  transfers_out_memes = "transfers_out_memes",
  transfers_out_memes_season1 = "transfers_out_memes_season1",
  transfers_out_memes_season2 = "transfers_out_memes_season2",
  transfers_out_gradients = "transfers_out_gradients",
  boosted_memes_tdh_season1 = "boosted_memes_tdh_season1",
  boosted_memes_tdh_season2 = "boosted_memes_tdh_season2",
  memes_cards_sets = "memes_cards_sets",
  memes_cards_sets_szn1 = "memes_cards_sets_szn1",
  memes_cards_sets_szn2 = "memes_cards_sets_szn2",
  memes_cards_sets_minus1 = "memes_cards_sets_minus1",
  memes_cards_sets_minus2 = "memes_cards_sets_minus2",
  memes_cards_sets_genesis = "genesis",
  unique_memes = "unique_memes",
  unique_memes_szn1 = "unique_memes_szn1",
  unique_memes_szn2 = "unique_memes_szn2",
}

enum Content {
  ALL = "All",
  MEMES = "Memes",
  MEMES1 = "Memes SZN1",
  MEMES2 = "Memes SZN2",
  GRADIENTS = "6529 Gradient",
}

enum OwnerTagFilter {
  ALL = "All",
  MEMES_SETS = "Meme Set",
  MEMES_SETS_MINUS1 = "Meme Set -1",
  MEMES_SETS_SZN1 = "SZN1 Set",
  MEMES_SETS_SZN2 = "SZN2 Set",
  GENESIS = "Genesis Set",
  GRADIENTS = "6529 Gradient",
}

enum Focus {
  TDH = "Cards HODLed",
  INTERACTIONS = "Interactions",
  SETS = "Sets",
}

export default function Leaderboard(props: Props) {
  const router = useRouter();

  const [content, setContent] = useState<Content>(Content.ALL);
  const [ownerTagFilter, setOwnerTagFilter] = useState<OwnerTagFilter>(
    OwnerTagFilter.ALL
  );
  const [focus, setFocus] = useState<Focus>(Focus.TDH);
  const [hideMuseum, setHideMuseum] = useState(false);

  const [pageProps, setPageProps] = useState<Props>(props);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<TDHMetrics[]>();
  const [lastTDH, setLastTDH] = useState<TDHCalc>();
  const [next, setNext] = useState(null);
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.total_balance, sort_direction: SortDirection.DESC });
  const [showViewAll, setShowViewAll] = useState(
    !window.location.pathname.includes("community")
  );

  if (props.showLastTdh) {
    printNextTdhCountdown();
  }

  async function fetchResults() {
    let tagFilter = "";
    switch (ownerTagFilter) {
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
      case OwnerTagFilter.GENESIS:
        tagFilter = "&filter=memes_genesis";
        break;
      case OwnerTagFilter.GRADIENTS:
        tagFilter = "&filter=gradients";
        break;
    }
    let museumFilter = hideMuseum ? "&hide_museum=true" : "";
    fetch(
      `${process.env.API_ENDPOINT}/api/owner_metrics?page_size=${props.pageSize}&page=${pageProps.page}&sort=${sort.sort}&sort_direction=${sort.sort_direction}${tagFilter}${museumFilter}`
    )
      .then((res) => res.json())
      .then((response: DBResponse) => {
        setTotalResults(response.count);
        setNext(response.next);
        setLeaderboard(response.data);
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
  }, [sort, ownerTagFilter, router.isReady, content, hideMuseum]);

  useEffect(() => {
    fetch(`${process.env.API_ENDPOINT}/api/blocks?page_size=${1}`)
      .then((res) => res.json())
      .then((response: DBResponse) => {
        if (response.data.length > 0) {
          setLastTDH({
            block: response.data[0].block_number,
            date: new Date(response.data[0].timestamp),
          });
        }
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

  function getCardsHodled(lead: TDHMetrics) {
    switch (content) {
      case Content.MEMES:
        return lead.memes_balance;
      case Content.MEMES1:
        return lead.memes_balance_season1;
      case Content.MEMES2:
        return lead.memes_balance_season2;
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
    switch (content) {
      case Content.MEMES1:
        unique = lead.unique_memes_szn1;
        break;
      case Content.MEMES2:
        unique = lead.unique_memes_szn2;
        break;
      default:
        unique = lead.unique_memes;
        break;
    }
    if (unique > 0) {
      return `x${numberWithCommas(unique)}`;
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
      case Content.GRADIENTS:
        return Sort.transfers_out_gradients;
      default:
        return Sort.transfers_out;
    }
  }

  function printHodlersDropdown() {
    return (
      <Dropdown className={styles.contentDropdown} drop={"down-centered"}>
        <Dropdown.Toggle>HODLers: {ownerTagFilter}</Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.values(OwnerTagFilter).map((tagFilter) => (
            <Dropdown.Item
              key={tagFilter}
              onClick={() => setOwnerTagFilter(tagFilter)}>
              {[
                OwnerTagFilter.MEMES_SETS_MINUS1,
                OwnerTagFilter.MEMES_SETS_SZN1,
                OwnerTagFilter.MEMES_SETS_SZN2,
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
          <Dropdown.Item onClick={() => setContent(Content.GRADIENTS)}>
            {Content.GRADIENTS}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  function printInteractionsWidget() {
    return (
      <>
        <span
          onClick={() => setFocus(Focus.TDH)}
          className={`${styles.focusSwitchLabel} ${
            focus == Focus.TDH && styles.focusSwitchLabelActive
          }`}>
          Cards HODLed
        </span>
        <span
          onClick={() => setFocus(Focus.INTERACTIONS)}
          className={`${styles.focusSwitchLabel} ${
            styles.focusSwitchLabelExtraPadding
          } ${focus == Focus.INTERACTIONS && styles.focusSwitchLabelActive}`}>
          Interactions
        </span>
        <span
          onClick={() => setFocus(Focus.SETS)}
          className={`${styles.focusSwitchLabel} ${
            styles.focusSwitchLabelExtraPadding
          } ${focus == Focus.SETS && styles.focusSwitchLabelActive}`}>
          Sets
        </span>
      </>
    );
  }

  return (
    <Container className={`no-padding pt-4`} id={`leaderboard-page`}>
      <Row>
        <Col className={`d-flex align-items-center`} xs={6}>
          <h1>
            COMMUNITY{" "}
            {showViewAll && (
              <a href="/community">
                <span className={styles.viewAllLink}>VIEW ALL</span>
              </a>
            )}
          </h1>
        </Col>
        {lastTDH && props.showLastTdh && (
          <Col
            className={`${styles.lastTDH} d-flex align-items-center justify-content-end`}
            xs={6}>
            * TDH Block&nbsp;
            <a
              href={`https://etherscan.io/block/${lastTDH.block}`}
              rel="noreferrer"
              target="_blank">
              {lastTDH.block}
            </a>
            &nbsp;|&nbsp;Next Calculation&nbsp;
            <span id="next-tdh-div-1">{nextTdh()}</span>
          </Col>
        )}
      </Row>
      {!showViewAll && (
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
            md={{ span: 4 }}
            lg={{ span: 4 }}>
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
          <Col
            className={`${styles.pageHeader} text-center`}
            xs={{ span: 12 }}
            sm={{ span: 12 }}
            md={{ span: 2 }}
            lg={{ span: 2 }}>
            <Form.Check
              type="switch"
              checked={hideMuseum}
              className={`${styles.museumToggle}`}
              label={`Hide 6529Museum`}
              onChange={() => setHideMuseum(!hideMuseum)}
            />
          </Col>
        </Row>
      )}
      <Row className={`${styles.scrollContainer} pt-2`}>
        <Col>
          {leaderboard && leaderboard.length > 0 && (
            <Table bordered={false} className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th className={styles.rank}>Rank</th>
                  <th className={styles.hodler}>
                    HODLer&nbsp;&nbsp;
                    <span className={styles.totalResults}>
                      x{totalResults}
                    </span>{" "}
                  </th>
                  {focus == Focus.TDH && (
                    <th className={styles.tdhSub}>
                      <span className="d-flex align-items-center justify-content-center">
                        Cards HODLed&nbsp;
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
                          Meme SZN1 Sets&nbsp;
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
                          Meme SZN2 Sets&nbsp;
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
                    return (
                      <tr key={`${index}-${lead.wallet}`}>
                        <td className={styles.rank}>
                          {/* {lead.tdh_rank} */}
                          {index +
                            1 +
                            (pageProps.page - 1) * pageProps.pageSize}
                        </td>
                        <td className={styles.hodler}>
                          <Address
                            address={lead.wallet}
                            ens={lead.wallet_display}
                            tags={{
                              memesCardsSets: lead.memes_cards_sets,
                              memesCardsSetS1: lead.memes_cards_sets_szn1,
                              memesCardsSetS2: lead.memes_cards_sets_szn2,
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
                              <span className={styles.tdhBoost}>
                                &nbsp;(x{lead.boost})
                              </span>
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
                                ? `x${numberWithCommas(lead.memes_cards_sets)}`
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
                              {lead.genesis > 0
                                ? `x${numberWithCommas(lead.genesis)}`
                                : "-"}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
      {props.showMore && totalResults > 0 && leaderboard && (
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
    </Container>
  );
}
