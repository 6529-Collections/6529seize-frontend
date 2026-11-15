"use client";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  continueInBrowser,
  getWebsiteHost,
} from "@/services/desktop/continueInBrowser";

/**
 * For actions 6529 Desktop does not forward to the browser wallet (market
 * orders, validator sessions): says so and opens the same page on the
 * website, where the browser wallet signs directly.
 */
export default function ContinueInBrowserNotice() {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4">
      <p className="tw-m-0 tw-text-sm tw-text-iron-200">
        {t(locale, "desktopWalletRequest.notForwarded", {
          site: getWebsiteHost(),
        })}
      </p>
      <button
        type="button"
        onClick={() => {
          continueInBrowser();
        }}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-self-start tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, "desktopWalletRequest.continueInBrowser")}
        <ArrowTopRightOnSquareIcon aria-hidden="true" className="tw-size-5" />
      </button>
    </div>
  );
}
