"use client";

import XTDHCard from "../../ui/XTDHCard";
import TargetSelector from "../../TargetSelector";
import TargetSummary from "./TargetSummary";
import AllocateForm from "./AllocateForm";
import type { XtdhSelectedTarget } from "../../types";

export default function AllocateSection({
  selectedTarget,
  amountPerDay,
  onTargetChange,
  onAmountChange,
  onReset,
  onSubmit,
  submitDisabled,
}: {
  readonly selectedTarget: XtdhSelectedTarget | null;
  readonly amountPerDay: string;
  readonly onTargetChange: (t: XtdhSelectedTarget | null) => void;
  readonly onAmountChange: (v: string) => void;
  readonly onReset: () => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly submitDisabled?: boolean;
}) {
  return (
    <XTDHCard title="Allocate xTDH">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <TargetSelector onChange={onTargetChange} />
        <TargetSummary target={selectedTarget} />
        <AllocateForm
          amountPerDay={amountPerDay}
          onAmountChange={onAmountChange}
          onReset={onReset}
          onSubmit={onSubmit}
          disabled={!!submitDisabled}
        />
      </div>
    </XTDHCard>
  );
}

