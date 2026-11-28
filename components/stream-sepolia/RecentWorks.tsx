"use client";

import { THE_MEMES_GRID_CLASS_NAME } from "@/components/the-memes/theMemesLayout";
import type { SaleSummary } from "@/lib/stream/reads";

import { useNow, useSales, useShowcase } from "./useStreamData";
import { WorkCard } from "./WorkCard";

const LABEL = "tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500";

/** The newest works on this instance, newest first (6529 Stream and Independent alike). */
function newestWorks(sales: readonly SaleSummary[], count: number): SaleSummary[] {
  return [...sales].sort((a, b) => (a.startedAt > b.startedAt ? -1 : 1)).slice(0, count);
}

/** A row of recently created works, to show what people are making. */
export function RecentWorks({ title, count = 4 }: { readonly title: string; readonly count?: number }) {
  const sales = useSales();
  const now = useNow();
  // Test tokens (no art, operator test names) stay out of it.
  const { shown } = useShowcase(sales.data ?? []);
  const works = newestWorks(shown, count);
  if (works.length === 0) return null;
  return (
    <section aria-label={title} className="tw-mt-4">
      <h2 className={LABEL}>{title}</h2>
      <ul className={`tw-m-0 tw-mt-3 tw-list-none tw-p-0 ${THE_MEMES_GRID_CLASS_NAME}`}>
        {works.map((sale) => (
          <WorkCard key={sale.saleId.toString()} sale={sale} now={now} />
        ))}
      </ul>
    </section>
  );
}
