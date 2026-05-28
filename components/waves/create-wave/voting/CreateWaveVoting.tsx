"use client";

import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWaveCreditNft } from "@/generated/models/ApiWaveCreditNft";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";
import CreateWaveApprovalTiming, {
  CreateWaveApprovalTimingMode,
  getCreateWaveApprovalTimingMode,
} from "./CreateWaveApprovalTiming";
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
const APPROVAL_TIMING_CONFLICT_ERROR =
  "Choose either minimum time above threshold or time-weighted voting.";
const DEFAULT_APPROVAL_THRESHOLD_TIME_MS = 60 * 1000;

const VOTING_SETTINGS_GRID_CLASSES =
  "tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-3 tw-border-t tw-border-iron-700 tw-pt-6";
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
    errors.includes(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_INVALID)
  ) {
    return APPROVAL_THRESHOLD_TIME_INVALID_ERROR;
  }

  return undefined;
};

export default function CreateWaveVoting({
  waveType,
  selectedType,
  category,
  profileId,
  creditNfts,
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
  const approvalTimingErrorMessage = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.APPROVAL_TIMING_OPTIONS_MUTUALLY_EXCLUSIVE
  )
    ? APPROVAL_TIMING_CONFLICT_ERROR
    : undefined;
  const showVotingSettings = waveType !== ApiWaveType.Chat;
  const approvalTimingMode = getCreateWaveApprovalTimingMode({
    thresholdTimeMs: approvalThresholdTimeMs,
    timeWeighted,
  });
  const timeWeightedConfig =
    approvalTimingMode === CreateWaveApprovalTimingMode.TIME_WEIGHTED
      ? { ...timeWeighted, enabled: true }
      : timeWeighted;
  const onApprovalTimingModeChange = (
    mode: CreateWaveApprovalTimingMode
  ): void => {
    switch (mode) {
      case CreateWaveApprovalTimingMode.IMMEDIATE:
        setApprovalThresholdTimeMs(null);
        onTimeWeightedChange({ ...timeWeighted, enabled: false });
        break;
      case CreateWaveApprovalTimingMode.THRESHOLD_TIME:
        setApprovalThresholdTimeMs(
          approvalThresholdTimeMs !== null &&
            Number.isFinite(approvalThresholdTimeMs) &&
            approvalThresholdTimeMs > 0
            ? approvalThresholdTimeMs
            : DEFAULT_APPROVAL_THRESHOLD_TIME_MS
        );
        onTimeWeightedChange({ ...timeWeighted, enabled: false });
        break;
      case CreateWaveApprovalTimingMode.TIME_WEIGHTED:
        setApprovalThresholdTimeMs(null);
        onTimeWeightedChange({ ...timeWeighted, enabled: true });
        break;
    }
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
                {getCreateWaveVotingLabel(votingType)}
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
          <CreateWaveApprovalTiming
            selectedMode={approvalTimingMode}
            errorMessage={approvalTimingErrorMessage}
            onModeChange={onApprovalTimingModeChange}
          />

          {approvalTimingMode === CreateWaveApprovalTimingMode.THRESHOLD_TIME && (
            <div className="tw-mt-3" data-testid="approval-timing-detail">
              <CreateWaveVotingThresholdTime
                thresholdTimeMs={approvalThresholdTimeMs}
                errorMessage={approvalThresholdTimeErrorMessage}
                setThresholdTimeMs={setApprovalThresholdTimeMs}
              />
            </div>
          )}

          {approvalTimingMode === CreateWaveApprovalTimingMode.TIME_WEIGHTED && (
            <div className="tw-mt-3" data-testid="approval-timing-detail">
              <TimeWeightedVoting
                config={timeWeightedConfig}
                errorMessage={timeWeightedErrorMessage}
                onChange={onTimeWeightedChange}
                showToggle={false}
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
