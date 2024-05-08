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
    <div className="tw-px-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-b-0 tw-divide-iron-700">
      {actions.map((action) => (
        <ProxyActionRow
          key={action.id}
          action={action}
          profileProxyId={profileProxy.id}
        />
      ))}
    </div>
  );
}
