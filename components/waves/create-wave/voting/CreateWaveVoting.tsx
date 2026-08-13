"use client";

import { useState } from "react";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWaveCreditNft } from "@/generated/models/ApiWaveCreditNft";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";
import CreateWaveApprovalHold, {
  CreateWaveApprovalHoldMode,
  getCreateWaveApprovalHoldMode,
} from "./CreateWaveApprovalHold";
import CreateWaveVotingRep from "./CreateWaveVotingRep";
import CreateWaveVotingThreshold from "./CreateWaveVotingThreshold";
import CreateWaveVotingThresholdTime from "./CreateWaveVotingThresholdTime";
import MemeCardSetPicker from "./MemeCardSetPicker";
import MaxVotesPerIdentityInput from "./MaxVotesPerIdentityInput";
import NegativeVotingToggle from "./NegativeVotingToggle";
import TimeWeightedVoting from "./TimeWeightedVoting";
import type { TimeWeightedVotingConfig } from "./types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CreateWaveAdvancedSection from "../utils/CreateWaveAdvancedSection";
import CreateWaveStepHeader from "../utils/CreateWaveStepHeader";

const VOTING_TYPES_ORDER: Record<ApiWaveCreditType, number | undefined> = {
  [ApiWaveCreditType.TdhPlusXtdh]: 0,
  [ApiWaveCreditType.Tdh]: 1,
  [ApiWaveCreditType.Rep]: 2,
  [ApiWaveCreditType.CardSetTdh]: 3,
  [ApiWaveCreditType.Xtdh]: undefined,
};

const TIME_WEIGHTED_DURATION_ERROR =
  "This interval is longer than the wave duration. Choose a shorter interval, extend the wave end date, or clear the end date.";
const APPROVAL_THRESHOLD_TIME_INVALID_ERROR =
  "Enter a whole number greater than 0, or leave blank for immediate approval.";
const APPROVAL_THRESHOLD_TIME_DURATION_ERROR =
  "This time is longer than the wave duration. Choose a shorter time, extend the wave end date, or clear the end date.";
const DEFAULT_APPROVAL_THRESHOLD_TIME_MS = 60 * 1000;

const ADVANCED_VOTING_ERRORS = new Set<CREATE_WAVE_VALIDATION_ERROR>([
  CREATE_WAVE_VALIDATION_ERROR.MAX_VOTES_PER_IDENTITY_PER_DROP_INVALID,
  CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_TOO_SMALL,
  CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_TOO_LARGE,
  CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION,
  CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_INVALID,
  CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_EXCEEDS_WAVE_DURATION,
]);

const VOTING_SETTINGS_GRID_CLASSES =
  "tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-6";
const VOTING_OPTIONS_GRID_CLASSES =
  "tw-mt-3 tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-4 [&>div]:tw-gap-x-2 [&>div]:tw-px-3 [&>div]:tw-py-3";

const getCreateWaveVotingLabel = (votingType: ApiWaveCreditType): string => {
  if (votingType === ApiWaveCreditType.CardSetTdh) {
    return "Memes TDH";
  }

  return WAVE_VOTING_LABELS[votingType];
};

const getApprovalThresholdTimeErrorMessage = (
  errors: CREATE_WAVE_VALIDATION_ERROR[]
): string | undefined => {
  if (
    errors.includes(
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_EXCEEDS_WAVE_DURATION
    )
  ) {
    return APPROVAL_THRESHOLD_TIME_DURATION_ERROR;
  }

  if (
    errors.includes(
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_INVALID
    )
  ) {
    return APPROVAL_THRESHOLD_TIME_INVALID_ERROR;
  }

  return undefined;
};

function CreateWaveCreditScopeSelect({
  creditScope,
  onCreditScopeChange,
}: {
  readonly creditScope: ApiWaveCreditScope;
  readonly onCreditScopeChange: (scope: ApiWaveCreditScope) => void;
}) {
  const locale = useBrowserLocale();
  const creditScopeOptions = [
    {
      scope: ApiWaveCreditScope.Wave,
      label: t(locale, "waves.create.voting.scope.wave.label"),
      description: t(locale, "waves.create.voting.scope.wave.description"),
    },
    {
      scope: ApiWaveCreditScope.Drop,
      label: t(locale, "waves.create.voting.scope.drop.label"),
      description: t(locale, "waves.create.voting.scope.drop.description"),
    },
  ] as const;

  return (
    <fieldset className="tw-mt-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-px-0 tw-pb-0 tw-pt-6">
      <legend className="tw-mb-3 tw-mt-0 tw-block tw-pr-4 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
        {t(locale, "waves.create.voting.scope.legend")}
      </legend>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2">
        {creditScopeOptions.map((option) => {
          const isSelected = creditScope === option.scope;
          return (
            <CommonBorderedRadioButton
              key={option.scope}
              type={option.scope}
              selected={creditScope}
              variant="subtle"
              name="create-wave-credit-scope"
              ariaLabel={option.label}
              onChange={onCreditScopeChange}
            >
              <span className="tw-min-w-0 tw-whitespace-normal">
                <span
                  className={`tw-flex tw-min-h-4 tw-items-center tw-text-sm tw-font-semibold ${
                    isSelected
                      ? "tw-text-white"
                      : "tw-text-iron-300 group-hover:tw-text-white"
                  }`}
                >
                  {option.label}
                </span>
                <span
                  className={`tw-mt-1 tw-block tw-text-xs tw-font-normal tw-leading-4 ${
                    isSelected ? "tw-text-iron-300" : "tw-text-iron-400"
                  }`}
                >
                  {option.description}
                </span>
              </span>
            </CommonBorderedRadioButton>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function CreateWaveVoting({
  waveType,
  selectedType,
  category,
  profileId,
  creditNfts,
  creditScope,
  memeCount,
  isMemeCountLoading,
  isMemeCountError,
  allowNegativeVotes,
  maxVotesPerIdentityPerDrop,
  approvalThreshold,
  approvalThresholdTimeMs,
  errors,
  onTypeChange,
  setCategory,
  setProfileId,
  setCreditNfts,
  onCreditScopeChange,
  onAllowNegativeVotesChange,
  setMaxVotesPerIdentityPerDrop,
  setApprovalThreshold,
  setApprovalThresholdTimeMs,
  timeWeighted,
  onTimeWeightedChange,
}: {
  readonly waveType: ApiWaveType;
  readonly selectedType: ApiWaveCreditType | null;
  readonly category: string | null;
  readonly profileId: string | null;
  readonly creditNfts: ApiWaveCreditNft[];
  readonly creditScope: ApiWaveCreditScope;
  readonly memeCount: number | null;
  readonly isMemeCountLoading: boolean;
  readonly isMemeCountError: boolean;
  readonly allowNegativeVotes: boolean;
  readonly maxVotesPerIdentityPerDrop: number | null;
  readonly approvalThreshold: number | null;
  readonly approvalThresholdTimeMs: number | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onTypeChange: (type: ApiWaveCreditType) => void;
  readonly setCategory: (category: string | null) => void;
  readonly setProfileId: (profileId: string | null) => void;
  readonly setCreditNfts: (creditNfts: ApiWaveCreditNft[]) => void;
  readonly onCreditScopeChange: (scope: ApiWaveCreditScope) => void;
  readonly onAllowNegativeVotesChange: (allowNegativeVotes: boolean) => void;
  readonly setMaxVotesPerIdentityPerDrop: (value: number | null) => void;
  readonly setApprovalThreshold: (value: number | null) => void;
  readonly setApprovalThresholdTimeMs: (value: number | null) => void;
  readonly timeWeighted: TimeWeightedVotingConfig;
  readonly onTimeWeightedChange: (config: TimeWeightedVotingConfig) => void;
}) {
  const locale = useBrowserLocale();
  const [approvalHoldModeOverride, setApprovalHoldModeOverride] =
    useState<CreateWaveApprovalHoldMode | null>(null);

  if (selectedType === null) {
    return null;
  }

  const timeWeightedErrorMessage = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION
  )
    ? TIME_WEIGHTED_DURATION_ERROR
    : undefined;
  const approvalThresholdError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED
  );
  const approvalThresholdTimeErrorMessage =
    getApprovalThresholdTimeErrorMessage(errors);
  const showVotingSettings = waveType !== ApiWaveType.Chat;
  const hasAdvancedError = errors.some((error) =>
    ADVANCED_VOTING_ERRORS.has(error)
  );
  const isAdvancedCustomized =
    maxVotesPerIdentityPerDrop !== null ||
    !allowNegativeVotes ||
    timeWeighted.enabled ||
    approvalThresholdTimeMs !== null;
  const inferredApprovalHoldMode = getCreateWaveApprovalHoldMode({
    thresholdTimeMs: approvalThresholdTimeMs,
  });
  const approvalHoldMode = approvalHoldModeOverride ?? inferredApprovalHoldMode;
  const onApprovalHoldModeChange = (mode: CreateWaveApprovalHoldMode): void => {
    setApprovalHoldModeOverride(mode);

    switch (mode) {
      case CreateWaveApprovalHoldMode.NONE:
        setApprovalThresholdTimeMs(null);
        break;
      case CreateWaveApprovalHoldMode.HOLD:
        setApprovalThresholdTimeMs(
          approvalThresholdTimeMs !== null &&
            Number.isFinite(approvalThresholdTimeMs) &&
            approvalThresholdTimeMs > 0
            ? approvalThresholdTimeMs
            : DEFAULT_APPROVAL_THRESHOLD_TIME_MS
        );
        break;
    }
  };
  const onApprovalThresholdTimeChange = (value: number | null): void => {
    setApprovalHoldModeOverride(CreateWaveApprovalHoldMode.HOLD);
    setApprovalThresholdTimeMs(value);
  };

  return (
    <div>
      <CreateWaveStepHeader
        title={t(
          locale,
          waveType === ApiWaveType.Chat
            ? "waves.create.voting.ratingTitle"
            : "waves.create.voting.title"
        )}
      />
      <div className={VOTING_OPTIONS_GRID_CLASSES}>
        {(Object.keys(VOTING_TYPES_ORDER) as ApiWaveCreditType[])
          .filter((votingType) => VOTING_TYPES_ORDER[votingType] !== undefined)
          .map((votingType) => (
            <CommonBorderedRadioButton
              key={votingType}
              type={votingType}
              selected={selectedType}
              disabled={false}
              variant="subtle"
              name="create-wave-credit-type"
              ariaLabel={getCreateWaveVotingLabel(votingType)}
              onChange={onTypeChange}
            >
              <span
                className={`tw-flex tw-min-h-4 tw-items-center tw-text-sm tw-font-semibold ${
                  selectedType === votingType
                    ? "tw-text-white"
                    : "tw-text-iron-300 group-hover:tw-text-white"
                }`}
              >
                {getCreateWaveVotingLabel(votingType)}
              </span>
            </CommonBorderedRadioButton>
          ))}
        {selectedType === ApiWaveCreditType.Rep && (
          <div className="tw-col-span-full !tw-px-0 !tw-py-0">
            <CreateWaveVotingRep
              category={category}
              profileId={profileId}
              errors={errors}
              setCategory={setCategory}
              setProfileId={setProfileId}
            />
          </div>
        )}
        {selectedType === ApiWaveCreditType.CardSetTdh && (
          <MemeCardSetPicker
            creditNfts={creditNfts}
            memeCount={memeCount}
            isMemeCountLoading={isMemeCountLoading}
            isMemeCountError={isMemeCountError}
            errors={errors}
            onCreditNftsChange={setCreditNfts}
          />
        )}
      </div>

      <CreateWaveCreditScopeSelect
        creditScope={creditScope}
        onCreditScopeChange={onCreditScopeChange}
      />

      {waveType === ApiWaveType.Approve && (
        <div
          data-testid="create-wave-voting-settings-grid"
          className={VOTING_SETTINGS_GRID_CLASSES}
        >
          <CreateWaveVotingThreshold
            threshold={approvalThreshold}
            error={approvalThresholdError}
            setThreshold={setApprovalThreshold}
          />
        </div>
      )}

      {showVotingSettings && (
        <div className="tw-mt-6">
          <CreateWaveAdvancedSection
            title={t(
              locale,
              waveType === ApiWaveType.Approve
                ? "waves.create.voting.approveAdvancedSummary"
                : "waves.create.voting.rankAdvancedSummary"
            )}
            isCustomized={isAdvancedCustomized}
            hasError={hasAdvancedError}
            variant="filled"
          >
            <div className="tw-space-y-3 tw-p-5">
              <MaxVotesPerIdentityInput
                value={maxVotesPerIdentityPerDrop}
                errors={errors}
                onChange={setMaxVotesPerIdentityPerDrop}
              />

              {waveType === ApiWaveType.Approve ? (
                <>
                  <TimeWeightedVoting
                    config={timeWeighted}
                    errorMessage={timeWeightedErrorMessage}
                    onChange={onTimeWeightedChange}
                  />

                  <CreateWaveApprovalHold
                    selectedMode={approvalHoldMode}
                    onModeChange={onApprovalHoldModeChange}
                  />

                  {approvalHoldMode === CreateWaveApprovalHoldMode.HOLD && (
                    <div data-testid="approval-hold-detail">
                      <CreateWaveVotingThresholdTime
                        thresholdTimeMs={approvalThresholdTimeMs}
                        errorMessage={approvalThresholdTimeErrorMessage}
                        usesTimeWeightedScore={timeWeighted.enabled}
                        setThresholdTimeMs={onApprovalThresholdTimeChange}
                      />
                    </div>
                  )}

                  <NegativeVotingToggle
                    allowNegativeVotes={allowNegativeVotes}
                    onChange={onAllowNegativeVotesChange}
                    isDisabled={false}
                  />
                </>
              ) : (
                <>
                  <NegativeVotingToggle
                    allowNegativeVotes={allowNegativeVotes}
                    onChange={onAllowNegativeVotesChange}
                    isDisabled={false}
                  />
                  <TimeWeightedVoting
                    config={timeWeighted}
                    errorMessage={timeWeightedErrorMessage}
                    onChange={onTimeWeightedChange}
                  />
                </>
              )}
            </div>
          </CreateWaveAdvancedSection>
        </div>
      )}
    </div>
  );
}
