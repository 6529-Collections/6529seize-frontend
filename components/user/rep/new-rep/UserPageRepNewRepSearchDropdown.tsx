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
      <p className="tw-m-0 tw-px-2 tw-py-1.5 tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400">
        {t(locale, "rep.categories.grant.minimumCharacters", {
          min: minSearchLength,
        })}
      </p>
    );
  }

  if (state === RepSearchState.MAX_LENGTH_ERROR) {
    return (
      <p className="tw-m-0 tw-px-2 tw-py-1.5 tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400">
        {t(locale, "rep.categories.grant.maximumCharacters", {
          max: maxSearchLength,
        })}
      </p>
    );
  }

  if (state === RepSearchState.LOADING) {
    return (
      <output className="tw-flex tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-text-xs tw-leading-5 tw-text-iron-400">
        <CircleLoader />
        <span>{t(locale, "rep.categories.grant.searching")}</span>
      </output>
    );
  }

  if (!categories.length) {
    return null;
  }

  return (
    <div className="tw-flex tw-max-h-80 tw-flex-wrap tw-gap-2 tw-overflow-y-auto tw-p-1">
      {categories.map((category) => {
        const isMemesSubmissionCategory = category === MEMES_NOMINEE_CATEGORY;
        const isNonQualifyingLookalike = isMemesNomineeLookalike(category);
        let categoryAppearance =
          "tw-border-iron-700/60 tw-bg-transparent tw-text-iron-200 hover:tw-border-iron-600 hover:tw-bg-iron-800/60";
        if (isMemesSubmissionCategory) {
          categoryAppearance =
            "tw-border-emerald-500/30 tw-bg-emerald-500/10 tw-text-white hover:tw-border-emerald-500/50 hover:tw-bg-emerald-500/15";
        } else if (isNonQualifyingLookalike) {
          categoryAppearance =
            "tw-border-iron-700/60 tw-bg-transparent tw-text-iron-300 hover:tw-border-iron-600 hover:tw-bg-iron-800/60";
        }

        return (
          <button
            key={category}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRepSelect(category);
            }}
            className={`tw-flex tw-max-w-full tw-cursor-pointer tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-rounded-lg tw-border tw-border-solid tw-min-h-8 tw-px-2.5 tw-py-1 tw-text-left tw-text-xs tw-font-normal tw-leading-5 tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none ${categoryAppearance}`}
          >
            <span
              className={`tw-min-w-0 tw-max-w-full tw-break-words ${
                isMemesSubmissionCategory ? "tw-font-medium" : ""
              }`}
            >
              {category}
            </span>
            {isMemesSubmissionCategory && (
              <span className="tw-whitespace-nowrap tw-text-[11px] tw-font-normal tw-leading-5 tw-text-emerald-300">
                {t(locale, "rep.categories.grant.submissionBadge")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
