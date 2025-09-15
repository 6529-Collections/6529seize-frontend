"use client";

import type { Summary, XtdhSelectedTarget } from "../types";
import CapacityCard from "./CapacityCard";
import AllocateSection from "./allocate/AllocateSection";
import OutgoingGrantsTable from "./outgoing/OutgoingGrantsTable";

export default function XTDHGive({
  summary,
  selectedTarget,
  amountPerDay,
  onTargetChange,
  onAmountChange,
  onReset,
  onSubmit,
  rows,
  loading,
}: {
  readonly summary: Summary;
  readonly selectedTarget: XtdhSelectedTarget | null;
  readonly amountPerDay: string;
  readonly onTargetChange: (t: XtdhSelectedTarget | null) => void;
  readonly onAmountChange: (v: string) => void;
  readonly onReset: () => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly rows: import("./outgoing/OutgoingGrantRow").OutgoingGrantRowData[];
  readonly loading?: boolean;
}) {
  const base = typeof summary.baseRatePerDay === "number" ? summary.baseRatePerDay : 0;
  const multiplier = typeof summary.multiplier === "number" ? summary.multiplier : 0;
  const capacity = base * multiplier;
  const allocated = typeof summary.allocatedRatePerDay === "number" ? summary.allocatedRatePerDay : 0;
  const remaining = Math.max(0, capacity - allocated);
  return (
    <>
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-5 tw-gap-4">
        <div className="lg:tw-col-span-2 tw-flex tw-flex-col tw-gap-4">
          <CapacityCard
            allocatedPerDay={summary.allocatedRatePerDay}
            capacityPerDay={capacity}
            remainingPerDay={remaining}
          />
        </div>

        <div className="lg:tw-col-span-3">
          <AllocateSection
            selectedTarget={selectedTarget}
            amountPerDay={amountPerDay}
            onTargetChange={onTargetChange}
            onAmountChange={onAmountChange}
            onReset={onReset}
            onSubmit={onSubmit}
            submitDisabled={!selectedTarget || !amountPerDay}
            capacityPerDay={capacity}
            allocatedPerDay={allocated}
          />
        </div>
      </div>

      <OutgoingGrantsTable rows={rows} loading={loading} />
    </>
  );
}
