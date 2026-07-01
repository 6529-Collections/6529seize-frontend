"use client";

import type { MemeSeason } from "@/entities/ISeason";
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
}

export default function MemeSeasonGridDropdown({
  selected,
  setSelected,
  initialSeasonId,
  disabled = false,
  seasons,
  allSeasonsLabel = "All Seasons",
}: MemeSeasonGridDropdownProps) {
  const [fetchedSeasons, setFetchedSeasons] = useState<MemeSeason[]>([]);

  useEffect(() => {
    if (seasons !== undefined) {
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

  return (
    <FilterGridDropdown
      ariaLabel="Season"
      disabled={disabled}
      filterLabel="Season"
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
      allItemLabel={allSeasonsLabel}
      triggerLabel={activeSeason?.display ?? allSeasonsLabel}
    />
  );
}
