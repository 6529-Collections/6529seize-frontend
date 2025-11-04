import { PROFILE_PROXY_AVAILABLE_ACTIONS } from "@/entities/IProxy";
import { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import ProxyCreateActionSelectTypeItem from "./ProxyCreateActionSelectTypeItem";

export default function ProxyCreateActionSelectType({
  currentActions,
  setSelectedActionType,
  onCancel,
}: {
  readonly currentActions: ApiProfileProxyAction[];
  readonly setSelectedActionType: (
    actionType: ApiProfileProxyActionType
  ) => void;
  readonly onCancel?: () => void;
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
            <button
              onClick={onCancel}
              type="button"
              className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
            >
              Cancel
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
