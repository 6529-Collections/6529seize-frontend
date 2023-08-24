import { useRouter } from "next/router";
import { AllowlistDescription } from "../../allowlist-tool/allowlist-tool.types";

export default function DistributionPlanToolPlansTable({
  plans,
}: {
  plans: AllowlistDescription[];
}) {
  const router = useRouter();
  const goToDistributionPlan = (id: string) => {
    router.push(`/distribution-plan-tool/plans/${id}`);
  };
  return (
    <div>
      {plans.map((plan) => (
        <div
          onClick={() => goToDistributionPlan(plan.id)}
          key={plan.id}
          className="tw-w-full tw-inline-flex tw-justify-between tw-cursor-pointer tw-p-4 tw-border tw-border-solid tw-border-neutral-700 tw-rounded-md tw-mb-4"
        >
          <div>{plan.name}</div>
          <div>{plan.description}</div>
          <div>{new Date(plan.createdAt).toDateString()}</div>
        </div>
      ))}
    </div>
  );
}
