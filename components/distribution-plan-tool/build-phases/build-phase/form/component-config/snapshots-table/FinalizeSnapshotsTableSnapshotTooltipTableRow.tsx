export default function FinalizeSnapshotsTableSnapshotTooltipTableRow({
  name,
  value,
}: {
  name: string;
  value: string;
}) {
  return (
    <div className="tw-flex tw-w-full tw-items-start tw-gap-x-2 tw-whitespace-normal">
      <div className="tw-w-48 tw-flex-none tw-whitespace-nowrap">{name}:</div>
      <div className="tw-[overflow-wrap:anywhere] tw-min-w-0 tw-flex-1 tw-break-words">
        {value}
      </div>
    </div>
  );
}
