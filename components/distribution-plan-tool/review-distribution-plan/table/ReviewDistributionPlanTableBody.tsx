import { useContext } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import DistributionPlanTableBodyWrapper from "../../common/DistributionPlanTableBodyWrapper";
import ReviewDistributionPlanTableRow from "./ReviewDistributionPlanTableRow";

export default function ReviewDistributionPlanTableBody() {
  const { phases } = useContext(DistributionPlanToolContext);
  return (
    <DistributionPlanTableBodyWrapper>
      {phases.map((phase) => (
        <ReviewDistributionPlanTableRow key={phase.id} phase={phase} />
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
