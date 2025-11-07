"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  fetchXtdhTokenContributors,
  fetchXtdhTokens,
} from "@/services/api/xtdh";
import type { XtdhToken } from "@/types/xtdh";

const TOKENS_PAGE_SIZE = 25;

export type XtdhReceivedScope =
  | { readonly kind: "ecosystem" }
  | { readonly kind: "identity"; readonly identity: string | null };

export interface XtdhReceivedSectionProps {
  readonly scope: XtdhReceivedScope;
  readonly description?: string;
}

export default function XtdhReceivedSection({
  scope,
  description =
    "View NFTs that currently receive xTDH grants. Data comes directly from the public API.",
}: XtdhReceivedSectionProps) {
  const [expandedTokenKey, setExpandedTokenKey] = useState<string | null>(null);

  const scopeKey =
    scope.kind === "ecosystem"
      ? "ecosystem"
      : scope.identity?.toLowerCase() ?? "identity:unknown";

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [QueryKey.XTDH_TOKENS, scopeKey, TOKENS_PAGE_SIZE],
    initialPageParam: 1,
    enabled: scope.kind === "ecosystem" || Boolean(scope.identity),
    queryFn: async ({ pageParam }) =>
      await fetchXtdhTokens({
        page: typeof pageParam === "number" ? pageParam : 1,
        pageSize: TOKENS_PAGE_SIZE,
        grantee: scope.kind === "identity" ? scope.identity ?? undefined : undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    refetchOnWindowFocus: false,
  });

  const tokens = useMemo(() => {
    if (!data?.pages?.length) {
      return [] as XtdhToken[];
    }
    return data.pages.flatMap((page) => page.tokens);
  }, [data]);

  const handleToggle = (tokenKey: string) => {
    setExpandedTokenKey((previous) => (previous === tokenKey ? null : tokenKey));
  };

  if (scope.kind === "identity" && !scope.identity) {
    return (
      <section className="tailwind-scope tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-5 tw-text-iron-50">
        <h2 className="tw-mb-2 tw-text-lg tw-font-semibold">xTDH Grants</h2>
        <p className="tw-text-sm tw-text-iron-300">
          Connect a profile to view NFTs that receive xTDH on your behalf.
        </p>
      </section>
    );
  }

  return (
    <section className="tailwind-scope tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-5 tw-text-iron-50">
      <div className="tw-mb-4">
        <h2 className="tw-mb-1 tw-text-lg tw-font-semibold">xTDH Grants</h2>
        <p className="tw-text-sm tw-text-iron-300">{description}</p>
      </div>

      {isLoading ? (
        <Placeholder message="Loading xTDH data…" />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Unable to load xTDH data"}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : tokens.length === 0 ? (
        <Placeholder message="No xTDH grants were found." />
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-3">
          <ul className="tw-flex tw-flex-col tw-gap-3" role="list">
            {tokens.map((token) => {
              const tokenKey = `${token.contract}:${token.tokenId}`;
              const expanded = expandedTokenKey === tokenKey;

              return (
                <li key={tokenKey} className="tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-shadow-sm">
                  <button
                    type="button"
                    className="tw-flex tw-w-full tw-flex-col tw-gap-2 tw-rounded-xl tw-p-4 tw-text-left hover:tw-bg-iron-900 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500"
                    onClick={() => handleToggle(tokenKey)}
                    aria-expanded={expanded}
                  >
                    <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between">
                      <div>
                        <p className="tw-text-xs tw-uppercase tw-text-iron-400">Contract</p>
                        <p className="tw-font-mono tw-text-sm tw-text-white">{token.contract}</p>
                        <p className="tw-text-xs tw-uppercase tw-text-iron-400 tw-mt-2">Token ID</p>
                        <p className="tw-font-semibold tw-text-iron-50">{token.tokenId}</p>
                      </div>
                      <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-4 md:tw-mt-0">
                        <Metric label="xTDH Rate" value={`${formatNumber(token.xtdhRate)} / day`} />
                        <Metric label="Total xTDH" value={formatNumber(token.xtdhTotal)} />
                        <Metric
                          label="Top Grantor"
                          value={token.topGrantor?.handle ?? token.topGrantor?.id ?? "—"}
                        />
                        <Metric label="Details" value={expanded ? "Hide" : "Show"} />
                      </div>
                    </div>
                  </button>
                  {expanded ? (
                    <div className="tw-border-t tw-border-iron-800 tw-bg-iron-975 tw-p-4">
                      <TokenContributors contract={token.contract} tokenId={token.tokenId} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {hasNextPage ? (
            <button
              type="button"
              className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-50 hover:tw-bg-iron-900 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500"
              onClick={() => {
                void fetchNextPage();
              }}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

interface MetricProps {
  readonly label: string;
  readonly value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div>
      <p className="tw-text-xs tw-uppercase tw-text-iron-400">{label}</p>
      <p className="tw-font-semibold tw-text-iron-50">{value}</p>
    </div>
  );
}

interface PlaceholderProps {
  readonly message: string;
}

function Placeholder({ message }: PlaceholderProps) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-iron-800 tw-bg-iron-975 tw-p-6 tw-text-center tw-text-sm tw-text-iron-200">
      {message}
    </div>
  );
}

interface ErrorStateProps {
  readonly message: string;
  readonly onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-red-600/60 tw-bg-red-950/40 tw-p-6 tw-text-center">
      <p className="tw-text-sm tw-text-red-100">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="tw-mt-3 tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-red-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-red-400 focus-visible:tw-ring-2 focus-visible:tw-ring-red-300"
      >
        Retry
      </button>
    </div>
  );
}

interface TokenContributorsProps {
  readonly contract: string;
  readonly tokenId: string;
}

function TokenContributors({ contract, tokenId }: TokenContributorsProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [QueryKey.XTDH_TOKEN_CONTRIBUTORS, contract, tokenId],
    queryFn: async () => await fetchXtdhTokenContributors(contract, tokenId),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <Placeholder message="Loading contributors…" />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load contributors"}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!data || data.length === 0) {
    return <Placeholder message="No contributors available." />;
  }

  return (
    <ul className="tw-flex tw-flex-col tw-gap-2" role="list">
      {data.map((contributor, index) => (
        <li key={`${contributor.grantor?.id ?? index}-${contributor.xtdhRate}`} className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-bg-iron-900 tw-px-3 tw-py-2">
          <div>
            <p className="tw-text-sm tw-font-semibold tw-text-iron-50">
              {contributor.grantor?.handle ?? contributor.grantor?.id ?? "Unknown"}
            </p>
            <p className="tw-text-xs tw-text-iron-400">Contributes {formatNumber(contributor.xtdhRate)} / day</p>
          </div>
          <p className="tw-font-mono tw-text-sm tw-text-iron-200">
            Total {formatNumber(contributor.xtdhTotal)} xTDH
          </p>
        </li>
      ))}
    </ul>
  );
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatNumber(value: number): string {
  return numberFormatter.format(value ?? 0);
}
