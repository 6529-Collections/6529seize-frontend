import type { RefObject } from "react";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { CreateWaveStep } from "@/types/waves.types";
import CreateWaveDates from "./dates/CreateWaveDates";
import type { CreateWaveDescriptionHandles } from "./description/CreateWaveDescription";
import CreateWaveDescription from "./description/CreateWaveDescription";
import CreateWaveDrops from "./drops/CreateWaveDrops";
import CreateWaveGroups from "./groups/CreateWaveGroups";
import type { useWaveConfig } from "./hooks/useWaveConfig";
import CreateWaveOutcomes from "./outcomes/CreateWaveOutcomes";
import CreateWaveOverview from "./overview/CreateWaveOverview";
import CreateWaveVoting from "./voting/CreateWaveVoting";
import CreateWaveVotingThreshold from "./voting/CreateWaveVotingThreshold";

type WaveConfigController = ReturnType<typeof useWaveConfig>;

export default function CreateWaveStepContent({
  controller,
  profile,
  descriptionRef,
  showDropError,
  onHaveDropToSubmitChange,
  onInlineGroupCreate,
}: {
  readonly controller: WaveConfigController;
  readonly profile: ApiIdentity;
  readonly descriptionRef: RefObject<CreateWaveDescriptionHandles | null>;
  readonly showDropError: boolean;
  readonly onHaveDropToSubmitChange: (haveDrop: boolean) => void;
  readonly onInlineGroupCreate: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
}) {
  const {
    config,
    step,
    selectedOutcomeType,
    errors,
    groupsCache,
    setOverview,
    setDates,
    setDrops,
    setOutcomes,
    setDropsAdminCanDelete,
    onOutcomeTypeChange,
    onGroupSelect,
    onVotingTypeChange,
    onCategoryChange,
    onProfileIdChange,
    onMaxVotesPerIdentityPerDropChange,
    onTimeWeightedVotingChange,
    onThresholdChange,
    onChatEnabledChange,
  } = controller;

  switch (step) {
    case CreateWaveStep.OVERVIEW:
      return (
        <CreateWaveOverview
          overview={config.overview}
          errors={errors}
          setOverview={setOverview}
        />
      );
    case CreateWaveStep.GROUPS:
      return (
        <CreateWaveGroups
          waveName={config.overview.name}
          waveType={config.overview.type}
          groups={config.groups}
          groupsCache={groupsCache}
          chatEnabled={config.chat.enabled}
          adminCanDeleteDrops={config.drops.adminCanDeleteDrops}
          setChatEnabled={onChatEnabledChange}
          onGroupSelect={onGroupSelect}
          onInlineGroupCreate={onInlineGroupCreate}
          setDropsAdminCanDelete={setDropsAdminCanDelete}
        />
      );
    case CreateWaveStep.DATES:
      return (
        <CreateWaveDates
          waveType={config.overview.type}
          dates={config.dates}
          errors={errors}
          setDates={setDates}
        />
      );
    case CreateWaveStep.DROPS:
      return (
        <CreateWaveDrops
          waveType={config.overview.type}
          drops={config.drops}
          errors={errors}
          setDrops={setDrops}
        />
      );
    case CreateWaveStep.VOTING:
      return (
        <CreateWaveVoting
          waveType={config.overview.type}
          selectedType={config.voting.type}
          category={config.voting.category}
          profileId={config.voting.profileId}
          maxVotesPerIdentityPerDrop={config.voting.maxVotesPerIdentityPerDrop}
          errors={errors}
          onTypeChange={onVotingTypeChange}
          setCategory={onCategoryChange}
          setProfileId={onProfileIdChange}
          setMaxVotesPerIdentityPerDrop={onMaxVotesPerIdentityPerDropChange}
          timeWeighted={config.voting.timeWeighted}
          onTimeWeightedChange={onTimeWeightedVotingChange}
        />
      );
    case CreateWaveStep.APPROVAL:
      return (
        <div>
          <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
            Approval
          </p>
          <div className="tw-mt-3">
            <CreateWaveVotingThreshold
              threshold={config.approval.threshold}
              error={errors.includes(
                CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED
              )}
              setThreshold={onThresholdChange}
            />
          </div>
        </div>
      );
    case CreateWaveStep.OUTCOMES:
      return (
        <CreateWaveOutcomes
          outcomes={config.outcomes}
          outcomeType={selectedOutcomeType}
          waveType={config.overview.type}
          errors={errors}
          dates={config.dates}
          setOutcomeType={onOutcomeTypeChange}
          setOutcomes={setOutcomes}
        />
      );
    case CreateWaveStep.DESCRIPTION:
      return (
        <CreateWaveDescription
          ref={descriptionRef}
          profile={profile}
          showDropError={showDropError}
          wave={{
            name: config.overview.name,
            image: config.overview.image
              ? URL.createObjectURL(config.overview.image)
              : null,
            id: null,
          }}
          onHaveDropToSubmitChange={onHaveDropToSubmitChange}
        />
      );
  }

  return null;
}
