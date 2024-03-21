import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SortDirection } from "../../entities/ISort";
import styles from "./Leaderboard.module.scss";

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
