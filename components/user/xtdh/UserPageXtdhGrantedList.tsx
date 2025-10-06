"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import { parseTokenExpressionToRanges } from "@/components/nft-picker/NftPicker.utils";

const formatTargetTokens = (tokens: readonly string[]): string => {
  if (!tokens.length) {
    return "All tokens";
  }

  try {
    const ranges = parseTokenExpressionToRanges(tokens.join(","));
    if (!ranges.length) {
      return "All tokens";
    }

    return ranges
      .map((range) => {
        const start = range.start.toString();
        const end = range.end.toString();
        return range.start === range.end ? start : `${start}-${end}`;
      })
      .join(", ");
  } catch (error) {
    return tokens.join(", ");
  }
};

const formatDateTime = (timestampSeconds: number | null) => {
  if (!timestampSeconds || timestampSeconds <= 0) {
    return "No expiry";
  }

  const date = new Date(timestampSeconds * 1000);
  if (!Number.isFinite(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatAmount = (value: number) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
  }).format(value);

export interface UserPageXtdhGrantedListProps {
  readonly grantor: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly isSelf?: boolean;
}

export default function UserPageXtdhGrantedList({
  grantor,
  page = 1,
  pageSize = 25,
  isSelf = false,
}: Readonly<UserPageXtdhGrantedListProps>) {
  const enabled = Boolean(grantor);
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [QueryKey.TDH_GRANTS, grantor, page, pageSize],
    queryFn: async () =>
      await commonApiFetch<ApiTdhGrantsPage>({
        endpoint: "tdh-grants",
        params: {
          grantor,
          page,
          page_size: pageSize,
        },
      }),
    enabled,
    staleTime: 30_000,
  });

  const grants = useMemo(() => data?.data ?? [], [data]);

  let content: ReactNode;

  if (!enabled) {
    content = (
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">
        Unable to load TDH grants for this profile.
      </p>
    );
  } else if (isLoading) {
    content = (
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">Loading granted xTDH…</p>
    );
  } else if (isError) {
    const message =
      error instanceof Error ? error.message : "Failed to load granted xTDH.";
    content = (
      <div className="tw-flex tw-flex-col tw-gap-2">
        <p className="tw-text-sm tw-text-red-400 tw-m-0" role="alert">
          {message}
        </p>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="tw-self-start tw-rounded tw-bg-primary-500 tw-text-black tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold hover:tw-bg-primary-400">
          Retry
        </button>
      </div>
    );
  } else if (grants.length === 0) {
    content = (
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">
        {isSelf
          ? "You haven't granted any xTDH yet."
          : "This identity hasn't granted any xTDH yet."}
      </p>
    );
  } else {
    content = (
      <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
        {grants.map((grant) => {
          const tokensLabel = formatTargetTokens(grant.target_tokens);

          return (
            <li
              key={grant.id}
              className="tw-list-none tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-space-y-2">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
                <h3 className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-m-0">
                  {grant.target_contract}
                </h3>
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-200">
                  {grant.status}
                </span>
              </div>
              <p className="tw-text-xs tw-text-iron-300 tw-m-0">
                Tokens: {tokensLabel}
              </p>
              <div className="tw-flex tw-flex-wrap tw-gap-4 tw-text-xs tw-text-iron-200">
                <span>TDH rate: {formatAmount(grant.tdh_rate)}</span>
                <span>
                  Valid until: {formatDateTime(grant.valid_to ?? null)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4 tw-space-y-4">
      <div className="tw-flex tw-items-center">
        <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
          Granted xTDH
        </h2>
      </div>
      {content}
    </div>
  );
}
