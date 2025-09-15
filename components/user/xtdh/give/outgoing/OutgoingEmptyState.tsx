"use client";

export default function OutgoingEmptyState() {
  return (
    <tr className="tw-border-t tw-border-iron-800">
      <td className="tw-py-3 tw-text-iron-300" colSpan={5}>
        No outgoing grants yet. Use Allocate to create your first grant.
      </td>
    </tr>
  );
}

