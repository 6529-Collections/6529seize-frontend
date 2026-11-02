import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { EX_FOCUS } from "../tokens";
import type { ChapterDef, PageLink } from "./chapters";
import ScrollActive from "./ScrollActive";
import ShelfMenu from "./ShelfMenu";

/**
 * The chapter bar (EXPLAINED.md §6.2): the Read pages, then the Check
 * pages, then the shelf. The active page is underlined in blue; a page not
 * shipped shows at 55% and is not a link. When the pages do not fit (a
 * phone, a long translation) the bar scrolls sideways with an edge fade; on
 * a phone the shelf's pages follow the spine.
 */
function BarLink({
  page,
  active,
  locale,
  phoneOnly = false,
}: {
  readonly page: PageLink;
  readonly active: string;
  readonly locale: SupportedLocale;
  readonly phoneOnly?: boolean;
}) {
  const on = page.id === active;
  const title = kt(locale, page.title);
  const base = `tw-relative tw-inline-flex tw-h-[50px] tw-flex-none tw-items-center tw-gap-[7px] tw-whitespace-nowrap tw-px-[9px] tw-text-sm tw-no-underline md:tw-h-14 md:tw-px-[11px] md:tw-text-[15px] ${phoneOnly ? "md:tw-hidden" : ""}`;
  const number = page.n ? (
    <span
      className={`tw-text-xs tw-font-semibold ${on ? "tw-text-primary-300" : "tw-text-iron-400"}`}
    >
      {page.n}
    </span>
  ) : null;
  if (page.soon) {
    return (
      <span
        className={`${base} tw-font-medium tw-text-iron-400 tw-opacity-[0.55]`}
        aria-disabled="true"
        title={kt(locale, "explained.kit.shell.soon", { page: title })}
      >
        {number}
        {title}
      </span>
    );
  }
  return (
    <Link
      href={page.href}
      className={`${base} ${on ? "tw-font-semibold tw-text-iron-50" : "tw-font-medium tw-text-iron-400 hover:tw-text-iron-50"} ${EX_FOCUS}`}
      {...(on ? { "aria-current": "page" as const } : {})}
    >
      {number}
      {title}
      {on && (
        <span
          className="tw-absolute tw-inset-x-[9px] -tw-bottom-px tw-h-0.5 tw-rounded-sm tw-bg-primary-400 md:tw-inset-x-[11px]"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

function GroupLabel({ children }: { readonly children: string }) {
  return (
    <span className="tw-mr-1.5 tw-hidden tw-flex-none tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-400 md:tw-inline">
      {children}
    </span>
  );
}

export default function ChapterBar({
  chapter,
  active,
  locale,
  shelfOpen = false,
}: {
  readonly chapter: ChapterDef;
  /** The id of the page on screen. */
  readonly active: string;
  readonly locale: SupportedLocale;
  /** Rendered with the shelf open, for the gallery and the gates' states. */
  readonly shelfOpen?: boolean;
}) {
  const name = chapter.number
    ? kt(locale, "explained.kit.map.chapterTitle", {
        number: chapter.number,
        title: kt(locale, chapter.title),
      })
    : kt(locale, chapter.title);
  return (
    <nav
      aria-label={kt(locale, "explained.kit.shell.chapterPages", {
        chapter: name,
      })}
      className="tw-relative tw-flex tw-items-center tw-pl-3 md:tw-h-14 md:tw-px-12"
    >
      <div
        className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-0.5 tw-overflow-x-auto tw-pr-10 tw-scrollbar-none [mask-image:linear-gradient(90deg,#000_calc(100%-40px),transparent)]"
        data-chapter-scroll=""
        // The layout gate's shared scroll frame: it scrolls sideways with an edge fade.
        data-tdh-scroll=""
      >
        <GroupLabel>{kt(locale, "explained.kit.shell.read")}</GroupLabel>
        {chapter.read.map((page) => (
          <BarLink key={page.id} page={page} active={active} locale={locale} />
        ))}
        {chapter.check.length > 0 && (
          <>
            <span
              className="tw-ml-2.5 tw-mr-3.5 tw-h-5 tw-w-px tw-flex-none tw-bg-iron-700"
              aria-hidden="true"
            />
            <GroupLabel>{kt(locale, "explained.kit.shell.check")}</GroupLabel>
            {chapter.check.map((page) => (
              <BarLink
                key={page.id}
                page={page}
                active={active}
                locale={locale}
              />
            ))}
          </>
        )}
        {chapter.shelf.map((page) => (
          <BarLink
            key={page.id}
            page={page}
            active={active}
            locale={locale}
            phoneOnly
          />
        ))}
      </div>
      <ScrollActive />
      {chapter.shelf.length > 0 && (
        <div className="tw-ml-3 tw-hidden md:tw-block">
          <ShelfMenu
            shelf={chapter.shelf}
            active={active}
            locale={locale}
            defaultOpen={shelfOpen}
          />
        </div>
      )}
    </nav>
  );
}
