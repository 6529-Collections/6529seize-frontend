import type { DistributionPlanSearchContractMetadataResult } from "@/components/allowlist-tool/allowlist-tool.types";
import CreateSnapshotFormSearchCollectionDropdownTable from "./CreateSnapshotFormSearchCollectionDropdownTable";

export default function CreateSnapshotFormSearchCollectionDropdown({
  collections,
  defaultCollections,
  onCollection,
}: {
  collections: DistributionPlanSearchContractMetadataResult[];
  defaultCollections: DistributionPlanSearchContractMetadataResult[];
  onCollection: (param: {
    address: string;
    name: string;
    tokenIds: string | null;
  }) => void;
}) {
  return (
    <div className="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-shadow-lg tw-ring-1 tw-ring-white/10">
      <div className="tw-flow-root tw-max-h-96 tw-overflow-y-auto tw-overflow-x-hidden tw-py-1">
        {!!collections.length && (
          <CreateSnapshotFormSearchCollectionDropdownTable
            collections={collections}
            onCollection={onCollection}
          />
        )}
        <div className="tw-pt-1">
          {!!defaultCollections.length && (
            <CreateSnapshotFormSearchCollectionDropdownTable
              collections={defaultCollections}
              onCollection={onCollection}
            />
          )}
        </div>
      </div>
    </div>
  );
}
