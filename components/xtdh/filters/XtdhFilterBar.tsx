"use client";

import { useCallback, useMemo, useState } from "react";
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
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
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
      if (isChanging && state.direction !== DEFAULT_DIRECTION) {
        onDirectionChange(DEFAULT_DIRECTION);
      }
    },
    [disableInteractions, onSortChange, state.direction, onDirectionChange, state.sort]
  );

  const handleSortWithDirection = useCallback(
    (value: SortValue, direction: XtdhSortDirection) => {
      if (disableInteractions) return;
      if (state.sort !== value) {
        onSortChange(value);
      }
      onDirectionChange(direction);
    },
    [disableInteractions, onDirectionChange, onSortChange, state.sort]
  );

  const handleToggleDirection = useCallback(() => {
    if (disableInteractions) return;
    const nextDirection = state.direction === "asc" ? "desc" : "asc";
    onDirectionChange(nextDirection);
  }, [disableInteractions, onDirectionChange, state.direction]);

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

  return (
    <>
      <div className="tw-hidden md:tw-flex md:tw-flex-col md:tw-space-y-4 md:tw-border-b md:tw-border-iron-800 md:tw-pb-4">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              Sort By
            </span>
            <CommonTabs
              items={[...sortOptions] as CommonSelectItem<SortValue>[]}
              activeItem={state.sort}
              setSelected={handleSortSelect}
              sortDirection={tabSortDirection}
              filterLabel={`Sort ${view}`}
              disabled={disableInteractions}
            />
            <button
              type="button"
              onClick={handleToggleDirection}
              disabled={disableInteractions}
              className={classNames(
                "tw-inline-flex tw-items-center tw-justify-center tw-h-10 tw-w-10 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-text-sm tw-font-semibold tw-text-iron-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0 tw-transition",
                disableInteractions
                  ? "tw-opacity-50 tw-cursor-not-allowed"
                  : "hover:tw-bg-iron-800"
              )}
              aria-label={`Sort direction: ${state.direction === "desc" ? "descending" : "ascending"}`}
            >
              <CommonTableSortIcon direction={tabSortDirection} isActive={true} />
            </button>
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              Network
            </span>
            <div className="tw-flex tw-flex-wrap tw-gap-3">
              {availableNetworks.length === 0 ? (
                <span className="tw-text-sm tw-text-iron-400">
                  {disableInteractions
                    ? "Loading networks…"
                    : "No network filters available."}
                </span>
              ) : (
                availableNetworks.map((network) => (
                  <button
                    key={network}
                    type="button"
                    onClick={() => handleNetworkToggle(network)}
                    disabled={disableInteractions}
                    className={classNames(
                      "tw-h-10 tw-rounded-full tw-border tw-border-iron-800 tw-px-4 tw-text-sm tw-font-semibold tw-transition focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0",
                      disableInteractions
                        ? "tw-bg-iron-900 tw-text-iron-500 tw-cursor-not-allowed"
                        : state.networks.includes(network)
                        ? "tw-bg-primary-500 tw-text-iron-950"
                        : "tw-bg-iron-900 tw-text-iron-200 hover:tw-bg-iron-800"
                    )}
                  >
                    {network}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
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
          </div>
          <div className="tw-flex tw-flex-col tw-items-end tw-gap-2">
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
