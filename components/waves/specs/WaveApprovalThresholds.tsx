"use client";

import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getApprovalWindowEndTime } from "@/helpers/waves/approve-wave.helpers";
import { invalidateWaveApprovalStatusQueries } from "@/hooks/waves/invalidateWaveApprovalStatusQueries";
import { parsePositiveWholeNumberInput } from "../create-wave/utils/positiveWholeNumberInput";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import WaveApprovalThresholdsEditorForm, {
  type ApprovalThresholdTimeUnit,
} from "./WaveApprovalThresholdsEditorForm";
import WaveSettingRow from "./WaveSettingRow";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";

interface WaveApprovalThresholdsProps {
  readonly wave: ApiWave;
}

const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const MINUTES_IN_HOUR = 60;

const getUnitMs = (unit: ApprovalThresholdTimeUnit): number =>
  unit === "hours" ? HOUR_IN_MS : MINUTE_IN_MS;

const getValidThreshold = (
  threshold: number | null | undefined
): number | null =>
  typeof threshold === "number" &&
  Number.isFinite(threshold) &&
  Number.isInteger(threshold) &&
  threshold > 0
    ? threshold
    : null;

const getThresholdTimeInput = (
  durationMs: number | null | undefined
): { readonly value: string; readonly unit: ApprovalThresholdTimeUnit } => {
  if (
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  ) {
    return { value: "", unit: "minutes" };
  }

  if (durationMs % HOUR_IN_MS === 0) {
    return { value: String(durationMs / HOUR_IN_MS), unit: "hours" };
  }

  if (durationMs % MINUTE_IN_MS === 0) {
    return { value: String(durationMs / MINUTE_IN_MS), unit: "minutes" };
  }

  return { value: "", unit: "minutes" };
};

const formatThresholdMinDuration = (
  durationMs: number | null | undefined
): string => {
  if (
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  ) {
    return "Immediate";
  }

  const totalMinutes = Math.floor(durationMs / MINUTE_IN_MS);
  if (totalMinutes <= 0) {
    return "<1m";
  }

  const hours = Math.floor(totalMinutes / MINUTES_IN_HOUR);
  const minutes = totalMinutes % MINUTES_IN_HOUR;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};

const getApprovalWindowDurationMs = (wave: ApiWave): number | null => {
  const startTime = wave.participation.period?.min;
  const endTime = getApprovalWindowEndTime(wave);

  if (
    typeof startTime !== "number" ||
    !Number.isFinite(startTime) ||
    typeof endTime !== "number" ||
    !Number.isFinite(endTime)
  ) {
    return null;
  }

  return Math.max(0, endTime - startTime);
};

export default function WaveApprovalThresholds({
  wave,
}: WaveApprovalThresholdsProps) {
  const { canEdit, mutating, saveWaveConfigUpdate, setToast } =
    useWaveSettingUpdater(wave);
  const queryClient = useQueryClient();
  const threshold = getValidThreshold(wave.wave.winning_threshold);
  const minDurationMs = wave.wave.winning_threshold_min_duration_ms;
  const initialThresholdValue = threshold === null ? "" : String(threshold);
  const initialTimeInput = getThresholdTimeInput(minDurationMs);
  const [thresholdValue, setThresholdValue] = useState(initialThresholdValue);
  const [minTimeValue, setMinTimeValue] = useState(initialTimeInput.value);
  const [unit, setUnit] = useState<ApprovalThresholdTimeUnit>(
    initialTimeInput.unit
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const resetEditor = useCallback(() => {
    const nextThreshold = getValidThreshold(wave.wave.winning_threshold);
    const nextTimeInput = getThresholdTimeInput(
      wave.wave.winning_threshold_min_duration_ms
    );

    setThresholdValue(nextThreshold === null ? "" : String(nextThreshold));
    setMinTimeValue(nextTimeInput.value);
    setUnit(nextTimeInput.unit);
  }, [wave.wave.winning_threshold, wave.wave.winning_threshold_min_duration_ms]);

  const handleSave = (closeEditor: () => void) => {
    const parsedThreshold = parsePositiveWholeNumberInput(thresholdValue);
    if (parsedThreshold === null) {
      setToast({
        type: "error",
        message: "Approval threshold must be a whole number greater than 0",
      });
      return;
    }

    const trimmedMinTimeValue = minTimeValue.trim();
    const parsedMinTime =
      trimmedMinTimeValue === ""
        ? null
        : parsePositiveWholeNumberInput(trimmedMinTimeValue);
    if (trimmedMinTimeValue !== "" && parsedMinTime === null) {
      setToast({
        type: "error",
        message:
          "Minimum time must be a whole number greater than 0, or blank for immediate approval",
      });
      return;
    }

    const nextMinDurationMs =
      parsedMinTime === null ? 0 : parsedMinTime * getUnitMs(unit);
    const approvalWindowDurationMs = getApprovalWindowDurationMs(wave);
    if (
      approvalWindowDurationMs !== null &&
      nextMinDurationMs > approvalWindowDurationMs
    ) {
      setToast({
        type: "error",
        message: "Minimum time cannot be longer than the approval window",
      });
      return;
    }

    saveWaveConfigUpdate(
      closeEditor,
      (waveConfig) => ({
        ...waveConfig,
        winning_threshold: parsedThreshold,
        winning_threshold_min_duration_ms: nextMinDurationMs,
      }),
      () => invalidateWaveApprovalStatusQueries(queryClient, wave.id)
    );
  };

  const valueLabel =
    threshold === null
      ? "Not set"
      : (() => {
          const minDurationLabel = formatThresholdMinDuration(minDurationMs);
          return (
            <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-1">
              <span>{formatNumberWithCommas(threshold)}</span>
              <span aria-hidden="true">·</span>
              <span className="tw-whitespace-nowrap">
                Min time: {minDurationLabel}
              </span>
            </span>
          );
        })();

  const renderEditor = ({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) => (
    <WaveApprovalThresholdsEditorForm
      disabled={mutating}
      inputRef={inputRef}
      minTimeValue={minTimeValue}
      onCancel={closeEditor}
      onMinTimeValueChange={setMinTimeValue}
      onSave={() => handleSave(closeEditor)}
      onThresholdValueChange={setThresholdValue}
      onUnitChange={setUnit}
      thresholdValue={thresholdValue}
      unit={unit}
    />
  );

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editLabel="Edit approval threshold"
      label="Approval threshold"
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={valueLabel}
    />
  );
}
