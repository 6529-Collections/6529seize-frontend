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
  "tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 md:tw-grid-cols-4 [&>div]:tw-gap-x-2 [&>div]:tw-px-3 [&>div]:tw-py-3";
const CREDIT_SCOPE_PREVIEW_ITEMS = [0, 1, 2] as const;

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

function CreditScopePreview({
  scope,
  isSelected,
}: {
  readonly scope: ApiWaveCreditScope;
  readonly isSelected: boolean;
}) {
  const accentClass = isSelected ? "tw-bg-primary-400/80" : "tw-bg-iron-650";
  const connectorClass = isSelected ? "tw-bg-primary-500/30" : "tw-bg-iron-700";
  const sharedConnectorClasses = [
    "-tw-right-1.5 tw-left-1/2 sm:-tw-right-2",
    "-tw-right-1.5 tw-left-0 sm:-tw-right-2",
    "tw-left-0 tw-right-1/2",
  ] as const;
  const creditPool = (
    <span className="tw-flex tw-h-3 tw-w-9 tw-items-center tw-gap-0.5 tw-rounded-full tw-bg-iron-800 tw-px-1">
      {CREDIT_SCOPE_PREVIEW_ITEMS.map((item) => (
        <span
          key={item}
          className={`tw-h-1 tw-min-w-0 tw-flex-1 tw-rounded-full ${accentClass}`}
        />
      ))}
    </span>
  );

  return (
    <div
      aria-hidden="true"
      className="tw-mb-2 tw-h-16 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 tw-p-2 sm:tw-mb-3 sm:tw-h-20 sm:tw-p-2.5"
    >
      <div className="tw-flex tw-h-full tw-flex-col tw-items-center tw-justify-center">
        <div className="tw-grid tw-h-3 tw-w-full tw-max-w-36 tw-grid-cols-3 tw-gap-1.5 sm:tw-gap-2">
          {scope === ApiWaveCreditScope.Wave ? (
            <span className="tw-col-span-3 tw-flex tw-justify-center">
              {creditPool}
            </span>
          ) : (
            CREDIT_SCOPE_PREVIEW_ITEMS.map((item) => (
              <span key={item} className="tw-flex tw-justify-center">
                {creditPool}
              </span>
            ))
          )}
        </div>
        <div className="tw-relative tw-grid tw-h-3 tw-w-full tw-max-w-36 tw-grid-cols-3 tw-gap-1.5 sm:tw-gap-2">
          {CREDIT_SCOPE_PREVIEW_ITEMS.map((item) => (
            <span key={item} className="tw-relative">
              {scope === ApiWaveCreditScope.Wave && (
                <span
                  className={`tw-absolute tw-top-1.5 tw-h-px ${connectorClass} ${sharedConnectorClasses[item]}`}
                />
              )}
              <span
                className={`tw-relative tw-z-[1] tw-mx-auto tw-block tw-w-px ${connectorClass} ${
                  scope === ApiWaveCreditScope.Wave && item !== 1
                    ? "tw-mt-1.5 tw-h-1.5"
                    : "tw-h-full"
                }`}
              />
            </span>
          ))}
        </div>
        <div className="tw-grid tw-w-full tw-max-w-36 tw-grid-cols-3 tw-gap-1.5 sm:tw-gap-2">
          {CREDIT_SCOPE_PREVIEW_ITEMS.map((item) => (
            <span
              key={item}
              className="tw-flex tw-h-6 tw-flex-col tw-justify-center tw-gap-1 tw-rounded-sm tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-px-1.5"
            >
              <span className="tw-block tw-h-1 tw-w-2/3 tw-rounded-full tw-bg-iron-700" />
              <span className="tw-block tw-h-1 tw-w-full tw-rounded-full tw-bg-iron-800" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      <div className="tw-grid tw-grid-cols-2 tw-gap-3">
        {creditScopeOptions.map((option) => {
          const isSelected = creditScope === option.scope;
          return (
            <label
              key={option.scope}
              className={`tw-group tw-min-w-0 tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-p-2 tw-transition tw-duration-300 tw-ease-out focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 sm:tw-p-3 ${
                isSelected
                  ? "tw-border-primary-500/60 tw-bg-iron-900 tw-shadow-inner"
                  : "tw-border-white/5 tw-bg-iron-900/60 hover:tw-border-white/10 hover:tw-bg-iron-900"
              }`}
            >
              <CreditScopePreview
                scope={option.scope}
                isSelected={isSelected}
              />
              <div className="tw-flex tw-items-start tw-gap-2 sm:tw-gap-3">
                <input
                  id={`create-wave-credit-scope-${option.scope}`}
                  type="radio"
                  name="create-wave-credit-scope"
                  checked={isSelected}
                  aria-label={option.label}
                  onChange={() => onCreditScopeChange(option.scope)}
                  className="tw-peer tw-sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`tw-mt-0.5 tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out ${
                    isSelected
                      ? "tw-border-primary-400 tw-bg-primary-500/10"
                      : "tw-border-iron-600 tw-bg-transparent group-hover:tw-border-iron-500"
                  }`}
                >
                  <span
                    className={`tw-size-2 tw-rounded-full tw-bg-primary-400 tw-transition tw-duration-200 ${
                      isSelected ? "tw-scale-100" : "tw-scale-0"
                    }`}
                  />
                </span>
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
                    className={`tw-mt-1 tw-block tw-min-h-8 tw-text-xs tw-font-normal tw-leading-4 ${
                      isSelected ? "tw-text-iron-300" : "tw-text-iron-400"
                    }`}
                  >
                    {option.description}
                  </span>
                </span>
              </div>
            </label>
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
