import React, { useState } from "react";
import CreateWaveDrops from "./drops/CreateWaveDrops";
import CreateWavesMainSteps from "./main-steps/CreateWavesMainSteps";
import CreateWaveOverview from "./overview/CreateWaveOverview";
import WavesRating from "../WavesRating";
import CreateWaveGroups from "./groups/CreateWaveGroups";
import CreateWaveDates from "./dates/CreateWaveDates";
import WavesOutcome from "../WavesOutcome";
import WavesApproveApproval from "../WavesApproveApproval";
import {
  CreateWaveConfig,
  CreateWaveStep,
  WaveSignatureType,
  WaveType,
} from "../../../types/waves.types";
import { getCurrentDayStartTimestamp } from "../../../helpers/calendar/calendar.helpers";
import dynamic from "next/dynamic";

const CreateWaveSvg = dynamic(() => import("./utils/CreateWaveSvg"), {
  ssr: false,
});

export default function CreateWave() {
  const [step, setStep] = useState<CreateWaveStep>(CreateWaveStep.DROPS);
  const currentDayStartTimestamp = getCurrentDayStartTimestamp();
  const [config, setConfig] = useState<CreateWaveConfig>({
    overview: {
      type: WaveType.CHAT,
      signatureType: WaveSignatureType.NONE,
      name: "",
      description: "",
    },
    groups: {
      canView: null,
      canDrop: null,
      canVote: null,
      admin: null,
    },
    dates: {
      submissionStartDate: currentDayStartTimestamp,
      votingStartDate: currentDayStartTimestamp,
      endDate: null,
    },
    drops: {
      requiredTypes: [],
      requiredMetadata: [],
    },
  });

  const setOverview = (overview: CreateWaveConfig["overview"]) => {
    setConfig((prev) => ({
      ...prev,
      overview,
    }));
  };

  const setDates = (dates: CreateWaveConfig["dates"]) => {
    setConfig((prev) => ({
      ...prev,
      dates,
    }));
  };

  const setDrops = (drops: CreateWaveConfig["drops"]) => {
    setConfig((prev) => ({
      ...prev,
      drops,
    }));
  };

  const stepComponent: Record<CreateWaveStep, JSX.Element> = {
    [CreateWaveStep.OVERVIEW]: (
      <CreateWaveOverview
        overview={config.overview}
        setOverview={setOverview}
      />
    ),
    [CreateWaveStep.GROUPS]: (
      <CreateWaveGroups waveType={config.overview.type} />
    ),
    [CreateWaveStep.DATES]: (
      <CreateWaveDates
        waveType={config.overview.type}
        dates={config.dates}
        setDates={setDates}
      />
    ),
    [CreateWaveStep.DROPS]: (
      <CreateWaveDrops drops={config.drops} setDrops={setDrops} />
    ),
    [CreateWaveStep.VOTING]: <WavesRating />,
    [CreateWaveStep.APPROVAL]: <WavesApproveApproval />,
  };

  return (
    <div className="tailwind-scope">
      <div className="tw-overflow-hidden">
        <div className="lg:tw-grid lg:tw-grid-cols-12 lg:tw-min-h-[95vh] tw-h-full tw-w-full">
          <CreateWavesMainSteps
            activeStep={step}
            waveType={config.overview.type}
            onStep={setStep}
          />
          <div className="tw-relative tw-bg-iron-900 tw-w-full tw-h-full lg:tw-rounded-l-[40px] tw-px-8 tw-pt-12 tw-pb-12 lg:tw-col-span-9">
            <div className="tw-relative tw-z-[1]">
              {stepComponent[step]}
              {/* <WavesOutcome /> */}
            </div>
            <div className="tw-absolute tw-inset-0">
              <CreateWaveSvg />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
