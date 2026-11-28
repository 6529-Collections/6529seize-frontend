"use client";

import type { ReactNode } from "react";

import { THE_MEMES_GRID_CLASS_NAME } from "@/components/the-memes/theMemesLayout";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import type { SaleSummary } from "@/lib/stream/reads";
import { arrangeShelves, pickFeatured } from "@/lib/stream/showcase";

import { ReadyToStart } from "./ReadyToStart";
import { StreamHero } from "./StreamHero";
import { StreamLoading } from "./StreamLoading";
import { useNow, useSales, useShowcase } from "./useStreamData";
import { WorkCard } from "./WorkCard";

const LABEL = "tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500";

function Shelf({
  title,
  intro,
  sales,
  now,
}: {
  readonly title: string;
  readonly intro?: string | undefined;
  readonly sales: readonly SaleSummary[];
  readonly now: number;
}) {
  if (sales.length === 0) return null;
  return (
    <section className="tw-mt-6">
      <h3 className={LABEL}>{title}</h3>
      {intro ? <p className="tw-m-0 tw-mt-1 tw-max-w-2xl tw-text-sm tw-text-iron-400">{intro}</p> : null}
      <ul className={`tw-m-0 tw-mt-3 tw-list-none tw-p-0 ${THE_MEMES_GRID_CLASS_NAME}`}>
        {sales.map((sale) => (
          <WorkCard key={sale.saleId.toString()} sale={sale} now={now} />
        ))}
      </ul>
    </section>
  );
}

/**
 * One product's works, by interest: live sales, then sold works, then works
 * that ended without a buyer, and last the ended sales a visitor can finish.
 */
function ProductSection({
  title,
  sales,
  now,
  explainFinish,
  extra,
}: {
  readonly title: string;
  readonly sales: readonly SaleSummary[];
  readonly now: number;
  /** Explain "Finish a sale" here (said once per page, in the first section that has one). */
  readonly explainFinish: boolean;
  /** Shown last (works approved and waiting for someone to start the sale). */
  readonly extra?: ReactNode;
}) {
  const locale = useBrowserLocale();
  const shelves = arrangeShelves(sales, now);
  return (
    <section className="tw-mb-14">
      <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">{title}</h2>
      {sales.length === 0 && extra === undefined ? (
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-iron-500">{t(locale, "streamSepolia.home.none")}</p>
      ) : null}
      <Shelf title={t(locale, "streamSepolia.home.live")} sales={shelves.live} now={now} />
      <Shelf title={t(locale, "streamSepolia.home.sold")} sales={shelves.sold} now={now} />
      <Shelf title={t(locale, "streamSepolia.home.unsold")} sales={shelves.unsold} now={now} />
      <Shelf
        title={t(locale, "streamSepolia.home.finish")}
        intro={explainFinish ? t(locale, "streamSepolia.home.finishIntro") : undefined}
        sales={shelves.finish}
        now={now}
      />
      {extra}
    </section>
  );
}

/** Works with no art or an operator's test name, out of the main grids but still reachable. */
function TestTokens({ sales, now }: { readonly sales: readonly SaleSummary[]; readonly now: number }) {
  const locale = useBrowserLocale();
  if (sales.length === 0) return null;
  return (
    <details className="tw-group tw-mb-8">
      <summary className="tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400">
        {t(locale, "streamSepolia.home.testTokens", { count: sales.length.toString() })}
      </summary>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-500">{t(locale, "streamSepolia.home.testTokensHelp")}</p>
      <ul className={`tw-m-0 tw-mt-3 tw-list-none tw-p-0 ${THE_MEMES_GRID_CLASS_NAME}`}>
        {sales.map((sale) => (
          <WorkCard key={sale.saleId.toString()} sale={sale} now={now} />
        ))}
      </ul>
    </details>
  );
}

function Works({ sales, now }: { readonly sales: readonly SaleSummary[]; readonly now: number }) {
  const locale = useBrowserLocale();
  const { shown, tests } = useShowcase(sales);
  const curated = shown.filter((sale) => sale.curated);
  const independent = shown.filter((sale) => !sale.curated);
  const curatedHasFinish = arrangeShelves(curated, now).finish.length > 0;
  // 6529 Stream always leads, then Independent Stream, on every instance.
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <StreamHero featured={pickFeatured(shown, now)} now={now} />
      <ProductSection title={t(locale, "streamSepolia.product.stream")} sales={curated} now={now} explainFinish />
      <ProductSection
        title={t(locale, "streamSepolia.product.independent")}
        sales={independent}
        now={now}
        explainFinish={!curatedHasFinish}
        extra={<ReadyToStart />}
      />
      <TestTokens sales={tests} now={now} />
    </div>
  );
}

export function StreamHome() {
  const locale = useBrowserLocale();
  const now = useNow();
  const sales = useSales();
  if (sales.isLoading) {
    return <StreamLoading onRetry={() => void sales.refetch()} />;
  }
  // A failed refresh keeps showing the last good list.
  if (!sales.data) {
    return (
      <p role="alert" className="tw-text-sm tw-text-red">
        {t(locale, "streamSepolia.loadError")}
      </p>
    );
  }
  return <Works sales={sales.data} now={now} />;
}
