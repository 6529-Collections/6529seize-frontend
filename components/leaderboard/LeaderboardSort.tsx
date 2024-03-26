import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SortDirection } from "../../entities/ISort";
import styles from "./Leaderboard.module.scss";

export default function LeaderboardSort<LeaderboardSortType>(
  props: Readonly<{
    sort_option: LeaderboardSortType;
    sort: {
      sort: LeaderboardSortType;
      sort_direction: SortDirection;
    };
    setSort: (sort: {
      sort: LeaderboardSortType;
      sort_direction: SortDirection;
    }) => void;
  }>
) {
  return (
    <span className="d-flex flex-column">
      <FontAwesomeIcon
        icon="square-caret-up"
        onClick={() =>
          props.setSort({
            sort: props.sort_option,
            sort_direction: SortDirection.ASC,
          })
        }
        className={`${styles.caret} ${
          props.sort.sort_direction !== SortDirection.ASC ||
          props.sort.sort !== props.sort_option
            ? styles.disabled
            : ""
        }`}
      />
      <FontAwesomeIcon
        icon="square-caret-down"
        onClick={() =>
          props.setSort({
            sort: props.sort_option,
            sort_direction: SortDirection.DESC,
          })
        }
        className={`${styles.caret} ${
          props.sort.sort_direction !== SortDirection.DESC ||
          props.sort.sort !== props.sort_option
            ? styles.disabled
            : ""
        }`}
      />
    </span>
  );
}
