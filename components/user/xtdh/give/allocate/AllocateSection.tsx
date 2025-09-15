"use client";

import XTDHCard from "../../ui/XTDHCard";
import AllocateForm from "./AllocateForm";
import CollectionTokenPicker from "./CollectionTokenPicker";
import type { XtdhSelectedTarget } from "../../types";

export default function AllocateSection({
  selectedTarget,
  amountPerDay,
  onTargetChange,
  onAmountChange,
  onReset,
  onSubmit,
  submitDisabled,
  capacityPerDay,
  allocatedPerDay,
}: {
  readonly selectedTarget: XtdhSelectedTarget | null;
  readonly amountPerDay: string;
  readonly onTargetChange: (t: XtdhSelectedTarget | null) => void;
  readonly onAmountChange: (v: string) => void;
  readonly onReset: () => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly submitDisabled?: boolean;
  readonly capacityPerDay: number;
  readonly allocatedPerDay: number;
}) {
  return (
    <XTDHCard title="Allocate xTDH">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <CollectionTokenPicker value={selectedTarget} onChange={onTargetChange} />
        <AllocateForm
          amountPerDay={amountPerDay}
          onAmountChange={onAmountChange}
          onReset={onReset}
          onSubmit={onSubmit}
          disabled={!!submitDisabled}
          capacityPerDay={capacityPerDay}
          allocatedPerDay={allocatedPerDay}
        />
      </div>
    </XTDHCard>
  );
}
