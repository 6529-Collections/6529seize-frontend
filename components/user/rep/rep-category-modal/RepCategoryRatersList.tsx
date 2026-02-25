"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { Page } from "@/helpers/Types";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import Link from "next/link";
import { useState } from "react";

const PAGE_SIZE = 5;
const STALE_TIME = 5 * 60 * 1000;

export default function RepCategoryRatersList({
  handleOrWallet,
  category,
}: {
  readonly handleOrWallet: string;
  readonly category: string;
}) {
  const [page, setPage] = useState(1);

  const { data: ratersPage, isLoading } = useQuery<
    Page<RatingWithProfileInfoAndLevel>
  >({
    queryKey: [
      QueryKey.PROFILE_RATERS,
      {
        handleOrWallet: handleOrWallet.toLowerCase(),
        category,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<RatingWithProfileInfoAndLevel>>({
        endpoint: `profiles/${handleOrWallet}/rep/ratings/by-rater`,
        params: {
          category,
          page: `${page}`,
          page_size: `${PAGE_SIZE}`,
          order: "desc",
          order_by: "rating",
          given: "false",
        },
      }),
    enabled: !!handleOrWallet,
    staleTime: STALE_TIME,
  });

  const raterHandles =
    ratersPage?.data.map((r) => r.handle).filter(Boolean) ?? [];

  const identityQueries = useQueries({
    queries: raterHandles.map((handle) => ({
      queryKey: [QueryKey.PROFILE, handle.toLowerCase()],
      queryFn: async () =>
        await commonApiFetch<ApiIdentity>({
          endpoint: `identities/${handle.toLowerCase()}`,
        }),
      enabled: !!handle,
      staleTime: STALE_TIME,
    })),
  });

  const identityByHandle = new Map<string, ApiIdentity>();
  for (const q of identityQueries) {
    if (q.data) {
      const key =
        q.data.handle?.toLowerCase() ??
        q.data.primary_wallet?.toLowerCase() ??
        "";
      if (key) identityByHandle.set(key, q.data);
    }
  }

  const totalPages =
    ratersPage && ratersPage.count > 0
      ? Math.ceil(ratersPage.count / PAGE_SIZE)
      : null;

  if (isLoading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-py-10">
        <div className="tw-flex tw-items-center tw-gap-3 tw-text-sm tw-text-iron-400">
          <svg
            className="tw-h-5 tw-w-5 tw-animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="tw-opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="tw-opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading raters...
        </div>
      </div>
    );
  }

  if (!ratersPage?.data.length) {
    return (
      <div className="tw-py-10 tw-text-center tw-text-sm tw-text-iron-500">
        No raters found for this category.
      </div>
    );
  }

  return (
    <div>
      <div className="tw-flex tw-flex-col tw-divide-y tw-divide-solid tw-divide-iron-800/60 tw-divide-x-0">
        {ratersPage.data.map((rater) => {
          const identity = identityByHandle.get(rater.handle.toLowerCase());
          return (
            <RaterRow
              key={rater.handle}
              rater={rater}
              identity={identity ?? null}
            />
          );
        })}
      </div>
      {totalPages !== null && totalPages > 1 && (
        <CommonTablePagination
          small={true}
          currentPage={page}
          setCurrentPage={setPage}
          totalPages={totalPages}
          haveNextPage={ratersPage.next}
          loading={isLoading}
        />
      )}
    </div>
  );
}

function RaterRow({
  rater,
  identity,
}: {
  readonly rater: RatingWithProfileInfoAndLevel;
  readonly identity: ApiIdentity | null;
}) {
  const pfpUrl = identity?.pfp ?? null;
  const displayHandle = rater.handle;
  const profileLink = `/${rater.handle}`;

  return (
    <Link
      href={profileLink}
      className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-px-1 tw-py-3 tw-no-underline tw-transition-colors hover:tw-bg-iron-800/40 tw-rounded-lg"
    >
      <div className="tw-flex tw-items-center tw-gap-3 tw-min-w-0">
        <ProfileAvatar
          pfpUrl={pfpUrl}
          alt={displayHandle}
          size={ProfileBadgeSize.SMALL}
        />
        <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
          <span className="tw-truncate tw-text-sm tw-font-medium tw-text-iron-100">
            {displayHandle}
          </span>
          <UserCICAndLevel
            level={rater.level}
            size={UserCICAndLevelSize.SMALL}
          />
        </div>
      </div>
      <span
        className={`tw-flex-shrink-0 tw-text-sm tw-font-semibold ${
          rater.rating >= 0 ? "tw-text-green-400" : "tw-text-rose-400"
        }`}
      >
        {rater.rating > 0 ? "+" : ""}
        {formatNumberWithCommas(rater.rating)}
      </span>
    </Link>
  );
}
