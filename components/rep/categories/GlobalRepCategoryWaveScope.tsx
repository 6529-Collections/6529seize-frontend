"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveRepCategory } from "@/generated/models/ApiWaveRepCategory";
import type { ApiWaveRepContributor } from "@/generated/models/ApiWaveRepContributor";
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

type ContributorRow = {
  readonly item: ApiWaveRepContributor;
  readonly rank: number;
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

function LoadingOutput({
  label,
  size,
  className,
}: {
  readonly label: string;
  readonly size: CircleLoaderSize;
  readonly className: string;
}) {
  return (
    <output aria-label={label} className={className}>
      <CircleLoader size={size} />
    </output>
  );
}

function WaveSearchResults({
  matches,
  onSelect,
}: {
  readonly matches: SidebarWave[];
  readonly onSelect: (wave: SidebarWave) => void;
}) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="tw-mt-4">
      <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
        Search results
      </p>
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
        {matches.map((wave) => (
          <li key={wave.id}>
            <WaveResultButton wave={wave} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function WaveSelectionPrompt() {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-p-5">
      <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
        Select a wave to inspect this category inside Wave REP.
      </p>
    </div>
  );
}

function SelectedWaveHeader({ wave }: { readonly wave: SelectedWave }) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
      <div className="tw-min-w-0">
        <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          Selected wave
        </p>
        <p className="tw-mb-0 tw-break-words tw-text-lg tw-font-semibold tw-text-white">
          {wave.name}
        </p>
      </div>
      <Link
        href={getWaveRoute({
          waveId: wave.id,
          isDirectMessage: wave.isDirectMessage,
          isApp: false,
        })}
        className="tw-text-primary-200 hover:tw-text-primary-100 tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/10 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-no-underline tw-transition-colors hover:tw-border-primary-300/60 hover:tw-bg-primary-500/15"
      >
        Open wave
      </Link>
    </div>
  );
}

function WaveCategorySummary({
  category,
  isPending,
  isError,
  data,
}: {
  readonly category: string;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly data: ApiWaveRepCategory | null | undefined;
}) {
  if (isPending) {
    return (
      <LoadingOutput
        label="Loading wave REP category"
        size={CircleLoaderSize.XXLARGE}
        className="tw-flex tw-justify-center tw-py-8"
      />
    );
  }

  if (isError) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-error">
        Could not load Wave REP category totals.
      </p>
    );
  }

  if (!data) {
    return (
      <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-p-5">
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
          This wave has no non-zero Wave REP for {category}.
        </p>
      </div>
    );
  }

  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3">
      <WaveMetric label="Wave category REP" value={data.total_rep} />
      <WaveMetric label="Contributors" value={data.contributor_count} />
      <WaveMetric
        label="Your contribution"
        value={data.authenticated_user_contribution ?? 0}
      />
    </div>
  );
}

function WaveContributorsTable({
  category,
  rows,
}: {
  readonly category: string;
  readonly rows: ContributorRow[];
}) {
  return (
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
          {rows.map(({ item, rank }) => (
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
  );
}

function WaveContributorsSection({
  category,
  isPending,
  isError,
  rows,
}: {
  readonly category: string;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly rows: ContributorRow[];
}) {
  if (isPending) {
    return (
      <LoadingOutput
        label="Loading wave REP contributors"
        size={CircleLoaderSize.LARGE}
        className="tw-flex tw-justify-center tw-py-6"
      />
    );
  }

  if (isError) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-error">
        Could not load Wave REP contributors.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
        No Wave REP contributors found for this category.
      </p>
    );
  }

  return <WaveContributorsTable category={category} rows={rows} />;
}

function WaveRepDetails({
  category,
  selectedWave,
  categoryStatus,
  contributorsStatus,
  contributorRows,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  readonly category: string;
  readonly selectedWave: SelectedWave;
  readonly categoryStatus: {
    readonly isPending: boolean;
    readonly isError: boolean;
    readonly data: ApiWaveRepCategory | null | undefined;
  };
  readonly contributorsStatus: {
    readonly isPending: boolean;
    readonly isError: boolean;
  };
  readonly contributorRows: ContributorRow[];
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onLoadMore: () => void;
}) {
  return (
    <section className="tw-flex tw-flex-col tw-gap-4">
      <SelectedWaveHeader wave={selectedWave} />
      <WaveCategorySummary
        category={category}
        isPending={categoryStatus.isPending}
        isError={categoryStatus.isError}
        data={categoryStatus.data}
      />
      <WaveContributorsSection
        category={category}
        isPending={contributorsStatus.isPending}
        isError={contributorsStatus.isError}
        rows={contributorRows}
      />
      {hasNextPage && (
        <button
          type="button"
          disabled={isFetchingNextPage}
          onClick={onLoadMore}
          className="tw-self-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.07] disabled:tw-cursor-default disabled:tw-opacity-70"
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </button>
      )}
    </section>
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
  const selectedWaveId = selectedWave?.id ?? null;

  const waveCategoryQuery = useQuery({
    queryKey: getWaveRepCategoryQueryKey({
      waveId: selectedWaveId ?? "no-wave-selected",
      category,
    }),
    queryFn: async () => {
      if (!selectedWaveId) {
        throw new Error("Select a wave before loading category REP.");
      }
      return await fetchWaveRepCategorySummary({
        waveId: selectedWaveId,
        category,
      });
    },
    enabled: selectedWaveId !== null,
  });

  const contributorsQuery = useInfiniteQuery({
    queryKey: getWaveRepCategoryContributorsQueryKey({
      waveId: selectedWaveId ?? "no-wave-selected",
      category,
    }),
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!selectedWaveId) {
        throw new Error("Select a wave before loading category contributors.");
      }
      return await fetchWaveRepCategoryContributors({
        waveId: selectedWaveId,
        category,
        page: pageParam,
      });
    },
    enabled: selectedWaveId !== null,
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

  const waveContent = selectedWave ? (
    <WaveRepDetails
      category={category}
      selectedWave={selectedWave}
      categoryStatus={{
        isPending: waveCategoryQuery.isPending,
        isError: waveCategoryQuery.isError,
        data: waveCategoryQuery.data,
      }}
      contributorsStatus={{
        isPending: contributorsQuery.isPending,
        isError: contributorsQuery.isError,
      }}
      contributorRows={contributorRows}
      hasNextPage={contributorsQuery.hasNextPage}
      isFetchingNextPage={contributorsQuery.isFetchingNextPage}
      onLoadMore={() => {
        contributorsQuery.fetchNextPage().catch(() => undefined);
      }}
    />
  ) : (
    <WaveSelectionPrompt />
  );

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

        {searchStatus === "results" && (
          <WaveSearchResults
            matches={matches}
            onSelect={(nextWave) =>
              selectWave(getSelectedWaveFromSidebarWave(nextWave))
            }
          />
        )}

        {searchError && (
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-error">
            {searchError}
          </p>
        )}
      </section>

      {waveContent}
    </div>
  );
}
