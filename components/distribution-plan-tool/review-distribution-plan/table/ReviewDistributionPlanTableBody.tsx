"use client";

import ReviewDistributionPlanTableRow from "./ReviewDistributionPlanTableRow";
import type { ReviewDistributionPlanTablePhase } from "./ReviewDistributionPlanTable.types";

export default function ReviewDistributionPlanTableBody({
  rows,
  showManual = false,
}: {
  rows: ReviewDistributionPlanTablePhase[];
  showManual?: boolean;
}) {
  const items = rows.flatMap(({ phase, components }) => [phase, ...components]);

  return (
    <tbody
      role="rowgroup"
      className="tw-divide-y tw-divide-iron-700/40 tw-bg-iron-900"
    >
      {items.map((item) => (
        <ReviewDistributionPlanTableRow
          key={item.id}
          item={item}
          rows={rows}
          showManual={showManual}
        />
      ))}
    </tbody>
  );
}
