import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { Summary, XtdhIncomingRow } from "@/components/user/xtdh/types";
import type { OutgoingGrantRowData } from "@/components/user/xtdh/give/outgoing/OutgoingGrantRow";

// Mappers shared across hooks to keep behavior identical across code paths
function parseOutgoingRows(list: any[]): OutgoingGrantRowData[] {
  return (list || []).map((o: any, idx: number) => ({
    id: o.id ?? String(idx),
    targetLabel: `${o.contract ?? ""} (${String(o.scope ?? "").toLowerCase()}${
      o.tokenCount ? ` ${o.tokenCount}` : ""
    })`,
    allocationPerDay: Number(o.allocationPerDay ?? 0),
    status: o.status ?? "Active",
    updatedAt: o.updatedAt ?? "",
  }));
}

function parseIncomingRows(list: any[]): XtdhIncomingRow[] {
  return (list || []).map((i: any, idx: number) => ({
    id: i.id ?? String(idx),
    grantorLabel: i.grantor ?? i.grantorLabel ?? "",
    targetLabel: i.target ?? i.targetLabel ?? "",
    sharePerDay: Number(i.sharePerDay ?? 0),
    status: i.status ?? "Active",
    since: i.since ?? new Date().toISOString(),
  }));
}

export function useXtdhSummary(tdhRate: number | null | undefined) {
  return useQuery<Summary>({
    queryKey: [QueryKey.XTDH_SUMMARY, { tdhRate: typeof tdhRate === "number" ? tdhRate : null }],
    queryFn: async (): Promise<Summary> => {
      const [summaryRes, outgoingRes, incomingRes] = await Promise.all([
        fetch("/stubs/xtdh/summary.json", { cache: "no-store" }).catch(() => null),
        fetch("/stubs/xtdh/outgoing.json", { cache: "no-store" }).catch(() => null),
        fetch("/stubs/xtdh/incoming.json", { cache: "no-store" }).catch(() => null),
      ]);

      const baseData = (await summaryRes?.json().catch(() => ({}))) ?? {};
      const outgoingList = (await outgoingRes?.json().catch(() => [])) ?? [];
      const incomingList = (await incomingRes?.json().catch(() => [])) ?? [];

      const base = typeof tdhRate === "number" ? tdhRate : baseData.baseRatePerDay ?? null;
      const multiplier: number | null =
        typeof baseData.multiplier === "number" ? baseData.multiplier : 0.1;
      const xtdh =
        base != null && multiplier != null ? +(base * multiplier).toFixed(4) : null;
      const total = base != null && xtdh != null ? +(base + xtdh).toFixed(4) : null;

      const outgoingRows = parseOutgoingRows(outgoingList);
      const allocatedRatePerDay = outgoingRows.reduce(
        (acc, r) => acc + (typeof r.allocationPerDay === "number" ? r.allocationPerDay : 0),
        0,
      );

      const incomingRows = parseIncomingRows(incomingList);
      const incomingRatePerDay = incomingRows.reduce((acc, r) => acc + (r.sharePerDay || 0), 0);

      return {
        baseRatePerDay: base ?? null,
        multiplier,
        xtdhRatePerDay: xtdh,
        totalRatePerDay: total,
        allocatedRatePerDay,
        incomingRatePerDay,
      };
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}

export function useXtdhOutgoingGrants() {
  return useQuery<{ rows: OutgoingGrantRowData[]; allocatedPerDay: number }>({
    queryKey: [QueryKey.XTDH_OUTGOING],
    queryFn: async () => {
      const res = await fetch("/stubs/xtdh/outgoing.json", { cache: "no-store" });
      const list = await res.json().catch(() => [] as any[]);

      const rows: OutgoingGrantRowData[] = parseOutgoingRows(list);

      const allocatedPerDay = rows.reduce(
        (acc, r) => acc + (typeof r.allocationPerDay === "number" ? r.allocationPerDay : 0),
        0,
      );

      return { rows, allocatedPerDay };
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}

export function useXtdhIncomingGrants() {
  return useQuery<{ rows: XtdhIncomingRow[]; incomingPerDay: number }>({
    queryKey: [QueryKey.XTDH_INCOMING],
    queryFn: async () => {
      const res = await fetch("/stubs/xtdh/incoming.json", { cache: "no-store" });
      const list = await res.json().catch(() => [] as any[]);

      const rows: XtdhIncomingRow[] = parseIncomingRows(list);

      const incomingPerDay = rows.reduce((acc, r) => acc + (r.sharePerDay || 0), 0);

      return { rows, incomingPerDay };
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}
