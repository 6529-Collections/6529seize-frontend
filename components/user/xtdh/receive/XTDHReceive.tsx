"use client";

import { useState } from "react";
import XTDHCard from "../ui/XTDHCard";
import XTDHStat from "../ui/XTDHStat";
import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import type { ReceiveFilter } from "../types";
import { useXtdhIncomingGrants, useXtdhSummary } from "@/hooks/useXtdh";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

const asValue = (v: number | null, suffix = "") =>
  v == null ? "—" : `${formatNumberWithCommasOrDash(Math.floor(v))}${suffix}`;

export default function XTDHReceive({ profile }: { readonly profile: ApiIdentity }) {
  const [filter, setFilter] = useState<ReceiveFilter>("ALL");
  const { data: summary } = useXtdhSummary(
    typeof profile?.tdh_rate === "number" ? profile.tdh_rate : null,
  );
  const { data: incoming, isLoading, isFetching } = useXtdhIncomingGrants();
  const rows = incoming?.rows ?? [];
  const loading = isLoading || isFetching;
  return (
    <>
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-5 tw-gap-4">
        <div className="lg:tw-col-span-2">
          <XTDHCard title="Incoming xTDH Summary">
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <XTDHStat label="Incoming xTDH / day" value={asValue(summary?.incomingRatePerDay ?? null)} />
              <XTDHStat label="Sources (Active)" value="—" />
            </div>
            <div className="tw-text-iron-400 tw-text-xs tw-mt-3">
              Incoming xTDH accrues when you hold eligible assets and a grantor’s allocation is active and funded.
            </div>
          </XTDHCard>
        </div>
        <div className="lg:tw-col-span-3">
          <XTDHCard title="Filters">
            <div className="tw-flex tw-gap-2 tw-flex-wrap">
              {(["ALL", "ACTIVE", "PENDING"] as ReceiveFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`tw-text-xs tw-rounded tw-border tw-px-2 tw-py-1 tw-transition ${
                    filter === f
                      ? "tw-bg-primary-600 tw-border-primary-600 tw-text-white"
                      : "tw-bg-iron-900 tw-border-iron-700 tw-text-iron-200 hover:tw-bg-iron-800"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </XTDHCard>
        </div>
      </div>

      <XTDHCard title="Incoming xTDH (By Source)">
        <div className="tw-overflow-x-auto">
          <table className="tw-min-w-full tw-text-sm">
            <thead>
              <tr className="tw-text-iron-300">
                <th className="tw-text-left tw-font-medium tw-py-2">Grantor</th>
                <th className="tw-text-left tw-font-medium tw-py-2">Target</th>
                <th className="tw-text-left tw-font-medium tw-py-2">Your Share / day</th>
                <th className="tw-text-left tw-font-medium tw-py-2">Status</th>
                <th className="tw-text-left tw-font-medium tw-py-2">Since</th>
                <th className="tw-text-left tw-font-medium tw-py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="tw-border-t tw-border-iron-800">
                  <td className="tw-py-3 tw-text-iron-300" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length ? (
                rows
                  .filter((r) =>
                    filter === "ALL" ? true : r.status.toLowerCase() === filter.toLowerCase()
                  )
                  .map((r) => (
                    <tr key={r.id} className="tw-border-t tw-border-iron-800">
                      <td className="tw-py-2 tw-text-iron-200">{r.grantorLabel}</td>
                      <td className="tw-py-2 tw-text-iron-200">{r.targetLabel}</td>
                      <td className="tw-py-2 tw-text-iron-200">{formatNumberWithCommasOrDash(Math.floor(r.sharePerDay))}</td>
                      <td className="tw-py-2 tw-text-iron-200">{r.status}</td>
                      <td className="tw-py-2 tw-text-iron-200">{new Date(r.since).toLocaleDateString()}</td>
                      <td className="tw-py-2">
                        <button className="tw-text-iron-300 tw-text-xs" disabled>
                          View
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr className="tw-border-t tw-border-iron-800">
                  <td className="tw-py-3 tw-text-iron-300" colSpan={6}>
                    No incoming xTDH.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </XTDHCard>
    </>
  );
}
