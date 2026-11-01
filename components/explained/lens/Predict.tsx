"use client";

import { useState, type ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { EX_FOCUS } from "../tokens";

/**
 * Guess first (EXPLAINED.md §8.1): an optional question before a model,
 * answered in the reader's own choice. The answer shows once they choose,
 * and says whether they were right.
 */
export interface PredictOption {
  readonly label: string;
  readonly right: boolean;
}

export default function Predict({
  id,
  question,
  options,
  answer,
  locale,
  onAnswer,
}: {
  /** `data-predict`, for the gates' states. */
  readonly id: string;
  readonly question: ReactNode;
  readonly options: readonly PredictOption[];
  readonly answer: ReactNode;
  readonly locale: SupportedLocale;
  /** Called with the reader's choice, so the model can show the case asked about. */
  readonly onAnswer?: (index: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const right = picked !== null && options[picked]?.right === true;
  return (
    <div
      className="tw-mt-[18px] tw-grid tw-gap-2.5 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-black/20 tw-px-[18px] tw-py-4"
      data-predict={id}
      data-done={picked === null ? "0" : "1"}
    >
      <p className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
        {kt(locale, "explained.kit.lens.guessFirst")}: {question}
      </p>
      <div
        className="tw-inline-flex tw-flex-wrap tw-gap-0.5 tw-justify-self-start tw-rounded-2xl tw-border tw-border-solid tw-border-iron-700 tw-p-[3px] md:tw-rounded-full"
        role="group"
        aria-label={kt(locale, "explained.kit.lens.yourGuess")}
      >
        {options.map((option, index) => {
          const on = picked === index;
          let tone = "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50";
          if (on)
            tone = option.right
              ? "tw-bg-green tw-text-[#0D0D0F]"
              : "tw-bg-iron-400 tw-text-[#0D0D0F]";
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={on}
              data-right={option.right ? "1" : "0"}
              onClick={() => {
                setPicked(index);
                onAnswer?.(index);
              }}
              className={`tw-min-h-10 tw-cursor-pointer tw-whitespace-nowrap tw-rounded-full tw-border-0 tw-px-3.5 tw-text-sm tw-font-semibold md:tw-min-h-9 ${tone} ${EX_FOCUS}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p
        className="tw-m-0 tw-text-[15px] tw-leading-[23px] tw-text-iron-300"
        aria-live="polite"
        hidden={picked === null}
      >
        {picked !== null && (
          <>
            <b className="tw-font-semibold tw-text-iron-50">
              {kt(
                locale,
                right
                  ? "explained.kit.lens.right"
                  : "explained.kit.lens.notQuite"
              )}
            </b>{" "}
            {answer}
          </>
        )}
      </p>
    </div>
  );
}
