import { useState } from "react";
import {
  CreateProxyAction,
  PROFILE_PROXY_ACTION_LABELS,
} from "../../../../../../entities/IProxy";
import { ApiProfileProxyActionType } from "../../../../../../generated/models/ApiProfileProxyActionType";
import ProxyCreateActionConfigAllocateCic from "./ProxyCreateActionConfigAllocateCic";
import ProxyCreateActionConfigAllocateRep from "./ProxyCreateActionConfigAllocateRep";
import ProxyCreateActionConfigCreateDropToWave from "./ProxyCreateActionConfigCreateDropToWave";
import ProxyCreateActionConfigCreateWave from "./ProxyCreateActionConfigCreateWave";
import ProxyCreateActionConfigRateWaveDrop from "./ProxyCreateActionConfigRateWaveDrop";
import ProxyCreateActionConfigReadWave from "./ProxyCreateActionConfigReadWave";
import CommonTimeSelect from "../../../../../utils/time/CommonTimeSelect";
import ProxyCreateActionConfigEndTimeSwitch from "./ProxyCreateActionConfigEndTimeSwitch";

export default function ProxyCreateActionConfig({
  selectedActionType,
  submitting,
  onSubmit,
  onCancel,
}: {
  readonly selectedActionType: ApiProfileProxyActionType;
  readonly submitting: boolean;
  readonly onSubmit: (action: CreateProxyAction) => void;
  readonly onCancel: () => void;
}) {
  const [isEndTimeDisabled, setIsEndTimeDisabled] = useState<boolean>(true);
  const [endTime, setEndTime] = useState<number | null>(null);

  const submit = async (action: CreateProxyAction) => {
    if (isEndTimeDisabled) {
      onSubmit({
        ...action,
        end_time: null,
      });
      return;
    }
    onSubmit(action);
  };

  const components: Record<ApiProfileProxyActionType, JSX.Element> = {
    [ApiProfileProxyActionType.AllocateRep]: (
      <ProxyCreateActionConfigAllocateRep
        endTime={endTime}
        submitting={submitting}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
    [ApiProfileProxyActionType.AllocateCic]: (
      <ProxyCreateActionConfigAllocateCic
        endTime={endTime}
        submitting={submitting}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
    [ApiProfileProxyActionType.CreateWave]: (
      <ProxyCreateActionConfigCreateWave
        endTime={endTime}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
    [ApiProfileProxyActionType.ReadWave]: (
      <ProxyCreateActionConfigReadWave
        endTime={endTime}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
    [ApiProfileProxyActionType.CreateDropToWave]: (
      <ProxyCreateActionConfigCreateDropToWave
        endTime={endTime}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
    [ApiProfileProxyActionType.RateWaveDrop]: (
      <ProxyCreateActionConfigRateWaveDrop
        endTime={endTime}
        onSubmit={submit}
        onCancel={onCancel}
      />
    ),
  };
  return (
    <div className="tw-p-5 tw-flex tw-flex-col tw-bg-iron-900 tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-shadow-sm">
      <p className="tw-mb-0 tw-text-lg tw-text-iron-50 tw-font-semibold">
        {PROFILE_PROXY_ACTION_LABELS[selectedActionType]}
      </p>
      <ProxyCreateActionConfigEndTimeSwitch
        isActive={isEndTimeDisabled}
        setIsActive={setIsEndTimeDisabled}
      />
      <div className="tw-mt-4 tw-flex tw-flex-col md:tw-flex-row tw-gap-x-6 tw-gap-y-5">
        {!isEndTimeDisabled && (
          <div className="tw-w-full md:tw-w-auto">
            <span
              className={`${
                isEndTimeDisabled ? "tw-opacity-50" : ""
              } tw-block tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-300`}
            >
              End time
            </span>
            <div className="tw-mt-1.5">
              <CommonTimeSelect
                currentTime={endTime}
                onMillis={setEndTime}
                disabled={isEndTimeDisabled}
              />
            </div>
          </div>
        )}
        <div className="tw-w-full md:tw-w-auto">
          {components[selectedActionType]}
        </div>
      </div>
    </div>
  );
}
