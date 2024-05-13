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
import CommonTimeSelect from "../../../../../utils/time/CommonTimeSelect";
import ProxyCreateActionConfigEndTimeSwitch from "./ProxyCreateActionConfigEndTimeSwitch";

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
  const [isEndTimeActive, setIsEndTimeActive] = useState<boolean>(false);
  const [endTime, setEndTime] = useState<number | null>(null);

  const getRepActions = (): ProfileProxyAction[] =>
    currentActions.filter(
      (a) => a.action_type === ProfileProxyActionType.AllocateRep
    );

  const repActions = getRepActions();

  const submit = async (action: CreateProxyAction) => {
    if (!isEndTimeActive) {
      onSubmit({
        ...action,
        end_time: null,
      });
      return;
    }
    onSubmit(action);
  };

  const components: Record<ProfileProxyActionType, JSX.Element> = {
    [ProfileProxyActionType.AllocateRep]: (
      <ProxyCreateActionConfigAllocateRep
        endTime={endTime}
        repActions={repActions}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
    [ProfileProxyActionType.AllocateCic]: (
      <ProxyCreateActionConfigAllocateCic
        endTime={endTime}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
    [ProfileProxyActionType.CreateWave]: (
      <ProxyCreateActionConfigCreateWave
        endTime={endTime}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
    [ProfileProxyActionType.ReadWave]: (
      <ProxyCreateActionConfigReadWave
        endTime={endTime}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
    [ProfileProxyActionType.CreateDropToWave]: (
      <ProxyCreateActionConfigCreateDropToWave
        endTime={endTime}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
    [ProfileProxyActionType.RateWaveDrop]: (
      <ProxyCreateActionConfigRateWaveDrop
        endTime={endTime}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
  };
  return (
    <div className="tw-flex tw-flex-col">
      <p className="tw-mb-0 tw-text-base tw-text-iron-50 tw-font-semibold">
        {PROFILE_PROXY_ACTION_LABELS[selectedActionType]}
      </p>
      <ProxyCreateActionConfigEndTimeSwitch
        isActive={isEndTimeActive}
        setIsActive={setIsEndTimeActive}
      />
      <div className="tw-mt-4 tw-flex tw-items-center tw-gap-x-6">
        <div>
          <span className="tw-block tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
            End time
          </span>
          <div className="tw-mt-1.5">
            <CommonTimeSelect
              currentTime={endTime}
              onMillis={setEndTime}
              disabled={isEndTimeActive}
            />
          </div>
        </div>
      </div>
      <div className="tw-mt-4">{components[selectedActionType]}</div>
    </div>
  );
}
