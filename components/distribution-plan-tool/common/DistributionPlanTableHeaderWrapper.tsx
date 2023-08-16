export default function DistributionPlanTableHeaderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <thead className="tw-bg-neutral-800">
      <tr>{children}</tr>
    </thead>
  );
}
