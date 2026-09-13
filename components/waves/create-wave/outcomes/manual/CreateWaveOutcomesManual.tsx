"use client";

import { useEffect, useState } from "react";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import {
  CreateWaveOutcomeType,
  CreateWaveOutcomeConfigWinnersCreditValueType,
} from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES,
  CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES,
  getCreateWaveOutcomeInputStateClasses,
  getCreateWaveOutcomeLabelStateClasses,
} from "../createWaveOutcomeStyles";

// Winning positions drive a `new Array(maxPosition)` allocation at submit, so an
// out-of-range value (e.g. a 10-digit rank, or a very wide range) would throw
// "RangeError: Invalid array length" and crash the form.
const MAX_WINNING_POSITION = 10_000;

const POSITIONS_FORMAT_ERROR = "Invalid position format";
const POSITIONS_MIN_ERROR = "Positions start at 1";
const POSITIONS_MAX_ERROR = `Positions can't go above ${MAX_WINNING_POSITION.toLocaleString(
  "en-US"
)}`;
const backwardsRangeError = (segment: string): string =>
  `Range ${segment} is backwards — put the lower position first`;

// Shape gates, applied per comma-separated segment. Two flat patterns rather
// than one combined `(\d+(-\d+)?)(,\d+(-\d+)?)*`: nesting quantifiers inside
// optional/repeated groups is what makes a pattern a backtracking risk, and both
// of these keep their quantifiers as siblings.
const SINGLE_POSITION = /^\d+$/;
const POSITION_RANGE = /^\d+-\d+$/;

type PositionsParseResult =
  | { readonly ok: true; readonly positions: readonly number[] }
  | { readonly ok: false; readonly error: string };

const rejected = (error: string): PositionsParseResult => ({
  ok: false,
  error,
});

// The segment shape is validated before this runs, so every parseInt below is
// guaranteed to see digits and cannot produce NaN.
const parseSegment = (segment: string): PositionsParseResult => {
  if (SINGLE_POSITION.test(segment)) {
    const position = Number.parseInt(segment, 10);
    if (position < 1) return rejected(POSITIONS_MIN_ERROR);
    if (position > MAX_WINNING_POSITION) return rejected(POSITIONS_MAX_ERROR);
    return { ok: true, positions: [position] };
  }

  if (!POSITION_RANGE.test(segment)) {
    return rejected(POSITIONS_FORMAT_ERROR);
  }

  const [startText = "", endText = ""] = segment.split("-");
  const start = Number.parseInt(startText, 10);
  const end = Number.parseInt(endText, 10);
  if (start < 1) return rejected(POSITIONS_MIN_ERROR);
  if (end < start) return rejected(backwardsRangeError(segment));
  if (end > MAX_WINNING_POSITION) return rejected(POSITIONS_MAX_ERROR);
  return {
    ok: true,
    positions: Array.from({ length: end - start + 1 }, (_, i) => start + i),
  };
};

/**
 * Parses the winning-positions field.
 *
 * Any invalid segment rejects the WHOLE input. Previously an out-of-range
 * segment was filtered out while shape errors failed the whole string, so
 * "1,0-2" quietly saved position 1 alone and the user was never told that the
 * rest of what they typed had been dropped — and a wave's winner structure is
 * fixed at creation.
 */
const parseWinningPositions = (input: string): PositionsParseResult => {
  const cleanInput = input.replace(/\s/g, "");
  if (!cleanInput) {
    return rejected(POSITIONS_FORMAT_ERROR);
  }

  const collected: number[] = [];
  for (const segment of cleanInput.split(",")) {
    const parsed = parseSegment(segment);
    if (!parsed.ok) {
      return parsed;
    }
    collected.push(...parsed.positions);
  }

  // Every segment is bounded by MAX_WINNING_POSITION, so the allocation in
  // onSubmit stays small and nothing here can throw.
  return {
    ok: true,
    positions: [...new Set(collected)].sort((a, b) => a - b),
  };
};

export default function CreateWaveOutcomesManual({
  waveType,
  onOutcome,
  onCancel,
}: {
  readonly waveType: ApiWaveType;
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const locale = useBrowserLocale();
  const [value, setValue] = useState<string>("");
  const [positions, setPositions] = useState<string>("");
  const [positionsError, setPositionsError] = useState<string>("");

  const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const onPositionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[0-9,-]*$/.test(value)) {
      setPositions(value);
      setPositionsError("");
    }
  };

  const [isInputEmptyError, setIsInputEmptyError] = useState<boolean>(false);

  useEffect(() => setIsInputEmptyError(false), [value]);

  const isRankWave = waveType === ApiWaveType.Rank;
  const manualErrorId = "outcome-manual-error";
  const positionsErrorId = "outcome-positions-error";

  const onSubmit = () => {
    if (!value) {
      setIsInputEmptyError(!value);
      return;
    }

    if (isRankWave) {
      if (!positions) {
        setPositionsError("Please enter positions");
        return;
      }

      const parsed = parseWinningPositions(positions);
      if (!parsed.ok) {
        setPositionsError(parsed.error);
        return;
      }

      const parsedPositions = parsed.positions;

      const maxPosition = Math.max(...parsedPositions);
      const winners: number[] = new Array(maxPosition).fill(0);
      parsedPositions.forEach((pos) => {
        winners[pos - 1] = 1;
      });

      onOutcome({
        title: value,
        type: CreateWaveOutcomeType.MANUAL,
        credit: null,
        category: null,
        winnersConfig: {
          creditValueType:
            CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
          totalAmount: winners.reduce((acc, curr) => acc + curr, 0),
          winners: winners.map((winner) => ({ value: winner })),
        },
      });
    } else {
      onOutcome({
        title: value,
        type: CreateWaveOutcomeType.MANUAL,
        credit: null,
        category: null,
        winnersConfig: null,
      });
    }
  };

  return (
    <div className="tw-col-span-full">
      <div className="tw-flex tw-flex-col tw-gap-y-6 tw-pt-[0.5px]">
        <div className="tw-grid tw-gap-x-5 tw-gap-y-4">
          <div>
            <div className="tw-group tw-relative tw-w-full">
              <input
                type="text"
                value={value}
                onChange={onValueChange}
                id="outcome-manual"
                autoComplete="off"
                aria-invalid={isInputEmptyError}
                aria-describedby={isInputEmptyError ? manualErrorId : undefined}
                className={`${getCreateWaveOutcomeInputStateClasses({
                  hasError: isInputEmptyError,
                  hasValue: value.length > 0,
                })} ${CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES}`}
                placeholder=" "
              />
              <label
                htmlFor="outcome-manual"
                className={`${getCreateWaveOutcomeLabelStateClasses(
                  isInputEmptyError
                )} ${CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES}`}
              >
                Manual action
              </label>
            </div>
            {isInputEmptyError && (
              <div
                id={manualErrorId}
                role="alert"
                className="tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5"
              >
                <svg
                  className="tw-size-5 tw-flex-shrink-0 tw-text-error"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="tw-text-xs tw-font-medium tw-text-error">
                  Please enter your manual action
                </div>
              </div>
            )}
          </div>
          {isRankWave && (
            <div>
              <div className="tw-group tw-relative tw-w-full">
                <input
                  type="text"
                  value={positions}
                  onChange={onPositionsChange}
                  id="outcome-positions"
                  autoComplete="off"
                  aria-invalid={Boolean(positionsError)}
                  aria-describedby={
                    positionsError ? positionsErrorId : undefined
                  }
                  className={`${getCreateWaveOutcomeInputStateClasses({
                    hasError: Boolean(positionsError),
                    hasValue: positions.length > 0,
                  })} ${CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES}`}
                  placeholder=" "
                />
                <label
                  htmlFor="outcome-positions"
                  className={`${getCreateWaveOutcomeLabelStateClasses(
                    Boolean(positionsError)
                  )} ${CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES}`}
                >
                  Winning Positions (e.g. 1-3, 5, 7-9)
                </label>
              </div>
              {positionsError && (
                <div
                  id={positionsErrorId}
                  role="alert"
                  className="tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5"
                >
                  <svg
                    className="tw-size-5 tw-flex-shrink-0 tw-text-error"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="tw-text-xs tw-font-medium tw-text-error">
                    {positionsError}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="tw-relative tw-z-50 tw-flex tw-justify-end tw-gap-x-3">
          <Button variant="secondary" size="md" onClick={onCancel}>
            {t(locale, "waves.create.actions.cancel")}
          </Button>
          <Button variant="primary" size="md" onClick={onSubmit}>
            {t(locale, "waves.create.actions.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
