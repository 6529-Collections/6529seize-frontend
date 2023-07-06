import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import DistributionPlanTableBodyWrapper from "../../common/DistributionPlanTableBodyWrapper";
import ReviewDistributionPlanTableRow from "./ReviewDistributionPlanTableRow";
import { ReviewDistributionPlanTablePhase } from "./ReviewDistributionPlanTable";

export default function ReviewDistributionPlanTableBody({
  rows,
}: {
  rows: ReviewDistributionPlanTablePhase[];
}) {
  return (
    <DistributionPlanTableBodyWrapper>
      {rows.map((row) => (
        <>
          <ReviewDistributionPlanTableRow key={row.phase.id} item={row.phase} rows={rows} />
          {row.components.map((component) => (
            <ReviewDistributionPlanTableRow
              key={component.id}
              item={component}
              rows={rows}
            />
          ))}
        </>
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
