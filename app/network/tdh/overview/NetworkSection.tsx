import { Suspense } from "react";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { ot } from "./copy";
import NetworkDistribution from "./NetworkDistribution";
import { loadNetworkDistribution } from "./networkDistribution.server";

/**
 * The network step of the zoom, streamed: the page does not wait for
 * 6529.io's metrics, which are read at most hourly. Until they arrive the
 * figure's place is held, so nothing below it moves; if the API does not
 * answer, the page says so in one line instead of drawing a figure.
 */
async function NetworkFigure({ locale }: { readonly locale: SupportedLocale }) {
  const data = await loadNetworkDistribution();
  if (data === null) {
    return (
      <p className={`${EX_TEXT.cap} tw-mt-16`} data-fig="network">
        {ot(locale, "network.unavailable")}
      </p>
    );
  }
  return <NetworkDistribution data={data} locale={locale} />;
}

function Placeholder({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div
      className="tw-mt-16 tw-min-h-[420px] md:tw-mt-24 md:tw-min-h-[400px]"
      aria-busy="true"
      data-network-loading=""
    >
      <span className={EX_TEXT.label}>{ot(locale, "network.label")}</span>
    </div>
  );
}

export default function NetworkSection({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <Suspense fallback={<Placeholder locale={locale} />}>
      <NetworkFigure locale={locale} />
    </Suspense>
  );
}
