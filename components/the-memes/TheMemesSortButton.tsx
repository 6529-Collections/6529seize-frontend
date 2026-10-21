import FilterButton from "@/components/utils/button/FilterButton";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MemesSort } from "@/types/enums";
import { getMemesSortLabel } from "./theMemesI18n";

export default function TheMemesSortButton(
  props: Readonly<{
    currentSort: MemesSort;
    sort: MemesSort;
    locale: SupportedLocale;
    select: () => void;
  }>
) {
  const isActive = props.currentSort === props.sort;
  const label = getMemesSortLabel(props.sort, props.locale);

  return (
    <FilterButton
      selected={isActive}
      aria-pressed={isActive}
      aria-label={t(props.locale, "theMemes.sorting.sortButtonLabel", {
        sort: label,
      })}
      onClick={props.select}
      className={`tw-relative tw-m-0 tw-no-underline sm:tw-h-auto sm:tw-shrink sm:tw-rounded-none sm:tw-border-0 sm:tw-bg-transparent sm:tw-px-0.5 sm:tw-py-1 sm:tw-text-sm sm:tw-font-medium sm:tw-leading-5 sm:tw-shadow-none sm:after:tw-absolute sm:after:-tw-bottom-0.5 sm:after:tw-left-0 sm:after:tw-h-px sm:after:tw-w-full sm:after:tw-origin-left sm:after:tw-transition-transform sm:after:tw-duration-200 sm:after:tw-content-[''] sm:focus-visible:tw-outline-offset-0 sm:active:tw-bg-transparent sm:desktop-hover:hover:tw-bg-transparent ${
        isActive
          ? "sm:tw-text-white sm:after:tw-scale-x-100 sm:after:tw-bg-primary-400 sm:active:tw-text-white sm:desktop-hover:hover:tw-text-white"
          : "sm:tw-text-iron-500 sm:after:tw-scale-x-0 sm:after:tw-bg-iron-700 sm:hover:after:tw-scale-x-100 sm:desktop-hover:hover:tw-text-iron-200"
      }`}
    >
      {label}
    </FilterButton>
  );
}
