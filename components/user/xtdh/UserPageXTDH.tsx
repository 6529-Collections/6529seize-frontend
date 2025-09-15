"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import XTDHTabs from "./ui/XTDHTabs";
import XTDHOverview from "./overview/XTDHOverview";
import XTDHGive from "./give/XTDHGive";
import XTDHReceive from "./receive/XTDHReceive";
import XTDHHistory from "./history/XTDHHistory";
import type { ReceiveFilter, Summary, XtdhIncomingRow, XtdhInnerTab, XtdhSelectedTarget } from "./types";
import { XtdhInnerTab as TabId } from "./types";
import type { OutgoingGrantRowData } from "./give/outgoing/OutgoingGrantRow";

export default function UserPageXTDH({ profile }: { profile: ApiIdentity }) {
  const [tab, setTab] = useState<XtdhInnerTab>(TabId.OVERVIEW);
  const [selectedTarget, setSelectedTarget] = useState<XtdhSelectedTarget | null>(null);
  const [amountPerDay, setAmountPerDay] = useState<string>("");
  const [receiveFilter, setReceiveFilter] = useState<ReceiveFilter>("ALL");
  const [outgoingRows, setOutgoingRows] = useState<OutgoingGrantRowData[]>([]);
  const [incomingRows, setIncomingRows] = useState<XtdhIncomingRow[]>([]);
  const [loadingOutgoing, setLoadingOutgoing] = useState(false);
  const [loadingIncoming, setLoadingIncoming] = useState(false);

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

    // Load outgoing rows and compute allocated sum
    setLoadingOutgoing(true);
    fetch("/stubs/xtdh/outgoing.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((list) => {
        if (!mounted) return;
        const rows: OutgoingGrantRowData[] = (list || []).map((o: any, idx: number) => ({
          id: o.id ?? String(idx),
          targetLabel: `${o.contract ?? ""} (${String(o.scope ?? "").toLowerCase()}${
            o.tokenCount ? ` ${o.tokenCount}` : ""
          })`,
          allocationPerDay: Number(o.allocationPerDay ?? 0),
          status: o.status ?? "Active",
          updatedAt: o.updatedAt ?? "",
        }));
        setOutgoingRows(rows);
        const allocatedSum = rows.reduce((acc, r) => acc + (typeof r.allocationPerDay === "number" ? r.allocationPerDay : 0), 0);
        setSummary((s) => ({ ...s, allocatedRatePerDay: allocatedSum }));
      })
      .catch(() => void 0)
      .finally(() => mounted && setLoadingOutgoing(false));

    // Load incoming rows and compute external received sum
    setLoadingIncoming(true);
    fetch("/stubs/xtdh/incoming.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((list) => {
        if (!mounted) return;
        const rows: XtdhIncomingRow[] = (list || []).map((i: any, idx: number) => ({
          id: i.id ?? String(idx),
          grantorLabel: i.grantor ?? i.grantorLabel ?? "",
          targetLabel: i.target ?? i.targetLabel ?? "",
          sharePerDay: Number(i.sharePerDay ?? 0),
          status: i.status ?? "Active",
          since: i.since ?? new Date().toISOString(),
        }));
        setIncomingRows(rows);
        const externalSum = rows.reduce((acc, r) => acc + (r.sharePerDay || 0), 0);
        setSummary((s) => ({ ...s, incomingRatePerDay: externalSum }));
      })
      .catch(() => void 0)
      .finally(() => mounted && setLoadingIncoming(false));
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
      <XTDHTabs active={tab} onChange={setTab} />

      {tab === TabId.OVERVIEW && (
        <XTDHOverview
          summary={summary}
          onGoGive={() => setTab(TabId.GIVE)}
          onGoReceive={() => setTab(TabId.RECEIVE)}
        />
      )}
      {tab === TabId.GIVE && (
        <XTDHGive
          summary={summary}
          selectedTarget={selectedTarget}
          amountPerDay={amountPerDay}
          onTargetChange={setSelectedTarget}
          onAmountChange={setAmountPerDay}
          onReset={handleReset}
          onSubmit={handleAllocateSubmit}
          rows={outgoingRows}
          loading={loadingOutgoing}
        />
      )}
      {tab === TabId.RECEIVE && (
        <XTDHReceive
          summary={summary}
          filter={receiveFilter}
          onFilterChange={setReceiveFilter}
          rows={incomingRows}
          loading={loadingIncoming}
        />
      )}
      {tab === TabId.HISTORY && <XTDHHistory />}
    </div>
  );
}
