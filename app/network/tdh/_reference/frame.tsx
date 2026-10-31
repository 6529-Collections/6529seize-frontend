import type { ReactNode } from "react";
import { kt } from "@/components/explained/i18n";
import {
  chapterById,
  chapterPages,
  type PageLink,
} from "@/components/explained/shell/chapters";
import PrevNext, {
  type PrevNextLink,
} from "@/components/explained/shell/PrevNext";
import type { SupportedLocale } from "@/i18n/locales";

/**
 * Where a TDH page sits in its chapter, from the kit's map: its number in
 * the chapter bar (1 to 4 on the spine, S1 to S5 on the shelf), and the
 * pages before and after it in reading order.
 */
interface PagePlace {
  readonly chapterNumber: string;
  readonly link: PageLink;
  /** "4", or "S1" for the shelf. */
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

export function pagePlace(pageId: string, locale: SupportedLocale): PagePlace {
  const chapter = chapterById("tdh");
  const pages = chapterPages(chapter);
  const index = pages.findIndex((page) => page.id === pageId);
  const link = pages[index];
  if (!link) {
    throw new Error(`Unknown TDH page "${pageId}"`);
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

/**
 * The page before and after. Their kickers name places in the chapter
 * ("Back · 3", "Next · S1"), ordinals rather than quantities. The two cards
 * are the kit's half-width design with a short title, so the TDH gate's
 * empty-card rule does not apply to them.
 */
export function PlaceLinks({
  place,
  locale,
}: {
  readonly place: PagePlace;
  readonly locale: SupportedLocale;
}): ReactNode {
  return (
    <div data-ex-allow-number="" data-tdh-check-ignore="empty-card">
      <PrevNext
        locale={locale}
        {...(place.prev ? { prev: place.prev } : {})}
        {...(place.next ? { next: place.next } : {})}
      />
    </div>
  );
}
