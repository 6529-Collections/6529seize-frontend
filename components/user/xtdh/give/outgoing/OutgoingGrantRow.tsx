"use client";

export type OutgoingGrantRowData = {
  id: string;
  targetLabel: string;
  allocationPerDay: number | string;
  status: string;
  updatedAt: string;
};

export default function OutgoingGrantRow({ row }: { readonly row: OutgoingGrantRowData }) {
  const allocation =
    typeof row.allocationPerDay === "number"
      ? formatNumberWithCommasOrDash(Math.floor(row.allocationPerDay))
      : row.allocationPerDay;
  return (
    <tr className="tw-border-t tw-border-iron-800">
      <td className="tw-py-2 tw-text-iron-200">{row.targetLabel}</td>
      <td className="tw-py-2 tw-text-iron-200">{allocation}</td>
      <td className="tw-py-2 tw-text-iron-200">{row.status}</td>
      <td className="tw-py-2 tw-text-iron-200">{row.updatedAt}</td>
      <td className="tw-py-2">
        <button className="tw-text-iron-300 tw-text-xs" disabled>
          Edit
        </button>
        <span className="tw-text-iron-700 tw-px-2">|</span>
        <button className="tw-text-iron-300 tw-text-xs" disabled>
          Revoke
        </button>
      </td>
    </tr>
  );
}
import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
