import { useRouter } from "next/router";
import {
  IProfileAndConsolidations,
  ProfilesMatterRating,
} from "../../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { Page } from "../../../../helpers/Types";
import { commonApiFetch } from "../../../../services/api/common-api";
import UserPageIdentityCICRatingsList from "./UserPageIdentityCICRatingsList";
import UserPageIdentityCICRatingsHeader from "./UserPageIdentityCICRatingsHeader";

export default function CICRatings({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const {
    isLoading,
    isError,
    data: ratings,
    error,
  } = useQuery<Page<ProfilesMatterRating>>({
    queryKey: [
      "cic-ratings",
      {
        profile: user,
        page: 1,
        page_size: 100,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<ProfilesMatterRating>>({
        endpoint: `profiles/${user}/cic/ratings`,
        params: {
          page: "1",
          page_size: "100",
        },
      }),
    enabled: !!user,
    // initialData: initialProfile,
  });

  return (
    <div className="tw-bg-iron-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <UserPageIdentityCICRatingsHeader profile={profile} />

      <div className="tw-min-h-[28rem] tw-max-h-[28rem] tw-transform-gpu tw-scroll-py-3 tw-overflow-y-auto">
        {ratings?.data.length ? (
          <UserPageIdentityCICRatingsList ratings={ratings.data} />
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
