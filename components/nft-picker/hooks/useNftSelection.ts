import { useState, useRef, useEffect, useCallback } from "react";
import type {
  ContractOverview,
  NftPickerProps,
  NftPickerSelection,
  NftPickerSelectionError,
  ParseError,
  TokenRange,
  TokenSelection,
  OutputMode,
} from "../types";
import {
  toCanonicalRanges,
  mergeCanonicalRanges,
  removeTokenFromRanges,
  fromCanonicalRanges,
  tryToNumberArray,
  isRangeTooLargeError,
  formatCanonical,
  MAX_SAFE,
} from "../utils";

const EMPTY_SELECTION: TokenSelection = [];

type UseNftSelectionProps = {
  value?: NftPickerProps["value"] | undefined;
  defaultValue?: NftPickerProps["defaultValue"] | undefined;
  onChange: NftPickerProps["onChange"];
  onContractChange?: NftPickerProps["onContractChange"] | undefined;
  fixedContract?: NftPickerProps["fixedContract"] | undefined;
  outputMode: OutputMode;
};

export function useNftSelection({
  value,
  defaultValue,
  onChange,
  onContractChange,
  fixedContract,
  outputMode,
}: UseNftSelectionProps) {
  const [ranges, setRanges] = useState<TokenRange[]>([]);
  const [selectedContract, setSelectedContract] =
    useState<ContractOverview | null>(null);
  const effectiveSelectedContract = fixedContract ?? selectedContract;
  const [allSelected, setAllSelected] = useState<boolean>(false);

  const previousRangesRef = useRef<TokenRange[] | null>(null);
  const hasHydratedInitialValueRef = useRef(false);
  const onContractChangeRef = useRef(onContractChange);
  const isControlled = value !== undefined;

  useEffect(() => {
    onContractChangeRef.current = onContractChange;
  }, [onContractChange]);

  const emitContractChange = useCallback(
    (contract: ContractOverview | null) => {
      onContractChangeRef.current?.(contract);
    },
    []
  );

  const getSelectionFromRanges = useCallback(
    (
      canonicalRanges: TokenRange[],
      isAll: boolean
    ): { selection: TokenSelection | null; error?: ParseError | undefined } => {
      if (isAll) {
        return { selection: [] };
      }
      try {
        return { selection: fromCanonicalRanges(canonicalRanges) };
      } catch (error) {
        if (!isRangeTooLargeError(error)) {
          throw error;
        }
        const canonical = formatCanonical(canonicalRanges);
        const displayValue = canonical || "selection";
        return {
          selection: null,
          error: {
            code: error.code,
            input: displayValue,
            index: 0,
            length: Math.max(displayValue.length, 1),
            message: error.message,
          },
        };
      }
    },
    []
  );

  const emitChange = useCallback(
    (
      contract: ContractOverview,
      canonicalRanges: TokenRange[],
      isAll: boolean
    ) => {
      const { selection: selectionIds, error } = getSelectionFromRanges(
        canonicalRanges,
        isAll
      );
      if (error) {
        // We need to handle this error in the UI, but emitChange is mostly for prop updates.
        // For now, we'll return the error so the caller can handle it if needed,
        // or we might need a state for it.
        // The original code setParseErrors([error]) here.
        // We'll return it.
        return { error };
      }
      if (selectionIds === null) {
        return {};
      }
      if (!selectionIds.length && !isAll) {
        const payload: NftPickerSelection = {
          contractAddress: contract.address,
          allSelected: isAll,
          outputMode,
          tokenIds: [],
        } as NftPickerSelection;
        onChange(payload);
        return {};
      }
      if (outputMode === "number") {
        const { numbers, unsafeCount: unsafe } = tryToNumberArray(selectionIds);
        if (unsafe > 0) {
          const errorPayload: NftPickerSelectionError = {
            type: "error",
            error:
              "Token IDs exceed Number.MAX_SAFE_INTEGER. Switch to bigint output or remove those IDs.",
            unsafeCount: unsafe,
            contractAddress: contract.address,
            outputMode: "number",
          };
          console.warn(
            "NftPicker: selection includes token IDs above Number.MAX_SAFE_INTEGER; emitting error payload",
            { unsafeCount: unsafe, contractAddress: contract.address }
          );
          onChange(errorPayload);
          return { unsafeCount: unsafe };
        }
        const payload: NftPickerSelection = {
          contractAddress: contract.address,
          allSelected: isAll,
          outputMode: "number",
          tokenIds: numbers,
        };
        onChange(payload);
      } else {
        const decimalIds = selectionIds.map((id) => id.toString(10));
        const payload: NftPickerSelection = {
          contractAddress: contract.address,
          allSelected: isAll,
          outputMode: "bigint",
          tokenIds: decimalIds,
        };
        if (selectionIds.some((id) => id > MAX_SAFE)) {
          console.warn(
            "NftPicker: emitting bigint payload because some token IDs exceed MAX_SAFE_INTEGER"
          );
        }
        onChange(payload);
      }
      return {};
    },
    [getSelectionFromRanges, onChange, outputMode]
  );

  // Hydration logic
  useEffect(() => {
    if (!value) {
      return;
    }
    hasHydratedInitialValueRef.current = true;
    if (value.contractAddress) {
      setSelectedContract((prev) =>
        prev?.address === value.contractAddress ? prev : null
      );
    } else {
      setSelectedContract(null);
    }
    const canonical = toCanonicalRanges(value.selectedIds ?? EMPTY_SELECTION);
    setRanges(canonical);
    if (value.allSelected) {
      setAllSelected(true);
      previousRangesRef.current = canonical;
    } else {
      setAllSelected(false);
      previousRangesRef.current = null;
    }
  }, [value]);

  useEffect(() => {
    if (isControlled) {
      return;
    }
    if (hasHydratedInitialValueRef.current) {
      return;
    }
    if (!defaultValue) {
      return;
    }
    const defaultSelection = defaultValue.selectedIds
      ? (Array.from(defaultValue.selectedIds) as TokenSelection)
      : EMPTY_SELECTION;
    const canonical = toCanonicalRanges(defaultSelection);
    setRanges(canonical);
    if (defaultValue.allSelected) {
      setAllSelected(true);
      previousRangesRef.current = canonical;
    } else {
      setAllSelected(false);
      previousRangesRef.current = null;
    }
    hasHydratedInitialValueRef.current = true;
  }, [isControlled, defaultValue]);

  const addTokenRanges = (newRanges: TokenRange[]) => {
    if (!newRanges.length) {
      return;
    }
    const canonical = mergeCanonicalRanges(ranges, newRanges);
    const result = effectiveSelectedContract
      ? emitChange(effectiveSelectedContract, canonical, false)
      : {};
    if ("error" in result) {
      return result;
    }
    setRanges(canonical);
    setAllSelected(false);
    previousRangesRef.current = null;
    return result;
  };

  const removeToken = (tokenId: bigint) => {
    const canonical = removeTokenFromRanges(ranges, tokenId);
    setRanges(canonical);
    setAllSelected(false);
    previousRangesRef.current = null;
    if (effectiveSelectedContract) {
      emitChange(effectiveSelectedContract, canonical, false);
    }
  };

  const clearTokens = () => {
    if (!effectiveSelectedContract) {
      return;
    }
    setRanges([]);
    setAllSelected(false);
    previousRangesRef.current = null;
    emitChange(effectiveSelectedContract, [], false);
  };

  const selectAll = () => {
    if (!effectiveSelectedContract || allSelected) {
      return;
    }
    previousRangesRef.current = ranges;
    setAllSelected(true);
    emitChange(effectiveSelectedContract, ranges, true);
  };

  const deselectAll = () => {
    if (!effectiveSelectedContract) {
      return;
    }
    const previous = previousRangesRef.current;
    setAllSelected(false);
    if (previous?.length) {
      setRanges(previous);
      previousRangesRef.current = null;
      emitChange(effectiveSelectedContract, previous, false);
      return;
    }
    emitChange(effectiveSelectedContract, ranges, false);
  };

  const clearContract = () => {
    if (fixedContract) {
      return;
    }
    setSelectedContract(null);
    setRanges([]);
    setAllSelected(false);
    emitContractChange(null);
    onChange(null);
    previousRangesRef.current = null;
  };

  const setSelectionFromText = (canonical: TokenRange[]) => {
    const result = effectiveSelectedContract
      ? emitChange(effectiveSelectedContract, canonical, false)
      : {};
    if ("error" in result) {
      return result;
    }
    setRanges(canonical);
    setAllSelected(false);
    previousRangesRef.current = null;
    return result;
  };

  return {
    ranges,
    setRanges,
    selectedContract: effectiveSelectedContract,
    setSelectedContract,
    allSelected,
    setAllSelected,
    emitContractChange,
    emitChange,
    addTokenRanges,
    removeToken,
    clearTokens,
    selectAll,
    deselectAll,
    clearContract,
    setSelectionFromText,
  };
}
