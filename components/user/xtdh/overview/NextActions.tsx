"use client";

import Link from "next/link";
import XTDHCard from "../ui/XTDHCard";
import type { Summary } from "../types";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useXtdhSummary } from "@/hooks/useXtdh";

export default function NextActions({ profile }: { readonly profile: ApiIdentity }) {
  const { data: summaryData } = useXtdhSummary(
    typeof profile?.tdh_rate === "number" ? profile.tdh_rate : null,
  );
  const summary: Summary =
    summaryData ?? {
      baseRatePerDay: null,
      multiplier: null,
      xtdhRatePerDay: null,
      totalRatePerDay: null,
      allocatedRatePerDay: null,
      incomingRatePerDay: null,
    };
  const basePath = `/${profile.handle}/xtdh`;

  const base = numberOrZero(summary.baseRatePerDay);
  const multiplier = summary.multiplier ?? 0;
  const capacity = base * multiplier;
  const given = Math.max(0, numberOrZero(summary.allocatedRatePerDay));
  const external = Math.max(0, numberOrZero(summary.incomingRatePerDay));
  const kept = Math.max(0, capacity - given);
  const givenPct = capacity > 0 ? Math.round((given / capacity) * 100) : 0;
  const keptPct = capacity > 0 ? Math.round((kept / capacity) * 100) : 0;

  const suggestions: { text: string; href?: string; label?: string }[] = [];

  if (capacity === 0) {
    suggestions.push({ text: "No xTDH capacity yet (Base × Multiplier is 0)." });
  } else if (given === 0) {
    suggestions.push({ text: "You’re keeping all your xTDH." });
    suggestions.push({ text: "Allocate some to support a collection", href: `${basePath}/given`, label: "Give xTDH" });
  } else if (given > capacity) {
    suggestions.push({ text: "Over capacity — pro‑rata reduction next cycle." });
    suggestions.push({ text: "Review and fix allocations", href: `${basePath}/given`, label: "Manage grants" });
  } else {
    if (givenPct <= 20) {
      suggestions.push({ text: `You’re keeping most of your xTDH (${keptPct}%).` });
      suggestions.push({ text: "Spotlight a collection with a small grant", href: `${basePath}/given`, label: "Give xTDH" });
    } else if (givenPct <= 80) {
      suggestions.push({ text: `You’re giving ${givenPct}% and keeping ${keptPct}%.` });
      suggestions.push({ text: "Adjust split or add targets", href: `${basePath}/given`, label: "Manage grants" });
    } else {
      suggestions.push({ text: `You’re giving most of your xTDH (${givenPct}%).` });
      suggestions.push({ text: "Ensure this matches your intent", href: `${basePath}/given`, label: "Review grants" });
    }
  }

  if (external === 0) {
    suggestions.push({ text: "Not receiving xTDH from others." });
    suggestions.push({ text: "Discover sources", href: `${basePath}/received`, label: "View incoming" });
  } else {
    suggestions.push({ text: `Receiving ${Math.floor(external)}/day from others.` });
    suggestions.push({ text: "Review sources", href: `${basePath}/received`, label: "View incoming" });
  }

  const items = collapsePairs(suggestions);

  return (
    <XTDHCard title="Next actions">
      <ul className="tw-list-disc tw-pl-5 tw-text-sm tw-text-iron-300 tw-space-y-1">
        {items.map((it, idx) => (
          <li key={idx}>
            <span>{it.text}</span>
            {it.href ? (
              <Link href={it.href} className="tw-ml-2 tw-text-primary-400 hover:tw-underline tw-font-medium">
                {it.label ?? "Open"}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </XTDHCard>
  );
}

function numberOrZero(n: number | null): number {
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

function collapsePairs(arr: { text: string; href?: string; label?: string }[]) {
  // Keep order; merge duplicates if needed in future. For now, return as-is.
  return arr;
}
