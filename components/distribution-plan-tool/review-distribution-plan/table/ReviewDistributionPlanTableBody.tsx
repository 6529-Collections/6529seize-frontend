"use client";

import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import DistributionPlanTableBodyWrapper from "../../common/DistributionPlanTableBodyWrapper";
import ReviewDistributionPlanTableRow from "./ReviewDistributionPlanTableRow";
import {
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
