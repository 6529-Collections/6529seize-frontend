import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  isMemesNomineeLookalike,
  MEMES_NOMINEE_CATEGORY,
} from "@/helpers/waves/memes-nomination";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { RepSearchState } from "./rep-search-types";

function CategoryName({
  category,
  search,
}: {
  readonly category: string;
  readonly search: string;
}) {
  const query = search.normalize("NFKC").toLowerCase().replace(/\s/gu, "");
  if (!query) return category;

  let normalized = "";
  let offset = 0;
  const positions: { start: number; end: number }[] = [];
  for (const character of category) {
    const part = character.normalize("NFKC").toLowerCase().replace(/\s/gu, "");
    normalized += part;
    for (let index = 0; index < part.length; index++) {
      positions.push({ start: offset, end: offset + character.length });
    }
    offset += character.length;
  }

  const match = normalized.indexOf(query);
  const start = positions[match]?.start;
  const end = positions[match + query.length - 1]?.end;
  if (start === undefined || end === undefined) return category;

  return (
    <>
      {category.slice(0, start)}
      <span className="tw-opacity-80 md:tw-opacity-100">
        {category.slice(start, end)}
      </span>
      {category.slice(end)}
    </>
  );
}

export default function UserPageRepNewRepSearchDropdown({
  categories,
  onRepSelect,
  state,
  minSearchLength,
  maxSearchLength,
  search = "",
  activeIndex = 0,
  optionIdPrefix = "rep-category-option-",
}: {
  readonly categories: string[];
  readonly onRepSelect: (rep: string) => void;
  readonly state: RepSearchState;
  readonly minSearchLength: number;
  readonly maxSearchLength: number;
  readonly search?: string;
  readonly activeIndex?: number;
  readonly optionIdPrefix?: string;
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
    <div className="tw-flex tw-flex-col tw-gap-2 tw-p-1 md:tw-flex-row md:tw-flex-wrap">
      {categories.map((category, index) => {
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

        // Safari can blur the search before the suggestion click fires.
        return (
          <button
            key={category}
            type="button"
            role="option"
            id={`${optionIdPrefix}${index}`}
            aria-label={
              isMemesSubmissionCategory
                ? `${category} ${t(locale, "rep.categories.grant.submissionBadge")}`
                : category
            }
            aria-selected={activeIndex === index}
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              onRepSelect(category);
            }}
            className={`tw-flex tw-min-h-12 tw-w-full tw-max-w-full tw-cursor-pointer tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-0 tw-rounded-lg tw-border tw-border-solid tw-px-2.5 tw-py-0.5 tw-text-left tw-text-sm tw-font-normal tw-leading-5 tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none md:tw-min-h-8 md:tw-w-auto md:tw-gap-y-1 md:tw-py-1 md:tw-text-xs ${activeIndex === index ? "tw-ring-1 tw-ring-inset tw-ring-primary-400 forced-colors:tw-outline forced-colors:tw-outline-2 forced-colors:-tw-outline-offset-2 forced-colors:tw-outline-[Highlight]" : ""} ${categoryAppearance}`}
          >
            <span
              className={`tw-min-w-0 tw-max-w-full tw-break-words ${
                isMemesSubmissionCategory
                  ? "tw-font-medium tw-text-emerald-400"
                  : ""
              }`}
            >
              <CategoryName category={category} search={search} />
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
