import { CreateSnapshotSnapshot } from "./CreateSnapshotTableBody";

export default function CreateSnapshotTableRow({
  snapshot,
}: {
  snapshot: CreateSnapshotSnapshot;
}) {
  return (
    <tr>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {snapshot.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {snapshot.contract}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {snapshot.blockNo}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {snapshot.tokenIds ?? "All"}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {snapshot.walletsCount ?? 'N/A'}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {snapshot.tokensCount ?? 'N/A'}
      </td>
    </tr>
  );
}
