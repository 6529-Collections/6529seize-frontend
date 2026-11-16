import { isHelpBotCreditRepCategory } from "@/components/utils/input/rep-category/repCategoryConstants";
import type { RatingStats } from "@/entities/IProfile";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useMemo } from "react";

export default function GrantRepCategorySuggestions({
  ratings,
  search,
  disabled,
  onSelect,
  selectedCategory,
  total,
}: {
  readonly ratings: readonly RatingStats[] | undefined;
  readonly search: string;
  readonly disabled: boolean;
  readonly onSelect: (category: string) => void;
  readonly selectedCategory: string | null;
  readonly total: number;
}) {
  const locale = useBrowserLocale();
  const assigned = useMemo(
    () =>
      ratings?.filter(
        (item) =>
          item.rater_contribution !== 0 &&
          !isHelpBotCreditRepCategory(item.category)
      ),
    [ratings]
  );
  const normalizedSearch = selectedCategory
    ? ""
    : search.trim().toLocaleLowerCase(locale);
  const matches = assigned?.filter((item) =>
    item.category.toLocaleLowerCase(locale).includes(normalizedSearch)
  );
  if (!ratings)
    return (
      <output className="tw-mt-4 tw-block tw-h-[108px] tw-text-xs tw-text-iron-400">
        {t(locale, "user.rate.loading")}
      </output>
    );
  if (!assigned || assigned.length === 0) return null;
  return (
    <fieldset
      aria-label={t(locale, "rep.categories.grant.youAssigned")}
      className="tw-m-0 tw-mt-4 tw-min-w-0 tw-border-0 tw-p-0"
    >
      <legend className="tw-mb-2 tw-p-0">
        <span className="tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
          {t(locale, "rep.categories.grant.youAssigned")}
        </span>
        <span className="tw-ml-2 tw-text-sm tw-font-medium tw-text-iron-300">
          {formatInteger(locale, total)}
        </span>
      </legend>
      <div className="tw-flex tw-h-[88px] tw-flex-wrap tw-content-start tw-gap-2 tw-overflow-y-auto tw-p-0.5">
        {matches?.map((item) => (
          <button
            key={item.category}
            type="button"
            disabled={disabled}
            aria-pressed={selectedCategory === item.category}
            onClick={() => onSelect(item.category)}
            className={`tw-group tw-inline-flex tw-h-[38px] tw-max-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-[13px] tw-text-left tw-text-sm tw-font-medium tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50 motion-reduce:tw-transition-none ${selectedCategory === item.category ? "tw-border-white/30 tw-bg-white/10 tw-text-iron-50" : "tw-border-white/[0.06] tw-bg-white/5 tw-text-iron-100 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-white/[0.085]"}`}
          >
            <span className="tw-min-w-0 tw-truncate">{item.category}</span>
            <span className="tw-shrink-0 tw-text-iron-400 tw-transition-colors desktop-hover:group-hover:tw-text-iron-300">
              {formatInteger(locale, item.rater_contribution)}
            </span>
          </button>
        ))}
        {matches?.length === 0 && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-500">
            {t(locale, "rep.categories.grant.noMatchingChoices")}
          </p>
        )}
      </div>
    </fieldset>
  );
}
