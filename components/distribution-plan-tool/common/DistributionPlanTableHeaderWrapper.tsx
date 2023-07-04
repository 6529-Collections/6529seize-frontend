export default function DistributionPlanTableHeaderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <thead className="tw-bg-[#1E1E1E]">
      <tr>{children}</tr>
    </thead>
  );
}
