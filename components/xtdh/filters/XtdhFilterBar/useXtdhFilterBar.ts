import { useCallback, useMemo } from "react";
import type { ChangeEvent } from "react";
import { SortDirection } from "@/entities/ISort";
import {
  DEFAULT_COLLECTION_SORT,
  DEFAULT_TOKEN_SORT,
  DEFAULT_DIRECTION,
  ALL_NETWORKS_OPTION,
} from "../constants";
import type {
  XtdhCollectionsSort,
  XtdhFilterState,
  XtdhSortDirection,
  XtdhTokensSort,
  XtdhView,
} from "../types";

type XtdhSortValue = XtdhCollectionsSort | XtdhTokensSort;

interface UseXtdhFilterBarParams<SortValue extends XtdhSortValue> {
  readonly view: XtdhView;
  readonly state: XtdhFilterState<SortValue>;
  readonly disableInteractions: boolean;
  readonly connectedProfileId: string | null;
  readonly onNetworksChange: (networks: string[]) => void;
  readonly onMinRateChange: (value: number | undefined) => void;
  readonly onMinGrantorsChange: (value: number | undefined) => void;
  readonly onSortChange: (sort: SortValue) => void;
  readonly onDirectionChange: (direction: XtdhSortDirection) => void;
  readonly onToggleMyGrants: (enabled: boolean) => void;
  readonly onToggleReceiving: (enabled: boolean) => void;
}

interface UseXtdhFilterBarResult<SortValue extends XtdhSortValue> {
  readonly activeFilterCount: number;
  readonly minRateId: string;
  readonly minGrantorsId: string;
  readonly personalFiltersDisabled: boolean;
  readonly tabSortDirection: SortDirection;
  readonly handleNetworkToggle: (network: string) => void;
  readonly handleMinRateInput: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  readonly handleMinGrantorsInput: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  readonly handleSortSelect: (value: SortValue) => void;
  readonly handleSortWithDirection: (
    value: SortValue,
    direction: XtdhSortDirection
  ) => void;
  readonly handleToggleMyGrants: (enabled: boolean) => void;
  readonly handleToggleReceiving: (enabled: boolean) => void;
}

/**
 * Centralises filter handler logic so the visual layer can stay declarative.
 */
export function useXtdhFilterBar<SortValue extends XtdhSortValue>({
  view,
  state,
  disableInteractions,
  connectedProfileId,
  onNetworksChange,
  onMinRateChange,
  onMinGrantorsChange,
  onSortChange,
  onDirectionChange,
  onToggleMyGrants,
  onToggleReceiving,
}: UseXtdhFilterBarParams<SortValue>): UseXtdhFilterBarResult<SortValue> {
  const defaultSort =
    view === "collections" ? DEFAULT_COLLECTION_SORT : DEFAULT_TOKEN_SORT;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += state.networks.length;
    if (typeof state.minRate === "number") count += 1;
    if (typeof state.minGrantors === "number") count += 1;
    if (state.showMyGrants) count += 1;
    if (state.showMyReceiving) count += 1;
    if (state.sort !== defaultSort) count += 1;
    if (state.direction !== DEFAULT_DIRECTION) count += 1;
    return count;
  }, [state, defaultSort]);

  const handleNetworkToggle = useCallback(
    (network: string) => {
      if (disableInteractions) return;
      if (network === ALL_NETWORKS_OPTION) {
        onNetworksChange([]);
        return;
      }
      const nextNetworks = state.networks.includes(network)
        ? state.networks.filter((item) => item !== network)
        : [...state.networks, network];
      onNetworksChange(nextNetworks);
    },
    [disableInteractions, onNetworksChange, state.networks]
  );

  const handleMinRateInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (disableInteractions) return;
      const { value } = event.target;
      if (value === "") {
        onMinRateChange(undefined);
        return;
      }

      const parsed = Number.parseFloat(value);
      onMinRateChange(Number.isFinite(parsed) ? parsed : undefined);
    },
    [disableInteractions, onMinRateChange]
  );

  const handleMinGrantorsInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (disableInteractions) return;
      const { value } = event.target;
      if (value === "") {
        onMinGrantorsChange(undefined);
        return;
      }

      const parsed = Number.parseInt(value, 10);
      onMinGrantorsChange(Number.isFinite(parsed) ? parsed : undefined);
    },
    [disableInteractions, onMinGrantorsChange]
  );

  const handleSortSelect = useCallback(
    (value: SortValue) => {
      if (disableInteractions) return;
      const isChanging = state.sort !== value;
      onSortChange(value);
      if (isChanging) {
        if (state.direction !== DEFAULT_DIRECTION) {
          onDirectionChange(DEFAULT_DIRECTION);
        }
      } else {
        const nextDirection = state.direction === "asc" ? "desc" : "asc";
        onDirectionChange(nextDirection);
      }
    },
    [disableInteractions, onSortChange, state.direction, onDirectionChange, state.sort]
  );

  const handleSortWithDirection = useCallback(
    (value: SortValue, direction: XtdhSortDirection) => {
      if (disableInteractions) return;
      if (state.sort !== value) {
        onSortChange(value);
        if (direction !== DEFAULT_DIRECTION) {
          onDirectionChange(direction);
        } else {
          onDirectionChange(DEFAULT_DIRECTION);
        }
      } else {
        onDirectionChange(direction);
      }
    },
    [disableInteractions, onDirectionChange, onSortChange, state.sort]
  );

  const handleToggleMyGrants = useCallback(
    (enabled: boolean) => {
      if (disableInteractions) return;
      onToggleMyGrants(enabled);
    },
    [disableInteractions, onToggleMyGrants]
  );

  const handleToggleReceiving = useCallback(
    (enabled: boolean) => {
      if (disableInteractions) return;
      onToggleReceiving(enabled);
    },
    [disableInteractions, onToggleReceiving]
  );

  const minRateId =
    view === "collections"
      ? "xtdh-collections-min-rate"
      : "xtdh-tokens-min-rate";
  const minGrantorsId =
    view === "collections"
      ? "xtdh-collections-min-grantors"
      : "xtdh-tokens-min-grantors";

  const personalFiltersDisabled =
    !connectedProfileId || disableInteractions;

  const tabSortDirection =
    state.direction === "asc" ? SortDirection.ASC : SortDirection.DESC;

  return {
    activeFilterCount,
    minRateId,
    minGrantorsId,
    personalFiltersDisabled,
    tabSortDirection,
    handleNetworkToggle,
    handleMinRateInput,
    handleMinGrantorsInput,
    handleSortSelect,
    handleSortWithDirection,
    handleToggleMyGrants,
    handleToggleReceiving,
  };
}
