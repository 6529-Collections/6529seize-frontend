import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import type { SortDirection } from "@/entities/ISort";
import type { ChangeEvent } from "react";
import type { ActivityLabels } from "../constants";
import type {
  XtdhCollectionsSort,
  XtdhFilterState,
  XtdhTokensSort,
  XtdhView,
} from "../types";
import XtdhFilterCheckboxField from "./fields/XtdhFilterCheckboxField";
import XtdhFilterNumberField from "./fields/XtdhFilterNumberField";
import XtdhNetworkDropdown from "./fields/XtdhNetworkDropdown";

type XtdhSortValue = XtdhCollectionsSort | XtdhTokensSort;

interface DesktopFilterPanelProps<SortValue extends XtdhSortValue> {
  readonly view: XtdhView;
  readonly sortOptions: ReadonlyArray<CommonSelectItem<SortValue>>;
  readonly state: XtdhFilterState<SortValue>;
  readonly availableNetworks: string[];
  readonly connectedProfileId: string | null;
  readonly activityLabels: ActivityLabels;
  readonly disableInteractions: boolean;
  readonly minRateId: string;
  readonly minGrantorsId: string;
  readonly personalFiltersDisabled: boolean;
  readonly tabSortDirection: SortDirection;
  readonly onNetworkToggle: (network: string) => void;
  readonly onMinRateChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onMinGrantorsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onToggleMyGrants: (enabled: boolean) => void;
  readonly onToggleReceiving: (enabled: boolean) => void;
  readonly onSortSelect: (value: SortValue) => void;
}

export default function DesktopFilterPanel<SortValue extends XtdhSortValue>({
  view,
  sortOptions,
  state,
  availableNetworks,
  connectedProfileId,
  activityLabels,
  disableInteractions,
  minRateId,
  minGrantorsId,
  personalFiltersDisabled,
  tabSortDirection,
  onNetworkToggle,
  onMinRateChange,
  onMinGrantorsChange,
  onToggleMyGrants,
  onToggleReceiving,
  onSortSelect,
}: Readonly<DesktopFilterPanelProps<SortValue>>) {
  return (
    <div className="tw-hidden md:tw-flex md:tw-flex-col md:tw-space-y-3 md:tw-border-b md:tw-border-iron-800 md:tw-pb-4">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
        <XtdhNetworkDropdown
          networks={availableNetworks}
          selected={state.networks}
          onToggle={onNetworkToggle}
          disabled={disableInteractions}
        />

        <XtdhFilterNumberField
          id={minRateId}
          label="Minimum xTDH Rate"
          value={state.minRate}
          placeholder="Any"
          onChange={onMinRateChange}
          disabled={disableInteractions}
        />

        <XtdhFilterNumberField
          id={minGrantorsId}
          label="Minimum Grantors"
          value={state.minGrantors}
          placeholder="Any"
          onChange={onMinGrantorsChange}
          disabled={disableInteractions}
        />

        <XtdhFilterCheckboxField
          id={`${view}-my-grants`}
          label={activityLabels.allocated}
          checked={state.showMyGrants && Boolean(connectedProfileId)}
          onChange={onToggleMyGrants}
          disabled={personalFiltersDisabled}
        />
        <XtdhFilterCheckboxField
          id={`${view}-receiving`}
          label={activityLabels.receiving}
          checked={state.showMyReceiving && Boolean(connectedProfileId)}
          onChange={onToggleReceiving}
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
          setSelected={onSortSelect}
          sortDirection={tabSortDirection}
          filterLabel={`Sort ${view}`}
        />
      </div>
    </div>
  );
}
