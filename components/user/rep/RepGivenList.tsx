"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CommonSkeletonLoader from "@/components/utils/animation/CommonSkeletonLoader";
import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { ProfileRatersParamsOrderBy } from "@/types/enums";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import RepGivenPill from "./RepGivenPill";

const INITIAL_VISIBLE = 5;
const LOAD_MORE_COUNT = 10;

export default function RepGivenList({
  handle,
}: {
  readonly handle: string;
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const { isLoading, data: ratings } = useQuery<
    Page<RatingWithProfileInfoAndLevel>
  >({
    queryKey: [
      QueryKey.PROFILE_RATERS,
      {
        handleOrWallet: handle.toLowerCase(),
        matter: "rep",
        order: SortDirection.DESC,
        orderBy: ProfileRatersParamsOrderBy.RATING,
        given: true,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<RatingWithProfileInfoAndLevel>>({
        endpoint: `profiles/${handle}/rep/ratings/by-rater`,
        params: {
          page: "1",
          page_size: "200",
          order: SortDirection.DESC.toLowerCase(),
          order_by: ProfileRatersParamsOrderBy.RATING.toLowerCase(),
          given: "true",
        },
      }),
    enabled: !!handle,
  });

  if (isLoading) {
    return (
      <div className="tw-p-4">
        <CommonSkeletonLoader />
      </div>
    );
  }

  if (!ratings?.data.length) {
    return (
      <div className="tw-py-4">
        <span className="tw-text-sm tw-italic tw-text-iron-500">
          No given rep ratings
        </span>
      </div>
    );
  }

  const allRatings = ratings.data;
  const visibleRatings = allRatings.slice(0, visibleCount);
  const hasMore = allRatings.length > visibleCount;

  return (
    <div className="tw-flex tw-flex-wrap tw-gap-3">
      {visibleRatings.map((rating) => (
        <RepGivenPill key={rating.handle} rating={rating} />
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_COUNT)}
          className="tw-inline-flex tw-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-4 tw-text-sm tw-font-medium tw-text-iron-400 tw-backdrop-blur-md tw-transition-all tw-duration-300 tw-ease-out hover:tw-border-white/20 hover:tw-bg-white/10 hover:tw-text-white"
        >
          +{allRatings.length - visibleCount} more
        </button>
      )}
    </div>
  );
}
