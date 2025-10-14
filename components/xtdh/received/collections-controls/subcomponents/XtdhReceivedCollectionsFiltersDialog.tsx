"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";

import {
  XTDH_COLLECTION_DISCOVERY_TABS,
  XTDH_COLLECTION_OWNERSHIP_TABS,
  type XtdhCollectionOwnershipFilter,
  type XtdhCollectionsDiscoveryFilter,
} from "../../utils/constants";

interface XtdhReceivedCollectionsFiltersDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly ownershipFilter: XtdhCollectionOwnershipFilter;
  readonly onOwnershipFilterChange: (
    filter: XtdhCollectionOwnershipFilter,
  ) => void;
  readonly discoveryFilter: XtdhCollectionsDiscoveryFilter;
  readonly onDiscoveryFilterChange: (
    filter: XtdhCollectionsDiscoveryFilter,
  ) => void;
  readonly isLoading: boolean;
}

export function XtdhReceivedCollectionsFiltersDialog({
  isOpen,
  onClose,
  ownershipFilter,
  onOwnershipFilterChange,
  discoveryFilter,
  onDiscoveryFilterChange,
  isLoading,
}: XtdhReceivedCollectionsFiltersDialogProps) {
  return (
    <MobileWrapperDialog
      title="Filters"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="tw-flex tw-flex-col tw-gap-6 tw-px-4 tw-pb-6">
        <section className="tw-flex tw-flex-col tw-gap-3">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
            Relationship
          </span>
          <CommonTabs<XtdhCollectionOwnershipFilter>
            items={XTDH_COLLECTION_OWNERSHIP_TABS}
            activeItem={ownershipFilter}
            filterLabel="Relationship filter"
            setSelected={onOwnershipFilterChange}
            disabled={isLoading}
          />
        </section>

        <section className="tw-flex tw-flex-col tw-gap-3">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
            Discovery
          </span>
          <CommonTabs<XtdhCollectionsDiscoveryFilter>
            items={XTDH_COLLECTION_DISCOVERY_TABS}
            activeItem={discoveryFilter}
            filterLabel="Discovery filter"
            setSelected={onDiscoveryFilterChange}
            disabled={isLoading}
          />
        </section>

        <div className="tw-flex tw-justify-end tw-gap-3">
          <button
            type="button"
            onClick={onClose}
            className="tw-inline-flex tw-flex-1 tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 tw-transition tw-duration-200"
          >
            Apply
          </button>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}
