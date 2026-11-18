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
      <p className="tw-m-0 tw-break-words tw-rounded-lg tw-bg-white/[0.03] tw-px-3.5 tw-py-3 tw-text-xs tw-font-normal tw-text-iron-400">
        {tRich(locale, "rep.categories.edit.proxy", {
          name: (
            <Link
              key="proxy"
              className="tw-font-medium tw-text-iron-100"
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
    <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-bg-white/[0.03] tw-px-3.5 tw-py-3 tw-text-xs tw-font-normal tw-text-iron-400">
      <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1">
        <span className="tw-min-w-0 tw-break-words">
          {t(locale, "rep.categories.edit.availableRep")}
        </span>
        <span className="tw-ml-auto tw-whitespace-nowrap tw-font-medium tw-text-iron-100">
          {isLoading ? "…" : formatNumberWithCommas(heroAvailableCredit)}
        </span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1">
        <span className="tw-min-w-0 tw-break-words">
          {t(locale, "rep.categories.edit.ratingLimit", { category })}
        </span>
        <span className="tw-ml-auto tw-whitespace-nowrap tw-font-medium tw-text-iron-100">
          {isLoading ? "…" : `+/- ${formatNumberWithCommas(minMaxValues.max)}`}
        </span>
      </div>
    </div>
  );
}
