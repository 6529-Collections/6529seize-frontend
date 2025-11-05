import AllowlistToolAnimationWrapper from "@/components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper";

export default function DistributionPlanTableBodyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <tbody className="tw-bg-iron-900 tw-divide-y tw-divide-iron-700/40">
      <AllowlistToolAnimationWrapper mode="sync"  initial={false}>
        {children}
      </AllowlistToolAnimationWrapper>
    </tbody>
  );
}
