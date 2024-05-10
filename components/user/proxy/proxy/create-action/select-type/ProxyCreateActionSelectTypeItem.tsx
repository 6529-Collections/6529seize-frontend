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
    <li className="tw-ring-1 tw-ring-iron-600 tw-rounded-lg">
      <button
        type="button"
        onClick={() => setSelectedActionType(actionType)}
        className="tw-border-0 tw-bg-iron-950 tw-px-3 tw-py-2.5 tw-font-medium tw-text-iron-300 tw-text-sm tw-rounded-lg hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
      >
        {PROFILE_PROXY_ACTION_LABELS[actionType]}
      </button>
    </li>
  );
}
