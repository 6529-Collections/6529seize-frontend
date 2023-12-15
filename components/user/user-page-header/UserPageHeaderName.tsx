import {
  CLASSIFICATIONS,
  IProfileAndConsolidations,
} from "../../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../../entities/ITDH";
import UserCICTypeIcon from "../utils/user-cic-type/UserCICTypeIcon";

export default function UserPageHeaderName({
  profile,
  mainAddress,
  consolidatedTDH,
}: {
  profile: IProfileAndConsolidations;
  mainAddress: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}) {
  const getDisplayName = (): string => {
    if (profile.profile?.handle) {
      return profile.profile.handle;
    }

    if (consolidatedTDH?.consolidation_display) {
      return consolidatedTDH.consolidation_display;
    }

    if (mainAddress.endsWith(".eth")) {
      return mainAddress;
    }

    return mainAddress;
  };

  const displayName = getDisplayName();
  return (
    <div className="tw-mt-4">
      <div className="tw-flex tw-items-center">
        <p className="tw-break-all tw-mb-0 tw-text-2xl sm:tw-text-3xl tw-font-semibold">
          {displayName}
        </p>
        {profile.profile?.handle && (
          <div className="tw-ml-2 tw-flex tw-items-center tw-justify-center tw-self-center tw-h-6 tw-w-6">
            <UserCICTypeIcon profile={profile} />
          </div>
        )}
      </div>
      {profile.profile?.classification && (
        <div className="tw-block tw-mt-1 tw-text-iron-400 tw-font-normal tw-text-[13px] tw-leading-3">
          {CLASSIFICATIONS[profile.profile.classification].title}
        </div>
      )}
    </div>
  );
}
