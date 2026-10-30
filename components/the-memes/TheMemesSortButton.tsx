import FilterButton from "@/components/utils/button/FilterButton";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MemesSort } from "@/types/enums";
import { getMemesSortLabel } from "./theMemesI18n";
import { getMemesSortButtonClasses } from "./theMemesSortStyles";

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
      className={getMemesSortButtonClasses(isActive)}
    >
      {label}
    </FilterButton>
  );
}
