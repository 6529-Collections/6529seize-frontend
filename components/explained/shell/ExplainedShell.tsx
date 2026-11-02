import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactEntry, FactSnapshot } from "@/lib/explained/facts";
import FactsProvider from "../facts/FactsProvider";
import { EX_LAYOUT } from "../tokens";
import Breadcrumb, { type Crumb } from "./Breadcrumb";
import ChapterBar from "./ChapterBar";
import ChapterSwitcher from "./ChapterSwitcher";
import { chapterById } from "./chapters";
import LivePill from "./LivePill";

/**
 * The frame of every 6529 Explained page (EXPLAINED.md §6.2): the crumbs
 * bar with the feed-time pill and the chapter switcher, the chapter bar,
 * then the page on the Explained surface. It sets the body type itself,
 * because the site's global CSS shrinks body text on narrow screens. The
 * page's facts reach its client components through FactsProvider.
 */
export interface LiveSource {
  readonly fact: FactEntry | null;
  /** "record": a dated record (a specification, a manifest), shown without the live pulse. */
  readonly kind: "feed" | "file" | "read" | "record";
  /** Minutes between new values: a day for the feed. */
  readonly cadenceMinutes?: number;
  /** For a record: what was written, "Manifest written", instead of "Record written". */
  readonly lead?: string;
}

export default function ExplainedShell({
  chapter,
  page,
  crumbs,
  live,
  facts,
  locale,
  children,
  clock = "live",
  menus,
}: {
  /** A chapter id from the map, or "hub". */
  readonly chapter: string;
  /** The page's id in its chapter: "overview", "check". */
  readonly page: string;
  readonly crumbs: readonly Crumb[];
  readonly live?: LiveSource;
  readonly facts: FactSnapshot;
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
  /** "frozen" keeps the pill at the render time (the gallery and the gates). */
  readonly clock?: "live" | "frozen";
  /** Menus rendered open, for the gallery's states. */
  readonly menus?: { readonly shelf?: boolean; readonly switcher?: boolean };
}) {
  const def = chapter === "hub" ? null : chapterById(chapter);
  return (
    <FactsProvider snapshot={facts}>
      <div
        className={`tailwind-scope tw-min-h-[100dvh] tw-w-full tw-bg-[#0D0D0F] tw-text-base tw-leading-[26px] tw-text-iron-300 tw-antialiased [font-variant-numeric:tabular-nums] md:tw-text-[18px] md:tw-leading-[29px]`}
        data-explained-shell={chapter}
        data-explained-page={page}
        // On a phone the shell's crumbs bar and chapter bar (EXPLAINED.md
        // §6.2) sit above every H1, under the app's own header, so the H1
        // starts below the layout gate's 200 px line by design.
        data-tdh-check-ignore="h1-offset"
      >
        <div className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900">
          {/* One row; when the page's name and the live pill do not both
              fit (a long German name beside "vor 1 Std. 1 Min."), the pill
              wraps under the name instead of cutting it. */}
          <div className="tw-mx-auto tw-flex tw-min-h-[50px] tw-max-w-[1244px] tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-1.5 tw-px-5 tw-py-2 md:tw-min-h-16 md:tw-px-12">
            <Breadcrumb crumbs={crumbs} locale={locale} />
            <div className="tw-flex tw-flex-none tw-items-center tw-gap-2.5">
              {live && (
                <LivePill
                  fact={live.fact}
                  kind={live.kind}
                  cadenceMinutes={live.cadenceMinutes ?? 1440}
                  {...(live.lead === undefined ? {} : { lead: live.lead })}
                  locale={locale}
                  asOf={facts.asOf}
                  clock={clock}
                />
              )}
              <div className="tw-hidden lg:tw-block">
                <ChapterSwitcher
                  locale={locale}
                  current={chapter}
                  defaultOpen={menus?.switcher ?? false}
                />
              </div>
            </div>
          </div>
        </div>
        {/* A chapter with one page so far needs no bar: the crumbs already
            name the page. */}
        {def && def.read.length + def.check.length + def.shelf.length > 1 && (
          <div className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900">
            <div className="tw-mx-auto tw-max-w-[1244px]">
              <ChapterBar
                chapter={def}
                active={page}
                locale={locale}
                shelfOpen={menus?.shelf ?? false}
              />
            </div>
          </div>
        )}
        <div className={`${EX_LAYOUT.page} tw-pb-[72px]`}>{children}</div>
      </div>
    </FactsProvider>
  );
}
