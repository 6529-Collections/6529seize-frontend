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
import { Time } from "../../../../../../helpers/time";
import { ProfileProxyAction } from "../../../../../../generated/models/ProfileProxyAction";

export default function ProxyCreateActionConfig({
  selectedActionType,
  currentActions,
  onSubmit,
}: {
  readonly selectedActionType: ProfileProxyActionType;
  readonly currentActions: ProfileProxyAction[];
  readonly onSubmit: (action: CreateProxyAction) => void;
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
      />
    ),
    [ProfileProxyActionType.AllocateCic]: (
      <ProxyCreateActionConfigAllocateCic
        endTime={endTime}
        onSubmit={onSubmit}
      />
    ),
    [ProfileProxyActionType.CreateWave]: (
      <ProxyCreateActionConfigCreateWave
        endTime={endTime}
        onSubmit={onSubmit}
      />
    ),
    [ProfileProxyActionType.ReadWave]: (
      <ProxyCreateActionConfigReadWave
        endTime={endTime}
        onSubmit={onSubmit}
      />
    ),
    [ProfileProxyActionType.CreateDropToWave]: (
      <ProxyCreateActionConfigCreateDropToWave
        endTime={endTime}
        onSubmit={onSubmit}
      />
    ),
    [ProfileProxyActionType.RateWaveDrop]: (
      <ProxyCreateActionConfigRateWaveDrop
        endTime={endTime}
        onSubmit={onSubmit}
      />
    ),
  };
  return (
    <div>
      <div>{PROFILE_PROXY_ACTION_LABELS[selectedActionType]}</div>
      <div>End time: {endTime}</div>
      <div>{components[selectedActionType]}</div>
    </div>
  );
}
