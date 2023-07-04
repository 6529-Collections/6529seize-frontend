import DistributionPlanTableWrapper from "../../common/DistributionPlanTableWrapper";
import ReviewDistributionPlanTableBody from "./ReviewDistributionPlanTableBody";
import ReviewDistributionPlanTableHeader from "./ReviewDistributionPlanTableHeader";

export default function ReviewDistributionPlanTable() {
  return (
    <DistributionPlanTableWrapper>
      <ReviewDistributionPlanTableHeader />
      <ReviewDistributionPlanTableBody />
    </DistributionPlanTableWrapper>
  );
}
