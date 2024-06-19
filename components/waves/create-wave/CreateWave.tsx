import React, { useEffect, useState } from "react";
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
  WaveRequiredMetadataType,
  WaveSignatureType,
} from "../../../types/waves.types";
import { getCurrentDayStartTimestamp } from "../../../helpers/calendar/calendar.helpers";
import dynamic from "next/dynamic";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import CreateWaveVoting from "./voting/CreateWaveVoting";
import CreateWaveApproval from "./approval/CreateWaveApproval";
import { GroupFull } from "../../../generated/models/GroupFull";
import { CreateNewWave } from "../../../generated/models/CreateNewWave";
import { WaveCreditType } from "../../../generated/models/WaveCreditType";
import { WaveCreditScope } from "../../../generated/models/WaveCreditScope";
import { WaveType } from "../../../generated/models/WaveType";

const CreateWaveSvg = dynamic(() => import("./utils/CreateWaveSvg"), {
  ssr: false,
});

export default function CreateWave({
  onBack,
}: {
  readonly onBack: () => void;
}) {
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
      requiredMetadata: [{ key: "", type: WaveRequiredMetadataType.STRING }],
    },
    voting: {
      type: WaveCreditType.Rep,
      category: null,
      profileId: null,
    },
    approval: {
      threshold: null,
      thresholdTimeMs: null,
    },
  });

  const [config, setConfig] = useState<CreateWaveConfig>(
    getInitialConfig({
      type: WaveType.Chat,
    })
  );

  const [step, setStep] = useState<CreateWaveStep>(CreateWaveStep.VOTING);

  const getIsVotingSignatureRequired = (): boolean => {
    return (
      config.overview.signatureType === WaveSignatureType.DROPS_AND_VOTING ||
      config.overview.signatureType === WaveSignatureType.VOTING
    );
  };

  const getIsParticipationSignatureRequired = (): boolean => {
    return (
      config.overview.signatureType === WaveSignatureType.DROPS_AND_VOTING ||
      config.overview.signatureType === WaveSignatureType.DROPS
    );
  };

  const getCreateNewWaveBody = (): CreateNewWave => {
    return {
      name: config.overview.name,
      description: config.overview.description,
      voting: {
        scope: {
          group_id: config.groups.canVote,
        },
        credit_type: WaveCreditType.Rep,
        // TODO: whats this???
        credit_scope: WaveCreditScope.Wave,
        credit_category: config.voting.category,
        creditor_id: config.voting.profileId,
        signature_required: getIsVotingSignatureRequired(),
      },
      visibility: {
        scope: {
          group_id: config.groups.canView,
        },
      },
      participation: {
        scope: {
          group_id: config.groups.canDrop,
        },
        // TODO: whats this???
        no_of_applications_allowed_per_participant: null,
        // TODO: needs also type
        required_metadata: config.drops.requiredMetadata.map((metadata) => ({
          name: metadata.key,
        })),
        signature_required: getIsParticipationSignatureRequired(),
        // TODO: whats this???
        period: undefined,
      },
      wave: {
        type: config.overview.type,
        // TODO: whats this???
        winning_thresholds: null,
        // TODO: whats this???
        max_winners: null,
        // TODO: needs new name
        time_lock_ms: config.approval.thresholdTimeMs,
        admin_group_id: config.groups.admin,
        // TODO: whats this???
        period: null,
      },
      outcomes: [],
    };
  };

  const onComplete = async (): Promise<void> => {};

  const onNextStep = async (): Promise<void> => {
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
        if (config.overview.type === WaveType.Approve) {
          setStep(CreateWaveStep.APPROVAL);
        } else {
          await onComplete();
        }
        break;
      case CreateWaveStep.APPROVAL:
        await onComplete();
        break;
      default:
        assertUnreachable(step);
    }
  };

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
    readonly group: GroupFull | null;
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

  const onVotingTypeChange = (type: WaveCreditType) => {
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
    <div className="tailwind-scope tw-bg-iron-950">
      <div className="tw-overflow-hidden tw-h-full tw-w-full">
        <button
          onClick={onBack}
          type="button"
          className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
        >
          <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 12H4M4 12L10 18M4 12L10 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span>Back</span>
        </button>
        <div className="tw-max-w-5xl tw-mx-auto lg:tw-flex tw-gap-x-24 tw-justify-center tw-h-full tw-w-full">
          <CreateWavesMainSteps
            activeStep={step}
            waveType={config.overview.type}
            onStep={setStep}
          />
          <div className="tw-relative tw-bg-iron-950 tw-w-full tw-min-h-screen tw-pt-12 tw-pb-12">
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
