import { RateMatter } from "../../../../../entities/IProfile";
import UserPageIdentityHeaderCICRate from "../../../identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import UserPageRateWrapper from "../../rate/UserPageRateWrapper";
import { ApiIdentity } from "../../../../../generated/models/ApiIdentity";

export default function UserCICTypeIconTooltipRate({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  return (
    <div className="tw-mt-3.5 tw-pt-3.5 tw-border-t tw-border-solid tw-border-neutral-600 tw-border-x-0 tw-border-b-0">
      <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
        <UserPageRateWrapper profile={profile} type={RateMatter.NIC}>
          <UserPageIdentityHeaderCICRate profile={profile} isTooltip={true} />
        </UserPageRateWrapper>
      </div>
    </div>
  );
}
