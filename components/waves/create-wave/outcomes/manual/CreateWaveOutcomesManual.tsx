"use client";

import { useRef, useState } from "react";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import {
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import CreateWaveOutcomeFormActions from "../CreateWaveOutcomeFormActions";

const REWARD_HELPER_ID = "outcome-manual-helper";
const REWARD_ERROR_ID = "outcome-manual-error";
const RANKS_HELPER_ID = "outcome-positions-helper";
const RANKS_ERROR_ID = "outcome-positions-error";

const isDigitsOnly = (value: string): boolean =>
  value.length > 0 &&
  Array.from(value).every((character) => character >= "0" && character <= "9");

const parseRange = (range: string): number[] | null => {
  if (!range.includes("-")) {
    if (!isDigitsOnly(range)) {
      return null;
    }
    const rank = Number.parseInt(range, 10);
    return Number.isNaN(rank) || rank < 1 ? null : [rank];
  }

  const rangeParts = range.split("-");
  if (rangeParts.length !== 2) {
    return null;
  }

  const [startValue, endValue] = rangeParts;
  if (
    !startValue ||
    !endValue ||
    !isDigitsOnly(startValue) ||
    !isDigitsOnly(endValue)
  ) {
    return null;
  }

  const start = Number.parseInt(startValue, 10);
  const end = Number.parseInt(endValue, 10);
  if (Number.isNaN(start) || Number.isNaN(end) || start < 1 || end < start) {
    return null;
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const parsePositions = (input: string): number[] | null => {
  const cleanInput = input.replace(/\s/g, "");
  if (!cleanInput) {
    return null;
  }

  try {
    const ranges = cleanInput.split(",").map(parseRange);
    if (ranges.includes(null)) {
      return null;
    }

    const positions = ranges
      .filter((range): range is number[] => range !== null)
      .flat();

    return positions.length > 0
      ? Array.from(new Set(positions)).sort((left, right) => left - right)
      : null;
  } catch {
    return null;
  }
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
  const [value, setValue] = useState("");
  const [positions, setPositions] = useState("");
  const [isRewardError, setIsRewardError] = useState(false);
  const [positionsError, setPositionsError] = useState("");
  const rewardInputRef = useRef<HTMLInputElement>(null);
  const ranksInputRef = useRef<HTMLInputElement>(null);

  const isRankWave = waveType === ApiWaveType.Rank;
  const descriptionKey = isRankWave
    ? "waves.create.outcomes.manual.description.rank"
    : "waves.create.outcomes.manual.description.approve";

  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    setIsRewardError(false);
  };

  const onPositionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (/^[0-9,\-\s]*$/.test(nextValue)) {
      setPositions(nextValue);
      setPositionsError("");
    }
  };

  const onSubmit = () => {
    if (!value.trim()) {
      setIsRewardError(true);
      rewardInputRef.current?.focus();
      return;
    }

    if (isRankWave) {
      if (!positions.trim()) {
        setPositionsError(
          t(DEFAULT_LOCALE, "waves.create.outcomes.manual.ranksRequiredError")
        );
        ranksInputRef.current?.focus();
        return;
      }

      const parsedPositions = parsePositions(positions);
      if (!parsedPositions) {
        setPositionsError(
          t(DEFAULT_LOCALE, "waves.create.outcomes.manual.ranksFormatError")
        );
        ranksInputRef.current?.focus();
        return;
      }

      const maxPosition = Math.max(...parsedPositions);
      let winners: number[];
      try {
        winners = new Array<number>(maxPosition).fill(0);
      } catch {
        setPositionsError(
          t(DEFAULT_LOCALE, "waves.create.outcomes.manual.ranksFormatError")
        );
        ranksInputRef.current?.focus();
        return;
      }
      parsedPositions.forEach((position) => {
        winners[position - 1] = 1;
      });

      onOutcome({
        title: value,
        type: CreateWaveOutcomeType.MANUAL,
        credit: null,
        category: null,
        winnersConfig: {
          creditValueType:
            CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
          totalAmount: winners.reduce((total, winner) => total + winner, 0),
          winners: winners.map((winner) => ({ value: winner })),
        },
      });
      return;
    }

    onOutcome({
      title: value,
      type: CreateWaveOutcomeType.MANUAL,
      credit: null,
      category: null,
      winnersConfig: null,
    });
  };

  const inputClasses = (hasError: boolean, hasValue: boolean) =>
    `${
      hasError
        ? "tw-caret-error tw-ring-error focus:tw-ring-error"
        : "tw-caret-primary-400 tw-ring-white/5 hover:tw-ring-white/10 focus:tw-ring-primary-400"
    } ${
      hasValue ? "tw-text-primary-400 focus:tw-text-white" : "tw-text-white"
    } tw-form-input tw-block tw-min-h-11 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-base tw-font-medium tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none sm:tw-text-sm`;

  return (
    <div className="tw-col-span-full tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-p-4 sm:tw-p-5">
      <div className="tw-space-y-5">
        <div>
          <h3 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-white">
            {t(DEFAULT_LOCALE, "waves.create.outcomes.manual.title")}
          </h3>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(DEFAULT_LOCALE, descriptionKey)}
          </p>
        </div>

        <div className="tw-space-y-2">
          <label
            htmlFor="outcome-manual"
            className="tw-block tw-text-sm tw-font-medium tw-text-iron-200"
          >
            {t(DEFAULT_LOCALE, "waves.create.outcomes.manual.rewardLabel")}
          </label>
          <input
            ref={rewardInputRef}
            id="outcome-manual"
            type="text"
            value={value}
            onChange={onValueChange}
            autoComplete="off"
            placeholder={t(
              DEFAULT_LOCALE,
              "waves.create.outcomes.manual.rewardPlaceholder"
            )}
            aria-invalid={isRewardError}
            aria-describedby={
              isRewardError
                ? `${REWARD_HELPER_ID} ${REWARD_ERROR_ID}`
                : REWARD_HELPER_ID
            }
            className={inputClasses(isRewardError, Boolean(value))}
          />
          <p
            id={REWARD_HELPER_ID}
            className="tw-mb-0 tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {t(DEFAULT_LOCALE, "waves.create.outcomes.manual.rewardHelper")}
          </p>
          {isRewardError ? (
            <p
              id={REWARD_ERROR_ID}
              role="alert"
              className="tw-mb-0 tw-text-xs tw-font-medium tw-text-error"
            >
              {t(DEFAULT_LOCALE, "waves.create.outcomes.manual.rewardError")}
            </p>
          ) : null}
        </div>

        {isRankWave ? (
          <div className="tw-space-y-2">
            <label
              htmlFor="outcome-positions"
              className="tw-block tw-text-sm tw-font-medium tw-text-iron-200"
            >
              {t(DEFAULT_LOCALE, "waves.create.outcomes.manual.ranksLabel")}
            </label>
            <input
              ref={ranksInputRef}
              id="outcome-positions"
              type="text"
              value={positions}
              onChange={onPositionsChange}
              autoComplete="off"
              placeholder={t(
                DEFAULT_LOCALE,
                "waves.create.outcomes.manual.ranksPlaceholder"
              )}
              aria-invalid={Boolean(positionsError)}
              aria-describedby={
                positionsError
                  ? `${RANKS_HELPER_ID} ${RANKS_ERROR_ID}`
                  : RANKS_HELPER_ID
              }
              className={inputClasses(
                Boolean(positionsError),
                Boolean(positions)
              )}
            />
            <p
              id={RANKS_HELPER_ID}
              className="tw-mb-0 tw-text-xs tw-leading-5 tw-text-iron-400"
            >
              {t(DEFAULT_LOCALE, "waves.create.outcomes.manual.ranksHelper")}
            </p>
            {positionsError ? (
              <p
                id={RANKS_ERROR_ID}
                role="alert"
                className="tw-mb-0 tw-text-xs tw-font-medium tw-text-error"
              >
                {positionsError}
              </p>
            ) : null}
          </div>
        ) : null}

        <CreateWaveOutcomeFormActions onCancel={onCancel} onSubmit={onSubmit} />
      </div>
    </div>
  );
}
