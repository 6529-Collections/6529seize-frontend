import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/explained/marks/glyphs";
import { kt } from "@/components/explained/i18n";
import LoopAtlas, {
  type AtlasStation,
  type AtlasStep,
} from "@/components/explained/shell/LoopAtlas";
import { chapterById } from "@/components/explained/shell/chapters";
import { EX_BUTTON, EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import { MEME_ART } from "@/app/network/tdh/overview/art";
import type { SupportedLocale } from "@/i18n/locales";
import { fmt, type FactBook, type FactId } from "@/lib/explained/facts";
import CheckableToday from "./CheckableToday";
import { ht } from "./copy";
import { mainStageDays } from "./schedule";

/**
 * The loop, live (MAP.md §3): six stations around Verify, each with its
 * live number; TDH's two stations carry the chapter's number; "Follow one
 * copy" steps a copy round; the selected station's card links to the
 * chapter that explains it. Beside it, three things you can check today.
 */
const NOT_AVAILABLE = "-";

/** The card whose copy travels the loop: Meme #2, one of the CC0 cards below. */
const HELD_CARD = 2;

function stations(book: FactBook, locale: SupportedLocale): AtlasStation[] {
  const f = (id: FactId) => {
    const fact = book.maybe(id);
    return fact === null ? NOT_AVAILABLE : fmt(fact, locale);
  };
  const tdh = chapterById("tdh").number ?? "";
  return [
    {
      key: "art",
      name: ht(locale, "station.art"),
      sub: ht(locale, "station.artSub"),
      num: ht(locale, "station.artNum", { count: f("memes.count") }),
      fact: "memes.count",
      say: ht(locale, "station.artSay", {
        days: mainStageDays(book, locale) ?? NOT_AVAILABLE,
        copies: f("rules.editionFloorCap"),
      }),
    },
    {
      key: "hold",
      name: ht(locale, "station.hold"),
      sub: ht(locale, "station.holdSub"),
      num: ht(locale, "station.holdNum", { count: f("tdh.latest.wallets") }),
      fact: "tdh.latest.wallets",
      chapter: tdh,
      say: ht(locale, "station.holdSay"),
    },
    {
      key: "time",
      name: ht(locale, "station.time"),
      sub: ht(locale, "station.timeSub"),
      num: ht(locale, "station.timeNum", { total: f("tdh.latest.total") }),
      fact: "tdh.latest.total",
      chapter: tdh,
      head: ht(locale, "station.timeHead", {
        copy: f("engine.machine.default"),
      }),
      say: ht(locale, "station.timeSay", {
        total: f("tdh.latest.total"),
        date: f("tdh.latest.date"),
        copy: f("engine.machine.default"),
        rate: f(`meme.${HELD_CARD}.rate`),
        edition: f(`meme.${HELD_CARD}.edition`),
      }),
    },
    {
      key: "standing",
      name: ht(locale, "station.standing"),
      sub: ht(locale, "station.standingSub"),
      num: ht(locale, "station.standingNum"),
      say: ht(locale, "station.standingSay"),
    },
    {
      key: "decide",
      name: ht(locale, "station.decide"),
      sub: ht(locale, "station.decideSub"),
      num: ht(locale, "station.decideNum", {
        next: f("site.mainStage.next"),
      }),
      fact: "site.mainStage.next",
      say: ht(locale, "station.decideSay", {
        perWeek: f("site.mainStage.perWeek"),
      }),
    },
    {
      key: "execute",
      name: ht(locale, "station.execute"),
      sub: ht(locale, "station.executeSub"),
      num: ht(locale, "station.executeNum"),
      say: ht(locale, "station.executeSay"),
    },
  ];
}

/** "Follow one copy": the stations in the order a copy meets them. */
function steps(locale: SupportedLocale): AtlasStep[] {
  return (
    ["art", "hold", "time", "standing", "decide", "execute"] as const
  ).map((station) => ({ label: ht(locale, `station.${station}`), station }));
}

/** The chapter that explains each station (MAP.md §3). */
const STATION_CHAPTER: Readonly<Record<string, string>> = {
  art: "memes",
  hold: "tdh",
  time: "tdh",
  standing: "standing",
  decide: "waves",
  execute: "network",
};

/**
 * Each station card's action: a live chapter's link, or the name of the
 * chapter that will explain it, marked coming.
 */
function stationActions(locale: SupportedLocale): Record<string, ReactNode> {
  const actions: Record<string, ReactNode> = {};
  for (const [station, id] of Object.entries(STATION_CHAPTER)) {
    const chapter = chapterById(id);
    actions[station] =
      chapter.status === "live" && chapter.href ? (
        <Link className={EX_BUTTON.cta} href={chapter.href}>
          {ht(locale, "chapterCta", {
            number: chapter.number ?? "",
            title: kt(locale, chapter.title),
          })}
          <Icon kind="arrow" className="tw-size-4" />
        </Link>
      ) : (
        <span className="tw-text-[15px] tw-leading-6 tw-text-iron-400">
          {ht(locale, "chapterComing", { title: kt(locale, chapter.title) })}
          {/* The art's chapter is coming; its one-minute CC0 answer is on
              this page already. */}
          {station === "art" && (
            <>
              {" "}
              <a className={EX_LINK} href="#cc0">
                {ht(locale, "chapterCc0")}
              </a>
            </>
          )}
        </span>
      );
  }
  return actions;
}

/** "Follow one copy" opens on the copy being held: the Time station. */
const HELD_STEP = 2;

/** The copy that travels the loop: Meme #2, one of the CC0 cards below. */
const TOKEN_ART = MEME_ART[HELD_CARD].src;

/** Under the station card: what Verify at the centre shows, and what it does not. */
function VerifyNote({ locale }: { readonly locale: SupportedLocale }) {
  return (
    // On a phone the loop's list ends on Verify with the same limit, so the
    // note is for the circle's column only.
    <div
      className="tw-rounded-xl tw-border tw-border-dashed tw-border-iron-800 tw-p-5 max-xl:tw-hidden"
      data-verify-note=""
    >
      <span className={EX_TEXT.label}>{ht(locale, "verifyNote.label")}</span>
      <p className="tw-m-0 tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {ht(locale, "verifyNote.body")}{" "}
        <Link className={EX_LINK} href="/network/tdh/verification">
          {ht(locale, "verifyNote.link")}
        </Link>
      </p>
    </div>
  );
}

export default function HubLoop({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const equal = book.maybe("tdh.latest.agree.live.identities.equal");
  return (
    <div className="tw-mt-8">
      <LoopAtlas
        stations={stations(book, locale)}
        steps={steps(locale)}
        initialStep={HELD_STEP}
        locale={locale}
        verify={{
          identities: equal === null ? NOT_AVAILABLE : fmt(equal, locale),
          fact: "tdh.latest.agree.live.identities.equal",
        }}
        actions={stationActions(locale)}
        note={<VerifyNote locale={locale} />}
        tokenArt={TOKEN_ART}
        autoplay
        aside={<CheckableToday book={book} locale={locale} />}
      />
    </div>
  );
}
