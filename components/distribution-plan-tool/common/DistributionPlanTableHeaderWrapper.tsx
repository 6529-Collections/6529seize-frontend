export default function DistributionPlanTableHeaderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <thead className="tw-bg-iron-800">
      <tr>{children}</tr>
    </thead>
  );
}
