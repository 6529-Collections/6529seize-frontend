import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../generated/models/ProfileProxyAction";
import PencilIcon from "../../../../utils/icons/PencilIcon";
import ProfileProxyCredit from "./utils/credit/ProfileProxyCredit";

export default function ProxyActionAllocateRep({
  profileProxy,
  action,
}: {
  readonly profileProxy: ProfileProxy;
  readonly action: ProfileProxyAction;
}) {
  return (
    <div>
      <div>Allocate rep</div>
      <div>Active: {action.is_active.toString()}</div>
      <ProfileProxyCredit
        profileProxy={profileProxy}
        profileProxyAction={action}
      />
      <div>Category: {action.action_data.credit_category}</div>
      <div>Group id: {action.action_data.group_id}</div>
    </div>
  );
}
