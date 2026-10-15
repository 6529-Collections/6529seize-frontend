import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

function Wallet({ label }: { readonly label: string }) {
  return (
    <span className="tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-800 tw-text-base tw-font-semibold tw-text-iron-50">
      {label}
    </span>
  );
}

/**
 * Step 5 and DEV-2: one transaction that sends a copy out of Wallet A and
 * back. Netted at the transaction boundary (D131), Wallet A never lost it.
 * Built in HTML, so its labels stay legible at any width.
 */
export default function TransactionBoxDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <figure className="tw-m-0 tw-max-w-md">
      <figcaption className="tw-sr-only">
        {t(locale, "network.tdh.how.s5.diagramDesc")}
      </figcaption>
      <div aria-hidden="true">
        <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-py-3">
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-300">
            {t(locale, "network.tdh.how.s5.transaction")}
          </p>
          <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
            <Wallet label="A" />
            <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1.5">
              <span className="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-text-xs tw-text-primary-300">
                {t(locale, "network.tdh.how.s5.out")}
                <ArrowLongRightIcon className="tw-size-5 tw-text-primary-300" />
              </span>
              <span className="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-text-xs tw-text-primary-300">
                <ArrowLongLeftIcon className="tw-size-5 tw-text-primary-300" />
                {t(locale, "network.tdh.how.s5.back")}
              </span>
            </div>
            <Wallet label="C" />
          </div>
        </div>
        <p className="tw-m-0 tw-mt-2 tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-success/70 tw-bg-iron-800 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-50">
          {t(locale, "network.tdh.how.s5.net")}
        </p>
      </div>
    </figure>
  );
}
