"use client";

import XTDHCard from "../../ui/XTDHCard";
import AllocateForm from "./AllocateForm";
import CollectionTokenPicker from "./CollectionTokenPicker";
import { useState } from "react";
import type { XtdhSelectedTarget } from "../../types";
import type { XtdhSelectedTarget } from "../../types";

export default function AllocateSection({
  capacityPerDay,
  allocatedPerDay,
  onAllocate,
}: {
  readonly capacityPerDay: number;
  readonly allocatedPerDay: number;
  readonly onAllocate?: (payload: {
    target: XtdhSelectedTarget;
    amountPerDay: number;
  }) => void;
}) {
  const [selectedTarget, setSelectedTarget] = useState<XtdhSelectedTarget | null>(null);
  const [amountPerDay, setAmountPerDay] = useState<string>("");

  const handleReset = () => {
    setAmountPerDay("");
    setSelectedTarget(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) return;
    const n = Math.floor(Number(amountPerDay));
    if (!Number.isFinite(n) || n <= 0) return;
    onAllocate?.({ target: selectedTarget, amountPerDay: n });
  };
  return (
    <XTDHCard title="Allocate xTDH">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <CollectionTokenPicker value={selectedTarget} onChange={setSelectedTarget} />
        <AllocateForm
          amountPerDay={amountPerDay}
          onAmountChange={setAmountPerDay}
          onReset={handleReset}
          onSubmit={handleSubmit}
          disabled={!selectedTarget || !amountPerDay}
          capacityPerDay={capacityPerDay}
          allocatedPerDay={allocatedPerDay}
        />
      </div>
    </XTDHCard>
  );
}
