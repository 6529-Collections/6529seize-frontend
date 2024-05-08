import { PROFILE_PROXY_ACTION_LABELS } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";

export default function ProxyCreateActionSelectTypeItem({
  actionType,
  setSelectedActionType,
}: {
  readonly actionType: ProfileProxyActionType;
  readonly setSelectedActionType: (actionType: ProfileProxyActionType) => void;
}) {
  return (
    <li>
      <button onClick={() => setSelectedActionType(actionType)}>
        {PROFILE_PROXY_ACTION_LABELS[actionType]}
      </button>
    </li>
  );
}
