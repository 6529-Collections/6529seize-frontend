import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ProfileRatersTableWrapper, {
  IProfileRatersTableItem,
  ProfileRatersTableType,
} from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { Page } from "../../../helpers/Types";
import { RatingWithProfileInfoAndLevel } from "../../../entities/IProfile";
import { commonApiFetch } from "../../../services/api/common-api";

const PAGE_SIZE = 10;
const INITIAL_PAGE = 1;
export type USER_PAGE_REP_RATERS_TYPE =
  | ProfileRatersTableType.REP_RECEIVED
  | ProfileRatersTableType.REP_GIVEN;

export default function UserPageRepRaters({
  type,
}: {
  readonly type: USER_PAGE_REP_RATERS_TYPE;
}) {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string).toLowerCase();
  const [currentPage, setCurrentPage] = useState<number>(INITIAL_PAGE);
  const [totalPages, setTotalPages] = useState<number>(1);

  const getQueryParams = () => {
    const params: {
      handle_or_wallet: string;
      page: string;
      page_size: string;
      log_type: string;
      given?: string;
    } = {
      handle_or_wallet: handleOrWallet,
      page: `${currentPage}`,
      page_size: `${PAGE_SIZE}`,
      log_type: "",
    };
    if (type === ProfileRatersTableType.REP_GIVEN) {
      params.given = "true";
    }
    return params;
  };

  const [queryParams, setQueryParams] = useState<{
    handle_or_wallet: string;
    page: string;
    page_size: string;
    log_type: string;
    given?: string;
  }>(getQueryParams());

  useEffect(() => {
    setQueryParams(getQueryParams());
  }, [currentPage, type, handleOrWallet]);

  const { isLoading, data: ratings } = useQuery<
    Page<RatingWithProfileInfoAndLevel>
  >({
    queryKey: [QueryKey.PROFILE_REP_RATERS, queryParams],
    queryFn: async () =>
      await commonApiFetch<Page<RatingWithProfileInfoAndLevel>>({
        endpoint: `profiles/${handleOrWallet}/rep/ratings/by-rater`,
        params: queryParams,
      }),
    enabled: !!handleOrWallet,
    placeholderData: keepPreviousData,
  });

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
    rating: RatingWithProfileInfoAndLevel
  ): IProfileRatersTableItem => ({
    raterHandle: rating.handle,
    rating: rating.rating,
    raterCIC: rating.cic,
    raterLevel: rating.level,
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
      type={type}
      ratings={ratingsMapped}
      noRatingsMessage="No Rep Ratings"
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={setCurrentPage}
    />
  );
}
