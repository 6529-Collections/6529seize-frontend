import AllowlistToolAnimationWrapper from "../../allowlist-tool/common/animation/AllowlistToolAnimationWrapper";

export default function DistributionPlanTableBodyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <tbody className="tw-bg-neutral-900 tw-divide-y tw-divide-neutral-700/40">
      <AllowlistToolAnimationWrapper mode="sync"  initial={false}>
        {children}
      </AllowlistToolAnimationWrapper>
    </tbody>
  );
}
