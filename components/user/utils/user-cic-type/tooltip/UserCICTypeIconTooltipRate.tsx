import UserPageIdentityHeaderCICRate from "@/components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import UserPageRateWrapper from "@/components/user/utils/rate/UserPageRateWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { RateMatter } from "@/types/enums";

export default function UserCICTypeIconTooltipRate({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  return (
    <div className="tw-mt-3.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-600 tw-pt-3.5">
      <div className="tw-flex tw-w-full tw-items-center tw-justify-between">
        <UserPageRateWrapper profile={profile} type={RateMatter.NIC}>
          <UserPageIdentityHeaderCICRate profile={profile} isTooltip={true} />
        </UserPageRateWrapper>
      </div>
    </div>
  );
}
