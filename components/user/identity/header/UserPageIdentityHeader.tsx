import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityHeaderCIC from "./UserPageIdentityHeaderCIC";

export default function UserPageIdentityHeader({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  return (
    <div className="tw-px-6 tw-pt-6">
      <div className="tw-mb-6">
        <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-100">
          Network Identity Check (NIC)
        </h2>
        <p className="tw-mb-0 tw-text-iron-500 tw-text-sm tw-font-normal tw-leading-relaxed">
          Does the network believe this profile accurately represents its identity?
        </p>
      </div>
      <UserPageIdentityHeaderCIC profile={profile} />
    </div>
  );
}
