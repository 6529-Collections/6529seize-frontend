import Link from "next/link";
import { LimitNote } from "@/components/explained/evidence/notes";
import { Icon } from "@/components/explained/marks/glyphs";
import Mark from "@/components/explained/marks/Mark";
import ArtCard from "@/components/explained/things/ArtCard";
import {
  EX_BUTTON,
  EX_LAYOUT,
  EX_LINK,
  EX_TEXT,
} from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { MEME_ART } from "@/app/network/tdh/overview/art";
import { withCc0 } from "@/components/explained/marks/Cc0";
import Cc0Licence from "./Cc0Licence";
import type { FactBook } from "@/lib/explained/facts";
import { Fact } from "../_lib/facts";
import { hrich, ht, type HubKey } from "./copy";

/**
 * CC0, in one minute (MAP.md §3; TDH-DESIGN.md §7): three real CC0 cards,
 * each named and marked free to use; the mockup's model (pick a work and a
 * use); the artist's three boxes (give, keep, not written down);
 * "The art is free. Holding is what counts.", what an artist gives and
 * keeps, where CC0 stops (Card #1's Punk), the full image, the License
 * page, the CC0 deed and how holding counts, and the absolute behind it
 * (D89). It
 * lives on the hub until The Memes and CC0 ships, then moves there with a
 * redirect of #cc0.
 */
const FAN = [
  {
    art: MEME_ART[3],
    place: "tw-left-[3%] tw-top-6 tw-rotate-[-5deg]",
  },
  { art: MEME_ART[2], place: "tw-left-[31.5%] tw-top-0 tw-z-[2]" },
  {
    art: MEME_ART[4],
    place: "tw-left-[60%] tw-top-6 tw-rotate-[5deg]",
  },
] as const;

const DOWNLOAD = MEME_ART[2];

/** Meme Card #1 on 6529.io: the CryptoPunk where CC0 stops. */
const MEME_ONE = "/the-memes/1";

/** Creative Commons' deed for CC0 1.0: the dedication in plain words, and its notice on endorsement. */
const CC0_DEED = "https://creativecommons.org/publicdomain/zero/1.0/";

/** The artist's three boxes: what you give, keep, and what no one has written down. */
const ARTIST: readonly {
  readonly id: string;
  readonly label: HubKey;
  readonly body: HubKey;
  readonly mark: "absolute" | "decided" | "open";
  readonly refText?: string;
}[] = [
  {
    id: "give",
    label: "cc0.giveLabel",
    body: "cc0.give",
    mark: "absolute",
    refText: "D89",
  },
  {
    id: "keep",
    label: "cc0.keepLabel",
    body: "cc0.keepBody",
    mark: "decided",
    refText: "D91",
  },
  {
    id: "unstated",
    label: "cc0.unstatedLabel",
    body: "cc0.unstated",
    mark: "open",
  },
];

export default function Cc0Answer({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  return (
    <section id="cc0" className={`${EX_LAYOUT.section} tw-scroll-mt-24`}>
      <div className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-5 lg:tw-grid-cols-[500px_minmax(0,1fr)] lg:tw-gap-16">
        <figure className="tw-m-0">
          <div
            className="tw-relative tw-aspect-[350/270] tw-w-full lg:tw-aspect-[500/400]"
            // The three cards overlap as a fan by design.
            data-tdh-check-ignore="card-gap"
            role="group"
            aria-label={ht(locale, "cc0.fanLabel")}
          >
            {FAN.map(({ art, place }) => (
              <div key={art.id} className={`tw-absolute tw-w-[37%] ${place}`}>
                <ArtCard
                  src={art.src}
                  fallbackSrc={art.original}
                  alt={ht(locale, "cc0.alt", { id: art.id, title: art.title })}
                  number={`#${art.id}`}
                  sizes="(max-width: 1024px) 40vw, 216px"
                />
              </div>
            ))}
          </div>
          {/* The licence sits on the art: each card named, free to use,
              and its full image one tap away. */}
          <figcaption>
            <ul className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-col tw-gap-1.5 tw-p-0 tw-text-[13px] tw-leading-5 tw-text-iron-400">
              {FAN.map(({ art }) => (
                <li key={art.id} className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-inline-flex tw-h-5 tw-items-center tw-rounded tw-border tw-border-solid tw-border-iron-700 tw-px-1.5 tw-text-xs tw-font-semibold tw-text-iron-200">
                    CC0
                  </span>
                  <a
                    className={EX_LINK}
                    href={art.original}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {ht(locale, "cc0.fanCaption", {
                      id: art.id,
                      title: art.title,
                    })}
                  </a>
                </li>
              ))}
            </ul>
          </figcaption>
        </figure>
        <div className="tw-max-w-[600px]">
          <span className={EX_TEXT.label}>
            {withCc0(ht(locale, "cc0.label"))}
          </span>
          <h2 className={`${EX_TEXT.stmt} tw-mt-3`}>
            {withCc0(ht(locale, "cc0.title"))}
          </h2>
          {/* The mark travels with the claim it qualifies. */}
          <div className="tw-mt-3">
            <Mark
              kind="absolute"
              locale={locale}
              size="sm"
              refText={ht(locale, "cc0.markRef")}
            />
          </div>
          <p className={`${EX_TEXT.body} tw-m-0 tw-mt-4`}>
            {withCc0(ht(locale, "cc0.body"))}
          </p>
          <ul className="tw-m-0 tw-mt-5 tw-flex tw-list-none tw-flex-col tw-items-start tw-gap-y-2 tw-p-0 tw-text-[15px] tw-leading-6 sm:tw-flex-row sm:tw-flex-wrap sm:tw-gap-x-5">
            <li className="tw-flex tw-items-center tw-gap-1.5">
              <Icon kind="down" className="tw-size-4 tw-text-iron-400" />
              <a
                className={EX_LINK}
                href={DOWNLOAD.original}
                target="_blank"
                rel="noreferrer"
              >
                {ht(locale, "cc0.download", { id: DOWNLOAD.id })}
              </a>
            </li>
            <li className="tw-flex tw-items-center tw-gap-1.5">
              <Icon kind="rule" className="tw-size-4 tw-text-iron-400" />
              <Link className={EX_LINK} href="/about/license">
                {withCc0(ht(locale, "cc0.chapter"))}
              </Link>
            </li>
            <li className="tw-flex tw-items-center tw-gap-1.5">
              <Icon kind="arrow" className="tw-size-4 tw-text-iron-400" />
              <a
                className={EX_LINK}
                href={CC0_DEED}
                target="_blank"
                rel="noopener noreferrer"
              >
                {withCc0(ht(locale, "cc0.deed"))}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="tw-mt-10 md:tw-mt-12">
        <Cc0Licence locale={locale} />
      </div>
      <div className="tw-mt-10 md:tw-mt-12" data-cc0="artist">
        <h3 className={EX_TEXT.h3}>{ht(locale, "cc0.artistTitle")}</h3>
        <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 md:tw-grid-cols-3 md:tw-gap-4">
          {ARTIST.map((box) => (
            <li
              key={box.id}
              className="tw-flex tw-flex-col tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-py-4"
              data-cc0={box.id}
            >
              <span className={EX_TEXT.label}>{ht(locale, box.label)}</span>
              <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
                {box.id === "keep"
                  ? hrich(locale, box.body, {
                      own: (
                        <Fact
                          book={book}
                          id="memes.artistCopies"
                          locale={locale}
                        />
                      ),
                      choice: (
                        <Fact
                          book={book}
                          id="memes.artistChoice"
                          locale={locale}
                        />
                      ),
                    })
                  : withCc0(ht(locale, box.body))}
              </p>
              <span className="tw-mt-auto tw-pt-1">
                <Mark
                  kind={box.mark}
                  locale={locale}
                  size="sm"
                  {...(box.refText ? { refText: box.refText } : {})}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="tw-mt-8 tw-grid tw-grid-cols-1 tw-items-start tw-gap-6 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-gap-12">
        <LimitNote title={withCc0(ht(locale, "cc0.limitTitle"))}>
          {withCc0(ht(locale, "cc0.limit"))}{" "}
          <Link className={EX_LINK} href={MEME_ONE}>
            {ht(locale, "cc0.limitLink")}
          </Link>
        </LimitNote>
        <p className="tw-m-0 lg:tw-pt-4">
          <Link className={EX_BUTTON.cta} href="/network/tdh">
            {ht(locale, "cc0.holding")}
            <Icon kind="arrow" className="tw-size-4" />
          </Link>
        </p>
      </div>
    </section>
  );
}
