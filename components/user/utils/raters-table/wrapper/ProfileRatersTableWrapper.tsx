import React, { useEffect, useState } from "react";
import ProfileRatersTableWrapperHeader from "./ProfileRatersTableWrapperHeader";
import {
  RateMatter,
  RatingWithProfileInfoAndLevel,
} from "../../../../../entities/IProfile";
import { useRouter } from "next/router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Page } from "../../../../../helpers/Types";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { SortDirection } from "../../../../../entities/ISort";
import ProfileRatersTable from "../ProfileRatersTable";
import CommonSkeletonLoader from "../../../../utils/animation/CommonSkeletonLoader";

export enum ProfileRatersTableType {
  CIC_RECEIVED = "CIC_RECEIVED",
  CIC_GIVEN = "CIC_GIVEN",
  REP_RECEIVED = "REP_RECEIVED",
  REP_GIVEN = "REP_GIVEN",
}

export enum ProfileRatersParamsOrderBy {
  RATING = "RATING",
  LAST_MODIFIED = "LAST_MODIFIED",
}

export interface ProfileRatersParams {
  readonly page: number;
  readonly pageSize: number;
  readonly given: boolean;
  readonly order: SortDirection;
  readonly orderBy: ProfileRatersParamsOrderBy;
  readonly handleOrWallet: string;
  readonly matter: RateMatter;
}

export default function ProfileRatersTableWrapper({
  initialParams,
}: {
  readonly initialParams: ProfileRatersParams;
}) {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string).toLowerCase();
  const pageSize = initialParams.pageSize;
  const given = initialParams.given;
  const matter = initialParams.matter;

  const [currentPage, setCurrentPage] = useState<number>(initialParams.page);
  const [order, setOrder] = useState<SortDirection>(initialParams.order);
  const [orderBy, setOrderBy] = useState<ProfileRatersParamsOrderBy>(
    initialParams.orderBy
  );

  const getType = (): ProfileRatersTableType => {
    switch (matter) {
      case RateMatter.CIC:
        return given
          ? ProfileRatersTableType.CIC_GIVEN
          : ProfileRatersTableType.CIC_RECEIVED;
      case RateMatter.REP:
        return given
          ? ProfileRatersTableType.REP_GIVEN
          : ProfileRatersTableType.REP_RECEIVED;
      default:
        assertUnreachable(matter);
        return ProfileRatersTableType.CIC_RECEIVED;
    }
  };

  const type = getType();

  const {
    isLoading,
    isFetching,
    data: ratings,
  } = useQuery<Page<RatingWithProfileInfoAndLevel>>({
    queryKey: [
      QueryKey.PROFILE_RATERS,
      {
        handleOrWallet,
        matter,
        page: `${currentPage}`,
        pageSize: `${pageSize}`,
        order,
        orderBy,
        given,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<RatingWithProfileInfoAndLevel>>({
        endpoint: `profiles/${handleOrWallet}/${matter.toLowerCase()}/ratings/by-rater`,
        params: {
          page: `${currentPage}`,
          page_size: `${pageSize}`,
          order: order.toLowerCase(),
          order_by: orderBy.toLowerCase(),
          given: given ? "true" : "false",
        },
      }),
    enabled: !!handleOrWallet,
    placeholderData: keepPreviousData,
  });

  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (isLoading) return;
    if (!ratings?.count) {
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }
    setTotalPages(Math.ceil(ratings.count / pageSize));
  }, [ratings?.count, ratings?.page, isLoading]);

  const getNoRatingsMessage = (): string => {
    switch (type) {
      case ProfileRatersTableType.CIC_RECEIVED:
        return "No CIC received ratings";
      case ProfileRatersTableType.CIC_GIVEN:
        return "No CIC given ratings";
      case ProfileRatersTableType.REP_RECEIVED:
        return "No Rep received ratings";
      case ProfileRatersTableType.REP_GIVEN:
        return "No Rep given ratings";
      default:
        assertUnreachable(type);
        return "";
    }
  };

  const onSortTypeClick = (newSortType: ProfileRatersParamsOrderBy) => {
    if (newSortType === orderBy) {
      setOrder((prev) =>
        prev === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC
      );
    } else {
      setOrderBy(newSortType);
      setOrder(SortDirection.DESC);
    }
  };

  return (
    <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col">
      <div>
        <ProfileRatersTableWrapperHeader type={type} />
      </div>
      <div className="tw-flex-1 tw-mt-2 lg:tw-mt-4 tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl tw-max-h-[29rem] tw-scroll-py-3 tw-overflow-y-auto">
        {isLoading ? (
          <div className="tw-p-4">
            <CommonSkeletonLoader />
          </div>
        ) : (
          <ProfileRatersTable
            ratings={ratings?.data || []}
            type={type}
            order={order}
            orderBy={orderBy}
            loading={isFetching}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onSortTypeClick={onSortTypeClick}
            noRatingsMessage={getNoRatingsMessage()}
          />
        )}
      </div>
    </div>
  );
}
