"use client";

import { useEffect, useState } from "react";
import DistributionPlanTableBodyWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableBodyWrapper";
import ReviewDistributionPlanTableRow from "./ReviewDistributionPlanTableRow";
import type {
  ReviewDistributionPlanTableItem,
  ReviewDistributionPlanTablePhase,
} from "./ReviewDistributionPlanTable";

export default function ReviewDistributionPlanTableBody({
  rows,
}: {
  rows: ReviewDistributionPlanTablePhase[];
}) {
  const [items, setItems] = useState<ReviewDistributionPlanTableItem[]>([]);

  useEffect(() => {
    setItems(
      rows.flatMap((row) => {
        return [row.phase, ...row.components];
      })
    );
  }, [rows]);

  return (
    <DistributionPlanTableBodyWrapper>
      {items.map((item) => (
        <ReviewDistributionPlanTableRow key={item.id} item={item} rows={rows} />
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
