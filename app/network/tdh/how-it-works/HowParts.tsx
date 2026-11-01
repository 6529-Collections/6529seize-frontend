import type { SupportedLocale } from "@/i18n/locales";
import { EX_FOCUS } from "@/components/explained/tokens";
import { ht, type HowKey } from "./copy";

/**
 * The four parts under the header: Time, Rarity, Collections and You, each a
 * link to its part with a small drawing of its idea (a fourth day filled; a
 * tall narrow tile beside low wide ones; one hatched band; three wallets).
 * Drawn in HTML, ink and blue only.
 */
const PARTS: readonly {
  readonly letter: string;
  readonly id: string;
  readonly title: HowKey;
  readonly line: HowKey;
  readonly drawing: "time" | "rarity" | "collections" | "you";
}[] = [
  {
    letter: "A",
    id: "part-a",
    title: "explained.tdh.how.parts.a.title",
    line: "explained.tdh.how.parts.a.line",
    drawing: "time",
  },
  {
    letter: "B",
    id: "part-b",
    title: "explained.tdh.how.parts.b.title",
    line: "explained.tdh.how.parts.b.line",
    drawing: "rarity",
  },
  {
    letter: "C",
    id: "part-c",
    title: "explained.tdh.how.parts.c.title",
    line: "explained.tdh.how.parts.c.line",
    drawing: "collections",
  },
  {
    letter: "D",
    id: "part-d",
    title: "explained.tdh.how.parts.d.title",
    line: "explained.tdh.how.parts.d.line",
    drawing: "you",
  },
];

const TILE =
  "tw-block tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-300/[0.16]";

function Drawing({
  kind,
}: {
  readonly kind: (typeof PARTS)[number]["drawing"];
}) {
  if (kind === "time") {
    return (
      <>
        {[0, 1, 2].map((day) => (
          <i key={day} className={`${TILE} tw-h-5 tw-w-[24%]`} />
        ))}
        <i className="tw-block tw-h-5 tw-w-[24%] tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-400/30" />
      </>
    );
  }
  if (kind === "rarity") {
    return (
      <>
        <i className={`${TILE} tw-h-9 tw-w-[8%]`} />
        <i className={`${TILE} tw-h-[13px] tw-w-[22%]`} />
        <i className={`${TILE} tw-h-[5px] tw-w-[60%]`} />
      </>
    );
  }
  if (kind === "collections") {
    return (
      <i className="tw-block tw-h-[30px] tw-w-full tw-border tw-border-solid tw-border-primary-400 [background:repeating-linear-gradient(45deg,rgba(82,139,255,0.5)_0_2px,transparent_2px_6px)]" />
    );
  }
  return (
    <>
      {[0, 1, 2].map((wallet) => (
        <i
          key={wallet}
          className={`${TILE} tw-h-[22px] tw-w-[32%] tw-rounded`}
        />
      ))}
    </>
  );
}

export default function HowParts({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    // A figure, as in the mockup: four drawings of the four ideas, as links.
    <figure className="tw-m-0 tw-mt-10 md:tw-mt-12">
      <nav
        aria-label={ht(locale, "explained.tdh.how.parts.label")}
        className="tw-grid tw-grid-cols-1 tw-gap-2.5 min-[360px]:tw-grid-cols-2 lg:tw-grid-cols-4 lg:tw-gap-3.5"
      >
        {PARTS.map((part) => (
          <a
            key={part.id}
            href={`#${part.id}`}
            className={`tw-relative tw-flex tw-flex-col tw-gap-1 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3.5 tw-pb-[60px] tw-pt-3.5 tw-text-sm tw-leading-5 tw-no-underline hover:tw-border-iron-700 md:tw-px-[18px] md:tw-pb-[74px] md:tw-pt-[18px] md:tw-text-[15px] md:tw-leading-[22px] ${EX_FOCUS}`}
          >
            <span className="tw-text-[13px] tw-font-bold tw-text-primary-300">
              {part.letter}
            </span>
            <b className="tw-text-[17px] tw-font-semibold tw-leading-6 tw-text-iron-50 md:tw-text-[19px] md:tw-leading-[26px]">
              {ht(locale, part.title)}
            </b>
            <span className="tw-text-iron-400">{ht(locale, part.line)}</span>
            <span
              className="tw-absolute tw-inset-x-3.5 tw-bottom-3.5 tw-flex tw-h-[30px] tw-items-end tw-gap-1 md:tw-inset-x-[18px] md:tw-bottom-[18px] md:tw-h-9"
              aria-hidden="true"
            >
              <Drawing kind={part.drawing} />
            </span>
          </a>
        ))}
      </nav>
    </figure>
  );
}

/** One term of the formula, with the letter of the part that explains it. */
function Term({
  href,
  letter,
  children,
}: {
  readonly href: string;
  readonly letter: string;
  readonly children: string;
}) {
  return (
    <a
      href={href}
      className={`tw-inline tw-rounded tw-bg-iron-900 tw-px-1.5 tw-text-iron-50 tw-no-underline [box-decoration-break:clone] hover:tw-bg-iron-800 md:tw-whitespace-nowrap ${EX_FOCUS}`}
    >
      {children}
      {/* The part's letter, on the line rather than raised, so it stays
          inside the term's box. */}
      <span className="tw-ml-1 tw-align-baseline tw-text-xs tw-font-bold tw-text-primary-300">
        {letter}
      </span>
    </a>
  );
}

/**
 * The whole calculation on the first screen, in one line, each term
 * lettered with the part below that explains it: TDH is the sum, over every
 * card an identity holds (D), of whole days held (A) × rate (B) × boost (C),
 * each card rounded on its own.
 */
export function HowFormula({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <figure
      className="tw-m-0 tw-mt-8 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-[18px] tw-py-4 md:tw-px-6 md:tw-py-5"
      data-fig="formula"
    >
      <figcaption className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
        {ht(locale, "explained.tdh.how.formula.lead")}
      </figcaption>
      <p
        className="tw-m-0 tw-text-[17px] tw-leading-[32px] tw-text-iron-300 md:tw-text-lg md:tw-leading-[34px]"
        data-formula=""
      >
        <b className="tw-font-semibold tw-text-iron-50">TDH = Σ</b>{" "}
        <span className="tw-text-iron-400">
          {ht(locale, "explained.tdh.how.formula.over")}
        </span>{" "}
        <Term href="#part-d" letter="D">
          {ht(locale, "explained.tdh.how.formula.cards")}
        </Term>
        {" : "}
        <Term href="#part-a" letter="A">
          {ht(locale, "explained.tdh.how.formula.days")}
        </Term>
        {" × "}
        <Term href="#part-b" letter="B">
          {ht(locale, "explained.tdh.how.formula.rate")}
        </Term>
        {" × "}
        <Term href="#part-c" letter="C">
          {ht(locale, "explained.tdh.how.formula.boost")}
        </Term>
        {", "}
        <span className="tw-text-iron-400">
          {ht(locale, "explained.tdh.how.formula.round")}
        </span>
      </p>
    </figure>
  );
}
