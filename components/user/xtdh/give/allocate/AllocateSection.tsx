"use client";

import XTDHCard from "../../ui/XTDHCard";
import AllocateForm from "./AllocateForm";
import CollectionTokenPicker from "./CollectionTokenPicker";
import { useState } from "react";
import type { XtdhSelectedTarget } from "../../types";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function AllocateSection({
  profile,
  onAllocate,
}: {
  readonly profile: ApiIdentity;
  readonly onAllocate: (payload: {
    target: XtdhSelectedTarget;
    amountPerDay: number;
  }) => void;
}) {
  const [selectedTarget, setSelectedTarget] = useState<XtdhSelectedTarget | null>(null);

  const handleReset = () => {
    setSelectedTarget(null);
  };

  return (
    <XTDHCard title="Allocate xTDH">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <CollectionTokenPicker value={selectedTarget} onChange={setSelectedTarget} />
        <AllocateForm
          profile={profile}
          onSubmitAmount={(amountPerDay) => {
            if (!selectedTarget) return;
            onAllocate({ target: selectedTarget, amountPerDay });
          }}
          disabled={!selectedTarget}
          helpers={undefined}
        />
        <div className="tw-flex tw-justify-end">
          <button
            type="button"
            className="tw-bg-iron-800 tw-text-iron-200 tw-rounded tw-px-3 tw-py-2 tw-border tw-border-iron-700 hover:tw-bg-iron-700 tw-transition"
            onClick={handleReset}
          >
            Reset Selection
          </button>
        </div>
      </div>
    </XTDHCard>
  );
}
