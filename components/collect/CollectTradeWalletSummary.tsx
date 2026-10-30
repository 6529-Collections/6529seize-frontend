import type { ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { CollectTradeAction } from "./collect.types";

/** Shared wallet guidance for creating an offer and reviewing existing offers. */
export default function CollectTradeWalletSummary({
  action,
  makerLabel,
  message,
  connectWalletAction,
}: {
  readonly action: CollectTradeAction;
  readonly makerLabel: string;
  readonly message?: string | undefined;
  readonly connectWalletAction?: ReactNode;
}) {
  const locale = useBrowserLocale();
  const walletLine = (
    <p
      data-collect-trade-wallet
      className="tw-m-0 tw-break-all tw-text-xs tw-leading-5 tw-text-iron-300"
    >
      {action === "buy"
        ? t(locale, "collect.trade.payingWalletLine", { wallet: makerLabel })
        : t(locale, "collect.orders.maker", { wallet: makerLabel })}
    </p>
  );

  const hasConnectWalletAction = Boolean(connectWalletAction);
  if (!hasConnectWalletAction) return walletLine;

  return (
    <div
      data-collect-wallet-summary
      className="tw-flex tw-shrink-0 tw-flex-wrap tw-items-center tw-gap-4 tw-rounded-xl tw-bg-iron-900 tw-p-4"
    >
      <div className="tw-min-w-0 tw-flex-[1_1_10rem] tw-space-y-1">
        {walletLine}
        {message && (
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {message}
          </p>
        )}
      </div>
      <div className="tw-min-w-0 tw-flex-[1_0_8rem]">{connectWalletAction}</div>
    </div>
  );
}
