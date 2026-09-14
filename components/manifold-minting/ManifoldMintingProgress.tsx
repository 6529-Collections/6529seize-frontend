"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import ManifoldMintingDetails, {
  type MintReceipt,
} from "./ManifoldMintingDetails";
import ManifoldMintingTransactionLink from "./ManifoldMintingTransactionLink";

export default function ManifoldMintingProgress({
  status,
  receipt,
  transactionUrl,
}: Readonly<{
  status: "confirm_wallet" | "submitted";
  receipt: MintReceipt | undefined;
  transactionUrl: string | undefined;
}>) {
  const locale = useBrowserLocale();
  return (
    <>
      {receipt && (
        <ManifoldMintingDetails
          receipt={receipt}
          recipientLabel={t(
            locale,
            "theMemes.mint.transaction.recipientPending"
          )}
        />
      )}
      {status === "confirm_wallet" ? (
        <details className="tw-rounded-lg tw-bg-iron-900/60">
          <summary
            tabIndex={0}
            className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(locale, "theMemes.mint.transaction.walletHelp")}
          </summary>
          <p className="tw-m-0 tw-px-3 tw-pb-3 tw-text-sm tw-leading-relaxed tw-text-iron-300">
            {t(locale, "theMemes.mint.transaction.walletHelpDescription")}
          </p>
        </details>
      ) : (
        <>
          <p className="tw-m-0 tw-text-center tw-text-sm tw-text-iron-400">
            {t(locale, "theMemes.mint.transaction.submittedHint")}
          </p>
          {transactionUrl && (
            <ManifoldMintingTransactionLink href={transactionUrl} />
          )}
        </>
      )}
    </>
  );
}
