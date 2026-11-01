import ReaderPaths, {
  type ReaderPath,
} from "@/components/explained/shell/ReaderPaths";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { ht, type HubKey } from "./copy";

/**
 * Who are you reading as? (MAP.md §3): eight paths, each a few pages in
 * order with the time it takes. The minutes are reading-time estimates
 * for each path's pages, set by the editors with the paths, not facts
 * about 6529; the list is marked so the number gate reads them as such.
 */
interface PathDef {
  readonly who: HubKey;
  readonly route: HubKey;
  readonly minutes: number;
  readonly href: string;
  readonly more?: boolean;
}

const PATHS: readonly PathDef[] = [
  {
    who: "path.first",
    route: "path.firstRoute",
    minutes: 6,
    href: "/network/tdh",
  },
  {
    who: "path.collect",
    route: "path.collectRoute",
    minutes: 9,
    href: "/network/tdh/consolidation",
  },
  {
    who: "path.art",
    route: "path.artRoute",
    minutes: 7,
    href: "#cc0",
    more: true,
  },
  {
    who: "path.code",
    route: "path.codeRoute",
    minutes: 25,
    href: "/network/tdh/specification",
  },
  {
    who: "path.proofs",
    route: "path.proofsRoute",
    minutes: 15,
    href: "/network/tdh/formal",
  },
  {
    who: "path.validator",
    route: "path.validatorRoute",
    minutes: 11,
    href: "/network/tdh/verification",
  },
  {
    who: "path.writer",
    route: "path.writerRoute",
    minutes: 8,
    href: "/network/tdh/verification",
  },
  // The eighth: for a reader none of the seven describes. Eight paths fill
  // two rows of four.
  {
    who: "path.unsure",
    route: "path.unsureRoute",
    minutes: 2,
    href: "/network/tdh",
  },
];

/** The Memes and CC0 is chapter 02 once it ships: the art path grows with it. */
const ART_CHAPTER = "02";

export default function HubPaths({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const paths: ReaderPath[] = PATHS.map((path) => ({
    who: ht(locale, path.who),
    route: ht(locale, path.route),
    minutes: path.minutes,
    href: path.href,
    ...(path.more
      ? { more: ht(locale, "path.artMore", { number: ART_CHAPTER }) }
      : {}),
  }));
  return (
    <section id="paths" className={EX_LAYOUT.section}>
      <div className={EX_LAYOUT.stmt}>
        <div>
          <span className={`${EX_TEXT.label} tw-mb-3.5 tw-block`}>
            {ht(locale, "paths.label")}
          </span>
          <h2 className={EX_TEXT.stmt}>{ht(locale, "paths.title")}</h2>
        </div>
        <div className="lg:tw-pt-1.5">
          <p className={`${EX_TEXT.body} tw-m-0`}>{ht(locale, "paths.body")}</p>
        </div>
      </div>
      <div className="tw-mt-10 md:tw-mt-12" data-ex-allow-number="">
        <ReaderPaths paths={paths} locale={locale} />
      </div>
    </section>
  );
}
