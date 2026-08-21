export default function DistributionPlanTableWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tw-flow-root">
      <div
        role="region"
        aria-label="Scrollable data table"
        tabIndex={0}
        className="tw-w-full tw-max-w-full tw-overscroll-x-contain tw-overflow-x-auto tw-rounded-lg tw-pb-1 tw-ring-1 tw-ring-white/10 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/70 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-scrollbar-thumb-iron-500"
      >
        <table className="tw-min-w-full tw-divide-y tw-divide-iron-700/60">
          {children}
        </table>
      </div>
    </div>
  );
}
