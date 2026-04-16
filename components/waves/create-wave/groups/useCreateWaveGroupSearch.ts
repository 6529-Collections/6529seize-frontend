import {
  type Dispatch,
  useCallback,
  useId,
  useState,
  type KeyboardEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { GroupsRequestParams } from "@/entities/IGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { Mutable, NonNullableNotRequired } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";

const MAX_RESULTS = 7;
const DEBOUNCE_MS = 200;

type CreateWaveGroupSearchParams = {
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly selectedGroup: ApiGroupFull | null;
  readonly allowClear: boolean;
  readonly onSelect: (group: ApiGroupFull | null) => void;
  readonly wrapperRef: RefObject<HTMLDivElement | null>;
};

type CreateWaveGroupSearchState = {
  readonly selectedGroupKey: string | null;
  readonly inputValue: string;
  readonly searchCriteria: string;
  readonly activeIndex: number;
};

function getSelectedGroupKey(group: ApiGroupFull | null): string | null {
  if (!group) {
    return null;
  }

  return JSON.stringify([group.id, group.name]);
}

function createSearchState({
  selectedGroupKey,
  selectedGroupName,
}: {
  readonly selectedGroupKey: string | null;
  readonly selectedGroupName: string;
}): CreateWaveGroupSearchState {
  return {
    selectedGroupKey,
    inputValue: selectedGroupName,
    searchCriteria: selectedGroupName,
    activeIndex: -1,
  };
}

function getEffectiveSearchState({
  searchState,
  selectedGroupKey,
  selectedGroupName,
}: {
  readonly searchState: CreateWaveGroupSearchState;
  readonly selectedGroupKey: string | null;
  readonly selectedGroupName: string;
}): CreateWaveGroupSearchState {
  if (searchState.selectedGroupKey === selectedGroupKey) {
    return searchState;
  }

  return createSearchState({ selectedGroupKey, selectedGroupName });
}

function useCreateWaveGroupSuggestions({
  debouncedValue,
  disabled,
  isOpen,
}: {
  readonly debouncedValue: string;
  readonly disabled: boolean;
  readonly isOpen: boolean;
}) {
  const { data, isFetching } = useQuery<ApiGroupFull[]>({
    queryKey: [QueryKey.GROUPS, { group_name: debouncedValue || null }],
    queryFn: async () => {
      const params: Mutable<NonNullableNotRequired<GroupsRequestParams>> = {};
      if (debouncedValue) {
        params.group_name = debouncedValue;
      }

      return await commonApiFetch<
        ApiGroupFull[],
        NonNullableNotRequired<GroupsRequestParams>
      >({
        endpoint: "groups",
        params,
      });
    },
    enabled: isOpen && !disabled,
    placeholderData: keepPreviousData,
  });

  return {
    isFetching,
    suggestions: (data ?? []).slice(0, MAX_RESULTS),
  };
}

function useCreateWaveGroupKeyboardNavigation({
  activeIndex,
  closeSearch,
  isOpen,
  onOptionSelect,
  setActiveIndex,
  setIsOpen,
  suggestions,
}: {
  readonly activeIndex: number;
  readonly closeSearch: () => void;
  readonly isOpen: boolean;
  readonly onOptionSelect: (group: ApiGroupFull) => void;
  readonly setActiveIndex: Dispatch<SetStateAction<number>>;
  readonly setIsOpen: Dispatch<SetStateAction<boolean>>;
  readonly suggestions: readonly ApiGroupFull[];
}) {
  return useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (event.key === "ArrowDown") {
          setIsOpen(true);
          setActiveIndex(0);
          event.preventDefault();
        }
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= suggestions.length) {
            return suggestions.length ? 0 : -1;
          }
          return nextIndex;
        });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => {
          if (suggestions.length === 0) {
            return -1;
          }
          if (prev <= 0) {
            return suggestions.length - 1;
          }
          return prev - 1;
        });
      } else if (event.key === "Enter") {
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          event.preventDefault();
          onOptionSelect(suggestions[activeIndex]!);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
      }
    },
    [
      activeIndex,
      closeSearch,
      isOpen,
      onOptionSelect,
      setActiveIndex,
      setIsOpen,
      suggestions,
    ]
  );
}

function useCreateWaveGroupSearchState({
  selectedGroupKey,
  selectedGroupName,
}: {
  readonly selectedGroupKey: string | null;
  readonly selectedGroupName: string;
}) {
  const [searchState, setSearchState] = useState<CreateWaveGroupSearchState>(
    () => createSearchState({ selectedGroupKey, selectedGroupName })
  );
  const [debouncedValue, setDebouncedValue] =
    useState<string>(selectedGroupName);
  const effectiveSearchState = getEffectiveSearchState({
    searchState,
    selectedGroupKey,
    selectedGroupName,
  });
  const { activeIndex, inputValue, searchCriteria } = effectiveSearchState;

  const updateSearchState = useCallback(
    (
      getNextState: (
        current: CreateWaveGroupSearchState
      ) => CreateWaveGroupSearchState
    ) => {
      setSearchState((current) => {
        const effectiveCurrent = getEffectiveSearchState({
          searchState: current,
          selectedGroupKey,
          selectedGroupName,
        });

        return getNextState(effectiveCurrent);
      });
    },
    [selectedGroupKey, selectedGroupName]
  );

  const setActiveIndex = useCallback<Dispatch<SetStateAction<number>>>(
    (nextActiveIndex) => {
      updateSearchState((current) => ({
        ...current,
        activeIndex:
          typeof nextActiveIndex === "function"
            ? nextActiveIndex(current.activeIndex)
            : nextActiveIndex,
      }));
    },
    [updateSearchState]
  );

  useDebounce(
    () => {
      setDebouncedValue(searchCriteria.trim());
    },
    DEBOUNCE_MS,
    [searchCriteria]
  );

  return {
    activeIndex,
    debouncedValue,
    inputValue,
    searchCriteria,
    setActiveIndex,
    setSearchState,
  };
}

export function useCreateWaveGroupSearch({
  defaultLabel,
  disabled,
  inputRef,
  selectedGroup,
  allowClear,
  onSelect,
  wrapperRef,
}: CreateWaveGroupSearchParams) {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listboxId = `${baseId}-listbox`;
  const selectedGroupKey = getSelectedGroupKey(selectedGroup);
  const selectedGroupName = selectedGroup?.name ?? "";
  const [isOpen, setIsOpen] = useState(false);
  const {
    activeIndex,
    debouncedValue,
    inputValue,
    searchCriteria,
    setActiveIndex,
    setSearchState,
  } = useCreateWaveGroupSearchState({
    selectedGroupKey,
    selectedGroupName,
  });

  const { isFetching, suggestions } = useCreateWaveGroupSuggestions({
    debouncedValue,
    disabled,
    isOpen,
  });

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, [setActiveIndex]);

  const clearSelection = useCallback(() => {
    if (!allowClear || disabled) {
      return;
    }

    setSearchState({
      selectedGroupKey: null,
      inputValue: "",
      searchCriteria: "",
      activeIndex: -1,
    });
    onSelect(null);
    setIsOpen(true);
    inputRef.current?.focus();
  }, [allowClear, disabled, inputRef, onSelect, setSearchState]);

  useClickAway(wrapperRef, () => {
    if (!isOpen) {
      return;
    }
    closeSearch();
  });

  useKeyPressEvent("Escape", () => {
    if (!isOpen) {
      return;
    }
    closeSearch();
  });

  const onInputFocus = () => {
    if (disabled) {
      return;
    }
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleInputChange = (value: string) => {
    setSearchState({
      selectedGroupKey: selectedGroup && allowClear ? null : selectedGroupKey,
      inputValue: value,
      searchCriteria: value,
      activeIndex: -1,
    });
    setIsOpen(true);
    if (selectedGroup && allowClear) {
      onSelect(null);
    }
  };

  const onOptionSelect = useCallback(
    (group: ApiGroupFull) => {
      setSearchState({
        selectedGroupKey,
        inputValue: group.name,
        searchCriteria: group.name,
        activeIndex: -1,
      });
      onSelect(group);
      closeSearch();
      inputRef.current?.focus();
    },
    [closeSearch, inputRef, onSelect, selectedGroupKey, setSearchState]
  );

  const handleKeyDown = useCreateWaveGroupKeyboardNavigation({
    activeIndex,
    closeSearch,
    isOpen,
    onOptionSelect,
    setActiveIndex,
    setIsOpen,
    suggestions,
  });

  const hasValue = inputValue.trim().length > 0;
  const helperText = selectedGroup
    ? `Selected: ${selectedGroup.name}`
    : `Default: ${defaultLabel}`;
  const showClearButton =
    allowClear && (hasValue || !!selectedGroup) && !disabled;
  const showNoResults = !isFetching && isOpen && suggestions.length === 0;
  const activeOptionId =
    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return {
    activeIndex,
    activeOptionId,
    clearSelection,
    handleInputChange,
    handleKeyDown,
    hasValue,
    helperText,
    inputId,
    inputValue,
    isFetching,
    isOpen,
    listboxId,
    onInputFocus,
    onOptionSelect,
    searchCriteria,
    setActiveIndex,
    showClearButton,
    showNoResults,
    suggestions,
  };
}
