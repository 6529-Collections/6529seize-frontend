"use client";

import type { MemeSeason } from "@/entities/ISeason";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { useEffect, useMemo, useState } from "react";
import FilterGridDropdown from "./FilterGridDropdown";

interface MemeSeasonGridDropdownProps {
  readonly selected: MemeSeason | null;
  readonly setSelected: (season: MemeSeason | null) => void;
  readonly initialSeasonId?: number | null | undefined;
  readonly disabled?: boolean | undefined;
  readonly seasons?: readonly MemeSeason[] | undefined;
  readonly allSeasonsLabel?: string | undefined;
  readonly locale?: SupportedLocale | undefined;
}

export default function MemeSeasonGridDropdown({
  selected,
  setSelected,
  initialSeasonId,
  disabled = false,
  seasons,
  allSeasonsLabel,
  locale = DEFAULT_LOCALE,
}: MemeSeasonGridDropdownProps) {
  const [fetchedSeasons, setFetchedSeasons] = useState<MemeSeason[]>([]);

  useEffect(() => {
    if (seasons !== undefined) {
      // Drop any API-fetched list once the parent provides scoped seasons.
      setFetchedSeasons((currentSeasons) =>
        currentSeasons.length === 0 ? currentSeasons : []
      );
      return;
    }

    const abortController = new AbortController();
    commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
      signal: abortController.signal,
    })
      .then((response) => {
        setFetchedSeasons(response);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch meme seasons:", error);
      });
    return () => {
      abortController.abort();
    };
  }, [seasons]);

  const availableSeasons = seasons ?? fetchedSeasons;

  const activeSeasonId = selected?.id ?? initialSeasonId ?? null;
  const activeSeason = useMemo(
    () =>
      availableSeasons.find((season) => season.id === activeSeasonId) ?? null,
    [activeSeasonId, availableSeasons]
  );
  const seasonFilterLabel = t(locale, "theMemes.filters.season.label");
  const resolvedAllSeasonsLabel =
    allSeasonsLabel ?? t(locale, "theMemes.filters.season.all");
  const activeLabel = activeSeason?.display ?? resolvedAllSeasonsLabel;

  return (
    <FilterGridDropdown
      disabled={disabled}
      filterLabel={seasonFilterLabel}
      items={availableSeasons.map((season) => ({
        value: season.id,
        label: season.display,
      }))}
      onSelect={(seasonId) => {
        setSelected(
          availableSeasons.find((season) => season.id === seasonId) ?? null
        );
      }}
      selectedValue={activeSeasonId}
      allItemLabel={resolvedAllSeasonsLabel}
      triggerLabel={activeLabel}
      triggerAriaLabel={t(locale, "theMemes.filters.triggerAriaLabel", {
        filter: seasonFilterLabel,
        value: activeLabel,
      })}
    />
  );
}
