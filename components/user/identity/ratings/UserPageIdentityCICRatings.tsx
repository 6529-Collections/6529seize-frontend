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

const PAGE_SIZE = 10;

export default function CICRatings({
  profile,
  profileCICRatings: initialProfileCICRatings,
}: {
  profile: IProfileAndConsolidations;
  profileCICRatings: Page<ProfilesMatterRatingWithRaterLevel>;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const [currentPage, setCurrentPage] = useState<number>(1);

  const {
    isLoading,
    isError,
    data: ratings,
    error,
  } = useQuery<Page<ProfilesMatterRatingWithRaterLevel>>({
    queryKey: [
      "cic-ratings",
      {
        profile: user,
        page: `${currentPage}`,
        page_size: `${PAGE_SIZE}`,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<ProfilesMatterRatingWithRaterLevel>>({
        endpoint: `profiles/${user}/cic/ratings`,
        params: {
          page: "1",
          page_size: "100",
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
          <>
            <UserPageIdentityCICRatingsList ratings={ratings.data} />
            {totalPages > 1 && (
              <UserPageIdentityPagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
              />
            )}
          </>
        ) : (
          <div className="tw-mt-4">
            <span className="tw-px-8 tw-text-sm tw-italic tw-text-iron-500">
              No CIC Ratings
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
