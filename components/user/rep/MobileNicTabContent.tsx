import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type { useNicRatingsOverview } from "./useNicRatingsOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { RateMatter } from "@/types/enums";
import NicRatingsOverview from "./NicRatingsOverview";
import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";

export default function MobileNicTabContent({
  profile,
  ratings,
  initialActivityLogParams,
  canEditNic,
  onRateNic,
}: {
  readonly profile: ApiIdentity;
  readonly ratings: ReturnType<typeof useNicRatingsOverview>;
  readonly initialActivityLogParams: ActivityLogParams;
  readonly canEditNic: boolean;
  readonly onRateNic: () => void;
}) {
  return (
    <>
      <div className="tw-mt-6 tw-px-1">
        <NicRatingsOverview
          profile={profile}
          ratings={ratings}
          compact
          {...(canEditNic ? { onRateClick: onRateNic } : {})}
        />
      </div>

      <div className="tw-mt-6">
        <UserPageCombinedActivityLog
          layout="mobile"
          initialActivityLogParams={initialActivityLogParams}
          matter={RateMatter.NIC}
          withMatterFilter={false}
        />
      </div>
    </>
  );
}
