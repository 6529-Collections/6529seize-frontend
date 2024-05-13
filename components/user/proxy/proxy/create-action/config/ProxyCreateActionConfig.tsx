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
      <div className="tw-mt-4 tw-flex tw-items-center tw-gap-x-6">
        <div>
          <span className="tw-block tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
            End time
          </span>
          <div className="tw-mt-1.5">
            <CommonTimeSelect currentTime={endTime} onMillis={setEndTime} />
          </div>
        </div>
        <div className="tw-mt-7 tw-flex tw-items-center">
          <button
            type="button"
            className="tw-bg-iron-700 tw-p-0 tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500 focus:tw-ring-offset-2"
            role="switch"
            aria-checked="false"
          >
            <span
              aria-hidden="true"
              className="tw-translate-x-0 tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-white tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out"
            ></span>
          </button>
          <span className="tw-ml-3 tw-text-sm">
            <span className="tw-font-medium tw-text-iron-300">No end time</span>
          </span>
        </div>
      </div>
      <div className="tw-mt-4">{components[selectedActionType]}</div>
    </div>
  );
}
