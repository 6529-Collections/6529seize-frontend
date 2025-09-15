"use client";

import XTDHCard from "../../ui/XTDHCard";
import GivenGrantRow, { GivenGrantRowData } from "./GivenGrantRow";
import GivenEmptyState from "./GivenEmptyState";
import { useMemo, useState } from "react";

export default function GivenGrantsTable({
  rows,
  loading,
}: {
  readonly rows: GivenGrantRowData[];
  readonly loading?: boolean;
}) {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE">("ALL");
  const visibleRows = useMemo(() => {
    if (filter === "ALL") return rows;
    return rows.filter((r) => (r.status || "").toLowerCase() === "active");
  }, [rows, filter]);
  return (
    <XTDHCard title="Active Grants (Given)">
      <div className="tw-flex tw-gap-2 tw-mb-2">
        {["ALL", "ACTIVE"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
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
      <div className="tw-overflow-x-auto">
        <table className="tw-min-w-full tw-text-sm">
          <thead>
            <tr className="tw-text-iron-300">
              <th className="tw-text-left tw-font-medium tw-py-2">Target</th>
              <th className="tw-text-left tw-font-medium tw-py-2">Allocation / day</th>
              <th className="tw-text-left tw-font-medium tw-py-2">Status</th>
              <th className="tw-text-left tw-font-medium tw-py-2">Last Update</th>
              <th className="tw-text-left tw-font-medium tw-py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="tw-border-t tw-border-iron-800">
                <td className="tw-py-3 tw-text-iron-300" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : visibleRows.length ? (
              visibleRows.map((r) => <GivenGrantRow key={r.id} row={r} />)
            ) : (
              <GivenEmptyState />
            )}
          </tbody>
        </table>
      </div>
    </XTDHCard>
  );
}
