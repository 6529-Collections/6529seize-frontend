import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../../../../services/api/common-api";
import UserPageIdentityHeaderCIC from "./UserPageIdentityHeaderCIC";
import UserPageIdentityHeaderCICRateWrapper from "./UserPageIdentityHeaderCICRateWrapper";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";

export default function UserPageIdentityHeader({
  profile: initialProfile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const {
    isLoading,
    isError,
    data: profile,
    error,
  } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user.toLowerCase()}`,
      }),
    enabled: !!user,
    initialData: initialProfile,
  });


  return (
    <div>
      <div className="tw-mt-8 lg:tw-flex lg:tw-items-center tw-lg:justify-between">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-col">
            <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-white tw-sm:truncate sm:tw-text-2xl sm:tw-tracking-tight">
              Community Identity Check (CIC)
            </h2>
            <p className="tw-font-normal tw-text-iron-400 tw-text-base tw-mb-0">
              Does the community believe this profile accurately represents its
              identity?
            </p>
          </div>
          <UserPageIdentityHeaderCIC profile={profile} />
          <UserPageIdentityHeaderCICRateWrapper profile={profile} />
        </div>
      </div>
    </div>
  );
}
