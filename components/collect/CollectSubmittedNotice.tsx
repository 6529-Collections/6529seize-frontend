"use client";

import Link from "next/link";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, tRich } from "@/i18n/messages";

/** Only mount after the operation is known to have been submitted. */
export default function CollectSubmittedNotice({
  approval = false,
}: {
  readonly approval?: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <p className="tw-m-0 tw-text-[13px] tw-leading-6 tw-text-iron-300">
      {tRich(
        locale,
        approval ? "collect.receipt.approvalLeave" : "collect.receipt.leave",
        {
          orders: (
            <Link
              key="orders"
              href="/collect/orders"
              className="tw-rounded-sm tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {t(locale, "collect.receipt.orders")}
            </Link>
          ),
        }
      )}
    </p>
  );
}
