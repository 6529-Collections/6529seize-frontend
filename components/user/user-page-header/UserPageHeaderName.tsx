import { IProfileAndConsolidations } from "../../../entities/IProfile";
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
        {profile.profile && (
          <svg
            className="tw-h-4 tw-w-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="24" height="24" rx="12" fill="#45B26B" />
            <path
              d="M7.5 12L10.5 15L16.5 9"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className="tw-block tw-text-neutral-400 tw-font-normal tw-text-[13px] tw-leading-3">
        Pseudonym
      </div>
    </div>
  );
}
