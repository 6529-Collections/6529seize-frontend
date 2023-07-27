export default function DistributionPlanSecondaryText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="tw-mb-0 tw-block tw-font-light tw-text-base tw-text-neutral-400">
      {children}
    </p>
  );
}
