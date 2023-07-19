export default function DistributionPlanTableWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tw-flow-root">
      <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
        <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle sm:tw-px-6 lg:tw-px-8">
          <div className="tw-overflow-hidden tw-shadow tw-ring-1 tw-ring-white/10 tw-rounded-lg">
            <table className="tw-min-w-full tw-divide-y tw-divide-neutral-700">
              {children}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
