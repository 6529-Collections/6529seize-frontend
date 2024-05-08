import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../generated/models/ProfileProxyAction";
import ProfileProxyCredit from "./utils/credit/ProfileProxyCredit";

export default function ProxyActionAllocateCic({
  profileProxy,
  action,
}: {
  readonly profileProxy: ProfileProxy;
  readonly action: ProfileProxyAction;
}) {
  return (
    <div>
      <div>allocate cic</div>
      <div>Active: {action.is_active.toString()}</div>
      <ProfileProxyCredit
        profileProxy={profileProxy}
        profileProxyAction={action}
      />
    </div>
  );
}
