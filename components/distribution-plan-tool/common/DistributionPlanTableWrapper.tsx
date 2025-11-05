export default function DistributionPlanTableWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tw-flow-root">
      <div className="tw-overflow-x-auto tw-ring-1 tw-ring-white/10 tw-rounded-lg">
        <table className="tw-min-w-full tw-divide-y tw-divide-iron-700/60">
          {children}
        </table>
      </div>
    </div>
  );
}
