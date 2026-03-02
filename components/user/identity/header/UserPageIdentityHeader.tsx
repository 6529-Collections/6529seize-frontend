import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityHeaderCIC from "./UserPageIdentityHeaderCIC";

export default function UserPageIdentityHeader({
  profile,
  cicOverview,
}: {
  readonly profile: ApiIdentity;
  readonly cicOverview: ApiCicOverview | null;
}) {
  return (
    <div className="tw-px-6 tw-pt-6">
      <div className="tw-mb-6">
        <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-100">
          Network Identity Check (NIC)
        </h2>
        <p className="tw-mb-0 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-500">
          Does the network believe this profile accurately represents its
          identity?
        </p>
      </div>
      <UserPageIdentityHeaderCIC profile={profile} cicOverview={cicOverview} />
    </div>
  );
}
