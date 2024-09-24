import {
  IProfileAndConsolidations,
  RateMatter,
} from "../../../../entities/IProfile";
import UserPageIdentityHeaderCIC from "./UserPageIdentityHeaderCIC";
import UserPageRateWrapper from "../../utils/rate/UserPageRateWrapper";
import UserPageIdentityHeaderCICRate from "./cic-rate/UserPageIdentityHeaderCICRate";

export default function UserPageIdentityHeader({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  return (
    <div>
      <div className="tw-mt-6 lg:tw-mt-8 lg:tw-flex lg:tw-items-center tw-lg:justify-between">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-col">
            <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-2xl sm:tw-tracking-tight">
              Network Identity Check (NIC)
            </h2>
            <p className="tw-font-normal tw-text-iron-400 tw-text-sm sm:tw-text-base tw-mb-0">
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
