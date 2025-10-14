"use client";

import CommonInput from "@/components/utils/input/CommonInput";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";

import {
  XTDH_COLLECTION_DISCOVERY_TABS,
  XTDH_COLLECTION_OWNERSHIP_TABS,
  type XtdhCollectionOwnershipFilter,
  type XtdhCollectionsDiscoveryFilter,
  type XtdhReceivedView,
} from "../../utils/constants";
import { XtdhReceivedViewToggle } from "../../subcomponents/XtdhReceivedViewToggle";

interface XtdhReceivedCollectionsDesktopControlsProps {
  readonly searchQuery: string;
  readonly onSearchChange: (value: string | null) => void;
  readonly ownershipFilter: XtdhCollectionOwnershipFilter;
  readonly onOwnershipFilterChange: (
    filter: XtdhCollectionOwnershipFilter,
  ) => void;
  readonly discoveryFilter: XtdhCollectionsDiscoveryFilter;
  readonly onDiscoveryFilterChange: (
    filter: XtdhCollectionsDiscoveryFilter,
  ) => void;
  readonly isLoading: boolean;
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
}

export function XtdhReceivedCollectionsDesktopControls({
  searchQuery,
  onSearchChange,
  ownershipFilter,
  onOwnershipFilterChange,
  discoveryFilter,
  onDiscoveryFilterChange,
  isLoading,
  view,
  onViewChange,
  announcement,
}: XtdhReceivedCollectionsDesktopControlsProps) {
  return (
    <div className="hidden md:flex md:flex-col md:gap-4">
      <div className="tw-flex tw-flex-wrap md:tw:flex-nowrap tw-items-center tw-gap-3 xl:tw-gap-4">
        <div className="tw-min-w-[220px] tw-max-w-[360px] tw-flex-shrink-0">
          <CommonInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search collections..."
            showSearchIcon={true}
            disabled={isLoading}
          />
        </div>
        <div className="tw-flex-1 tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex-1">
            <CommonTabs<XtdhCollectionOwnershipFilter>
              items={XTDH_COLLECTION_OWNERSHIP_TABS}
              activeItem={ownershipFilter}
              filterLabel="Relationship filter"
              setSelected={onOwnershipFilterChange}
              disabled={isLoading}
            />
          </div>
          <div className="tw-flex-1">
            <CommonTabs<XtdhCollectionsDiscoveryFilter>
              items={XTDH_COLLECTION_DISCOVERY_TABS}
              activeItem={discoveryFilter}
              filterLabel="Discovery filter"
              setSelected={onDiscoveryFilterChange}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="tw-flex-shrink-0 tw-ml-auto">
          <XtdhReceivedViewToggle
            view={view}
            onViewChange={onViewChange}
            announcement={announcement}
          />
        </div>
      </div>
    </div>
  );
}
