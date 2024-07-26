export default function FinalizeSnapshotsTableSnapshotTooltipTableRow({
  name,
  value,
}: {
  name: string;
  value: string;
}) {
  return (
    <div className="tw-w-full tw-inline-flex tw-space-x-2">
      <div className="tw-whitespace-nowrap">{name}:</div>
      <div>{value}</div>
    </div>
  );
}
