import { useEffect, useState } from "react";
import { UserPageStatsTDHType } from "./UserPageStats";
import UserPageStatsTable, {
  UserPageStatsTableItemData,
  UserPageStatsTableProps,
} from "./utils/table/UserPageStatsTable";
import { formatNumberWithCommasOrDash } from "../../../helpers/Helpers";

export default function UserPageStatsCollected({
  tdh,
}: {
  readonly tdh: UserPageStatsTDHType;
}) {
  const getAllCards = (
    props: UserPageStatsTDHType
  ): UserPageStatsTableItemData[] => {
    if (!props) return [];
    return [
      {
        title: "All Cards",
        isMain: true,
        total: formatNumberWithCommasOrDash(
          props.memes_balance + props.gradients_balance
        ),
        memes: formatNumberWithCommasOrDash(props.memes_balance),
        gradient: formatNumberWithCommasOrDash(props.gradients_balance),
        SZN1: formatNumberWithCommasOrDash(props.memes_balance_season1),
        SZN2: formatNumberWithCommasOrDash(props.memes_balance_season2),
        SZN3: formatNumberWithCommasOrDash(props.memes_balance_season3),
        SZN4: formatNumberWithCommasOrDash(props.memes_balance_season4),
        SZN5: formatNumberWithCommasOrDash(props.memes_balance_season5),
        SZN6: formatNumberWithCommasOrDash(props.memes_balance_season6),
      },
      {
        title: "Rank",
        isMain: false,
        total: `#${formatNumberWithCommasOrDash(props.dense_rank_balance)}${
          props.dense_rank_balance__ties > 1 ? " (tie)" : ""
        }`,
        memes: `#${formatNumberWithCommasOrDash(
          props.dense_rank_balance_memes
        )}${props.dense_rank_balance_memes__ties > 1 ? " (tie)" : ""}`,
        gradient: `#${formatNumberWithCommasOrDash(
          props.dense_rank_balance_gradients
        )}${props.dense_rank_balance_gradients__ties > 1 ? " (tie)" : ""}`,
        SZN1: `#${formatNumberWithCommasOrDash(
          props.dense_rank_balance_memes_season1
        )}${props.dense_rank_balance_memes_season1__ties > 1 ? " (tie)" : ""}`,
        SZN2: `#${formatNumberWithCommasOrDash(
          props.dense_rank_balance_memes_season2
        )}${props.dense_rank_balance_memes_season2__ties > 1 ? " (tie)" : ""}`,
        SZN3: `#${formatNumberWithCommasOrDash(
          props.dense_rank_balance_memes_season3
        )}${props.dense_rank_balance_memes_season3__ties > 1 ? " (tie)" : ""}`,
        SZN4: `#${formatNumberWithCommasOrDash(
          props.dense_rank_balance_memes_season4
        )}${props.dense_rank_balance_memes_season4__ties > 1 ? " (tie)" : ""}`,
        SZN5: `#${formatNumberWithCommasOrDash(
          props.dense_rank_balance_memes_season5
        )}${props.dense_rank_balance_memes_season5__ties > 1 ? " (tie)" : ""}`,
        SZN6: `#${formatNumberWithCommasOrDash(
          props.dense_rank_balance_memes_season6
        )}${props.dense_rank_balance_memes_season6__ties > 1 ? " (tie)" : ""}`,
      },
    ];
  };

  const getUniqueCards = (
    props: UserPageStatsTDHType
  ): UserPageStatsTableItemData[] => {
    if (!props) return [];
    return [
      {
        title: "Unique Cards",
        isMain: true,
        total: formatNumberWithCommasOrDash(
          props.unique_memes + props.gradients_balance
        ),
        memes: formatNumberWithCommasOrDash(props.unique_memes),
        gradient: formatNumberWithCommasOrDash(props.gradients_balance),
        SZN1: formatNumberWithCommasOrDash(props.unique_memes_szn1),
        SZN2: formatNumberWithCommasOrDash(props.unique_memes_szn2),
        SZN3: formatNumberWithCommasOrDash(props.unique_memes_szn3),
        SZN4: formatNumberWithCommasOrDash(props.unique_memes_szn4),
        SZN5: formatNumberWithCommasOrDash(props.unique_memes_szn5),
        SZN6: formatNumberWithCommasOrDash(props.unique_memes_szn6),
      },
      {
        title: "Rank",
        isMain: false,
        total: `#${formatNumberWithCommasOrDash(props.dense_rank_unique)}${
          props.dense_rank_unique__ties > 1 ? " (tie)" : ""
        }`,
        memes: `#${formatNumberWithCommasOrDash(
          props.dense_rank_unique_memes
        )}${props.dense_rank_unique_memes__ties > 1 ? " (tie)" : ""}`,
        gradient: `#${formatNumberWithCommasOrDash(
          props.dense_rank_balance_gradients
        )}${props.dense_rank_balance_gradients__ties > 1 ? " (tie)" : ""}`,
        SZN1: `#${formatNumberWithCommasOrDash(
          props.dense_rank_unique_memes_season1
        )}${props.dense_rank_unique_memes_season1__ties > 1 ? " (tie)" : ""}`,
        SZN2: `#${formatNumberWithCommasOrDash(
          props.dense_rank_unique_memes_season2
        )}${props.dense_rank_unique_memes_season2__ties > 1 ? " (tie)" : ""}`,
        SZN3: `#${formatNumberWithCommasOrDash(
          props.dense_rank_unique_memes_season3
        )}${props.dense_rank_unique_memes_season3__ties > 1 ? " (tie)" : ""}`,
        SZN4: `#${formatNumberWithCommasOrDash(
          props.dense_rank_unique_memes_season4
        )}${props.dense_rank_unique_memes_season4__ties > 1 ? " (tie)" : ""}`,
        SZN5: `#${formatNumberWithCommasOrDash(
          props.dense_rank_unique_memes_season5
        )}${props.dense_rank_unique_memes_season5__ties > 1 ? " (tie)" : ""}`,
        SZN6: `#${formatNumberWithCommasOrDash(
          props.dense_rank_unique_memes_season6
        )}${props.dense_rank_unique_memes_season6__ties > 1 ? " (tie)" : ""}`,
      },
    ];
  };

  const getTDH = (
    props: UserPageStatsTDHType
  ): UserPageStatsTableItemData[] => {
    if (!props) return [];
    return [
      {
        title: "TDH",
        isMain: true,
        total: formatNumberWithCommasOrDash(props.boosted_tdh),
        memes: formatNumberWithCommasOrDash(
          Math.round(props.boosted_memes_tdh)
        ),
        gradient: formatNumberWithCommasOrDash(
          Math.round(props.boosted_gradients_tdh)
        ),
        SZN1: formatNumberWithCommasOrDash(
          Math.round(props.boosted_memes_tdh_season1)
        ),
        SZN2: formatNumberWithCommasOrDash(
          Math.round(props.boosted_memes_tdh_season2)
        ),
        SZN3: formatNumberWithCommasOrDash(
          Math.round(props.boosted_memes_tdh_season3)
        ),
        SZN4: formatNumberWithCommasOrDash(
          Math.round(props.boosted_memes_tdh_season4)
        ),
        SZN5: formatNumberWithCommasOrDash(
          Math.round(props.boosted_memes_tdh_season5)
        ),
        SZN6: formatNumberWithCommasOrDash(
          Math.round(props.boosted_memes_tdh_season6)
        ),
      },
      {
        title: "Rank",
        isMain: false,
        total: `#${formatNumberWithCommasOrDash(props.tdh_rank)}`,
        memes: `#${formatNumberWithCommasOrDash(props.tdh_rank_memes)}`,
        gradient: `#${formatNumberWithCommasOrDash(props.tdh_rank_gradients)}`,
        SZN1: `#${formatNumberWithCommasOrDash(props.tdh_rank_memes_szn1)}`,
        SZN2: `#${formatNumberWithCommasOrDash(props.tdh_rank_memes_szn2)}`,
        SZN3: `#${formatNumberWithCommasOrDash(props.tdh_rank_memes_szn3)}`,
        SZN4: `#${formatNumberWithCommasOrDash(props.tdh_rank_memes_szn4)}`,
        SZN5: `#${formatNumberWithCommasOrDash(props.tdh_rank_memes_szn5)}`,
        SZN6: `#${formatNumberWithCommasOrDash(props.tdh_rank_memes_szn6)}`,
      },
    ];
  };

  const getData = (props: UserPageStatsTDHType): UserPageStatsTableProps => {
    if (!props) return { title: "Collected", data: [] };
    return {
      title: "Collected",
      data: [getAllCards(props), getUniqueCards(props), getTDH(props)],
    };
  };

  const [data, setData] = useState<UserPageStatsTableProps>(getData(tdh));

  useEffect(() => setData(getData(tdh)), [tdh]);

  return <UserPageStatsTable data={data} />;
}
