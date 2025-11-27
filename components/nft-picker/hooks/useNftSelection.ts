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
  value?: NftPickerProps["value"];
  defaultValue?: NftPickerProps["defaultValue"];
  onChange: NftPickerProps["onChange"];
  onContractChange?: NftPickerProps["onContractChange"];
  outputMode: OutputMode;
};

export function useNftSelection({
  value,
  defaultValue,
  onChange,
  onContractChange,
  outputMode,
}: UseNftSelectionProps) {
  const [ranges, setRanges] = useState<TokenRange[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractOverview | null>(null);
  const [allSelected, setAllSelected] = useState<boolean>(false);
  const [unsafeCount, setUnsafeCount] = useState<number>(0);

  const previousRangesRef = useRef<TokenRange[] | null>(null);
  const hasHydratedInitialValueRef = useRef(false);
  const pendingPropEmitRef = useRef<string | null>(null);
  const onContractChangeRef = useRef(onContractChange);
  const isControlled = value !== undefined;

  useEffect(() => {
    onContractChangeRef.current = onContractChange;
  }, [onContractChange]);

  const emitContractChange = useCallback((contract: ContractOverview | null) => {
    onContractChangeRef.current?.(contract);
  }, []);

  const getSelectionFromRanges = useCallback(
    (
      canonicalRanges: TokenRange[],
      isAll: boolean
    ): { selection: TokenSelection | null; error?: ParseError } => {
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
    (contract: ContractOverview, canonicalRanges: TokenRange[], isAll: boolean) => {
      pendingPropEmitRef.current = null;
      if (!contract) {
        return;
      }
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
        setUnsafeCount(unsafe);
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
    pendingPropEmitRef.current = null;
    if (!value) {
      return;
    }
    hasHydratedInitialValueRef.current = true;
    if (value.contractAddress) {
      setSelectedContract((prev) =>
        prev && prev.address === value.contractAddress ? prev : null
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
    pendingPropEmitRef.current = defaultValue.contractAddress ?? null;
    hasHydratedInitialValueRef.current = true;
  }, [isControlled, defaultValue]);

  // Sync prop emit
  useEffect(() => {
    const pendingContractAddress = pendingPropEmitRef.current;
    if (!pendingContractAddress) {
      return;
    }
    if (!selectedContract || selectedContract.address !== pendingContractAddress) {
      return;
    }
    pendingPropEmitRef.current = null;
    emitChange(selectedContract, ranges, allSelected);
  }, [selectedContract, ranges, allSelected, emitChange]);

  const addTokenRanges = (newRanges: TokenRange[]) => {
    if (!newRanges.length) {
      return;
    }
    const canonical = mergeCanonicalRanges(ranges, newRanges);
    setRanges(canonical);
    setAllSelected(false);
    setUnsafeCount(0);
    previousRangesRef.current = null;
    if (selectedContract) {
      return emitChange(selectedContract, canonical, false);
    }
    return {};
  };

  const removeToken = (tokenId: bigint) => {
    const canonical = removeTokenFromRanges(ranges, tokenId);
    setRanges(canonical);
    setAllSelected(false);
    previousRangesRef.current = null;
    if (selectedContract) {
      emitChange(selectedContract, canonical, false);
    }
  };

  const clearTokens = () => {
    if (!selectedContract) {
      return;
    }
    setRanges([]);
    setAllSelected(false);
    setUnsafeCount(0);
    previousRangesRef.current = null;
    emitChange(selectedContract, [], false);
  };

  const selectAll = () => {
    if (!selectedContract || allSelected) {
      return;
    }
    previousRangesRef.current = ranges;
    setAllSelected(true);
    emitChange(selectedContract, ranges, true);
  };

  const deselectAll = () => {
    if (!selectedContract) {
      return;
    }
    const previous = previousRangesRef.current;
    setAllSelected(false);
    if (previous?.length) {
      setRanges(previous);
      previousRangesRef.current = null;
      emitChange(selectedContract, previous, false);
      return;
    }
    emitChange(selectedContract, ranges, false);
  };

  const clearContract = () => {
    setSelectedContract(null);
    setRanges([]);
    setAllSelected(false);
    emitContractChange(null);
    onChange(null);
    setUnsafeCount(0);
    previousRangesRef.current = null;
  };

  const setSelectionFromText = (canonical: TokenRange[]) => {
    setRanges(canonical);
    setAllSelected(false);
    previousRangesRef.current = null;
    if (selectedContract) {
      return emitChange(selectedContract, canonical, false);
    }
    return {};
  };

  return {
    ranges,
    setRanges,
    selectedContract,
    setSelectedContract,
    allSelected,
    setAllSelected,
    unsafeCount,
    setUnsafeCount,
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
