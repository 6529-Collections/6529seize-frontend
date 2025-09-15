"use client";

import { useMemo, useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import XTDHTabs from "./ui/XTDHTabs";
import XTDHOverview from "./overview/XTDHOverview";
import XTDHGive from "./give/XTDHGive";
import XTDHReceive from "./receive/XTDHReceive";
import XTDHHistory from "./history/XTDHHistory";
import type { ReceiveFilter, Summary, XtdhInnerTab, XtdhSelectedTarget } from "./types";
import { XtdhInnerTab as TabId } from "./types";

export default function UserPageXTDH({ profile }: { profile: ApiIdentity }) {
  const [tab, setTab] = useState<XtdhInnerTab>(TabId.OVERVIEW);
  const [selectedTarget, setSelectedTarget] = useState<XtdhSelectedTarget | null>(null);
  const [amountPerDay, setAmountPerDay] = useState<string>("");
  const [receiveFilter, setReceiveFilter] = useState<ReceiveFilter>("ALL");

  const summary: Summary = useMemo(() => {
    const base = null;
    const mult = 0.1; // example default until wired
    const xtdh = base != null && mult != null ? +(base * mult).toFixed(4) : null;
    const total = base != null && xtdh != null ? +(base + xtdh).toFixed(4) : null;
    return {
      baseRatePerDay: base,
      multiplier: mult,
      xtdhRatePerDay: xtdh,
      totalRatePerDay: total,
      allocatedRatePerDay: null,
      incomingRatePerDay: null,
    };
  }, []);

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No-op in skeleton; wire API here next
  };

  const handleReset = () => {
    setSelectedTarget(null);
    setAmountPerDay("");
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <div className="tw-flex tw-items-baseline tw-justify-between">
        <h2 className="tw-text-iron-100 tw-text-xl lg:tw-text-2xl tw-font-semibold">xTDH Control Center</h2>
        <div className="tw-text-iron-400 tw-text-sm">{profile?.handle || profile?.display || "Identity"}</div>
      </div>

      <XTDHTabs active={tab} onChange={setTab} />

      {tab === TabId.OVERVIEW && <XTDHOverview summary={summary} />}
      {tab === TabId.GIVE && (
        <XTDHGive
          summary={summary}
          selectedTarget={selectedTarget}
          amountPerDay={amountPerDay}
          onTargetChange={setSelectedTarget}
          onAmountChange={setAmountPerDay}
          onReset={handleReset}
          onSubmit={handleAllocateSubmit}
        />
      )}
      {tab === TabId.RECEIVE && (
        <XTDHReceive summary={summary} filter={receiveFilter} onFilterChange={setReceiveFilter} />
      )}
      {tab === TabId.HISTORY && <XTDHHistory />}
    </div>
  );
}
