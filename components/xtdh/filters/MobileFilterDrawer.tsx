"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { classNames } from "@/helpers/Helpers";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import type { XtdhSortDirection } from "./types";

interface MobileFilterDrawerProps<SortValue extends string> {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly sortOptions: ReadonlyArray<CommonSelectItem<SortValue>>;
  readonly sort: SortValue;
  readonly direction: XtdhSortDirection;
  readonly onSelectSort: (value: SortValue) => void;
  readonly onSelectSortWithDirection: (
    value: SortValue,
    direction: XtdhSortDirection
  ) => void;
  readonly availableNetworks: string[];
  readonly selectedNetworks: string[];
  readonly onToggleNetwork: (network: string) => void;
  readonly minRate?: number;
  readonly minGrantors?: number;
  readonly onMinRateChange: (value: number | undefined) => void;
  readonly onMinGrantorsChange: (value: number | undefined) => void;
  readonly showMyGrants: boolean;
  readonly showMyReceiving: boolean;
  readonly onToggleMyGrants: (enabled: boolean) => void;
  readonly onToggleReceiving: (enabled: boolean) => void;
  readonly connectedProfileId: string | null;
  readonly onClearAll: () => void;
  readonly disabled?: boolean;
}

export default function MobileFilterDrawer<SortValue extends string>({
  isOpen,
  onClose,
  sortOptions,
  sort,
  direction,
  onSelectSort,
  onSelectSortWithDirection,
  availableNetworks,
  selectedNetworks,
  onToggleNetwork,
  minRate,
  minGrantors,
  onMinRateChange,
  onMinGrantorsChange,
  showMyGrants,
  showMyReceiving,
  onToggleMyGrants,
  onToggleReceiving,
  connectedProfileId,
  onClearAll,
  disabled = false,
}: Readonly<MobileFilterDrawerProps<SortValue>>) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-justify-end">
      <div
        className="tw-absolute tw-inset-0 tw-bg-iron-950/70"
        role="presentation"
        onClick={onClose}
      />
      <aside className="tw-relative tw-flex tw-h-full tw-w-[90%] tw-max-w-sm tw-flex-col tw-bg-iron-950 tw-p-6 tw-shadow-2xl">
        <header className="tw-flex tw-items-center tw-justify-between">
          <h2 className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-m-0">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="tw-h-9 tw-w-9 tw-rounded-full tw-border tw-border-iron-800 tw-text-lg tw-text-iron-200 hover:tw-bg-iron-900 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
            aria-label="Close filters"
          >
            ×
          </button>
        </header>

        <div className="tw-mt-6 tw-flex-1 tw-space-y-6 tw-overflow-y-auto">
          <section>
            <h3 className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-mb-3">
              Sort By
            </h3>
            <div className="tw-space-y-2">
              {sortOptions.map((option) => {
                const isActive = option.value === sort;
                return (
                  <div
                    key={option.key}
                    className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800 tw-px-3 tw-py-2"
                  >
                    <button
                      type="button"
                      className={classNames(
                        "tw-flex-1 tw-text-left tw-text-sm tw-font-medium",
                        isActive ? "tw-text-iron-50" : "tw-text-iron-200",
                        disabled ? "tw-opacity-50 tw-cursor-not-allowed" : ""
                      )}
                      onClick={() => {
                        if (disabled) return;
                        onSelectSort(option.value);
                      }}
                      disabled={disabled}
                    >
                      {option.label}
                    </button>
                    <div className="tw-flex tw-items-center tw-gap-1">
                      <DirectionToggle
                        label="↑"
                        isActive={isActive && direction === "asc"}
                        disabled={disabled}
                        onClick={() => {
                          if (disabled) return;
                          onSelectSortWithDirection(option.value, "asc");
                        }}
                      />
                      <DirectionToggle
                        label="↓"
                        isActive={isActive && direction === "desc"}
                        disabled={disabled}
                        onClick={() => {
                          if (disabled) return;
                          onSelectSortWithDirection(option.value, "desc");
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-mb-3">
              Network
            </h3>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {availableNetworks.length === 0 ? (
                <p className="tw-text-sm tw-text-iron-400 tw-m-0">
                  No network filters available.
                </p>
              ) : (
                availableNetworks.map((network) => (
                  <button
                    key={network}
                    type="button"
                    onClick={() => {
                      if (disabled) return;
                      onToggleNetwork(network);
                    }}
                    disabled={disabled}
                    className={classNames(
                      "tw-h-10 tw-rounded-full tw-border tw-border-iron-800 tw-px-4 tw-text-sm tw-font-semibold tw-transition focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0",
                      disabled
                        ? "tw-bg-iron-900 tw-text-iron-500 tw-cursor-not-allowed"
                        : selectedNetworks.includes(network)
                        ? "tw-bg-primary-500 tw-text-iron-950"
                        : "tw-bg-iron-900 tw-text-iron-200 hover:tw-bg-iron-800"
                    )}
                  >
                    {network}
                  </button>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-mb-3">
              Minimum Values
            </h3>
            <div className="tw-space-y-3">
              <div className="tw-flex tw-flex-col tw-gap-2">
                <label
                  htmlFor="mobile-min-rate"
                  className="tw-text-sm tw-font-medium tw-text-iron-200"
                >
                  Minimum xTDH Rate
                </label>
                <input
                  id="mobile-min-rate"
                  type="number"
                  min={0}
                  value={minRate ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "") {
                      onMinRateChange(undefined);
                      return;
                    }
                    const parsed = Number.parseFloat(value);
                    onMinRateChange(Number.isFinite(parsed) ? parsed : undefined);
                  }}
                  placeholder="Any"
                  disabled={disabled}
                  className={classNames(
                    "tw-h-10 tw-w-full tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-text-sm tw-text-iron-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400",
                    disabled ? "tw-opacity-50 tw-cursor-not-allowed" : ""
                  )}
                />
              </div>
              <div className="tw-flex tw-flex-col tw-gap-2">
                <label
                  htmlFor="mobile-min-grantors"
                  className="tw-text-sm tw-font-medium tw-text-iron-200"
                >
                  Minimum Grantors
                </label>
                <input
                  id="mobile-min-grantors"
                  type="number"
                  min={0}
                  value={minGrantors ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "") {
                      onMinGrantorsChange(undefined);
                      return;
                    }
                    const parsed = Number.parseInt(value, 10);
                    onMinGrantorsChange(Number.isFinite(parsed) ? parsed : undefined);
                  }}
                  placeholder="Any"
                  disabled={disabled}
                  className={classNames(
                    "tw-h-10 tw-w-full tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-text-sm tw-text-iron-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400",
                    disabled ? "tw-opacity-50 tw-cursor-not-allowed" : ""
                  )}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-mb-3">
              Show Collections
            </h3>
            <div className="tw-space-y-3">
              <CheckboxField
                id="mobile-my-grants"
                label="Collections I've allocated to"
                checked={showMyGrants && Boolean(connectedProfileId)}
                onChange={onToggleMyGrants}
                disabled={!connectedProfileId || disabled}
              />
              <CheckboxField
                id="mobile-receiving"
                label="Collections where I'm receiving"
                checked={showMyReceiving && Boolean(connectedProfileId)}
                onChange={onToggleReceiving}
                disabled={!connectedProfileId || disabled}
              />
              {!connectedProfileId && (
                <p className="tw-text-xs tw-text-amber-300 tw-m-0">
                  Connect to a profile to enable personal filters.
                </p>
              )}
            </div>
          </section>
        </div>

        <footer className="tw-mt-6 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              onClearAll();
            }}
            disabled={disabled}
            className="tw-h-10 tw-flex-1 tw-rounded-lg tw-border tw-border-iron-800 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-900 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="tw-h-10 tw-flex-1 tw-rounded-lg tw-bg-primary-500 tw-text-sm tw-font-semibold tw-text-iron-950 hover:tw-bg-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-0"
          >
            Apply
          </button>
        </footer>
      </aside>
    </div>,
    document.body
  );
}

function DirectionToggle({
  label,
  isActive,
  disabled,
  onClick,
}: {
  readonly label: string;
  readonly isActive: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "tw-h-8 tw-w-8 tw-rounded-md tw-text-sm tw-font-semibold tw-transition focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0",
        disabled
          ? "tw-bg-iron-900 tw-text-iron-500 tw-cursor-not-allowed"
          : isActive
            ? "tw-bg-primary-500 tw-text-iron-950"
            : "tw-bg-iron-900 tw-text-iron-200 hover:tw-bg-iron-800"
      )}
      aria-label={label === "↑" ? "Sort ascending" : "Sort descending"}
    >
      {label}
    </button>
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
        "tw-flex tw-items-center tw-gap-3 tw-text-sm tw-font-medium",
        disabled ? "tw-text-iron-500" : "tw-text-iron-200"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="tw-h-5 tw-w-5 tw-rounded tw-border tw-border-iron-800 tw-bg-iron-950 focus:tw-ring-primary-400"
      />
      <span>{label}</span>
    </label>
  );
}
