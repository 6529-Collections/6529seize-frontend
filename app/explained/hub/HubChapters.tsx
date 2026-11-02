import type { ReactNode } from "react";
import { kt } from "@/components/explained/i18n";
import ChapterIndex, {
  type ChapterIndexRow,
} from "@/components/explained/shell/ChapterIndex";
import { CHAPTERS } from "@/components/explained/shell/chapters";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { Fact } from "../_lib/facts";
import { hrich, ht, type HubKey } from "./copy";

/**
 * The chapters (MAP.md §3, §6): TDH live with its number and a link; the
 * rest in their order (Next, Then, Later, Last), each with its question,
 * whether its subject runs today, and what it waits on. No number and no
 * link until a chapter ships.
 */
interface ComingDef {
  readonly order: HubKey;
  readonly question: HubKey;
  /** The maturity's own words, in place of the track's: "Live subject". */
  readonly label?: HubKey;
  /** What it waits on; null for "nothing". */
  readonly waits: HubKey | null;
}

/** A coming chapter whose subject already runs: "Live subject". */
const LIVE_SUBJECT: HubKey = "chapter.liveSubject";

const COMING: Readonly<Record<string, ComingDef>> = {
  memes: {
    order: "order.next",
    question: "chapter.memesQ",
    label: LIVE_SUBJECT,
    waits: "chapter.memesWaits",
  },
  waves: {
    order: "order.then",
    question: "chapter.wavesQ",
    label: LIVE_SUBJECT,
    waits: null,
  },
  validators: {
    order: "order.then",
    question: "chapter.validatorsQ",
    waits: null,
  },
  nextgen: {
    order: "order.later",
    question: "chapter.nextgenQ",
    label: LIVE_SUBJECT,
    waits: null,
  },
  standing: {
    order: "order.later",
    question: "chapter.standingQ",
    label: LIVE_SUBJECT,
    waits: "chapter.standingWaits",
  },
  works: {
    order: "order.later",
    question: "chapter.worksQ",
    label: "chapter.worksLabel",
    waits: "chapter.worksWaits",
  },
  network: {
    order: "order.last",
    question: "chapter.networkQ",
    label: "chapter.networkLabel",
    waits: "chapter.networkWaits",
  },
};

function comingRow(
  id: string,
  def: ComingDef,
  book: FactBook,
  locale: SupportedLocale
): Pick<ChapterIndexRow, "order" | "question" | "maturityLabel" | "note"> {
  const waitsOn = (what: string) =>
    kt(locale, "explained.kit.chapters.waitsOn", { what });
  let note: ReactNode = waitsOn(ht(locale, def.waits ?? "chapter.nothing"));
  if (id === "validators") {
    note = hrich(locale, "chapter.validatorsNote", {
      version: <Fact book={book} id="site.validator.version" locale={locale} />,
    });
  }
  return {
    order: ht(locale, def.order),
    question: ht(locale, def.question),
    ...(def.label === undefined
      ? {}
      : { maturityLabel: ht(locale, def.label) }),
    note,
  };
}

export default function HubChapters({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const rows: ChapterIndexRow[] = CHAPTERS.map((chapter) => {
    const title = kt(locale, chapter.title);
    const def = COMING[chapter.id];
    if (chapter.status === "live" || def === undefined) {
      return {
        id: chapter.id,
        order: chapter.number ?? "",
        title,
        question: ht(locale, "chapter.tdhQ"),
        maturity: chapter.maturity,
        note: hrich(locale, "chapter.tdhNote", {
          date: <Fact book={book} id="tdh.days.first" locale={locale} />,
        }),
        ...(chapter.href ? { href: chapter.href } : {}),
      };
    }
    return {
      id: chapter.id,
      title,
      maturity: chapter.maturity,
      ...comingRow(chapter.id, def, book, locale),
    };
  });
  return (
    <section id="chapters" className={EX_LAYOUT.section}>
      <div className={EX_LAYOUT.stmt}>
        <div>
          <span className={`${EX_TEXT.label} tw-mb-3.5 tw-block`}>
            {ht(locale, "chapters.label")}
          </span>
          <h2 className={EX_TEXT.stmt}>{ht(locale, "chapters.title")}</h2>
        </div>
        <div className="lg:tw-pt-1.5">
          <p className={`${EX_TEXT.body} tw-m-0`}>
            {ht(locale, "chapters.body")}
          </p>
        </div>
      </div>
      <div className="tw-mt-10 md:tw-mt-12">
        <ChapterIndex rows={rows} locale={locale} />
      </div>
    </section>
  );
}
