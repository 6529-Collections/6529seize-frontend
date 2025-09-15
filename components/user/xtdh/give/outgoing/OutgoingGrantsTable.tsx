"use client";

import XTDHCard from "../../ui/XTDHCard";
import OutgoingGrantRow, { OutgoingGrantRowData } from "./OutgoingGrantRow";
import OutgoingEmptyState from "./OutgoingEmptyState";

export default function OutgoingGrantsTable({
  rows,
  loading,
}: {
  readonly rows: OutgoingGrantRowData[];
  readonly loading?: boolean;
}) {
  return (
    <XTDHCard title="Active Grants (Outgoing)">
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
            ) : rows.length ? (
              rows.map((r) => <OutgoingGrantRow key={r.id} row={r} />)
            ) : (
              <OutgoingEmptyState />
            )}
          </tbody>
        </table>
      </div>
    </XTDHCard>
  );
}

