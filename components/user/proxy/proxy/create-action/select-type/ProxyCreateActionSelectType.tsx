import { PROFILE_PROXY_ACTION_LABELS } from "../../../../../../entities/IProxy";
import { ProfileProxyAction } from "../../../../../../generated/models/ProfileProxyAction";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";
import { assertUnreachable } from "../../../../../../helpers/AllowlistToolHelpers";
import ProxyCreateActionSelectTypeItem from "./ProxyCreateActionSelectTypeItem";

export default function ProxyCreateActionSelectType({
  currentActions,
  setSelectedActionType,
}: {
  readonly currentActions: ProfileProxyAction[];
  readonly setSelectedActionType: (actionType: ProfileProxyActionType) => void;
}) {
  const isActionAvailable = (actionType: ProfileProxyActionType): boolean => {
    switch (actionType) {
      case ProfileProxyActionType.AllocateRep:
        return true;
      case ProfileProxyActionType.AllocateCic:
        return !currentActions.some(
          (action) => action.action_type === ProfileProxyActionType.AllocateCic
        );
      case ProfileProxyActionType.CreateWave:
        return !currentActions.some(
          (action) => action.action_type === ProfileProxyActionType.CreateWave
        );
      case ProfileProxyActionType.ReadWave:
        return !currentActions.some(
          (action) => action.action_type === ProfileProxyActionType.ReadWave
        );
      case ProfileProxyActionType.CreateDropToWave:
        return !currentActions.some(
          (action) =>
            action.action_type === ProfileProxyActionType.CreateDropToWave
        );
      case ProfileProxyActionType.RateWaveDrop:
        return !currentActions.some(
          (action) => action.action_type === ProfileProxyActionType.RateWaveDrop
        );
      default:
        assertUnreachable(actionType);
        return false;
    }
  };

  const availableActions = Object.values(ProfileProxyActionType).filter(
    isActionAvailable
  );

  return (
    <div>
      <div>Select action type</div>
      <ul>
        {availableActions.map((actionType) => (
          <ProxyCreateActionSelectTypeItem
            key={actionType}
            actionType={actionType}
            setSelectedActionType={setSelectedActionType}
          />
        ))}
      </ul>
    </div>
  );
}
