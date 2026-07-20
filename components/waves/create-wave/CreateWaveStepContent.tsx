import type { RefObject } from "react";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CreateWaveStep } from "@/types/waves.types";
import CreateWaveDates from "./dates/CreateWaveDates";
import type { CreateWaveDescriptionHandles } from "./description/CreateWaveDescription";
import CreateWaveDescription from "./description/CreateWaveDescription";
import CreateWaveDrops from "./drops/CreateWaveDrops";
import CreateWaveGroups from "./groups/CreateWaveGroups";
import type { useWaveConfig } from "./hooks/useWaveConfig";
import CreateWaveOutcomes from "./outcomes/CreateWaveOutcomes";
import CreateWaveOverview from "./overview/CreateWaveOverview";
import CreateWaveRules from "./CreateWaveRules";
import CreateWaveVoting from "./voting/CreateWaveVoting";

type WaveConfigController = ReturnType<typeof useWaveConfig>;

export default function CreateWaveStepContent({
  controller,
  profile,
  descriptionRef,
  submitting,
  showDropError,
  onHaveDropToSubmitChange,
  onInlineGroupCreate,
}: {
  readonly controller: WaveConfigController;
  readonly profile: ApiIdentity;
  readonly descriptionRef: RefObject<CreateWaveDescriptionHandles | null>;
  readonly submitting: boolean;
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
    isMemeCountLoading,
    isMemeCountError,
    setOverview,
    setDates,
    setDrops,
    setOutcomes,
    setDisplay,
    setDropsAdminCanDelete,
    onOutcomeTypeChange,
    onGroupSelect,
    onVotingTypeChange,
    onCategoryChange,
    onProfileIdChange,
    onCreditNftsChange,
    onCreditScopeChange,
    onMaxVotesPerIdentityPerDropChange,
    onAllowNegativeVotesChange,
    onTimeWeightedVotingChange,
    onThresholdChange,
    onThresholdTimeChange,
    onApprovalMaxWinnersChange,
    onChatEnabledChange,
  } = controller;

  switch (step) {
    case CreateWaveStep.OVERVIEW:
      return (
        <CreateWaveOverview
          overview={config.overview}
          display={config.display}
          errors={errors}
          ongoingRanking={config.dates.ongoingRanking ?? false}
          setOverview={setOverview}
          setDisplay={setDisplay}
          onOngoingRankingChange={(ongoingRanking) =>
            setDates({ ...config.dates, ongoingRanking })
          }
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
          ongoingRanking={config.dates.ongoingRanking ?? false}
          setDrops={setDrops}
        />
      );
    case CreateWaveStep.RULES:
      return (
        <CreateWaveRules
          config={config}
          groupsCache={groupsCache}
          setDisplay={setDisplay}
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
          creditNfts={config.voting.creditNfts}
          creditScope={config.voting.creditScope}
          memeCount={config.voting.creditNftMemeCount}
          isMemeCountLoading={isMemeCountLoading}
          isMemeCountError={isMemeCountError}
          allowNegativeVotes={config.voting.allowNegativeVotes}
          maxVotesPerIdentityPerDrop={config.voting.maxVotesPerIdentityPerDrop}
          approvalThreshold={config.approval.threshold}
          approvalThresholdTimeMs={config.approval.thresholdTimeMs}
          errors={errors}
          onTypeChange={onVotingTypeChange}
          setCategory={onCategoryChange}
          setProfileId={onProfileIdChange}
          setCreditNfts={onCreditNftsChange}
          onCreditScopeChange={onCreditScopeChange}
          onAllowNegativeVotesChange={onAllowNegativeVotesChange}
          setMaxVotesPerIdentityPerDrop={onMaxVotesPerIdentityPerDropChange}
          setApprovalThreshold={onThresholdChange}
          setApprovalThresholdTimeMs={onThresholdTimeChange}
          timeWeighted={config.voting.timeWeighted}
          onTimeWeightedChange={onTimeWeightedVotingChange}
        />
      );
    case CreateWaveStep.APPROVAL:
      return null;
    case CreateWaveStep.OUTCOMES:
      return (
        <CreateWaveOutcomes
          outcomes={config.outcomes}
          outcomeType={selectedOutcomeType}
          waveType={config.overview.type}
          errors={errors}
          dates={config.dates}
          display={config.display}
          maxWinners={config.approval.maxWinners}
          setOutcomeType={onOutcomeTypeChange}
          setOutcomes={setOutcomes}
          setDisplay={setDisplay}
          setMaxWinners={onApprovalMaxWinnersChange}
        />
      );
    case CreateWaveStep.DESCRIPTION:
      return (
        <CreateWaveDescription
          ref={descriptionRef}
          profile={profile}
          submitting={submitting}
          showDropError={showDropError}
          visibilityGroupId={config.groups.canView}
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
