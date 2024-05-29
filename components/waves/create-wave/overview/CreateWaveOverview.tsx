import { useState } from "react";
import {
  WaveOverviewConfig,
  WaveSignatureType,
  WaveType,
} from "../../../../types/waves.types";

import CreateWaveOverviewInputs from "./CreateWaveOverviewInputs";

import CreateWaveSignature from "./signature/CreateWaveSignature";
import CreateWaveType from "./type/CreateWaveType";

export default function CreateWaveOverview({
  overview,
  setOverview,
}: {
  readonly overview: WaveOverviewConfig;
  readonly setOverview: (overview: WaveOverviewConfig) => void;
}) {
  const onChange = <K extends keyof WaveOverviewConfig>({
    key,
    value,
  }: {
    readonly key: K;
    readonly value: WaveOverviewConfig[K];
  }) =>
    setOverview({
      ...overview,
      [key]: value,
    });

  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-flex tw-flex-col tw-space-y-8">
        <CreateWaveOverviewInputs onChange={onChange} />
        <CreateWaveType
          selected={overview.type}
          onChange={(type) =>
            onChange({
              key: "type",
              value: type,
            })
          }
        />
        <CreateWaveSignature
          selectedWaveType={overview.type}
          selectedSignatureType={overview.signatureType}
          onChange={(type) => onChange({ key: "signatureType", value: type })}
        />
        <div className="tw-text-right">
          <button
            type="button"
            className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-base tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            <span>Next step</span>
          </button>
        </div>
      </div>
    </div>
  );
}
