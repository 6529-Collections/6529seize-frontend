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
}: {
  readonly summary: Summary;
  readonly selectedTarget: XtdhSelectedTarget | null;
  readonly amountPerDay: string;
  readonly onTargetChange: (t: XtdhSelectedTarget | null) => void;
  readonly onAmountChange: (v: string) => void;
  readonly onReset: () => void;
  readonly onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-5 tw-gap-4">
        <div className="lg:tw-col-span-2 tw-flex tw-flex-col tw-gap-4">
          <CapacityCard allocatedPerDay={summary.allocatedRatePerDay} />
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
          />
        </div>
      </div>

      <OutgoingGrantsTable rows={[]} />
    </>
  );
}
