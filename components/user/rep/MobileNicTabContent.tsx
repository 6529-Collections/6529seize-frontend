import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { RateMatter } from "@/types/enums";
import NicRatingsOverview from "./NicRatingsOverview";
import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";

export default function MobileNicTabContent({
  profile,
  cicOverview,
  initialActivityLogParams,
  canEditNic,
  onRateNic,
}: {
  readonly profile: ApiIdentity;
  readonly cicOverview: ApiCicOverview | null;
  readonly initialActivityLogParams: ActivityLogParams;
  readonly canEditNic: boolean;
  readonly onRateNic: () => void;
}) {
  return (
    <>
      <div className="tw-mt-4 tw-px-1 tw-py-1">
        <NicRatingsOverview
          profile={profile}
          cicOverview={cicOverview}
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
