"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { fetchWaveById, searchWavesByName } from "@/services/api/waves-v2-api";
import type { SidebarWave } from "@/types/waves.types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import {
  fetchWaveRepCategoryContributors,
  fetchWaveRepCategorySummary,
  getWaveRepCategoryContributorsQueryKey,
  getWaveRepCategoryQueryKey,
} from "./globalRepCategory.api";
import {
  GLOBAL_REP_CATEGORY_PAGE_SIZE,
  getProfileDisplay,
  getProfileHref,
} from "./globalRepCategory.helpers";
import { parseWaveIdFromRepCategoryInput } from "./waveSearch.helpers";

type SearchStatus = "idle" | "loading" | "error" | "results";

type SelectedWave = {
  readonly id: string;
  readonly name: string;
  readonly isDirectMessage: boolean;
};

function getSelectedWaveFromApiWave(wave: ApiWave): SelectedWave {
  return {
    id: wave.id,
    name: wave.name,
    isDirectMessage:
      wave.wave.type === ApiWaveType.Chat &&
      Boolean(wave.chat?.scope?.group?.is_direct_message),
  };
}

function getSelectedWaveFromSidebarWave(wave: SidebarWave): SelectedWave {
  return {
    id: wave.id,
    name: wave.name,
    isDirectMessage: wave.isDirectMessage,
  };
}

function WaveResultButton({
  wave,
  onSelect,
}: {
  readonly wave: SidebarWave;
  readonly onSelect: (wave: SidebarWave) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(wave)}
      className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-3 tw-py-2.5 tw-text-left tw-transition-colors hover:tw-border-primary-400/40 hover:tw-bg-primary-500/10"
    >
      <span className="tw-min-w-0">
        <span className="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-white">
          {wave.name}
        </span>
        <span className="tw-block tw-truncate tw-text-xs tw-text-iron-500">
          {wave.id}
        </span>
      </span>
      <span className="tw-flex-shrink-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
        Select
      </span>
    </button>
  );
}

function WaveMetric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-px-4 tw-py-3">
      <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </p>
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-primary-300">
        {formatNumberWithCommas(value)}
      </p>
    </div>
  );
}

export default function GlobalRepCategoryWaveScope({
  category,
}: {
  readonly category: string;
}) {
  const [input, setInput] = useState("");
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [matches, setMatches] = useState<SidebarWave[]>([]);
  const [selectedWave, setSelectedWave] = useState<SelectedWave | null>(null);

  const waveCategoryQuery = useQuery({
    queryKey: selectedWave
      ? getWaveRepCategoryQueryKey({ waveId: selectedWave.id, category })
      : ["disabled-wave-rep-category", category],
    queryFn: async () =>
      await fetchWaveRepCategorySummary({
        waveId: selectedWave?.id ?? "",
        category,
      }),
    enabled: selectedWave !== null,
  });

  const contributorsQuery = useInfiniteQuery({
    queryKey: selectedWave
      ? getWaveRepCategoryContributorsQueryKey({
          waveId: selectedWave.id,
          category,
        })
      : ["disabled-wave-rep-category-contributors", category],
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await fetchWaveRepCategoryContributors({
        waveId: selectedWave?.id ?? "",
        category,
        page: pageParam,
      }),
    enabled: selectedWave !== null,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
  });

  const contributorRows = useMemo(
    () =>
      contributorsQuery.data?.pages.flatMap((page) =>
        page.data.map((item, index) => ({
          item,
          rank: (page.page - 1) * GLOBAL_REP_CATEGORY_PAGE_SIZE + index + 1,
        }))
      ) ?? [],
    [contributorsQuery.data?.pages]
  );

  const selectWave = (wave: SelectedWave) => {
    setSelectedWave(wave);
    setMatches([]);
    setSearchStatus("idle");
    setSearchError(null);
    setInput(wave.name);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput.length < 2) {
      setSearchStatus("error");
      setSearchError("Enter a wave name, id, or URL.");
      setMatches([]);
      return;
    }

    setSearchStatus("loading");
    setSearchError(null);
    setMatches([]);

    const waveId = parseWaveIdFromRepCategoryInput(trimmedInput);
    if (waveId) {
      try {
        const wave = await fetchWaveById({ waveId });
        selectWave(getSelectedWaveFromApiWave(wave));
      } catch (error) {
        setSearchStatus("error");
        setSearchError(
          error instanceof Error ? error.message : "Could not load that wave."
        );
      }
      return;
    }

    try {
      const searchMatches = await searchWavesByName({
        name: trimmedInput,
        pageSize: 5,
      });
      setMatches(searchMatches);
      setSearchStatus("results");
      if (searchMatches.length === 0) {
        setSearchError("No matching waves found.");
      }
    } catch (error) {
      setSearchStatus("error");
      setSearchError(
        error instanceof Error ? error.message : "Could not search waves."
      );
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-5">
      <section className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-p-4">
        <form
          onSubmit={(event) => {
            handleSubmit(event).catch(() => undefined);
          }}
          className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row"
        >
          <label className="tw-sr-only" htmlFor="wave-rep-wave-search">
            Search wave for REP analytics
          </label>
          <input
            id="wave-rep-wave-search"
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="tw-form-input tw-block tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-base tw-font-medium tw-text-white tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 sm:tw-text-sm"
            placeholder="Search wave by name, URL, or id"
          />
          <button
            type="submit"
            disabled={searchStatus === "loading"}
            className="tw-text-primary-100 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/10 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-transition-colors hover:tw-border-primary-300/60 hover:tw-bg-primary-500/15 disabled:tw-cursor-wait disabled:tw-opacity-70"
          >
            {searchStatus === "loading" ? "Searching..." : "Search"}
          </button>
        </form>

        {searchStatus === "results" && matches.length > 0 && (
          <div className="tw-mt-4">
            <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
              Search results
            </p>
            <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
              {matches.map((wave) => (
                <li key={wave.id}>
                  <WaveResultButton
                    wave={wave}
                    onSelect={(nextWave) =>
                      selectWave(getSelectedWaveFromSidebarWave(nextWave))
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {searchError && (
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-error">
            {searchError}
          </p>
        )}
      </section>

      {!selectedWave ? (
        <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-p-5">
          <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
            Select a wave to inspect this category inside Wave REP.
          </p>
        </div>
      ) : (
        <section className="tw-flex tw-flex-col tw-gap-4">
          <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
            <div className="tw-min-w-0">
              <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
                Selected wave
              </p>
              <p className="tw-mb-0 tw-break-words tw-text-lg tw-font-semibold tw-text-white">
                {selectedWave.name}
              </p>
            </div>
            <Link
              href={getWaveRoute({
                waveId: selectedWave.id,
                isDirectMessage: selectedWave.isDirectMessage,
                isApp: false,
              })}
              className="tw-text-primary-200 hover:tw-text-primary-100 tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/10 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-no-underline tw-transition-colors hover:tw-border-primary-300/60 hover:tw-bg-primary-500/15"
            >
              Open wave
            </Link>
          </div>

          {waveCategoryQuery.isPending ? (
            <div
              role="status"
              aria-label="Loading wave REP category"
              className="tw-flex tw-justify-center tw-py-8"
            >
              <CircleLoader size={CircleLoaderSize.XXLARGE} />
            </div>
          ) : waveCategoryQuery.isError ? (
            <p className="tw-mb-0 tw-text-sm tw-text-error">
              Could not load Wave REP category totals.
            </p>
          ) : waveCategoryQuery.data ? (
            <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3">
              <WaveMetric
                label="Wave category REP"
                value={waveCategoryQuery.data.total_rep}
              />
              <WaveMetric
                label="Contributors"
                value={waveCategoryQuery.data.contributor_count}
              />
              <WaveMetric
                label="Your contribution"
                value={
                  waveCategoryQuery.data.authenticated_user_contribution ?? 0
                }
              />
            </div>
          ) : (
            <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-p-5">
              <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                This wave has no non-zero Wave REP for {category}.
              </p>
            </div>
          )}

          {contributorsQuery.isPending ? (
            <div
              role="status"
              aria-label="Loading wave REP contributors"
              className="tw-flex tw-justify-center tw-py-6"
            >
              <CircleLoader size={CircleLoaderSize.LARGE} />
            </div>
          ) : contributorsQuery.isError ? (
            <p className="tw-mb-0 tw-text-sm tw-text-error">
              Could not load Wave REP contributors.
            </p>
          ) : contributorRows.length === 0 ? (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              No Wave REP contributors found for this category.
            </p>
          ) : (
            <div className="tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08]">
              <table className="tw-w-full tw-min-w-[34rem] tw-border-collapse tw-bg-white/[0.02] tw-text-left">
                <caption className="tw-sr-only">
                  Wave REP contributors for {category}
                </caption>
                <thead className="tw-bg-white/[0.04] tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
                  <tr>
                    <th scope="col" className="tw-w-16 tw-px-4 tw-py-3">
                      Rank
                    </th>
                    <th scope="col" className="tw-px-4 tw-py-3">
                      Contributor
                    </th>
                    <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
                      REP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contributorRows.map(({ item, rank }) => (
                    <tr
                      key={`${rank}-${item.profile.id}`}
                      className="tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/5 last:tw-border-b-0"
                    >
                      <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-iron-500">
                        {rank}
                      </td>
                      <td className="tw-px-4 tw-py-3">
                        <Link
                          href={getProfileHref(item.profile)}
                          className="hover:tw-text-primary-200 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline"
                        >
                          {getProfileDisplay(item.profile)}
                        </Link>
                      </td>
                      <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-semibold tw-text-iron-100">
                        {formatNumberWithCommas(item.contribution)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {contributorsQuery.hasNextPage && (
            <button
              type="button"
              disabled={contributorsQuery.isFetchingNextPage}
              onClick={() => {
                contributorsQuery.fetchNextPage().catch(() => undefined);
              }}
              className="tw-self-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.07] disabled:tw-cursor-default disabled:tw-opacity-70"
            >
              {contributorsQuery.isFetchingNextPage
                ? "Loading..."
                : "Load more"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
