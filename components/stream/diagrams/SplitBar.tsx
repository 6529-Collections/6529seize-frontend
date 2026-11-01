import { formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { SPLITS_DENOMINATOR } from "@/lib/stream/constants";

/**
 * The primary-sale split as a bar: the artist side and the network fee
 * (75/25 canonical, 90/10 federated). `feeShare` is out of 100,000.
 */
export default function SplitBar({
  feeShare,
  locale,
}: {
  readonly feeShare: number;
  readonly locale: SupportedLocale;
}) {
  const network = feeShare / SPLITS_DENOMINATOR;
  const artist = 1 - network;
  const label = t(locale, "stream.split.label", {
    artist: formatPercent(locale, artist, 0),
    network: formatPercent(locale, network, 0),
  });
  return (
    <div role="img" aria-label={label}>
      <div
        aria-hidden="true"
        className="tw-flex tw-h-2.5 tw-overflow-hidden tw-rounded-sm"
      >
        <span
          className="tw-bg-primary-400"
          style={{ width: `${artist * 100}%` }}
        />
        <span
          className="tw-bg-iron-500"
          style={{ width: `${network * 100}%` }}
        />
      </div>
      <div
        aria-hidden="true"
        className="tw-mt-1.5 tw-flex tw-justify-between tw-text-xs tw-text-iron-300"
      >
        <span>
          {t(locale, "stream.split.artist", {
            share: formatPercent(locale, artist, 0),
          })}
        </span>
        <span>
          {t(locale, "stream.split.network", {
            share: formatPercent(locale, network, 0),
          })}
        </span>
      </div>
    </div>
  );
}
