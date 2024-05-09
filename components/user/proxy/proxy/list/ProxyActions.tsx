import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { Time } from "../../../../../helpers/time";
import ProxyActionRow from "./ProxyActionRow";

export default function ProxyActions({
  profileProxy,
  profile,
}: {
  readonly profileProxy: ProfileProxy;
  readonly profile: IProfileAndConsolidations;
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
    <div>
    {/*   <div className="tw-grid tw-grid-cols-12 tw-py-3 tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-text-sm tw-text-iron-400 tw-font-normal">
        <div className="tw-col-span-2">Action</div>
        <div className="tw-col-span-2">Status</div>
        <div className="tw-col-span-2">Credit</div>
        <div className="tw-col-span-2">Start time</div>
        <div className="tw-col-span-2">End time</div>
        <div className="tw-col-span-2"></div>
      </div> */}
      <div className="tw-space-y-2.5 tw-mt-3">
        {actions.map((action) => (
          <ProxyActionRow
            key={action.id}
            action={action}
            profileProxy={profileProxy}
            profile={profile}
          />
        ))}
      </div>
    </div>
  );
}
