"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";

import { TxStatus } from "./TxStatus";
import { dismissTxResult, useKeptTxResults } from "./txResults";

/** Result lines of finished transactions whose buttons left the page. */
export function TxResultBar() {
  const locale = useBrowserLocale();
  const results = useKeptTxResults();
  if (results.length === 0) return null;
  return (
    <div className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-40 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-px-4 tw-pb-[max(0.75rem,env(safe-area-inset-bottom))] tw-pt-3 tw-backdrop-blur">
      <ul className="tw-mx-auto tw-m-0 tw-flex tw-max-w-5xl tw-list-none tw-flex-col tw-gap-2 tw-p-0">
        {results.map((result) => (
          <li key={result.id} className="tw-flex tw-items-start tw-justify-between tw-gap-3">
            <TxStatus state={{ phase: "done", hash: result.hash }} doneText={result.text} />
            <button
              type="button"
              onClick={() => dismissTxResult(result.id)}
              className="tw-h-8 tw-flex-none tw-rounded-md tw-border-0 tw-bg-white/[0.06] tw-px-3 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-white/[0.1]"
            >
              {t(locale, "streamSepolia.tx.dismiss")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
