"use client";

import { useEffect, useState } from "react";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import {
  CreateWaveOutcomeType,
  CreateWaveOutcomeConfigWinnersCreditValueType,
} from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import PrimaryButton from "@/components/utils/button/PrimaryButton";

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

  const parseRange = (range: string): number[] | null => {
    if (range.includes("-")) {
      const [start, end] = range.split("-").map((num) => parseInt(num));
      if (isNaN(start!) || isNaN(end!) || start! < 1 || end! < start!) {
        return null;
      }
      return Array.from({ length: end! - start! + 1 }, (_, i) => start! + i);
    }

    const num = parseInt(range);
    return isNaN(num) || num < 1 ? null : [num];
  };

  const parsePositions = (input: string): number[] | null => {
    const cleanInput = input.replace(/\s/g, "");
    if (!cleanInput) return null;

    if (!/^(\d+(-\d+)?)(,\d+(-\d+)?)*$/.test(cleanInput)) {
      return null;
    }

    try {
      const ranges = cleanInput.split(",");
      const positions = ranges
        .map(parseRange)
        .filter((range): range is number[] => range !== null)
        .flat();

      return positions.length > 0
        ? Array.from(new Set(positions)).sort((a, b) => a - b)
        : null;
    } catch {
      return null;
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

      const parsedPositions = parsePositions(positions);
      if (!parsedPositions) {
        setPositionsError("Invalid position format");
        return;
      }

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
              <div className="tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5">
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
                <div className="tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5">
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
          <button
            onClick={onCancel}
            type="button"
            className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-700 hover:tw-bg-iron-700 focus:!tw-outline focus-visible:!tw-outline-2 focus-visible:!tw-outline-offset-2 focus-visible:!tw-outline-primary-400"
          >
            Cancel
          </button>
          <PrimaryButton
            onClicked={onSubmit}
            disabled={false}
            loading={false}
            padding="tw-px-4 tw-py-3"
          >
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
