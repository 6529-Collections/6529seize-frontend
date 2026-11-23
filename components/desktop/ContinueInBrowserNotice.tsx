"use client";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  continueInBrowser,
  getWebsiteHost,
} from "@/services/desktop/continueInBrowser";

const MESSAGES = {
  signature: "desktopWalletRequest.notForwarded",
  transaction: "desktopWalletRequest.transactionNotForwarded",
  transactionUpdate: "desktopWalletRequest.transactionUpdate",
} as const;

/**
 * For actions 6529 Desktop does not forward to the browser wallet (market
 * orders, validator sessions, transactions): says so and opens the same
 * page on the website, where the browser wallet signs directly. If the
 * browser does not open, it says so and names the site to open by hand.
 */
export default function ContinueInBrowserNotice({
  kind = "signature",
}: {
  /** What the action asks the wallet for. */
  readonly kind?: keyof typeof MESSAGES;
}) {
  const locale = useBrowserLocale();
  const [openFailed, setOpenFailed] = useState(false);
  const site = getWebsiteHost();
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4">
      <p className="tw-m-0 tw-text-sm tw-text-iron-200">
        {t(locale, MESSAGES[kind], { site })}
      </p>
      <button
        type="button"
        onClick={() => {
          setOpenFailed(!continueInBrowser());
        }}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-self-start tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, "desktopWalletRequest.continueInBrowser")}
        <ArrowTopRightOnSquareIcon aria-hidden="true" className="tw-size-5" />
      </button>
      <p
        role="alert"
        className="tw-m-0 tw-text-sm tw-text-iron-200 empty:tw-hidden"
      >
        {openFailed
          ? t(locale, "desktopWalletRequest.openFailed", { site })
          : null}
      </p>
    </div>
  );
}
