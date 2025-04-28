import { ApiIdentity } from "../../../../../generated/models/ApiIdentity";
import { ApiProfileProxy } from "../../../../../generated/models/ApiProfileProxy";
import { Time } from "../../../../../helpers/time";
import ProxyActionRow from "./ProxyActionRow";

export default function ProxyActions({
  profileProxy,
  profile,
  isSelf,
}: {
  readonly profileProxy: ApiProfileProxy;
  readonly profile: ApiIdentity;
  readonly isSelf: boolean;
}) {
  const actions = profileProxy.actions.toSorted((a, d) => {
    const aExpired = a.end_time && a.end_time < Time.currentMillis();
    const dExpired = d.end_time && d.end_time < Time.currentMillis();
    if (aExpired && !dExpired) {
      return 1;
    }
    if (!aExpired && dExpired) {
      return -1;
    }
    if (aExpired && dExpired) {
      return d.end_time! - a.end_time!;
    }
    return d.start_time - a.start_time;
  });
  return (
    <div className="tw-space-y-2.5 tw-mt-3">
      {actions.map((action) => (
        <ProxyActionRow
          key={action.id}
          action={action}
          profileProxy={profileProxy}
          profile={profile}
          isSelf={isSelf}
        />
      ))}
    </div>
  );
}
