import { useRouter } from "next/router";
import { IProfileAndConsolidations, RateMatter } from "../../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../../../../services/api/common-api";
import UserPageIdentityHeaderCIC from "./UserPageIdentityHeaderCIC";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import UserPageRateWrapper from "../../utils/rate/UserPageRateWrapper";
import UserPageIdentityHeaderCICRate from "./cic-rate/UserPageIdentityHeaderCICRate";

export default function UserPageIdentityHeader({
  profile: initialProfile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { data: profile } = useQuery<IProfileAndConsolidations>({
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
      <div className="tw-mt-6 lg:tw-mt-8 lg:tw-flex lg:tw-items-center tw-lg:justify-between">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-col">
            <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 tw-sm:truncate sm:tw-text-2xl sm:tw-tracking-tight">
              Community Identity Check (CIC)
            </h2>
            <p className="tw-font-normal tw-text-iron-400 tw-text-base tw-mb-0">
              Does the community believe this profile accurately represents its
              identity?
            </p>
          </div>
          <UserPageIdentityHeaderCIC profile={profile} />
          <UserPageRateWrapper profile={profile} type={RateMatter.CIC}>
            <UserPageIdentityHeaderCICRate
              profile={profile}
              isTooltip={false}
            />
          </UserPageRateWrapper>
        </div>
      </div>
    </div>
  );
}
