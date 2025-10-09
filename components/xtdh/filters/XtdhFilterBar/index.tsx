"use client";

import { useCallback, useState } from "react";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { ACTIVITY_LABELS } from "../constants";
import type { ActivityLabels } from "../constants";
import MobileFilterDrawer from "../MobileFilterDrawer";
import MobileControls from "./MobileControls";
import DesktopFilterPanel from "./DesktopFilterPanel";
import { useXtdhFilterBar } from "./useXtdhFilterBar";
import type {
  XtdhCollectionsSort,
  XtdhFilterState,
  XtdhTokensSort,
  XtdhView,
  XtdhSortDirection,
} from "../types";

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

  const {
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
  } = useXtdhFilterBar<SortValue>({
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
  });

  const handleOpenMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const handleCloseMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return (
    <>
      <DesktopFilterPanel
        view={view}
        sortOptions={sortOptions}
        state={state}
        availableNetworks={availableNetworks}
        connectedProfileId={connectedProfileId}
        activityLabels={activityLabels}
        disableInteractions={disableInteractions}
        minRateId={minRateId}
        minGrantorsId={minGrantorsId}
        personalFiltersDisabled={personalFiltersDisabled}
        tabSortDirection={tabSortDirection}
        onNetworkToggle={handleNetworkToggle}
        onMinRateChange={handleMinRateInput}
        onMinGrantorsChange={handleMinGrantorsInput}
        onToggleMyGrants={handleToggleMyGrants}
        onToggleReceiving={handleToggleReceiving}
        onSortSelect={handleSortSelect}
      />

      <MobileControls
        activeFilterCount={activeFilterCount}
        sortOptions={sortOptions}
        sort={state.sort}
        direction={state.direction}
        onOpenFilters={handleOpenMobile}
      />

      <MobileFilterDrawer
        isOpen={isMobileOpen}
        onClose={handleCloseMobile}
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
          handleCloseMobile();
        }}
        disabled={disableInteractions}
      />
    </>
  );
}
