import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { Icon } from "../marks/glyphs";
import { EX_BUTTON, EX_TEXT } from "../tokens";
import { CHAPTERS, HUB_HREF, chapterById } from "./chapters";
import ExplainedShell from "./ExplainedShell";
import PageIndex, { type PageIndexRow } from "./PageIndex";

/**
 * No page at this address, inside 6529 Explained (EXPLAINED.md §6.2): the
 * shell, the chapter bar when the address is in a chapter, a plain sentence,
 * the chapter's pages from the map and a way back to the hub. The address
 * itself is never echoed. The page reads no live source, so it cannot fail
 * while a source is down; its facts are only the shell's.
 */
export default function NotFoundPage({
  chapter,
  locale,
}: {
  /** A chapter id from the map, or "hub" for an address under /explained. */
  readonly chapter: string;
  readonly locale: SupportedLocale;
}) {
  const def = chapter === "hub" ? null : chapterById(chapter);
  const chapterTitle = def
    ? kt(locale, "explained.kit.map.chapterTitle", {
        number: def.number ?? "",
        title: kt(locale, def.title),
      })
    : null;
  const rows: PageIndexRow[] = def
    ? [
        ...[...def.read, ...def.check].map((page) => ({
          no: page.n ?? "",
          title: kt(locale, page.title),
          href: page.href,
        })),
        ...def.shelf.map((page, index) => ({
          no: `S${index + 1}`,
          title: kt(locale, page.title),
          href: page.href,
          shelf: true,
        })),
      ]
    : CHAPTERS.filter((entry) => entry.status === "live" && entry.href).map(
        (entry) => ({
          no: entry.number ?? "",
          title: kt(locale, entry.title),
          href: entry.href ?? HUB_HREF,
        })
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
            {def && chapterTitle
              ? kt(locale, "explained.kit.notFound.chapterBody", {
                  chapter: chapterTitle,
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
        <div className="tw-mt-12 tw-max-w-[900px]">
          <PageIndex rows={rows} locale={locale} />
        </div>
      </article>
    </ExplainedShell>
  );
}
