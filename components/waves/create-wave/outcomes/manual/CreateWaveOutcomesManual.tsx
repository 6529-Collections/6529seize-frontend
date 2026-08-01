"use client";

import { useEffect, useState } from "react";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import {
  CreateWaveOutcomeType,
  CreateWaveOutcomeConfigWinnersCreditValueType,
} from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import Button from "@/components/utils/button/Button";

// Winning positions drive a `new Array(maxPosition)` allocation at submit, so an
// out-of-range value (e.g. a 10-digit rank, or a very wide range) would throw
// "RangeError: Invalid array length" and crash the form. Cap positions to a sane
// maximum and reject anything larger as invalid input.
const MAX_WINNING_POSITION = 10_000;

// Error copy is announced and programmatically tied to its field (WCAG 2.2 AA
// 3.3.1 / 4.1.3) rather than being visual-only.
const OUTCOME_ERROR_ID = "outcome-manual-error";
const POSITIONS_ERROR_ID = "outcome-positions-error";

const POSITIONS_FORMAT_ERROR = "Invalid position format";
const POSITIONS_MIN_ERROR = "Positions start at 1";
const POSITIONS_MAX_ERROR = `Positions can't go above ${MAX_WINNING_POSITION.toLocaleString(
  "en-US"
)}`;
const backwardsRangeError = (segment: string): string =>
  `Range ${segment} is backwards — put the lower position first`;

// Shape gates, applied per comma-separated segment. Two flat patterns rather
// than one combined `(\d+(-\d+)?)(,\d+(-\d+)?)*`: nesting quantifiers inside
// optional/repeated groups is what makes a pattern a backtracking risk, and
// both of these keep their quantifiers as siblings.
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
 * rest of what they typed had been dropped.
 */
export const parseWinningPositions = (input: string): PositionsParseResult => {
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
      <div className="tw-flex tw-flex-col tw-gap-y-5 tw-pt-[0.5px]">
        <div className="tw-grid tw-gap-x-5 tw-gap-y-4">
          <div>
            <div className="tw-group tw-relative tw-w-full">
              <input
                type="text"
                value={value}
                onChange={onValueChange}
                id="outcome-manual"
                aria-invalid={isInputEmptyError ? true : undefined}
                aria-describedby={
                  isInputEmptyError ? OUTCOME_ERROR_ID : undefined
                }
                autoComplete="off"
                className={`${
                  isInputEmptyError
                    ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
                    : "tw-caret-primary-400 tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400"
                } ${
                  value
                    ? "tw-text-primary-400 focus:tw-text-white"
                    : "tw-text-white"
                } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-pb-3 tw-pt-4 tw-text-base tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-sm`}
                placeholder=" "
              />
              <label
                htmlFor="outcome-manual"
                className={`${
                  isInputEmptyError ? "" : "peer-focus:tw-text-primary-400"
                } tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-bg-iron-900 tw-px-2 tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
              >
                Manual action
              </label>
            </div>
            {isInputEmptyError && (
              <div
                id={OUTCOME_ERROR_ID}
                role="alert"
                className="tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5">
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
                  aria-invalid={positionsError ? true : undefined}
                  aria-describedby={
                    positionsError ? POSITIONS_ERROR_ID : undefined
                  }
                  autoComplete="off"
                  className={`${
                    positionsError
                      ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
                      : "tw-caret-primary-400 tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400"
                  } ${
                    positions
                      ? "tw-text-primary-400 focus:tw-text-white"
                      : "tw-text-white"
                  } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-pb-3 tw-pt-4 tw-text-base tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-sm`}
                  placeholder=" "
                />
                <label
                  htmlFor="outcome-positions"
                  className={`${
                    positionsError ? "" : "peer-focus:tw-text-primary-400"
                  } tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-bg-iron-900 tw-px-2 tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
                >
                  Winning Positions (e.g. 1-3, 5, 7-9)
                </label>
              </div>
              {positionsError && (
                <div
                  id={POSITIONS_ERROR_ID}
                  role="alert"
                  className="tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5">
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
        <div className="tw-relative tw-z-50 tw-mt-6 tw-flex tw-justify-end tw-gap-x-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onSubmit}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
