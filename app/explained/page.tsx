import type { Metadata } from "next";
import { kt } from "@/components/explained/i18n";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import { HUB_HREF } from "@/components/explained/shell/chapters";
import { getAppMetadata } from "@/components/providers/metadata";
import { getNodeEnv } from "@/config/env";
import { loadFactBook } from "@/lib/explained/feed.server";
import { createFactBook, type FactBook } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";
import {
  firstParam,
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";
import Cc0Answer from "./hub/Cc0Answer";
import { ht } from "./hub/copy";
import HubChapters from "./hub/HubChapters";
import HubLoop from "./hub/HubLoop";
import HubPaths from "./hub/HubPaths";
import { HubOpener, HubSources } from "./hub/HubSections";
import ReadingGuide from "./hub/ReadingGuide";

/**
 * 6529 Explained, the hub, first version (MAP.md §3; TDH-DESIGN.md §4.8):
 * how 6529 works and how we know, the loop with its live numbers, three
 * things anyone can check today, reader paths, the chapters (TDH live, the
 * rest coming), CC0 in one minute, how to read the marks, and the
 * corrections log. Outside production `?facts=fixture` renders the final
 * mockups' facts.
 */
async function factBook(params: ExplainedParams): Promise<FactBook> {
  if (
    firstParam(params["facts"]) === "fixture" &&
    getNodeEnv() !== "production"
  ) {
    return createFactBook(fixtureFactInputs());
  }
  // Every day file, so the results written late or re-run are counted.
  return loadFactBook(true);
}

export default async function ExplainedHubPage({
  searchParams,
}: {
  readonly searchParams: Promise<ExplainedParams>;
}) {
  const params = await searchParams;
  const locale = await resolveExplainedLocale(params);
  const book = await factBook(params);
  return (
    <ExplainedShell
      chapter="hub"
      page="hub"
      crumbs={[
        { label: ht(locale, "crumbAbout"), href: "/about" },
        { label: kt(locale, "explained.kit.map.hub") },
      ]}
      live={{ fact: book.maybe("page.readAt"), kind: "read" }}
      facts={book.snapshot()}
      locale={locale}
    >
      <article data-ex-article="" lang={locale}>
        <HubOpener book={book} locale={locale} />
        <HubLoop book={book} locale={locale} />
        <HubPaths locale={locale} />
        <HubChapters book={book} locale={locale} />
        <Cc0Answer locale={locale} />
        <ReadingGuide locale={locale} />
        <HubSources book={book} locale={locale} />
      </article>
    </ExplainedShell>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  readonly searchParams: Promise<ExplainedParams>;
}): Promise<Metadata> {
  const locale = await resolveExplainedLocale(await searchParams);
  return getAppMetadata(
    {
      title: ht(locale, "meta.title"),
      description: ht(locale, "meta.description"),
    },
    { canonicalPath: HUB_HREF }
  );
}
