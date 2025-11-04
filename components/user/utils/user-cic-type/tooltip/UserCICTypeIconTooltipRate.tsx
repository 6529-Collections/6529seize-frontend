import UserPageIdentityHeaderCICRate from "@/components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import UserPageRateWrapper from "@/components/user/utils/rate/UserPageRateWrapper";
import { RateMatter } from "@/enums";
import { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserCICTypeIconTooltipRate({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  return (
    <div className="tw-mt-3.5 tw-pt-3.5 tw-border-t tw-border-solid tw-border-iron-600 tw-border-x-0 tw-border-b-0">
      <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
        <UserPageRateWrapper profile={profile} type={RateMatter.NIC}>
          <UserPageIdentityHeaderCICRate profile={profile} isTooltip={true} />
        </UserPageRateWrapper>
      </div>
    </div>
  );
}
