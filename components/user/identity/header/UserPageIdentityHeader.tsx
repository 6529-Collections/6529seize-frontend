import UserPageRateWrapper from "@/components/user/utils/rate/UserPageRateWrapper";
import { RateMatter } from "@/enums";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityHeaderCICRate from "./cic-rate/UserPageIdentityHeaderCICRate";
import UserPageIdentityHeaderCIC from "./UserPageIdentityHeaderCIC";

export default function UserPageIdentityHeader({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  return (
    <div>
      <div className="tw-mt-6 lg:tw-mt-8 lg:tw-flex lg:tw-items-center tw-lg:justify-between">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-col">
            <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-100 sm:tw-text-2xl sm:tw-tracking-tight">
              Network Identity Check (NIC)
            </h2>
            <p className="tw-font-normal tw-text-iron-200 tw-text-sm sm:tw-text-base tw-mb-0">
              Does the network believe this profile accurately represents its
              identity?
            </p>
          </div>
          <UserPageIdentityHeaderCIC profile={profile} />
          <UserPageRateWrapper profile={profile} type={RateMatter.NIC}>
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
