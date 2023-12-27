import { useRouter } from "next/router";
import { ProfilesMatterRatingWithRaterLevel } from "../../../../entities/IProfile";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Page } from "../../../../helpers/Types";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useEffect, useState } from "react";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import ProfileRatersTableWrapper, {
  IProfileRatersTableItem,
  ProfileRatersTableType,
} from "../../utils/raters-table/wrapper/ProfileRatersTableWrapper";

const PAGE_SIZE = 10;

export default function CICRatings({
  profileCICRatings: initialProfileCICRatings,
}: {
  readonly profileCICRatings: Page<ProfilesMatterRatingWithRaterLevel>;
}) {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string).toLowerCase();
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { isLoading, data: ratings } = useQuery<
    Page<ProfilesMatterRatingWithRaterLevel>
  >({
    queryKey: [
      QueryKey.CIC_RATINGS,
      {
        profile: handleOrWallet,
        page: `${currentPage}`,
        page_size: `${PAGE_SIZE}`,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<ProfilesMatterRatingWithRaterLevel>>({
        endpoint: `profiles/${handleOrWallet}/cic/ratings`,
        params: {
          page: `${currentPage}`,
          page_size: `${PAGE_SIZE}`,
        },
      }),
    enabled: !!handleOrWallet,
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

  const mapRating = (
    rating: ProfilesMatterRatingWithRaterLevel
  ): IProfileRatersTableItem => ({
    raterHandle: rating.rater_handle,
    rating: rating.rating,
    raterCIC: rating.rater_cic_rating,
    raterLevel: rating.rater_level,
    lastModified: rating.last_modified,
  });

  const [ratingsMapped, setRatingsMapped] = useState<IProfileRatersTableItem[]>(
    ratings?.data.map(mapRating) ?? []
  );

  useEffect(() => {
    if (!ratings?.data) {
      setRatingsMapped([]);
      return;
    }
    setRatingsMapped(ratings.data.map(mapRating));
  }, [ratings?.data]);

  return (
    <ProfileRatersTableWrapper
      type={ProfileRatersTableType.CIC_RECEIVED}
      ratings={ratingsMapped}
      noRatingsMessage="No CIC Ratings"
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={setCurrentPage}
    />
  );
}
