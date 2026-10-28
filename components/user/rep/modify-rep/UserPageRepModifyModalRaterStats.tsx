"use client";

import { useContext } from "react";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import Link from "next/link";

export default function UserPageRepModifyModalRaterStats({
  category,
  minMaxValues,
  heroAvailableCredit,
  isLoading = false,
}: {
  readonly category: string;
  readonly minMaxValues: { readonly min: number; readonly max: number };
  readonly heroAvailableCredit: number;
  readonly isLoading?: boolean;
}) {
  const { activeProfileProxy } = useContext(AuthContext);
  if (activeProfileProxy) {
    return (
      <p className="tw-m-0 tw-break-words tw-text-base tw-font-normal tw-text-iron-300">
        You are acting as proxy for:{" "}
        <Link
          className="tw-font-semibold tw-text-iron-50"
          href={`/${activeProfileProxy.created_by.handle ?? activeProfileProxy.created_by.id}`}
        >
          {activeProfileProxy.created_by.handle}
        </Link>
      </p>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-500">
      <div>
        <span>Your available Rep:</span>
        <span className="tw-block tw-h-5 tw-font-semibold tw-tabular-nums tw-text-iron-300">
          {isLoading ? "…" : formatNumberWithCommas(heroAvailableCredit)}
        </span>
      </div>
      <div>
        <span className="tw-break-words">
          Your max/min Rep Rating to {category}:
        </span>
        <span className="tw-block tw-h-5 tw-font-semibold tw-tabular-nums tw-text-iron-300">
          {isLoading ? "…" : `+/- ${formatNumberWithCommas(minMaxValues.max)}`}
        </span>
      </div>
    </div>
  );
}
