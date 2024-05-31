import React, { useState } from "react";
import CreateWaveDrops from "./drops/CreateWaveDrops";
import CreateWavesMainSteps from "./main-steps/CreateWavesMainSteps";
import CreateWaveOverview from "./overview/CreateWaveOverview";
import CreateWaveGroups from "./groups/CreateWaveGroups";
import CreateWaveDates from "./dates/CreateWaveDates";
import WavesOutcome from "../WavesOutcome";
import {
  CreateWaveConfig,
  CreateWaveGroupConfigType,
  CreateWaveStep,
  WaveSignatureType,
  WaveType,
  WaveVotingType,
} from "../../../types/waves.types";
import { getCurrentDayStartTimestamp } from "../../../helpers/calendar/calendar.helpers";
import dynamic from "next/dynamic";
import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import CreateWaveVoting from "./voting/CreateWaveVoting";
import CreateWaveApproval from "./approval/CreateWaveApproval";

const CreateWaveSvg = dynamic(() => import("./utils/CreateWaveSvg"), {
  ssr: false,
});

export default function CreateWave() {
  const getInitialConfig = ({
    type,
  }: {
    readonly type: WaveType;
  }): CreateWaveConfig => ({
    overview: {
      type,
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
      submissionStartDate: getCurrentDayStartTimestamp(),
      votingStartDate: getCurrentDayStartTimestamp(),
      endDate: null,
    },
    drops: {
      requiredTypes: [],
      requiredMetadata: [],
    },
    voting: {
      type: WaveVotingType.REP,
      category: null,
      profileId: null,
    },
    approval: {
      threshold: null,
      thresholdTimeMs: null,
    },
  });

  const [step, setStep] = useState<CreateWaveStep>(CreateWaveStep.APPROVAL);

  const onNextStep = () => {
    switch (step) {
      case CreateWaveStep.OVERVIEW:
        setStep(CreateWaveStep.GROUPS);
        break;
      case CreateWaveStep.GROUPS:
        setStep(CreateWaveStep.DATES);
        break;
      case CreateWaveStep.DATES:
        setStep(CreateWaveStep.DROPS);
        break;
      case CreateWaveStep.DROPS:
        setStep(CreateWaveStep.VOTING);
        break;
      case CreateWaveStep.VOTING:
        if (config.overview.type === WaveType.APPROVE) {
          setStep(CreateWaveStep.APPROVAL);
        }
        break;
      case CreateWaveStep.APPROVAL:
        break;
      default:
        assertUnreachable(step);
    }
  };

  const [config, setConfig] = useState<CreateWaveConfig>(
    getInitialConfig({
      type: WaveType.APPROVE,
    })
  );

  const setOverview = (overview: CreateWaveConfig["overview"]) => {
    setConfig((prev) => ({
      ...getInitialConfig({ type: overview.type }),
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

  const onGroupSelect = ({
    group,
    groupType,
  }: {
    readonly group: CurationFilterResponse | null;
    readonly groupType: CreateWaveGroupConfigType;
  }) => {
    switch (groupType) {
      case CreateWaveGroupConfigType.CAN_VIEW:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canView: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.CAN_DROP:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canDrop: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.CAN_VOTE:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canVote: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.ADMIN:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            admin: group?.id ?? null,
          },
        }));
        break;
      default:
        assertUnreachable(groupType);
    }
  };

  const onVotingTypeChange = (type: WaveVotingType) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        type,
        category: null,
        profileId: null,
      },
    }));
  };

  const onCategoryChange = (category: string | null) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        category,
      },
    }));
  };

  const onProfileIdChange = (profileId: string | null) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        profileId,
      },
    }));
  };

  const onThresholdChange = (threshold: number | null) => {
    setConfig((prev) => ({
      ...prev,
      approval: {
        ...prev.approval,
        threshold,
      },
    }));
  };

  const onThresholdTimeChange = (thresholdTimeMs: number | null) => {
    setConfig((prev) => ({
      ...prev,
      approval: {
        ...prev.approval,
        thresholdTimeMs,
      },
    }));
  };

  const stepComponent: Record<CreateWaveStep, JSX.Element> = {
    [CreateWaveStep.OVERVIEW]: (
      <CreateWaveOverview
        overview={config.overview}
        setOverview={setOverview}
        onNextStep={onNextStep}
      />
    ),
    [CreateWaveStep.GROUPS]: (
      <CreateWaveGroups
        waveType={config.overview.type}
        onGroupSelect={onGroupSelect}
        onNextStep={onNextStep}
      />
    ),
    [CreateWaveStep.DATES]: (
      <CreateWaveDates
        waveType={config.overview.type}
        dates={config.dates}
        setDates={setDates}
        onNextStep={onNextStep}
      />
    ),
    [CreateWaveStep.DROPS]: (
      <CreateWaveDrops
        drops={config.drops}
        setDrops={setDrops}
        onNextStep={onNextStep}
      />
    ),
    [CreateWaveStep.VOTING]: (
      <CreateWaveVoting
        waveType={config.overview.type}
        selectedType={config.voting.type}
        category={config.voting.category}
        profileId={config.voting.profileId}
        onTypeChange={onVotingTypeChange}
        setCategory={onCategoryChange}
        setProfileId={onProfileIdChange}
        onNextStep={onNextStep}
      />
    ),
    [CreateWaveStep.APPROVAL]: (
      <CreateWaveApproval
        threshold={config.approval.threshold}
        thresholdTimeMs={config.approval.thresholdTimeMs}
        setThreshold={onThresholdChange}
        setThresholdTimeMs={onThresholdTimeChange}
        onNextStep={onNextStep}
      />
    ),
  };

  return (
    <div className="tailwind-scope">
      <div className="tw-overflow-hidden lg:tw-min-h-[95vh] tw-h-full tw-w-full">
        <div className="tw-max-w-[58rem] tw-mx-auto tw-flex tw-gap-x-24 tw-pt-12 tw-pb-12">
          <CreateWavesMainSteps
            activeStep={step}
            waveType={config.overview.type}
            onStep={setStep}
          />
          <div className="tw-relative tw-bg-iron-950 tw-w-full tw-h-full">
            <div className="tw-relative tw-z-[1]">
              {stepComponent[step]}
              {/* <WavesOutcome /> */}
            </div>
            <div className="tw-absolute tw-inset-0 tw-translate-x-64">
              <CreateWaveSvg />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
