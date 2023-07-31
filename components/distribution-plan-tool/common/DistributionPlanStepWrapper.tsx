export default function DistributionPlanStepWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tw-mt-8 tw-pt-8 tw-border-t tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-t-neutral-700/60 tw-mx-auto">
      {children}
    </div>
  );
}
