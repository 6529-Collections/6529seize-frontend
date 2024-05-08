import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { Time } from "../../../../../helpers/time";
import ProxyActionRow from "./ProxyActionRow";

export default function ProxyActions({
  profileProxy,
}: {
  readonly profileProxy: ProfileProxy;
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
    <ul>
      {actions.map((action) => (
        <ProxyActionRow
          key={action.id}
          action={action}
          profileProxyId={profileProxy.id}
        />
      ))}
    </ul>
  );
}
