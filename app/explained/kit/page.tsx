import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import { getNodeEnv } from "@/config/env";
import { normalizeLocale } from "@/i18n/locales";
import { loadFactBook } from "@/lib/explained/feed.server";
import { createFactBook, type FactId } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";
import { KitEvidence } from "./KitEvidence";
import { KitFigures } from "./KitFigures";
import KitLensDemo from "./KitLensDemo";
import { KitSection } from "./KitSection";
import { KitMarks, KitShell } from "./KitShellAndMarks";
import KitTokens from "./KitTokens";

/**
 * The 6529 Explained kit gallery: every component of kit release 1 in every
 * state, on the facts of 2026-10-18 09:40 UTC, the moment the final mockups
 * were rendered. A dev-only route: production answers 404. The gates render
 * it at 1440 and 390 (`?locale=de-DE` for the longest copy). `?feed=live`
 * reads every source now instead, to see the kit on today's facts.
 */
export const dynamic = "force-dynamic";

/** Family facts the gallery's client models read through useFact. */
const CLIENT_FACTS: readonly FactId[] = [
  "meme.2.edition",
  "meme.3.edition",
  "meme.4.edition",
  "meme.8.edition",
  "meme.562.edition",
  "meme.562.minted",
];

export default async function ExplainedKitPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    locale?: string | string[];
    feed?: string | string[];
  }>;
}) {
  if (getNodeEnv() === "production") {
    notFound();
  }
  const params = await searchParams;
  const locale = normalizeLocale(
    Array.isArray(params.locale) ? params.locale[0] : params.locale
  );
  const live = params.feed === "live";
  const book = live
    ? await loadFactBook()
    : createFactBook(fixtureFactInputs());
  for (const id of CLIENT_FACTS) {
    book.get(id);
  }
  const openCycle = book.num("tdh.open.cycle");
  const days = book.get<{ cycle: number }[]>("tdh.days").value;
  const firstCycle = days[0]?.cycle ?? openCycle - 1;
  return (
    <ExplainedShell
      chapter="tdh"
      page="overview"
      crumbs={[
        { label: "6529 Explained", href: "/explained" },
        { label: "01 TDH", href: "/network/tdh" },
        { label: "The kit" },
      ]}
      live={{ fact: book.get("feed.writtenAt"), kind: "feed" }}
      facts={book.snapshot()}
      locale={locale}
      clock={live ? "live" : "frozen"}
    >
      <article data-ex-article="" lang={locale}>
        <header className="tw-pt-[30px] md:tw-pt-[52px]">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
            6529 Explained · kit release 1
          </span>
          <h1 className="tw-m-0 tw-mt-4 tw-text-[38px] tw-font-semibold tw-leading-[43px] tw-tracking-[-0.032em] tw-text-iron-50 md:tw-text-[64px] md:tw-leading-[68px]">
            The kit
          </h1>
          <p
            className="tw-m-0 tw-mt-4 tw-max-w-[700px] tw-text-[18px] tw-leading-[28px] tw-text-iron-300 md:tw-mt-[22px] md:tw-text-[22px] md:tw-leading-[34px]"
            data-ex-lede=""
          >
            Every component of 6529 Explained in every state, on the public feed
            of Oct 18, 2026, so a page can be built from parts that already pass
            the gates.
          </p>
        </header>
        <KitTokens />
        <KitShell book={book} locale={locale} />
        <KitMarks book={book} locale={locale} />
        <KitEvidence book={book} locale={locale} />
        <KitSection
          id="lens"
          title="The lens and Break it"
          lede="One world per chapter with one clock: move it and both views follow. A full model: controls with buttons and keys, the exact rule beside it, a readout read aloud, one Break it that restores, one stamp line, and a guess first."
        >
          <KitLensDemo
            locale={locale}
            openCycle={openCycle}
            firstCycle={firstCycle}
          />
        </KitSection>
        <KitFigures book={book} locale={locale} />
      </article>
    </ExplainedShell>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: "The 6529 Explained kit",
      description:
        "Every 6529 Explained component in every state (development only).",
    },
    { canonicalPath: "/explained/kit", robots: { index: false, follow: false } }
  );
}
