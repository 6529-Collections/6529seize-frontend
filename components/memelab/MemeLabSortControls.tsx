"use client";

import CollectionSortControls from "@/components/collection-page/CollectionSortControls";
import { printVolumeTypeDropdown } from "@/components/the-memes/TheMemes";
import { VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MemeLabSort } from "@/types/enums";
import { getMemeLabSortLabel } from "./memeLabI18n";

export default function MemeLabSortControls({
  ariaLabel,
  sortDirection,
  setSortDirection,
  currentSort,
  sortOptions,
  setSort,
  setVolumeType,
  volumeType,
  locale,
}: {
  readonly ariaLabel: string;
  readonly sortDirection: SortDirection | undefined;
  readonly setSortDirection: (direction: SortDirection) => void;
  readonly currentSort: MemeLabSort;
  readonly sortOptions: readonly MemeLabSort[];
  readonly setSort: (sort: MemeLabSort) => void;
  readonly setVolumeType: (volumeType: VolumeType) => void;
  readonly volumeType: VolumeType;
  readonly locale: SupportedLocale;
}) {
  return (
    <CollectionSortControls
      ariaLabel={ariaLabel}
      sortDirection={sortDirection}
      setSortDirection={setSortDirection}
      currentSort={currentSort}
      sortOptions={sortOptions}
      setSort={setSort}
      getSortLabel={(sortOption) => getMemeLabSortLabel(sortOption, locale)}
      getSortButtonAriaLabel={(sortOption) =>
        t(locale, "memeLab.sorting.sortButtonLabel", {
          sort: getMemeLabSortLabel(sortOption, locale),
        })
      }
      sortByLabel={t(locale, "memeLab.sorting.sortBy")}
      directionLegend={t(locale, "memeLab.sorting.directionLegend")}
      ascendingLabel={t(locale, "memeLab.sorting.ascendingLabel")}
      descendingLabel={t(locale, "memeLab.sorting.descendingLabel")}
    >
      {printVolumeTypeDropdown(
        currentSort === MemeLabSort.VOLUME,
        setVolumeType,
        () => setSort(MemeLabSort.VOLUME),
        volumeType,
        locale
      )}
    </CollectionSortControls>
  );
}
