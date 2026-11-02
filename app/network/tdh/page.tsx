import type { Metadata } from "next";
import { kt } from "@/components/explained/i18n";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import { chapterById, HUB_HREF } from "@/components/explained/shell/chapters";
import { getAppMetadata } from "@/components/providers/metadata";
import { getNodeEnv } from "@/config/env";
import { loadFactBook } from "@/lib/explained/feed.server";
import {
  createFactBook,
  type FactBook,
  type FactId,
} from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";
import {
  firstParam,
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";
import { ot } from "./overview/copy";
import ExplainedOverview from "./overview/ExplainedOverview";
import { showNetworkDistribution } from "./overview/flags";
import type { MachineCard } from "./overview/Machine";
import { machineCards } from "./overview/machineCards";

/**
 * 01 TDH, the overview (TDH-DESIGN.md §4.1), on the 6529 Explained kit.
 * Every number is a fact read on the server (lib/explained) and handed to
 * the page's models; the page renders per request in the reader's
 * language. Outside production, `?facts=fixture` renders the facts of the
 * final mockups (2026-10-18 09:40 UTC) to compare the two number for number.
 */
const CHAPTER = chapterById("tdh");

/** Facts the page's client models read: resolved before the snapshot. */
function clientFacts(cards: readonly MachineCard[]): FactId[] {
  const memes = [...new Set([...cards.map((card) => card.id), 2, 560, 562])];
  return [
    ...memes.flatMap((id) => [
      `meme.${id}.edition` as FactId,
      `meme.${id}.minted` as FactId,
      `meme.${id}.rate` as FactId,
    ]),
    "memes.editions",
    "example.firstCard.arrivedAt",
  ];
}

async function factBook(params: ExplainedParams): Promise<FactBook> {
  if (
    firstParam(params["facts"]) === "fixture" &&
    getNodeEnv() !== "production"
  ) {
    return createFactBook(fixtureFactInputs());
  }
  return loadFactBook();
}

export default async function TdhOverviewPage({
  searchParams,
}: {
  readonly searchParams: Promise<ExplainedParams>;
}) {
  const params = await searchParams;
  const locale = await resolveExplainedLocale(params);
  const book = await factBook(params);
  const cards = machineCards(book);
  for (const id of clientFacts(cards)) {
    book.maybe(id);
  }
  const network = showNetworkDistribution(firstParam(params["distribution"]));
  return (
    <ExplainedShell
      chapter={CHAPTER.id}
      page="overview"
      crumbs={[
        { label: kt(locale, "explained.kit.map.hub"), href: HUB_HREF },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: CHAPTER.number ?? "",
            title: kt(locale, CHAPTER.title),
          }),
        },
      ]}
      live={{ fact: book.maybe("feed.writtenAt"), kind: "feed" }}
      facts={book.snapshot()}
      locale={locale}
    >
      <ExplainedOverview
        book={book}
        locale={locale}
        cards={cards}
        network={network}
      />
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
      title: ot(locale, "meta.title"),
      description: ot(locale, "meta.description"),
    },
    { canonicalPath: CHAPTER.href ?? "/network/tdh" }
  );
}
