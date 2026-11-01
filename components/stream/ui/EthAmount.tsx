import { formatDecimalString } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { weiToEthDisplay, weiToEthString } from "@/lib/stream/eth";
import type { Wei } from "@/lib/stream/types";

/**
 * An ETH amount from wei, exact (no floating point), with the locale's
 * grouping and decimal separator. `significant` limits fraction digits after
 * the leading zeros; the full value is in `<data value>` and the title.
 */
export function formatEth(
  locale: SupportedLocale,
  wei: Wei,
  significant = 4
): string {
  return t(locale, "stream.eth.amount", {
    amount: formatDecimalString(locale, weiToEthDisplay(wei, significant)),
  });
}

export default function EthAmount({
  wei,
  locale,
  significant = 4,
  className = "",
}: {
  readonly wei: Wei;
  readonly locale: SupportedLocale;
  readonly significant?: number;
  readonly className?: string;
}) {
  const exact = weiToEthString(wei);
  return (
    <data
      value={exact}
      title={t(locale, "stream.eth.exact", {
        amount: formatDecimalString(locale, exact),
      })}
      className={`tw-whitespace-nowrap tw-tabular-nums ${className}`}
    >
      {formatEth(locale, wei, significant)}
    </data>
  );
}
