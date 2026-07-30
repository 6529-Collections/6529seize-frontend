import { PROFILE_PROXY_AVAILABLE_ACTIONS } from "@/entities/IProxy";
import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import ProxyCreateActionSelectTypeItem from "./ProxyCreateActionSelectTypeItem";
import Button from "@/components/utils/button/Button";

export default function ProxyCreateActionSelectType({
  currentActions,
  setSelectedActionType,
  onCancel,
}: {
  readonly currentActions: ApiProfileProxyAction[];
  readonly setSelectedActionType: (
    actionType: ApiProfileProxyActionType
  ) => void;
  readonly onCancel?: (() => void) | undefined;
}) {
  const isActionAvailable = (
    actionType: ApiProfileProxyActionType
  ): boolean => {
    if (!PROFILE_PROXY_AVAILABLE_ACTIONS.includes(actionType)) {
      return false;
    }
    switch (actionType) {
      case ApiProfileProxyActionType.AllocateRep:
        return !currentActions.some(
          (action) =>
            action.action_type === ApiProfileProxyActionType.AllocateRep
        );
      case ApiProfileProxyActionType.AllocateCic:
        return !currentActions.some(
          (action) =>
            action.action_type === ApiProfileProxyActionType.AllocateCic
        );
      case ApiProfileProxyActionType.CreateWave:
        return !currentActions.some(
          (action) =>
            action.action_type === ApiProfileProxyActionType.CreateWave
        );
      case ApiProfileProxyActionType.ReadWave:
        return !currentActions.some(
          (action) => action.action_type === ApiProfileProxyActionType.ReadWave
        );
      case ApiProfileProxyActionType.CreateDropToWave:
        return !currentActions.some(
          (action) =>
            action.action_type === ApiProfileProxyActionType.CreateDropToWave
        );
      case ApiProfileProxyActionType.RateWaveDrop:
        return !currentActions.some(
          (action) =>
            action.action_type === ApiProfileProxyActionType.RateWaveDrop
        );
      case ApiProfileProxyActionType.PublishCms:
        return !currentActions.some(
          (action) =>
            action.action_type === ApiProfileProxyActionType.PublishCms
        );
      default:
        assertUnreachable(actionType);
        return false;
    }
  };

  const availableActions = Object.values(ApiProfileProxyActionType).filter(
    isActionAvailable
  );

  return (
    <div>
      <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
        Select action type
      </p>
      <ul className="tw-mt-2 sm:tw-mt-4 tw-list-none tw-pl-0 tw-flex tw-items-center tw-gap-x-3">
        {availableActions.map((actionType) => (
          <ProxyCreateActionSelectTypeItem
            key={actionType}
            actionType={actionType}
            setSelectedActionType={setSelectedActionType}
          />
        ))}
        {onCancel && (
          <li>
            <Button
              variant="secondary"
              size="md"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </li>
        )}
      </ul>
    </div>
  );
}
