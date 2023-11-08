import {
  CLASSIFICATIONS,
  IProfileAndConsolidations,
} from "../../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../../entities/ITDH";

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
      <div className="tw-inline-flex tw-items-center tw-space-x-2">
        <p className="tw-mb-0 tw-text-3xl tw-font-semibold">{displayName}</p>
      </div>
      {profile.profile?.classification && (
        <div className="tw-block tw-text-neutral-400 tw-font-normal tw-text-[13px] tw-leading-3">
          {CLASSIFICATIONS[profile.profile.classification].title}
        </div>
      )}
    </div>
  );
}
