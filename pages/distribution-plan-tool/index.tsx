import DistributionPlanToolWrapper from "../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import DistributionPlanToolConnect from "../../components/distribution-plan-tool/connect/distributipn-plan-tool-connect";

export default function DistributionPlanTool() {
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-w-full tw-h-full tw-min-h-screen">
        <DistributionPlanToolConnect />
      </div>
    </DistributionPlanToolWrapper>
  );
}
