"use client";

import { useCallback } from "react";
import CommonSelect, {
  type CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
import CommonSwitch from "@/components/utils/switch/CommonSwitch";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import { classNames } from "@/helpers/Helpers";
import { SortDirection } from "@/entities/ISort";
import type { ActivityLabels } from "./constants";
import { ACTIVITY_LABELS } from "./constants";
import type {
  XtdhFilterState,
  XtdhCollectionsSort,
  XtdhTokensSort,
  XtdhView,
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
  readonly onDirectionToggle: () => void;
  readonly onNetworksChange: (networks: string[]) => void;
  readonly onMinRateChange: (value: number | undefined) => void;
  readonly onMinGrantorsChange: (value: number | undefined) => void;
  readonly onToggleMyGrants: (enabled: boolean) => void;
  readonly onToggleReceiving: (enabled: boolean) => void;
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
  onDirectionToggle,
  onNetworksChange,
  onMinRateChange,
  onMinGrantorsChange,
  onToggleMyGrants,
  onToggleReceiving,
  activityLabels = ACTIVITY_LABELS[view],
}: Readonly<XtdhFilterBarProps<SortValue>>) {
  const handleNetworkToggle = useCallback(
    (network: string) => {
      const nextNetworks = state.networks.includes(network)
        ? state.networks.filter((item) => item !== network)
        : [...state.networks, network];
      onNetworksChange(nextNetworks);
    },
    [onNetworksChange, state.networks]
  );

  const handleMinRateInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === "") {
        onMinRateChange(undefined);
        return;
      }

      const parsed = Number.parseFloat(value);
      onMinRateChange(Number.isFinite(parsed) ? parsed : undefined);
    },
    [onMinRateChange]
  );

  const handleMinGrantorsInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === "") {
        onMinGrantorsChange(undefined);
        return;
      }

      const parsed = Number.parseInt(value, 10);
      onMinGrantorsChange(Number.isFinite(parsed) ? parsed : undefined);
    },
    [onMinGrantorsChange]
  );

  const minRateId = view === "collections" ? "xtdh-collections-min-rate" : "xtdh-tokens-min-rate";
  const minGrantorsId =
    view === "collections" ? "xtdh-collections-min-grantors" : "xtdh-tokens-min-grantors";

  const personalFiltersDisabled = !connectedProfileId;
  const sortDirection =
    state.direction === "asc" ? SortDirection.ASC : SortDirection.DESC;

  return (
    <div
      className="tw-grid tw-gap-4 lg:tw-grid-cols-2 xl:tw-grid-cols-[1.5fr_1fr]"
      role="region"
      aria-label="Filters"
    >
      <div className="tw-space-y-3">
        <label className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
          Sort By
        </label>
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-flex-1">
              <CommonSelect
                items={[...sortOptions]}
                activeItem={state.sort}
                filterLabel={`Sort ${view}`}
                setSelected={onSortChange}
                sortDirection={sortDirection}
                disabled={disableInteractions}
              />
            </div>
          <button
            type="button"
            onClick={onDirectionToggle}
            disabled={disableInteractions}
            className={classNames(
              "tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0 tw-transition tw-duration-200",
              disableInteractions ? "tw-opacity-50 tw-cursor-not-allowed" : "hover:tw-bg-iron-800"
            )}
            aria-label={`Sort direction: ${state.direction === "desc" ? "descending" : "ascending"}`}
          >
            <CommonTableSortIcon direction={sortDirection} isActive={true} />
          </button>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
        <div className="tw-space-y-2">
          <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-m-0">
            Network
          </p>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {availableNetworks.length === 0 ? (
              <span className="tw-text-sm tw-text-iron-400">
                {disableInteractions ? "Loading networks…" : "No network filters available."}
              </span>
            ) : (
              availableNetworks.map((network) => (
                <button
                  key={network}
                  type="button"
                  onClick={() => handleNetworkToggle(network)}
                  className={classNames(
                    "tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-iron-700 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-transition focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0",
                    state.networks.includes(network)
                      ? "tw-bg-primary-500 tw-text-iron-50"
                      : "tw-bg-iron-800 tw-text-iron-200 hover:tw-bg-iron-700"
                  )}
                >
                  {network}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          <div>
            <label
              htmlFor={minRateId}
              className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-block tw-mb-1"
            >
              Minimum xTDH Rate
            </label>
            <input
              id={minRateId}
              name={`${view}-min-rate`}
              type="number"
              min={0}
              value={state.minRate ?? ""}
              onChange={handleMinRateInput}
              placeholder="Any"
              className="tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
            />
          </div>
          <div>
            <label
              htmlFor={minGrantorsId}
              className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-block tw-mb-1"
            >
              Minimum Grantors
            </label>
            <input
              id={minGrantorsId}
              name={`${view}-min-grantors`}
              type="number"
              min={0}
              value={state.minGrantors ?? ""}
              onChange={handleMinGrantorsInput}
              placeholder="Any"
              className="tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
            />
          </div>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <CommonSwitch
            label={activityLabels.allocated}
            isOn={state.showMyGrants && Boolean(connectedProfileId)}
            setIsOn={onToggleMyGrants}
          />
          <CommonSwitch
            label={activityLabels.receiving}
            isOn={state.showMyReceiving && Boolean(connectedProfileId)}
            setIsOn={onToggleReceiving}
          />
          {personalFiltersDisabled && (
            <p className="tw-text-xs tw-text-amber-300 tw-m-0">
              Connect to a profile to enable personal filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
