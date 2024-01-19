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
    classes: "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#75E0A7] tw-ring-1 tw-ring-inset tw-ring-[#47CD89]/20",
    value: (props) => props?.memes_cards_sets_szn1 ?? 0,
  },
  [MEMES_SEASON.SZN2]: {
    id: MEMES_SEASON.SZN2,
    title: "SZN2",
    classes: "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#84ADFF] tw-ring-1 tw-ring-inset tw-ring-[#528BFF]/20",
    value: (props) => props?.memes_cards_sets_szn2 ?? 0,
  },
  [MEMES_SEASON.SZN3]: {
    id: MEMES_SEASON.SZN3,
    title: "SZN3",
    classes: "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#F7B27A] tw-ring-1 tw-ring-inset tw-ring-[#F38744]/20",
    value: (props) => props?.memes_cards_sets_szn3 ?? 0,
  },
  [MEMES_SEASON.SZN4]: {
    id: MEMES_SEASON.SZN4,
    title: "SZN4",
    classes: "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#FDE272] tw-ring-1 tw-ring-inset tw-ring-[#FAC515]/20",
    value: (props) => props?.memes_cards_sets_szn4 ?? 0,
  },
  [MEMES_SEASON.SZN5]: {
    id: MEMES_SEASON.SZN5,
    title: "SZN5",
    classes: "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#EEAAFD] tw-ring-1 tw-ring-inset tw-ring-[#E478FA]/20",
    value: (props) => props?.memes_cards_sets_szn5 ?? 0,
  },
  [MEMES_SEASON.SZN6]: {
    id: MEMES_SEASON.SZN6,
    title: "SZN6",
    classes: "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#BDB4FE] tw-ring-1 tw-ring-inset tw-ring-[#9B8AFB]/20",
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
        classes: "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
      });
    }

    if (props.gradients_balance) {
      result.push({
        id: "gradients",
        title: `Gradients x${props.gradients_balance}`,
        classes: "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
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
        classes: "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#FDA29B] tw-ring-1 tw-ring-inset tw-ring-[#F97066]/20",
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
        classes: "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#FEA3B4] tw-ring-1 tw-ring-inset tw-ring-[#FD6F8E]/20",
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
    <div className="tw-space-y-2 sm:tw-space-y-3">
      <UserPageStatsTagsSet tags={mainTags} />
      <UserPageStatsTagsSet tags={seasonTags} />
    </div>
  );
}
