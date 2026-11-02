import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { chapterById, chapterPages, type PageLink } from "./chapters";
import PrevNext, { type PrevNextLink } from "./PrevNext";

/**
 * Where a page sits in its chapter, from the kit's map (`chapters.ts`): its
 * number in the chapter bar (1 to 5 on the spine, S1 to S5 on the shelf)
 * and the pages before and after it in reading order. Every chapter page
 * takes its back and next links from here, so the order is written once.
 */
export interface PagePlace {
  /** "01" for TDH. */
  readonly chapterNumber: string;
  readonly link: PageLink;
  /** "4", or "S1" for the shelf; empty for the overview. */
  readonly n: string;
  readonly prev: PrevNextLink | null;
  readonly next: PrevNextLink | null;
}

function placeOf(link: PageLink, shelf: readonly PageLink[]): string {
  const onShelf = shelf.indexOf(link);
  if (onShelf >= 0) {
    return `S${onShelf + 1}`;
  }
  return link.n ?? "";
}

export function pagePlace(
  chapterId: string,
  pageId: string,
  locale: SupportedLocale
): PagePlace {
  const chapter = chapterById(chapterId);
  const pages = chapterPages(chapter);
  const index = pages.findIndex((page) => page.id === pageId);
  const link = pages[index];
  if (!link) {
    throw new Error(`Unknown page "${pageId}" in chapter "${chapterId}"`);
  }
  const toLink = (page: PageLink | undefined): PrevNextLink | null => {
    if (!page) {
      return null;
    }
    const n = placeOf(page, chapter.shelf);
    return {
      href: page.href,
      title: kt(locale, page.title),
      ...(n ? { n } : {}),
    };
  };
  return {
    chapterNumber: chapter.number ?? "",
    link,
    n: placeOf(link, chapter.shelf),
    prev: toLink(pages[index - 1]),
    next: toLink(pages[index + 1]),
  };
}

/** The page before and after, from the page's place in its chapter. */
export function PlaceLinks({
  place,
  locale,
}: {
  readonly place: PagePlace;
  readonly locale: SupportedLocale;
}) {
  return (
    <PrevNext
      locale={locale}
      {...(place.prev ? { prev: place.prev } : {})}
      {...(place.next ? { next: place.next } : {})}
    />
  );
}
