"use client";

import { useContext } from "react";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, tRich } from "@/i18n/messages";
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
  const locale = useBrowserLocale();
  const { activeProfileProxy } = useContext(AuthContext);
  if (activeProfileProxy) {
    return (
      <p className="tw-m-0 tw-break-words tw-text-base tw-font-normal tw-text-iron-300">
        {tRich(locale, "rep.categories.edit.proxy", {
          name: (
            <Link
              key="proxy"
              className="tw-font-semibold tw-text-iron-50"
              href={`/${activeProfileProxy.created_by.handle ?? activeProfileProxy.created_by.id}`}
            >
              {activeProfileProxy.created_by.handle}
            </Link>
          ),
        })}
      </p>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-text-xs tw-font-normal tw-text-iron-400">
      <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-4">
        <span className="tw-min-w-0 tw-break-words">
          {t(locale, "rep.categories.edit.availableRep")}
        </span>
        <span className="tw-w-32 tw-shrink-0 tw-text-right tw-font-medium tw-tabular-nums tw-text-iron-300">
          {isLoading ? "…" : formatNumberWithCommas(heroAvailableCredit)}
        </span>
      </div>
      <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-4">
        <span className="tw-min-w-0 tw-break-words">
          {t(locale, "rep.categories.edit.ratingLimit", { category })}
        </span>
        <span className="tw-w-32 tw-shrink-0 tw-text-right tw-font-medium tw-tabular-nums tw-text-iron-300">
          {isLoading ? "…" : `+/- ${formatNumberWithCommas(minMaxValues.max)}`}
        </span>
      </div>
    </div>
  );
}
