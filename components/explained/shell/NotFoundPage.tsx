import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { Icon } from "../marks/glyphs";
import { EX_BUTTON, EX_TEXT } from "../tokens";
import type { Maturity } from "../marks/Track";
import { CHAPTERS, HUB_HREF, chapterById, chapterPages } from "./chapters";
import ExplainedShell from "./ExplainedShell";
import PageIndex, { type PageIndexRow } from "./PageIndex";

/**
 * No page at this address, inside 6529 Explained (EXPLAINED.md §6.2): the
 * shell, the chapter bar when the address is in a chapter, a plain sentence,
 * the chapter's pages from the map and a way back to the hub. The address
 * itself is never echoed. The page reads no live source, so it cannot fail
 * while a source is down; its facts are only the shell's.
 */
/** A coming chapter, as the hub's list says it: does its subject run today? */
const COMING_RUNS: Readonly<
  Record<
    Maturity,
    | "explained.kit.notFound.comingLive"
    | "explained.kit.notFound.comingBuilt"
    | "explained.kit.notFound.comingDesign"
  >
> = {
  live: "explained.kit.notFound.comingLive",
  built: "explained.kit.notFound.comingBuilt",
  design: "explained.kit.notFound.comingDesign",
};

export default function NotFoundPage({
  chapter,
  locale,
  descriptions = {},
}: {
  /** A chapter id from the map, or "hub" for an address under /explained. */
  readonly chapter: string;
  readonly locale: SupportedLocale;
  /** One line for each of the chapter's pages, by page id, as its overview lists them. */
  readonly descriptions?: Readonly<Record<string, string>>;
}) {
  const def = chapter === "hub" ? null : chapterById(chapter);
  const chapterTitle = def
    ? kt(locale, "explained.kit.map.chapterTitle", {
        number: def.number ?? "",
        title: kt(locale, def.title),
      })
    : null;
  // "The TDH chapter", not "01 TDH": a chapter named in a sentence.
  const chapterName = def
    ? kt(locale, "explained.kit.notFound.chapterName", {
        title: kt(locale, def.title),
      })
    : null;
  const rows: PageIndexRow[] = def
    ? [
        ...[...def.read, ...def.check].map((page) => ({
          no: page.n ?? "",
          title: kt(locale, page.title),
          href: page.href,
          ...(descriptions[page.id] ? { desc: descriptions[page.id] } : {}),
        })),
        ...def.shelf.map((page, index) => ({
          no: `S${index + 1}`,
          title: kt(locale, page.title),
          href: page.href,
          shelf: true,
          ...(descriptions[page.id] ? { desc: descriptions[page.id] } : {}),
        })),
      ]
    : // Every chapter, the coming ones listed without a link, so a reader
      // who typed /explained/validators learns it is coming, not missing;
      // a coming chapter's pages already live follow it, with their links.
      CHAPTERS.flatMap((entry): PageIndexRow[] =>
        entry.status === "live" && entry.href
          ? [
              {
                no: entry.number ?? "",
                title: kt(locale, entry.title),
                href: entry.href,
                desc: kt(locale, "explained.kit.notFound.liveChapter"),
              },
            ]
          : [
              {
                // A coming chapter's place in the build order, as the hub
                // lists it: Next, Then, Later; and whether its subject runs.
                no: entry.order ? kt(locale, entry.order) : "",
                title: kt(locale, entry.title),
                desc: kt(locale, COMING_RUNS[entry.maturity]),
              },
              ...chapterPages(entry).map((page) => ({
                no: "",
                title: kt(locale, page.title),
                href: page.href,
                desc: kt(locale, "explained.kit.notFound.liveInComing", {
                  chapter: kt(locale, entry.title),
                }),
              })),
              // The Memes' one-minute CC0 answer lives on the hub until its
              // chapter ships: an artist who types /explained/the-memes
              // finds it.
              ...(entry.id === "memes"
                ? [
                    {
                      no: "",
                      title: kt(locale, "explained.kit.notFound.cc0"),
                      href: `${HUB_HREF}#cc0`,
                      desc: kt(locale, "explained.kit.notFound.liveInComing", {
                        chapter: kt(locale, entry.title),
                      }),
                    },
                  ]
                : []),
            ]
      );
  return (
    <ExplainedShell
      chapter={def ? def.id : "hub"}
      page="none"
      crumbs={[
        { label: kt(locale, "explained.kit.shell.explained"), href: HUB_HREF },
        ...(def && chapterTitle
          ? [{ label: chapterTitle, href: def.href ?? HUB_HREF }]
          : []),
      ]}
      facts={{ asOf: new Date().toISOString(), facts: {} }}
      locale={locale}
    >
      <article data-ex-article="" lang={locale} data-ex-not-found="">
        <header className="tw-pt-[30px] md:tw-pt-[52px]">
          <span className={`${EX_TEXT.label} tw-block`}>
            {kt(locale, "explained.kit.notFound.eyebrow")}
          </span>
          <h1 className={`${EX_TEXT.h1r} tw-mt-4`}>
            {kt(locale, "explained.kit.notFound.title")}
          </h1>
          <p className={`${EX_TEXT.lede} tw-mt-4 md:tw-mt-[22px]`}>
            {def && chapterName
              ? kt(locale, "explained.kit.notFound.chapterBody", {
                  chapter: chapterName,
                })
              : kt(locale, "explained.kit.notFound.hubBody")}
          </p>
        </header>
        <div className="tw-mt-8 tw-flex tw-flex-wrap tw-gap-2.5">
          {def?.href && chapterTitle && (
            <Link className={EX_BUTTON.cta} href={def.href}>
              <span>{chapterTitle}</span>
              <Icon kind="arrow" />
            </Link>
          )}
          <Link
            className={def ? EX_BUTTON.secondary : EX_BUTTON.cta}
            href={HUB_HREF}
          >
            <span>{kt(locale, "explained.kit.notFound.toHub")}</span>
            {!def && <Icon kind="arrow" />}
          </Link>
        </div>
        {/* A direction, not only an index: where to start, by what the
            reader came for. */}
        {def && def.read[1] && def.check[0] && (
          <p className={`${EX_TEXT.body} tw-m-0 tw-mt-10`} data-start="">
            {kt(locale, "explained.kit.notFound.start", {
              hold: `${def.read[1].n ?? ""} ${kt(locale, def.read[1].title)}`.trim(),
              check:
                `${def.check[0].n ?? ""} ${kt(locale, def.check[0].title)}`.trim(),
            })}
          </p>
        )}
        <div className="tw-mt-12 tw-max-w-[900px]">
          <PageIndex rows={rows} locale={locale} />
        </div>
      </article>
    </ExplainedShell>
  );
}
