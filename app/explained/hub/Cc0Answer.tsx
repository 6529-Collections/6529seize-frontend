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
import { ht } from "./copy";

/**
 * CC0, in one minute (MAP.md §3; TDH-DESIGN.md §7): three real CC0 cards,
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
    place: "tw-left-0 tw-top-6 tw-rotate-[-5deg]",
  },
  { art: MEME_ART[2], place: "tw-left-[30%] tw-top-0 tw-z-[2]" },
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

export default function Cc0Answer({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section id="cc0" className={EX_LAYOUT.section}>
      <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-5 lg:tw-grid-cols-[500px_minmax(0,1fr)] lg:tw-gap-16">
        <div
          className="tw-relative tw-aspect-[350/300] tw-w-full lg:tw-sticky lg:tw-top-24 lg:tw-mt-2 lg:tw-aspect-[500/400] lg:tw-self-start"
          // The three cards overlap as a fan by design.
          data-tdh-check-ignore="card-gap"
          role="group"
          aria-label={ht(locale, "cc0.fanLabel")}
        >
          {FAN.map(({ art, place }) => (
            <div key={art.id} className={`tw-absolute tw-w-[38%] ${place}`}>
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
        <div className="tw-max-w-[600px]">
          <span className={EX_TEXT.label}>{ht(locale, "cc0.label")}</span>
          <h2 className={`${EX_TEXT.stmt} tw-mt-3`}>
            {ht(locale, "cc0.title")}
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
          <p className={`${EX_TEXT.body} tw-m-0 tw-mb-[18px] tw-mt-4`}>
            {ht(locale, "cc0.body")}
          </p>
          <p className={`${EX_TEXT.body} tw-m-0`} data-cc0="keep">
            {ht(locale, "cc0.keep")}
          </p>
          <div className="tw-mt-8">
            <LimitNote title={ht(locale, "cc0.limitTitle")}>
              {ht(locale, "cc0.limit")}{" "}
              <Link className={EX_LINK} href={MEME_ONE}>
                {ht(locale, "cc0.limitLink")}
              </Link>
            </LimitNote>
          </div>
          {/* One action, then the references as one row of links. */}
          <p className="tw-m-0 tw-mt-6 md:tw-mt-[30px]">
            <Link className={EX_BUTTON.cta} href="/network/tdh">
              {ht(locale, "cc0.holding")}
              <Icon kind="arrow" className="tw-size-4" />
            </Link>
          </p>
          <p className="tw-m-0 tw-mt-4 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-5 tw-gap-y-2 tw-text-[15px] tw-leading-6">
            <a
              className={EX_LINK}
              href={DOWNLOAD.original}
              target="_blank"
              rel="noreferrer"
            >
              {ht(locale, "cc0.download", { id: DOWNLOAD.id })}
            </a>
            <Link className={EX_LINK} href="/about/license">
              {ht(locale, "cc0.chapter")}
            </Link>
            <a
              className={EX_LINK}
              href={CC0_DEED}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ht(locale, "cc0.deed")}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
