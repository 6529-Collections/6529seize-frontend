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

const VOTING_SETTINGS_GRID_CLASSES =
  "tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-3 tw-border-t tw-border-iron-700 tw-pt-6";
const VOTING_OPTIONS_GRID_CLASSES =
  "tw-mt-3 tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-4 [&>div]:tw-gap-x-2 [&>div]:tw-px-3 [&>div]:tw-py-3";

const CREDIT_SCOPE_OPTIONS: readonly {
  readonly scope: ApiWaveCreditScope;
  readonly label: string;
  readonly description: string;
}[] = [
  {
    scope: ApiWaveCreditScope.Wave,
    label: "Whole wave",
    description: "Each identity has one voting budget across the wave.",
  },
  {
    scope: ApiWaveCreditScope.Drop,
    label: "Each drop",
    description: "Voting power applies separately to every drop.",
  },
];

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
    errors.includes(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_INVALID)
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
  return (
    <fieldset className="tw-mt-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-px-0 tw-pb-0 tw-pt-6">
      <legend className="tw-mb-3 tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
        Voting power scope
      </legend>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2">
        {CREDIT_SCOPE_OPTIONS.map((option) => {
          const selected = creditScope === option.scope;
          return (
            <label
              key={option.scope}
              className={`tw-flex tw-cursor-pointer tw-gap-x-3 tw-rounded-xl tw-border tw-border-solid tw-p-4 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out ${
                selected
                  ? "tw-border-primary-400 tw-bg-primary-500/5 tw-ring-primary-500/30"
                  : "tw-border-white/5 tw-bg-iron-900 tw-ring-white/5 hover:tw-border-white/10 hover:tw-bg-iron-800 hover:tw-ring-white/10"
              }`}
            >
              <input
                type="radio"
                name="create-wave-credit-scope"
                value={option.scope}
                checked={selected}
                onChange={() => onCreditScopeChange(option.scope)}
                className="tw-mt-1 tw-form-radio tw-h-4 tw-w-4 tw-cursor-pointer tw-border tw-border-solid tw-border-iron-650 tw-bg-iron-800 tw-text-primary-400 tw-ring-offset-iron-800 tw-transition tw-duration-300 tw-ease-out focus:tw-ring-2 focus:tw-ring-primary-400"
              />
              <span className="tw-min-w-0">
                <span
                  className={`tw-block tw-text-sm tw-font-semibold ${
                    selected ? "tw-text-primary-400" : "tw-text-iron-200"
                  }`}
                >
                  {option.label}
                </span>
                <span className="tw-mt-1 tw-block tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
                  {option.description}
                </span>
              </span>
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
  const TITLES: Record<ApiWaveType, string> = {
    [ApiWaveType.Chat]: "How Drops are Rated",
    [ApiWaveType.Rank]: "How Drops are Voted",
    [ApiWaveType.Approve]: "How Drops are Voted",
  };
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
  const inferredApprovalHoldMode = getCreateWaveApprovalHoldMode({
    thresholdTimeMs: approvalThresholdTimeMs,
  });
  const approvalHoldMode =
    approvalHoldModeOverride ?? inferredApprovalHoldMode;
  const onApprovalHoldModeChange = (
    mode: CreateWaveApprovalHoldMode
  ): void => {
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
      <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
        {TITLES[waveType]}
      </p>
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
              onChange={onTypeChange}
            >
              <span
                className={`tw-flex tw-min-h-4 tw-items-center tw-text-sm tw-font-semibold ${
                  selectedType === votingType
                    ? "tw-text-white"
                    : "tw-text-iron-300 group-hover:tw-text-white"
                }`}
              >
                {WAVE_VOTING_LABELS[votingType]}
              </span>
            </CommonBorderedRadioButton>
          ))}
        {selectedType === ApiWaveCreditType.Rep && (
          <div className="tw-col-span-full">
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

      {showVotingSettings && (
        <div
          data-testid="create-wave-voting-settings-grid"
          className={VOTING_SETTINGS_GRID_CLASSES}
        >
          <MaxVotesPerIdentityInput
            value={maxVotesPerIdentityPerDrop}
            errors={errors}
            onChange={setMaxVotesPerIdentityPerDrop}
          />

          {waveType === ApiWaveType.Approve && (
            <CreateWaveVotingThreshold
              threshold={approvalThreshold}
              error={approvalThresholdError}
              setThreshold={setApprovalThreshold}
            />
          )}
        </div>
      )}

      {waveType === ApiWaveType.Approve && (
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
            <div className="tw-mt-3" data-testid="approval-hold-detail">
              <CreateWaveVotingThresholdTime
                thresholdTimeMs={approvalThresholdTimeMs}
                errorMessage={approvalThresholdTimeErrorMessage}
                usesTimeWeightedScore={timeWeighted.enabled}
                setThresholdTimeMs={onApprovalThresholdTimeChange}
              />
            </div>
          )}
        </>
      )}

      {/* Negative Voting Toggle - show for Rank and Approve waves */}
      {waveType !== ApiWaveType.Chat && (
        <NegativeVotingToggle
          allowNegativeVotes={allowNegativeVotes}
          onChange={onAllowNegativeVotesChange}
          isDisabled={false}
        />
      )}

      {/* Show Time-Weighted Voting for Rank waves */}
      {waveType === ApiWaveType.Rank && (
        <TimeWeightedVoting
          config={timeWeighted}
          errorMessage={timeWeightedErrorMessage}
          onChange={onTimeWeightedChange}
        />
      )}
    </div>
  );
}
