import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  isMemesNomineeLookalike,
  MEMES_NOMINEE_CATEGORY,
} from "@/helpers/waves/memes-nomination";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { RepSearchState } from "./rep-search-types";

export default function UserPageRepNewRepSearchDropdown({
  categories,
  onRepSelect,
  state,
  minSearchLength,
  maxSearchLength,
}: {
  readonly categories: string[];
  readonly onRepSelect: (rep: string) => void;
  readonly state: RepSearchState;
  readonly minSearchLength: number;
  readonly maxSearchLength: number;
}) {
  const locale = useBrowserLocale();

  if (state === RepSearchState.MIN_LENGTH_ERROR) {
    return (
      <p className="tw-m-0 tw-px-2 tw-py-1 tw-text-xs tw-font-normal tw-text-iron-500">
        {t(locale, "rep.categories.grant.minimumCharacters", {
          min: minSearchLength,
        })}
      </p>
    );
  }

  if (state === RepSearchState.MAX_LENGTH_ERROR) {
    return (
      <p className="tw-m-0 tw-px-2 tw-py-1 tw-text-xs tw-font-normal tw-text-iron-500">
        {t(locale, "rep.categories.grant.maximumCharacters", {
          max: maxSearchLength,
        })}
      </p>
    );
  }

  if (state === RepSearchState.LOADING) {
    return (
      <output className="tw-flex tw-items-center tw-gap-2 tw-px-2 tw-text-xs tw-text-iron-400">
        <CircleLoader />
        <span>{t(locale, "rep.categories.grant.searching")}</span>
      </output>
    );
  }

  if (!categories.length) {
    return null;
  }

  return (
    <div className="tw-flex tw-max-h-80 tw-flex-wrap tw-gap-2.5 tw-overflow-y-auto tw-px-1 tw-py-1">
      {categories.map((category) => {
        const isMemesSubmissionCategory = category === MEMES_NOMINEE_CATEGORY;
        const isNonQualifyingLookalike = isMemesNomineeLookalike(category);
        let categoryAppearance =
          "tw-border-white/10 tw-bg-transparent tw-text-white hover:tw-bg-white/5";
        if (isMemesSubmissionCategory) {
          categoryAppearance =
            "tw-border-emerald-500/30 tw-bg-emerald-500/10 tw-text-white hover:tw-bg-emerald-500/15";
        } else if (isNonQualifyingLookalike) {
          categoryAppearance =
            "tw-border-white/10 tw-bg-transparent tw-text-iron-300 hover:tw-bg-white/5";
        }

        return (
          <button
            key={category}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRepSelect(category);
            }}
            className={`tw-flex tw-max-w-full tw-cursor-pointer tw-flex-wrap tw-items-center tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-1 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-white/40 md:tw-px-2 md:tw-py-1.5 md:tw-text-xs ${categoryAppearance}`}
          >
            <span
              className={`tw-break-words ${
                isMemesSubmissionCategory ? "tw-font-bold" : ""
              }`}
            >
              {category}
            </span>
            {isMemesSubmissionCategory && (
              <span className="tw-ml-1 tw-whitespace-nowrap tw-rounded tw-bg-emerald-500/20 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-text-emerald-400">
                {t(locale, "rep.categories.grant.submissionBadge")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
