import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import Mark, { type MarkKind } from "../marks/Mark";
import Track, { type Maturity } from "../marks/Track";

/**
 * The ladder (EXPLAINED.md §4.4, §6.4): how far the evidence reaches. Rungs
 * by what they rule out, each with its marks in one line (standing,
 * maturity, evidence) and a blue line where today's evidence stops. One
 * track, or two side by side (the rule; a day).
 */
export type RungMark =
  | {
      readonly kind: MarkKind;
      readonly label?: string;
      readonly refText?: string;
    }
  | {
      readonly maturity: Maturity;
      readonly label?: string;
      readonly refText?: string;
    }
  | { readonly halfPair: { readonly a: boolean; readonly b: boolean } };

export interface Rung {
  readonly what: string;
  readonly detail?: ReactNode;
  /** At most three, in one line (§3 rule 2). */
  readonly marks: readonly RungMark[];
}

/** Proof A and proof B (§4.2): filled when proved, dashed when not. */
export function HalfPair({
  a,
  b,
  locale,
  test = false,
}: {
  readonly a: boolean;
  readonly b: boolean;
  readonly locale: SupportedLocale;
  /**
   * Proofs of a synthetic test cycle, not of a real day: the capsules are
   * outlined in green, not filled, and the word says so, so a skim never
   * reads a test pair as a day fully proved.
   */
  readonly test?: boolean;
}) {
  let word = kt(locale, "explained.kit.halfPair.none");
  if (a && b) word = kt(locale, "explained.kit.halfPair.both");
  else if (a || b) word = kt(locale, "explained.kit.halfPair.half");
  if (test) word = kt(locale, "explained.kit.halfPair.test", { word });
  const capsule = (letter: "A" | "B", done: boolean) => {
    const proof = kt(
      locale,
      letter === "A" ? "explained.kit.halfPair.a" : "explained.kit.halfPair.b"
    );
    let look =
      "tw-border-[1.5px] tw-border-dashed tw-border-iron-400 tw-text-iron-400";
    if (done) {
      look = test
        ? "tw-border-[1.5px] tw-border-solid tw-border-green tw-text-green"
        : "tw-bg-green tw-text-[#0D0D0F]";
    }
    return (
      <span
        className={`tw-inline-grid tw-size-6 tw-place-items-center tw-rounded-full tw-text-xs tw-font-bold tw-leading-none ${look}`}
        role="img"
        aria-label={kt(
          locale,
          done
            ? "explained.kit.halfPair.proved"
            : "explained.kit.halfPair.notProved",
          { proof }
        )}
        data-proof={letter}
        data-proved={done ? "1" : "0"}
      >
        <span aria-hidden="true">{letter}</span>
      </span>
    );
  };
  return (
    <span
      className="tw-inline-flex tw-items-center tw-gap-1.5"
      data-halfpair={`${a ? 1 : 0}${b ? 1 : 0}`}
      {...(test ? { "data-test-cycle": "" } : {})}
    >
      {capsule("A", a)}
      {capsule("B", b)}
      <span className="tw-ml-1.5 tw-text-[13px] tw-font-semibold tw-text-iron-50">
        {word}
      </span>
    </span>
  );
}

function RungMarks({
  marks,
  locale,
}: {
  readonly marks: readonly RungMark[];
  readonly locale: SupportedLocale;
}) {
  if (marks.length > 3) {
    throw new Error("A rung carries at most three marks.");
  }
  return (
    <span className="tw-flex tw-flex-col tw-gap-1.5 tw-pt-0.5">
      {marks.map((mark) => {
        if ("halfPair" in mark) {
          return (
            <HalfPair
              key="halfpair"
              a={mark.halfPair.a}
              b={mark.halfPair.b}
              locale={locale}
            />
          );
        }
        if ("maturity" in mark) {
          return (
            <Track
              key={`t-${mark.maturity}`}
              maturity={mark.maturity}
              locale={locale}
              size="sm"
              {...(mark.label ? { label: mark.label } : {})}
              {...(mark.refText ? { refText: mark.refText } : {})}
            />
          );
        }
        return (
          <Mark
            key={`m-${mark.kind}-${mark.label ?? ""}`}
            kind={mark.kind}
            locale={locale}
            size="sm"
            {...(mark.label ? { label: mark.label } : {})}
            {...(mark.refText ? { refText: mark.refText } : {})}
          />
        );
      })}
    </span>
  );
}

function Track1({
  rungs,
  todayAfter,
  locale,
  compact,
}: {
  readonly rungs: readonly Rung[];
  readonly todayAfter: number;
  readonly locale: SupportedLocale;
  readonly compact: boolean;
}) {
  return (
    <ol
      className="tw-m-0 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-p-0"
      data-ladder=""
    >
      {rungs.map((rung, index) => {
        const out = index >= todayAfter;
        return (
          <li
            key={rung.what}
            className="tw-relative"
            data-rung={index + 1}
            data-reached={out ? "0" : "1"}
          >
            {index === todayAfter && (
              <div
                className="tw-relative -tw-mt-px tw-border-0 tw-border-t-2 tw-border-solid tw-border-primary-400"
                data-ex-frame-ignore=""
              >
                <span className="tw-absolute -tw-top-3 tw-right-0 tw-bg-[#0D0D0F] tw-pl-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300">
                  {kt(
                    locale,
                    compact
                      ? "explained.kit.ladder.reaches"
                      : "explained.kit.ladder.today"
                  )}
                </span>
              </div>
            )}
            <div
              className={`tw-grid tw-grid-cols-[30px_minmax(0,1fr)] tw-gap-x-2.5 tw-gap-y-1.5 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-4 ${compact ? "md:tw-grid-cols-[30px_minmax(0,1fr)_190px] md:tw-gap-3.5" : "md:tw-grid-cols-[40px_minmax(0,1fr)_300px] md:tw-gap-[18px]"}`}
            >
              <span className="tw-pt-0.5 tw-text-[15px] tw-font-semibold tw-text-iron-400">
                {index + 1}
              </span>
              <span
                className={`tw-text-[17px] tw-font-semibold tw-leading-[25px] ${out ? "tw-text-iron-400" : "tw-text-iron-50"}`}
              >
                {rung.what}
                {rung.detail !== undefined && (
                  <span className="tw-mt-[3px] tw-block tw-text-[15px] tw-font-normal tw-leading-[23px] tw-text-iron-400">
                    {rung.detail}
                  </span>
                )}
              </span>
              <span className="tw-col-start-2 md:tw-col-start-3">
                <RungMarks marks={rung.marks} locale={locale} />
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function AssuranceLadder({
  tracks,
  locale,
}: {
  /** One ladder, or two side by side, each with the rung after which today's evidence stops. */
  readonly tracks: readonly {
    readonly title?: string;
    readonly rungs: readonly Rung[];
    readonly todayAfter: number;
  }[];
  readonly locale: SupportedLocale;
}) {
  const compact = tracks.length > 1;
  return (
    <div
      className={
        compact
          ? "tw-grid tw-grid-cols-1 tw-gap-10 lg:tw-grid-cols-2 lg:tw-gap-6"
          : ""
      }
    >
      {tracks.map((track) => (
        <div key={track.title ?? "ladder"}>
          {track.title && (
            <h3 className="tw-m-0 tw-mb-3 tw-text-[21px] tw-font-semibold tw-leading-7 tw-text-iron-50">
              {track.title}
            </h3>
          )}
          <Track1
            rungs={track.rungs}
            todayAfter={track.todayAfter}
            locale={locale}
            compact={compact}
          />
        </div>
      ))}
    </div>
  );
}
