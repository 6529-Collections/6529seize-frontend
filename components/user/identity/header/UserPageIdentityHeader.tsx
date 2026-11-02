import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityHeaderCIC from "./UserPageIdentityHeaderCIC";

export default function UserPageIdentityHeader({
  profile,
  cicOverview,
  onRateClick,
}: {
  readonly profile: ApiIdentity;
  readonly cicOverview: ApiCicOverview | null;
  readonly onRateClick?: () => void;
}) {
  return (
    <div className="tw-px-6 tw-pt-6">
      <div className="tw-mb-6">
        <h2 className="tw-mb-1 tw-mt-0 tw-text-xl tw-font-semibold tw-text-iron-100">
          Network Identity Check (NIC)
        </h2>
        <p className="tw-m-0 tw-text-[15px] tw-font-normal tw-leading-[22.75px] tw-text-iron-300">
          Does the network believe this profile accurately represents its
          identity?
        </p>
      </div>
      <UserPageIdentityHeaderCIC
        profile={profile}
        cicOverview={cicOverview}
        {...(onRateClick ? { onRateClick } : {})}
      />
    </div>
  );
}
