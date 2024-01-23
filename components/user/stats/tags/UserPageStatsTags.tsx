import { useEffect, useState } from "react";
import UserPageStatsTagsSet from "./UserPageStatsTagsSet";
import { MEMES_SEASON } from "../../../../enums";
import { UserPageStatsTDHType } from "../UserPageStats";
import { formatNumberWithCommasOrDash } from "../../../../helpers/Helpers";

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
    classes:
      "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-[#84ACFF]/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#84ACFF] tw-ring-1 tw-ring-inset tw-ring-[#84ACFF]/20",
    value: (props) => props?.memes_cards_sets_szn1 ?? 0,
  },
  [MEMES_SEASON.SZN2]: {
    id: MEMES_SEASON.SZN2,
    title: "SZN2",
    classes:
      "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-[#8494FF]/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#8494FF] tw-ring-1 tw-ring-inset tw-ring-[#8494FF]/20",
    value: (props) => props?.memes_cards_sets_szn2 ?? 0,
  },
  [MEMES_SEASON.SZN3]: {
    id: MEMES_SEASON.SZN3,
    title: "SZN3",
    classes:
      "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-[#8A84FF]/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#8A84FF] tw-ring-1 tw-ring-inset tw-ring-[#8A84FF]/20",
    value: (props) => props?.memes_cards_sets_szn3 ?? 0,
  },
  [MEMES_SEASON.SZN4]: {
    id: MEMES_SEASON.SZN4,
    title: "SZN4",
    classes:
      "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-[#A184FF]/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#A184FF] tw-ring-1 tw-ring-inset tw-ring-[#A184FF]/20",
    value: (props) => props?.memes_cards_sets_szn4 ?? 0,
  },
  [MEMES_SEASON.SZN5]: {
    id: MEMES_SEASON.SZN5,
    title: "SZN5",
    classes:
      "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-[#B884FF]/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#B884FF] tw-ring-1 tw-ring-inset tw-ring-[#B884FF]/20",
    value: (props) => props?.memes_cards_sets_szn5 ?? 0,
  },
  [MEMES_SEASON.SZN6]: {
    id: MEMES_SEASON.SZN6,
    title: "SZN6",
    classes:
      "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-[#CF84FF]/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-[#CF84FF] tw-ring-1 tw-ring-inset tw-ring-[#CF84FF]/20",
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
    if (props.memes_cards_sets) {
      result.push({
        id: "memes_sets",
        title: `Meme Sets x${formatNumberWithCommasOrDash(
          props.memes_cards_sets
        )}`,
        classes:
          "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
      });
    }

    if (props.memes_balance) {
      result.push({
        id: "memes",
        title: `Memes x${formatNumberWithCommasOrDash(props.memes_balance)} ${
          props.unique_memes === props.memes_balance
            ? ""
            : `(unique x${formatNumberWithCommasOrDash(props.unique_memes)})`
        }`,
        classes:
          "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
      });
    }

    if (props.gradients_balance) {
      result.push({
        id: "gradients",
        title: `Gradients x${formatNumberWithCommasOrDash(
          props.gradients_balance
        )}`,
        classes:
          "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
      });
    }

    if (props.boost) {
      result.push({
        id: "boost",
        title: `Boost x${formatNumberWithCommasOrDash(props.boost)}`,
        classes:
          "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
      });
    }

    return result;
  };

  const getSeasonTags = (props: UserPageStatsTDHType): UserPageStatsTag[] => {
    const result: UserPageStatsTag[] = [];

    if (!props) {
      return result;
    }

    for (const szn of Object.values(MEMES_SEASON)) {
      const sznConfig = SEASONS_CONFIG[szn];
      const sznValue = sznConfig.value(props);
      if (sznValue) {
        result.push({
          id: sznConfig.id,
          title: `Meme Sets ${sznConfig.title} x${formatNumberWithCommasOrDash(
            sznValue
          )}`,
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

  const [haveAnyTags, setHaveAnyTags] = useState<boolean>(
    !!mainTags.length || !!seasonTags.length
  );

  useEffect(() => {
    setHaveAnyTags(!!mainTags.length || !!seasonTags.length);
  }, [mainTags, seasonTags]);

  if (!haveAnyTags) {
    return <div></div>;
  }

  return (
    <div className="tw-space-y-2 sm:tw-space-y-3">
      <UserPageStatsTagsSet tags={mainTags} />
      <UserPageStatsTagsSet tags={seasonTags} />
    </div>
  );
}
