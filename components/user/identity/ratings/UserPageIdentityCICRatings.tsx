import { useRouter } from "next/router";
import {
  IProfileAndConsolidations,
  ProfilesMatterRatingWithRaterLevel,
} from "../../../../entities/IProfile";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Page } from "../../../../helpers/Types";
import { commonApiFetch } from "../../../../services/api/common-api";
import UserPageIdentityCICRatingsList from "./UserPageIdentityCICRatingsList";
import UserPageIdentityCICRatingsHeader from "./UserPageIdentityCICRatingsHeader";
import { useEffect, useState } from "react";
import UserPageIdentityPagination from "../utils/UserPageIdentityPagination";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";

const PAGE_SIZE = 10;

export default function CICRatings({
  profile,
  profileCICRatings: initialProfileCICRatings,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly profileCICRatings: Page<ProfilesMatterRatingWithRaterLevel>;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { isLoading, data: ratings } = useQuery<
    Page<ProfilesMatterRatingWithRaterLevel>
  >({
    queryKey: [
      QueryKey.CIC_RATINGS,
      {
        profile: user.toLowerCase(),
        page: `${currentPage}`,
        page_size: `${PAGE_SIZE}`,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<ProfilesMatterRatingWithRaterLevel>>({
        endpoint: `profiles/${user}/cic/ratings`,
        params: {
          page: `${currentPage}`,
          page_size: `${PAGE_SIZE}`,
        },
      }),
    enabled: !!user,
    placeholderData: keepPreviousData,
    initialData: () =>
      currentPage === 1 ? initialProfileCICRatings : undefined,
  });

  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (isLoading) return;
    if (!ratings?.count) {
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }
    setTotalPages(Math.ceil(ratings.count / PAGE_SIZE));
  }, [ratings?.count, ratings?.page, isLoading]);

  return (
    <div className="tw-bg-iron-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <UserPageIdentityCICRatingsHeader profile={profile} />

      <div className="tw-min-h-[28rem] tw-max-h-[28rem] tw-transform-gpu tw-scroll-py-3 tw-overflow-y-auto">
        {ratings?.data.length ? (
          <div className="tw-flow-root">
            <div className="tw-overflow-x-auto">
              <UserPageIdentityCICRatingsList ratings={ratings.data} />
              {totalPages > 1 && (
                <UserPageIdentityPagination
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalPages={totalPages}
                  user={user}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="tw-mt-4">
            <span className="tw-px-6 md:tw-px-8 tw-text-sm tw-italic tw-text-iron-500">
              No CIC Ratings
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
