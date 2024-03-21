import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SortDirection } from "../../entities/ISort";
import styles from "./Leaderboard.module.scss";

export enum LeaderboardCardsCollectedSort {
  level = "level",
  balance = "balance",
  unique_memes = "unique_memes",
  memes_cards_sets = "memes_cards_sets",
  boosted_tdh = "boosted_tdh",
  day_change = "day_change",
}

export enum LeaderboardInteractionsSort {
  "primary_purchases_count" = "primary_purchases_count",
  "primary_purchases_value" = "primary_purchases_value",
  "secondary_purchases_count" = "secondary_purchases_count",
  "secondary_purchases_value" = "secondary_purchases_value",
  "sales_count" = "sales_count",
  "sales_value" = "sales_value",
  "transfers_in" = "transfers_in",
  "transfers_out" = "transfers_out",
  "airdrops" = "airdrops",
  "burns" = "burns",
}

export type LeaderboardSortType =
  | LeaderboardCardsCollectedSort
  | LeaderboardInteractionsSort;

export default function LeaderboardSort<LeaderboardSortType>(
  props: Readonly<{
    sort: {
      sort: LeaderboardSortType;
      sort_direction: SortDirection;
    };
    setSort: (sort: {
      sort: LeaderboardSortType;
      sort_direction: SortDirection;
    }) => void;
    s: LeaderboardSortType;
  }>
) {
  return (
    <span className="d-flex flex-column">
      <FontAwesomeIcon
        icon="square-caret-up"
        onClick={() =>
          props.setSort({
            sort: props.s,
            sort_direction: SortDirection.ASC,
          })
        }
        className={`${styles.caret} ${
          props.sort.sort_direction != SortDirection.ASC ||
          props.sort.sort != props.s
            ? styles.disabled
            : ""
        }`}
      />
      <FontAwesomeIcon
        icon="square-caret-down"
        onClick={() =>
          props.setSort({
            sort: props.s,
            sort_direction: SortDirection.DESC,
          })
        }
        className={`${styles.caret} ${
          props.sort.sort_direction != SortDirection.DESC ||
          props.sort.sort != props.s
            ? styles.disabled
            : ""
        }`}
      />
    </span>
  );
}
