"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { classNames } from "@/helpers/Helpers";
import { SortDirection } from "@/entities/ISort";
import {
  ACTIVITY_LABELS,
  DEFAULT_COLLECTION_SORT,
  DEFAULT_DIRECTION,
  DEFAULT_TOKEN_SORT,
} from "./constants";
import MobileFilterDrawer from "./MobileFilterDrawer";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import type { ActivityLabels } from "./constants";
import type {
  XtdhFilterState,
  XtdhCollectionsSort,
  XtdhTokensSort,
  XtdhView,
  XtdhSortDirection,
} from "./types";

type XtdhSortValue = XtdhCollectionsSort | XtdhTokensSort;

interface XtdhFilterBarProps<SortValue extends XtdhSortValue> {
  readonly view: XtdhView;
  readonly state: XtdhFilterState<SortValue>;
  readonly sortOptions: ReadonlyArray<CommonSelectItem<SortValue>>;
  readonly connectedProfileId: string | null;
  readonly availableNetworks: string[];
  readonly disableInteractions: boolean;
  readonly onSortChange: (sort: SortValue) => void;
  readonly onDirectionChange: (direction: XtdhSortDirection) => void;
  readonly onNetworksChange: (networks: string[]) => void;
  readonly onMinRateChange: (value: number | undefined) => void;
  readonly onMinGrantorsChange: (value: number | undefined) => void;
  readonly onToggleMyGrants: (enabled: boolean) => void;
  readonly onToggleReceiving: (enabled: boolean) => void;
  readonly onClearAll: () => void;
  readonly activityLabels?: ActivityLabels;
}

export default function XtdhFilterBar<SortValue extends XtdhSortValue>({
  view,
  state,
  sortOptions,
  connectedProfileId,
  availableNetworks,
  disableInteractions,
  onSortChange,
  onDirectionChange,
  onNetworksChange,
  onMinRateChange,
  onMinGrantorsChange,
  onToggleMyGrants,
  onToggleReceiving,
  onClearAll,
  activityLabels = ACTIVITY_LABELS[view],
}: Readonly<XtdhFilterBarProps<SortValue>>) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
      const nextNetworks = state.networks.includes(network)
        ? state.networks.filter((item) => item !== network)
        : [...state.networks, network];
      onNetworksChange(nextNetworks);
    },
    [disableInteractions, onNetworksChange, state.networks]
  );

  const handleMinRateInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
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
    (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const tabSortDirection = state.direction === "asc" ? SortDirection.ASC : SortDirection.DESC;

  return (
    <>
      <div className="tw-hidden md:tw-flex md:tw-flex-col md:tw-space-y-3 md:tw-border-b md:tw-border-iron-800 md:tw-pb-4">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
          <NetworkDropdown
            networks={availableNetworks}
            selected={state.networks}
            onToggle={handleNetworkToggle}
            disabled={disableInteractions}
          />

          <NumberField
            id={minRateId}
            label="Minimum xTDH Rate"
            value={state.minRate}
            placeholder="Any"
            onChange={handleMinRateInput}
            disabled={disableInteractions}
          />
          <NumberField
            id={minGrantorsId}
            label="Minimum Grantors"
            value={state.minGrantors}
            placeholder="Any"
            onChange={handleMinGrantorsInput}
            disabled={disableInteractions}
          />

          <CheckboxField
            id={`${view}-my-grants`}
            label={activityLabels.allocated}
            checked={state.showMyGrants && Boolean(connectedProfileId)}
            onChange={handleToggleMyGrants}
            disabled={personalFiltersDisabled}
          />
          <CheckboxField
            id={`${view}-receiving`}
            label={activityLabels.receiving}
            checked={state.showMyReceiving && Boolean(connectedProfileId)}
            onChange={handleToggleReceiving}
            disabled={personalFiltersDisabled}
          />
          {!connectedProfileId ? (
            <span className="tw-text-xs tw-text-amber-300">
              Connect to a profile to enable personal filters.
            </span>
          ) : null}
        </div>

        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
          <CommonTabs
            items={[...sortOptions] as CommonSelectItem<SortValue>[]}
            activeItem={state.sort}
            setSelected={handleSortSelect}
            sortDirection={tabSortDirection}
            filterLabel={`Sort ${view}`}
          />
        </div>
      </div>

      <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-800 tw-pb-4 md:tw-hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-50 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
        >
          <span aria-hidden="true">☰</span>
          <span>Filters &amp; Sort</span>
          {activeFilterCount > 0 ? (
            <span className="tw-inline-flex tw-h-6 tw-min-w-[1.5rem] tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-px-2 tw-text-xs tw-font-bold tw-text-iron-950">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        <SortSummary
          sortOptions={sortOptions}
          sort={state.sort}
          direction={state.direction}
        />
      </div>

      <MobileFilterDrawer
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        sortOptions={sortOptions}
        sort={state.sort}
        direction={state.direction}
        onSelectSort={handleSortSelect}
        onSelectSortWithDirection={handleSortWithDirection}
        availableNetworks={availableNetworks}
        selectedNetworks={state.networks}
        onToggleNetwork={handleNetworkToggle}
        minRate={state.minRate}
        minGrantors={state.minGrantors}
        onMinRateChange={onMinRateChange}
        onMinGrantorsChange={onMinGrantorsChange}
        showMyGrants={state.showMyGrants}
        showMyReceiving={state.showMyReceiving}
        onToggleMyGrants={handleToggleMyGrants}
        onToggleReceiving={handleToggleReceiving}
        connectedProfileId={connectedProfileId}
        onClearAll={() => {
          onClearAll();
          setIsMobileOpen(false);
        }}
        disabled={disableInteractions}
      />
    </>
  );
}

function NumberField({
  id,
  label,
  value,
  placeholder,
  onChange,
  disabled,
}: {
  readonly id: string;
  readonly label: string;
  readonly value?: number;
  readonly placeholder?: string;
  readonly onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly disabled?: boolean;
}) {
  return (
    <label className="tw-flex tw-flex-col tw-gap-1">
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
        {label}
      </span>
      <input
        id={id}
        type="number"
        min={0}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={classNames(
          "tw-h-10 tw-w-44 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400",
          disabled ? "tw-opacity-50 tw-cursor-not-allowed" : ""
        )}
      />
    </label>
  );
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
  readonly disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={classNames(
        "tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium",
        disabled ? "tw-text-iron-500" : "tw-text-iron-200"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="tw-h-5 tw-w-5 tw-rounded tw-border tw-border-iron-800 tw-bg-iron-950 focus:tw-ring-primary-400"
      />
      <span>{label}</span>
    </label>
  );
}

function NetworkDropdown({
  networks,
  selected,
  onToggle,
  disabled,
}: {
  readonly networks: string[];
  readonly selected: string[];
  readonly onToggle: (network: string) => void;
  readonly disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const handleToggleOpen = useCallback(() => {
    if (disabled || networks.length === 0) return;
    setOpen((prev) => !prev);
  }, [disabled, networks.length]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-network-dropdown="true"]')) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const activeLabel = useMemo(() => {
    if (selected.length === 0 || selected.length === networks.length) {
      return "All networks";
    }
    if (selected.length === 1) {
      return selected[0];
    }
    return `${selected.length.toLocaleString()} networks`;
  }, [networks.length, selected]);

  return (
    <div className="tw-relative" data-network-dropdown="true">
      <button
        type="button"
        onClick={handleToggleOpen}
        disabled={disabled || networks.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={classNames(
          "tw-flex tw-h-10 tw-min-w-[11rem] tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-transition",
          disabled || networks.length === 0
            ? "tw-opacity-50 tw-text-iron-500 tw-cursor-not-allowed"
            : "hover:tw-bg-iron-800 tw-text-iron-200"
        )}
      >
        <span>{networks.length === 0 ? "No networks" : activeLabel}</span>
        <span aria-hidden>{open ? "▲" : "▼"}</span>
      </button>
      {open ? (
        <div className="tw-absolute tw-z-30 tw-mt-2 tw-w-56 tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-shadow-xl">
          <ul className="tw-max-h-60 tw-overflow-y-auto tw-py-2" role="listbox" aria-multiselectable="true">
            {networks.map((network) => {
              const checked = selectedSet.has(network);
              return (
                <li key={network}>
                  <label className="tw-flex tw-cursor-pointer tw-items-center tw-justify-between tw-gap-2 tw-px-4 tw-py-2 hover:tw-bg-iron-900">
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(network)}
                        className="tw-h-4 tw-w-4 tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400"
                      />
                      <span className="tw-text-sm tw-text-iron-100">{network}</span>
                    </div>
                  </label>
                </li>
              );
            })}
            {networks.length === 0 ? (
              <li className="tw-px-4 tw-py-2 tw-text-sm tw-text-iron-400">No network filters available.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SortSummary<SortValue extends string>({
  sortOptions,
  sort,
  direction,
}: {
  readonly sortOptions: ReadonlyArray<CommonSelectItem<SortValue>>;
  readonly sort: SortValue;
  readonly direction: XtdhSortDirection;
}) {
  const activeOption = useMemo(
    () => sortOptions.find((option) => option.value === sort),
    [sortOptions, sort]
  );

  if (!activeOption) {
    return null;
  }

  return (
    <div className="tw-text-xs tw-font-medium tw-text-iron-300">
      {activeOption.label} {direction === "asc" ? "↑" : "↓"}
    </div>
  );
}
