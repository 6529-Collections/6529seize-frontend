import { useState } from "react";
import {
  CreateProxyAction,
  PROFILE_PROXY_ACTION_LABELS,
} from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";
import ProxyCreateActionConfigAllocateCic from "./ProxyCreateActionConfigAllocateCic";
import ProxyCreateActionConfigAllocateRep from "./ProxyCreateActionConfigAllocateRep";
import ProxyCreateActionConfigCreateDropToWave from "./ProxyCreateActionConfigCreateDropToWave";
import ProxyCreateActionConfigCreateWave from "./ProxyCreateActionConfigCreateWave";
import ProxyCreateActionConfigRateWaveDrop from "./ProxyCreateActionConfigRateWaveDrop";
import ProxyCreateActionConfigReadWave from "./ProxyCreateActionConfigReadWave";

import { ProfileProxyAction } from "../../../../../../generated/models/ProfileProxyAction";

export default function ProxyCreateActionConfig({
  selectedActionType,
  currentActions,
  onSubmit,
  onCancel,
}: {
  readonly selectedActionType: ProfileProxyActionType;
  readonly currentActions: ProfileProxyAction[];
  readonly onSubmit: (action: CreateProxyAction) => void;
  readonly onCancel: () => void;
}) {
  const [endTime, setEndTime] = useState<number | null>(null);

  const getRepActions = (): ProfileProxyAction[] =>
    currentActions.filter(
      (a) => a.action_type === ProfileProxyActionType.AllocateRep
    );

  const repActions = getRepActions();

  const components: Record<ProfileProxyActionType, JSX.Element> = {
    [ProfileProxyActionType.AllocateRep]: (
      <ProxyCreateActionConfigAllocateRep
        endTime={endTime}
        repActions={repActions}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    ),
    [ProfileProxyActionType.AllocateCic]: (
      <ProxyCreateActionConfigAllocateCic
        endTime={endTime}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    ),
    [ProfileProxyActionType.CreateWave]: (
      <ProxyCreateActionConfigCreateWave
        endTime={endTime}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    ),
    [ProfileProxyActionType.ReadWave]: (
      <ProxyCreateActionConfigReadWave
        endTime={endTime}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    ),
    [ProfileProxyActionType.CreateDropToWave]: (
      <ProxyCreateActionConfigCreateDropToWave
        endTime={endTime}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    ),
    [ProfileProxyActionType.RateWaveDrop]: (
      <ProxyCreateActionConfigRateWaveDrop
        endTime={endTime}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    ),
  };
  return (
    <div className="tw-flex tw-flex-col">
      <p className="tw-mb-0 tw-text-base tw-text-iron-50 tw-font-semibold">
        {PROFILE_PROXY_ACTION_LABELS[selectedActionType]}
      </p>
      <p className="tw-mb-0 tw-space-x-1.5">
        <span className="tw-text-iron-400 tw-font-normal tw-text-base">
          End time:
        </span>
        <span className="tw-text-iron-50 tw-text-base tw-font-medium">
          {endTime}
        </span>
      </p>
      <div className="tw-mt-2">{components[selectedActionType]}</div>
    </div>
  );
}
