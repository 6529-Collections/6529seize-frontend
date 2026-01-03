import { useState, useMemo, useCallback } from "react";
import type { ParseError, TokenRange } from "../types";
import {
  parseTokenExpressionToRanges,
  formatCanonical,
  BIGINT_ZERO,
  BIGINT_ONE,
  formatBigIntWithSeparators,
} from "../utils";

type UseNftTokenInputProps = {
  allowRanges: boolean;
  allSelected: boolean;
  contractTotalSupply?: bigint | null | undefined;
};

export function useNftTokenInput({
  allowRanges,
  allSelected,
  contractTotalSupply,
}: UseNftTokenInputProps) {
  const [tokenInput, setTokenInput] = useState<string>("");
  const [isEditingText, setIsEditingText] = useState(false);
  const [textValue, setTextValue] = useState<string>("");
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);

  const trimmedTokenInput = tokenInput.trim();

  const tokenPreview = useMemo(() => {
    if (!trimmedTokenInput) {
      return {
        ranges: [] as TokenRange[],
        canonical: "",
        count: BIGINT_ZERO,
        errors: null as ParseError[] | null,
      };
    }

    if (!allowRanges && trimmedTokenInput.includes("-")) {
      return {
        ranges: [] as TokenRange[],
        canonical: "",
        count: BIGINT_ZERO,
        errors: [
          {
            input: trimmedTokenInput,
            index: 0,
            length: Math.max(trimmedTokenInput.length, 1),
            message: "Ranges are disabled for this picker",
          },
        ],
      };
    }

    try {
      const canonicalRanges = parseTokenExpressionToRanges(trimmedTokenInput);
      const count = canonicalRanges.reduce(
        (total, range) => total + (range.end - range.start + BIGINT_ONE),
        BIGINT_ZERO
      );
      return {
        ranges: canonicalRanges,
        canonical: formatCanonical(canonicalRanges),
        count,
        errors: null as ParseError[] | null,
      };
    } catch (error) {
      if (Array.isArray(error)) {
        return {
          ranges: [] as TokenRange[],
          canonical: "",
          count: BIGINT_ZERO,
          errors: error as ParseError[],
        };
      }
      return {
        ranges: [] as TokenRange[],
        canonical: "",
        count: BIGINT_ZERO,
        errors: [
          {
            input: trimmedTokenInput,
            index: 0,
            length: Math.max(trimmedTokenInput.length, 1),
            message: "Unable to parse token input",
          },
        ],
      };
    }
  }, [allowRanges, trimmedTokenInput]);

  const canAddTokens =
    !allSelected &&
    Boolean(trimmedTokenInput) &&
    !tokenPreview.errors &&
    tokenPreview.count > BIGINT_ZERO;

  const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

  const formatCount = useCallback(
    (value: bigint | number): string =>
      typeof value === "number"
        ? numberFormatter.format(value)
        : formatBigIntWithSeparators(value),
    [numberFormatter]
  );

  const helperState = useMemo(() => {
    if (allSelected) {
      if (contractTotalSupply) {
        return {
          tone: "success" as const,
          text: `All ${formatCount(contractTotalSupply)} tokens selected. Deselect to add specific tokens.`,
        };
      }
      return {
        tone: "success" as const,
        text: "All tokens selected. Deselect to add specific tokens.",
      };
    }
    if (!trimmedTokenInput) {
      return {
        tone: "muted" as const,
        text: "Tip: Enter single tokens or ranges separated by commas.",
      };
    }
    if (tokenPreview.errors) {
      const [firstError] = tokenPreview.errors;
      const detail = firstError?.input ? ` (${firstError.input})` : "";
      return {
        tone: "error" as const,
        text: `${firstError?.message ?? "Invalid token input"}${detail}`,
      };
    }
    const countLabel = formatCount(tokenPreview.count);
    const canonical = tokenPreview.canonical || trimmedTokenInput;
    const plural = tokenPreview.count === BIGINT_ONE ? "token" : "tokens";
    return {
      tone: "success" as const,
      text: `Looks good: ${canonical} • Will add ${countLabel} ${plural}.`,
    };
  }, [allSelected, contractTotalSupply, formatCount, tokenPreview, trimmedTokenInput]);

  return {
    tokenInput,
    setTokenInput,
    isEditingText,
    setIsEditingText,
    textValue,
    setTextValue,
    parseErrors,
    setParseErrors,
    tokenPreview,
    canAddTokens,
    helperState,
    formatCount,
  };
}
