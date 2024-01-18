import { useEffect, useState } from "react";
import UserPageStatsTagsSet from "./UserPageStatsTagsSet";
import { MEMES_SEASON } from "../../../../enums";
import { UserPageStatsTDHType } from "../UserPageStats";

export interface UserPageStatsTag {
  readonly id: string;
  readonly title: string;
  readonly classes: string;
}

const SEASONS_CONFIG: Record<
  MEMES_SEASON,
  {
    readonly id: MEMES_SEASON;
    readonly title: string;
    readonly classes: string;
    readonly value: (props: UserPageStatsTDHType) => number;
  }
> = {
  [MEMES_SEASON.SZN1]: {
    id: MEMES_SEASON.SZN1,
    title: "SZN1",
    classes: "tw-bg-neutral-400",
    value: (props) => props?.memes_cards_sets_szn1 ?? 0,
  },
  [MEMES_SEASON.SZN2]: {
    id: MEMES_SEASON.SZN2,
    title: "SZN2",
    classes: "tw-bg-neutral-400",
    value: (props) => props?.memes_cards_sets_szn2 ?? 0,
  },
  [MEMES_SEASON.SZN3]: {
    id: MEMES_SEASON.SZN3,
    title: "SZN3",
    classes: "tw-bg-neutral-400",
    value: (props) => props?.memes_cards_sets_szn3 ?? 0,
  },
  [MEMES_SEASON.SZN4]: {
    id: MEMES_SEASON.SZN4,
    title: "SZN4",
    classes: "tw-bg-neutral-400",
    value: (props) => props?.memes_cards_sets_szn4 ?? 0,
  },
  [MEMES_SEASON.SZN5]: {
    id: MEMES_SEASON.SZN5,
    title: "SZN5",
    classes: "tw-bg-neutral-400",
    value: (props) => props?.memes_cards_sets_szn5 ?? 0,
  },
  [MEMES_SEASON.SZN6]: {
    id: MEMES_SEASON.SZN6,
    title: "SZN6",
    classes: "tw-bg-neutral-400",
    value: (props) => props?.memes_cards_sets_szn6 ?? 0,
  },
};

export default function UserPageStatsTags({
  tdh,
}: {
  readonly tdh: UserPageStatsTDHType;
}) {
  const getMainTags = (props: UserPageStatsTDHType): UserPageStatsTag[] => {
    const result: UserPageStatsTag[] = [];

    if (!props) {
      return result;
    }

    if (props.boost) {
      result.push({
        id: "boost",
        title: `Boost x${props.boost}`,
        classes: "tw-bg-neutral-400",
      });
    }

    if (props.gradients_balance) {
      result.push({
        id: "gradients",
        title: `Gradients x${props.gradients_balance}`,
        classes: "tw-bg-neutral-400",
      });
    }

    if (props.memes_balance) {
      result.push({
        id: "memes",
        title: `Memes x${props.memes_balance} ${
          props.unique_memes === props.memes_balance
            ? ""
            : `(unique x${props.unique_memes})`
        }`,
        classes: "tw-bg-neutral-400",
      });
    }

    return result;
  };

  const getSeasonTags = (props: UserPageStatsTDHType): UserPageStatsTag[] => {
    const result: UserPageStatsTag[] = [];

    if (!props) {
      return result;
    }

    if (props.memes_cards_sets) {
      result.push({
        id: "memes_sets",
        title: `Meme Sets x${props.memes_cards_sets}`,
        classes: "tw-bg-neutral-400",
      });
    }

    for (const szn of Object.values(MEMES_SEASON)) {
      const sznConfig = SEASONS_CONFIG[szn];
      const sznValue = sznConfig.value(props);
      if (sznValue) {
        result.push({
          id: sznConfig.id,
          title: `Meme Sets ${sznConfig.title} x${sznValue}`,
          classes: sznConfig.classes,
        });
      }
    }

    return result;
  };

  const [mainTags, setMainTags] = useState<UserPageStatsTag[]>(
    getMainTags(tdh)
  );

  const [seasonTags, setSeasonTags] = useState<UserPageStatsTag[]>(
    getSeasonTags(tdh)
  );

  useEffect(() => {
    setMainTags(getMainTags(tdh));
    setSeasonTags(getSeasonTags(tdh));
  }, [tdh]);

  return (
    <div className="tw-space-y-2">
      <UserPageStatsTagsSet tags={mainTags} />
      <UserPageStatsTagsSet tags={seasonTags} />
    </div>
  );
}
