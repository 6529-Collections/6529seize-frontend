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
    <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-max-w-lg tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-lg tw-ring-1 tw-ring-white/10">
      <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
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
