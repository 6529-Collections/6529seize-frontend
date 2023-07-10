export default function DistributionPlanTableHeaderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <thead className="tw-bg-neutral-800/60">
      <tr>{children}</tr>
    </thead>
  );
}
