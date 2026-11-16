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
}: {
  readonly ratings: readonly RatingStats[] | undefined;
  readonly search: string;
  readonly disabled: boolean;
  readonly onSelect: (category: string) => void;
}) {
  const locale = useBrowserLocale();
  const groups = useMemo(() => {
    const available = ratings?.filter(
      (item) => !isHelpBotCreditRepCategory(item.category)
    );
    const normalizedSearch = search.trim().toLocaleLowerCase(locale);
    const matches = (item: RatingStats) =>
      item.category.toLocaleLowerCase(locale).includes(normalizedSearch);
    return [
      {
        key: "youAssigned",
        items: available?.filter(
          (item) => item.rater_contribution !== 0 && matches(item)
        ),
      },
      {
        key: "onProfile",
        items: available
          ?.filter((item) => item.rater_contribution === 0 && matches(item))
          .toSorted((a, b) => b.rating - a.rating)
          .slice(0, 6),
      },
    ] as const;
  }, [ratings, search, locale]);
  if (!ratings)
    return (
      <output className="tw-mt-3 tw-block tw-text-xs tw-text-iron-400">
        {t(locale, "user.rate.loading")}
      </output>
    );
  return (
    <div className="tw-mt-4 tw-space-y-4">
      {groups.map(({ key, items }) => (
        <fieldset key={key} className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
          <legend className="tw-mb-2 tw-p-0 tw-text-xs tw-font-medium tw-text-iron-400">
            {t(locale, `rep.categories.grant.${key}`)}
          </legend>
          <div className="tw-flex tw-max-h-32 tw-flex-wrap tw-gap-2 tw-overflow-y-auto tw-p-0.5">
            {items?.map((item) => (
              <button
                key={item.category}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(item.category)}
                className="tw-inline-flex tw-min-h-9 tw-max-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700/60 tw-bg-iron-900/60 tw-px-2.5 tw-py-1 tw-text-left tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-200 tw-transition-colors hover:tw-border-iron-600 hover:tw-bg-iron-800/60 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50 motion-reduce:tw-transition-none"
              >
                <span className="tw-min-w-0 tw-break-words">
                  {item.category}
                </span>
                {key === "youAssigned" && (
                  <span className="tw-shrink-0 tw-font-medium">
                    {formatInteger(locale, item.rater_contribution)}
                  </span>
                )}
              </button>
            ))}
            {items?.length === 0 && (
              <p className="tw-m-0 tw-text-xs tw-text-iron-500">
                {t(
                  locale,
                  search.trim()
                    ? "rep.categories.grant.noMatchingChoices"
                    : `rep.categories.grant.${key}Empty`
                )}
              </p>
            )}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
