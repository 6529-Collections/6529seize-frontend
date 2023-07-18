import { DistributionPlanSearchContractMetadataResult } from "../../../allowlist-tool/allowlist-tool.types";
import CreateSnapshotFormSearchCollectionDropdownItem from "./CreateSnapshotFormSearchCollectionDropdownItem";

export default function CreateSnapshotFormSearchCollectionDropdownTable({
  collections,
  onCollection,
}: {
  collections: DistributionPlanSearchContractMetadataResult[];
  onCollection: (param: {
    address: string;
    name: string;
    tokenIds: string | null;
  }) => void;
}) {
  return (
    <table className="tw-min-w-full">
      <thead className="tw-border-b tw-border-solid tw-border-x-0 tw-border-neutral-700/60">
        <tr>
          <th
            scope="col"
            className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-xs tw-font-medium tw-text-neutral-400"
          >
            Collection
          </th>
          <th
            scope="col"
            className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-neutral-400"
          >
            All time volume
          </th>
          <th
            scope="col"
            className="tw-whitespace-nowrap tw-pl-3 tw-pr-4 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-neutral-400"
          >
            Floor
          </th>
        </tr>
      </thead>
      <tbody className="tw-divide-y tw-divide-neutral-700/60">
        {collections.map((collection) => (
          <CreateSnapshotFormSearchCollectionDropdownItem
            key={collection.id}
            collection={collection}
            onCollection={onCollection}
          />
        ))}
      </tbody>
    </table>
  );
}
