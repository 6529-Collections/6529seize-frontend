"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { VoteNumericInput } from "@/components/voting/VoteNumericInput";
import { clampVote } from "@/components/voting/useVoteNumericSteps";
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote.types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface SingleWaveDropVoteInputProps {
  readonly voteValue: number | string;
  readonly minValue: number;
  readonly maxValue: number;
  readonly label: string;
  readonly setVoteValue: React.Dispatch<React.SetStateAction<string | number>>;
  readonly onSubmit: () => void;
  readonly size?: SingleWaveDropVoteSize | undefined;
}

const countDigits = (text: string): number => text.replaceAll(/\D/g, "").length;

/** The vote as shown in the field, grouped the way the viewer's locale groups digits. */
const formatVoteInputValue = (
  locale: SupportedLocale,
  value: number | string
): string => {
  if (value === "" || value === "-") {
    return value;
  }
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric)
    ? formatInteger(locale, numeric)
    : String(value);
};

/**
 * Removes the locale's digit grouping (and any spaces) from typed or pasted
 * text, so "5,000,000" (en) and "5.000.000" (de) both read as 5000000. A
 * decimal mark is left in place, and parsing stops at it as before.
 */
const removeDigitGrouping = (locale: SupportedLocale, text: string): string => {
  const group =
    new Intl.NumberFormat(locale)
      .formatToParts(11111)
      .find((part) => part.type === "group")?.value ?? ",";
  return text.replaceAll(group, "").replaceAll(/\s/g, "");
};

/** The caret position just after the `digits`-th digit of `text`. */
const getCaretAfterDigits = (text: string, digits: number): number => {
  if (digits <= 0) {
    return text.startsWith("-") ? 1 : 0;
  }
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (/\d/.test(text.charAt(index))) {
      seen += 1;
      if (seen === digits) {
        return index + 1;
      }
    }
  }
  return text.length;
};

export const SingleWaveDropVoteInput: React.FC<
  SingleWaveDropVoteInputProps
> = ({
  voteValue,
  setVoteValue,
  minValue,
  maxValue,
  label,
  onSubmit,
  size = SingleWaveDropVoteSize.NORMAL,
}) => {
  const locale = useBrowserLocale();
  // Separators move as digits are typed, so remember how many digits sat
  // before the caret and restore that position after the reformat.
  const pendingCaretRef = useRef<{
    readonly input: HTMLInputElement;
    readonly digits: number;
  } | null>(null);
  // Counts edits, so the caret is restored even when an edit (deleting a
  // separator, say) leaves the value and its display unchanged.
  const [caretEdit, setCaretEdit] = useState(0);
  const displayValue = formatVoteInputValue(locale, voteValue);
  const allowsNegativeValues = minValue < 0;
  // Digits plus the grouping marks locales use (comma, period, spaces).
  const inputPattern = allowsNegativeValues
    ? String.raw`-?[0-9.,\s]*`
    : String.raw`[0-9.,\s]*`;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const caret = input.selectionStart ?? input.value.length;
    pendingCaretRef.current = {
      input,
      digits: countDigits(input.value.slice(0, caret)),
    };
    setCaretEdit((edit) => edit + 1);
    const inputValue = removeDigitGrouping(locale, input.value);

    if (inputValue === "") {
      setVoteValue(inputValue);
      return;
    }

    if (inputValue === "-") {
      setVoteValue(inputValue);
      return;
    }

    const value = parseInt(inputValue);
    if (isNaN(value)) return;
    setVoteValue(clampVote(value, minValue, maxValue));
  };

  useLayoutEffect(() => {
    const pending = pendingCaretRef.current;
    pendingCaretRef.current = null;
    if (pending?.input !== document.activeElement) {
      return;
    }
    const position = getCaretAfterDigits(pending.input.value, pending.digits);
    pending.input.setSelectionRange(position, position);
  }, [caretEdit, displayValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  const isCompact = size === SingleWaveDropVoteSize.MINI;
  return (
    <VoteNumericInput
      type="text"
      aria-label={t(locale, "competitions.voteValue")}
      pattern={inputPattern}
      inputMode="numeric"
      value={displayValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      unit={label}
      variant={isCompact ? "compact" : "default"}
      adjustments={{
        min: minValue,
        max: maxValue,
        value: typeof voteValue === "number" ? voteValue : 0,
        onChange: setVoteValue,
      }}
    />
  );
};
