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
  WaveRequiredMetadataType,
  WaveSignatureType,
} from "../../../types/waves.types";
import { getCurrentDayStartTimestamp } from "../../../helpers/calendar/calendar.helpers";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import CreateWaveVoting from "./voting/CreateWaveVoting";
import CreateWaveApproval from "./approval/CreateWaveApproval";
import { GroupFull } from "../../../generated/models/GroupFull";
import { CreateNewWave } from "../../../generated/models/CreateNewWave";
import { WaveCreditType } from "../../../generated/models/WaveCreditType";
import { WaveCreditScope } from "../../../generated/models/WaveCreditScope";
import { WaveType } from "../../../generated/models/WaveType";
import CreateWaveActions from "./utils/CreateWaveActions";
import CreateWaveDescription from "./description/CreateWaveDescription";

export default function CreateWave({
  onBack,
}: {
  readonly onBack: () => void;
}) {
  const initialType = WaveType.Rank;
  const initialStep = CreateWaveStep.OVERVIEW;
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
      type: WaveCreditType.Tdh,
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
      type: initialType,
    })
  );

  const [step, setStep] = useState<CreateWaveStep>(initialStep);

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
        // TODO: needs also type and make sure to filter out empty strings
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
      />
    ),
    [CreateWaveStep.GROUPS]: (
      <CreateWaveGroups
        waveType={config.overview.type}
        onGroupSelect={onGroupSelect}
      />
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
    [CreateWaveStep.VOTING]: (
      <CreateWaveVoting
        selectedType={config.voting.type}
        category={config.voting.category}
        profileId={config.voting.profileId}
        onTypeChange={onVotingTypeChange}
        setCategory={onCategoryChange}
        setProfileId={onProfileIdChange}
      />
    ),
    [CreateWaveStep.APPROVAL]: (
      <CreateWaveApproval
        threshold={config.approval.threshold}
        thresholdTimeMs={config.approval.thresholdTimeMs}
        setThreshold={onThresholdChange}
        setThresholdTimeMs={onThresholdTimeChange}
      />
    ),
    [CreateWaveStep.DESCRIPTION]: <CreateWaveDescription />,
  };

  return (
    <div className="tailwind-scope tw-bg-iron-950">
      <div className="tw-overflow-hidden tw-h-full tw-w-full">
        <div className="tw-max-w-5xl tw-mx-auto tw-mt-8">
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
          <h1 className="tw-mb-0">Create new Wave</h1>
        </div>
        <div className="tw-mt-8 tw-mb-12 tw-max-w-5xl tw-mx-auto lg:tw-flex tw-gap-x-24 tw-justify-between tw-h-full tw-w-full">
          <div className="tw-1/4">
            <CreateWavesMainSteps
              activeStep={step}
              waveType={config.overview.type}
              onStep={setStep}
            />
          </div>
          <div className="tw-flex-1">
            <div className="tw-relative tw-w-full tw-bg-iron-900 tw-p-10 tw-rounded-xl">
              <div className="tw-relative tw-z-[1] tw-h-full">
                <div className="tw-flex tw-flex-col tw-h-full">
                  <div className="tw-flex-1">{stepComponent[step]}</div>
                  <div className="tw-mt-auto">
                    <CreateWaveActions
                      setStep={setStep}
                      step={step}
                      config={config}
                    />
                  </div>
                </div>
              </div>
              {/* <div className="tw-absolute tw-inset-0">
              <CreateWaveSvg />
            </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
