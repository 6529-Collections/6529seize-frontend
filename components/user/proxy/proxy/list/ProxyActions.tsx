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
    <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
      <div className="tw-grid tw-grid-cols-10 tw-gap-x-4 tw-px-4 tw-justify-between tw-items-center tw-w-full tw-text-sm tw-text-iron-400 tw-font-normal">
        <div className="tw-col-span-2">Action</div>
        <div className="tw-col-span-2">Status</div>
        <div className="tw-col-span-2">Credit</div>
        <div className="tw-col-span-2">Start time</div>
        <div className="tw-col-span-2">End time</div>
      </div>
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
