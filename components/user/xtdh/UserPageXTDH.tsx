"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import XTDHTabs from "./ui/XTDHTabs";
import XTDHOverview from "./overview/XTDHOverview";
import XTDHGive from "./give/XTDHGive";
import XTDHReceive from "./receive/XTDHReceive";
import XTDHHistory from "./history/XTDHHistory";
import XTDHHeaderStats from "./header/XTDHHeaderStats";
import type { ReceiveFilter, Summary, XtdhInnerTab, XtdhSelectedTarget } from "./types";
import { XtdhInnerTab as TabId } from "./types";

export default function UserPageXTDH({ profile }: { profile: ApiIdentity }) {
  const [tab, setTab] = useState<XtdhInnerTab>(TabId.OVERVIEW);
  const [selectedTarget, setSelectedTarget] = useState<XtdhSelectedTarget | null>(null);
  const [amountPerDay, setAmountPerDay] = useState<string>("");
  const [receiveFilter, setReceiveFilter] = useState<ReceiveFilter>("ALL");

  const [summary, setSummary] = useState<Summary>({
    baseRatePerDay: null,
    multiplier: null,
    xtdhRatePerDay: null,
    totalRatePerDay: null,
    allocatedRatePerDay: null,
    incomingRatePerDay: null,
  });

  useEffect(() => {
    let mounted = true;
    fetch("/stubs/xtdh/summary.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const base = typeof profile?.tdh_rate === "number" ? profile.tdh_rate : (data.baseRatePerDay ?? null);
        const multiplier = data.multiplier ?? 0.1;
        const xtdh = base != null && multiplier != null ? +(base * multiplier).toFixed(4) : null;
        const total = base != null && xtdh != null ? +(base + xtdh).toFixed(4) : null;
        setSummary({
          baseRatePerDay: base,
          multiplier,
          xtdhRatePerDay: xtdh,
          totalRatePerDay: total,
          allocatedRatePerDay: data.allocatedRatePerDay ?? null,
          incomingRatePerDay: data.incomingRatePerDay ?? null,
        });
      })
      .catch(() => void 0);
    return () => {
      mounted = false;
    };
  }, [profile?.tdh_rate]);

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
      <XTDHHeaderStats summary={summary} />

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
