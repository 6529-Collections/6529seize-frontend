import Link from "next/link";
import FactValue from "@/components/explained/facts/FactValue";
import AsOf from "@/components/explained/marks/AsOf";
import { EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { formatCount, formatUtcDay } from "@/lib/explained/format";
import type { DaySummary } from "@/lib/explained/registry/feedFacts";
import { FactText } from "@/components/explained/facts/FactText";
import {
  GoLink,
  Para,
  Section,
  Statement,
  StatementLabel,
} from "@/components/explained/layout/rows";
import { rich } from "@/components/explained/rich";
import { ht } from "./copy";
import TotalsLens from "./TotalsLens";

/** The stat row's numbers on the narrowest screens, so ten digits fit. */
const NUM_NARROW = "max-[379px]:tw-text-[24px] max-[379px]:tw-leading-8";

/**
 * Then, the network (steps 13 and 14): every identity's TDH added up, from
 * the latest result of the daily comparison, and the cutover (D132). Every
 * number is a fact of the feed; when the feed cannot be read, the section
 * says so instead of printing a number.
 */
export default function NetworkSection({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const total = book.maybe<number>("tdh.latest.total");
  const identities = book.maybe<number>("tdh.latest.identities");
  const wallets = book.maybe<number>("tdh.latest.wallets");
  const date = book.maybe<string>("tdh.latest.date");
  const cycle = book.maybe<number>("tdh.latest.cycle");
  const delta = book.maybe<number>("tdh.latest.delta");
  const days = book.maybe<DaySummary[]>("tdh.days");
  const written = book.maybe<string>("feed.writtenAt");
  const fileUrl = book.maybe<string>("tdh.latest.file.url");
  const cutover = book.maybe<string>("tdh.cutover.about");
  const cutoverChecked = book.maybe<string>("tdh.cutover.checkedAt");
  const v = (fact: Parameters<typeof FactValue>[0]["fact"]) => (
    <FactValue fact={fact} locale={locale} />
  );

  const previous =
    cycle && days ? days.value.find((d) => d.cycle === cycle.value - 1) : null;
  const deltaPlain =
    delta === null ? null : (
      <FactText fact={delta} locale={locale}>
        {formatCount(locale, Math.abs(delta.value))}
      </FactText>
    );
  let bodyKey:
    | "explained.tdh.how.n.bodyMore"
    | "explained.tdh.how.n.bodyLess"
    | "explained.tdh.how.n.bodyTotal" = "explained.tdh.how.n.bodyTotal";
  if (delta !== null && delta.value > 0)
    bodyKey = "explained.tdh.how.n.bodyMore";
  if (delta !== null && delta.value < 0)
    bodyKey = "explained.tdh.how.n.bodyLess";
  const cutoverPast =
    cutover !== null &&
    Date.parse(cutover.value) < Date.parse(book.snapshot().asOf);
  const fileName = fileUrl?.value.split("/").slice(-2).join("/") ?? null;

  return (
    <Section id="part-n">
      <span id="step-13" />
      <span id="step-14" />
      <Statement
        label={
          <StatementLabel mark={ht(locale, "explained.tdh.how.n.kicker")}>
            {ht(locale, "explained.tdh.how.n.label")}
          </StatementLabel>
        }
        title={rich(locale, "explained.tdh.how.n.title", {
          identities: v(identities),
        })}
      >
        {total === null ? (
          <Para>{ht(locale, "explained.tdh.how.n.unavailable")}</Para>
        ) : (
          <Para>
            {rich(locale, bodyKey, {
              total: v(total),
              date: v(date),
              delta: deltaPlain,
            })}{" "}
            {cutover !== null &&
              rich(
                locale,
                cutoverPast
                  ? "explained.tdh.how.n.cutoverPast"
                  : "explained.tdh.how.n.cutover",
                { date: v(cutover), checked: v(cutoverChecked) }
              )}
          </Para>
        )}
        <p className="tw-m-0">
          <GoLink href="/network/tdh/verification">
            {ht(locale, "explained.tdh.how.n.link")}
          </GoLink>
        </p>
      </Statement>
      {total !== null && (
        <figure className="tw-m-0 tw-mt-12">
          <div className="tw-grid tw-grid-cols-2 tw-gap-x-3 tw-gap-y-[18px] lg:tw-grid-cols-[minmax(0,1.45fr)_repeat(3,minmax(0,1fr))] lg:tw-gap-4">
            <div className="tw-col-span-2 lg:tw-col-span-1">
              <span className={`tw-block ${EX_TEXT.numL} ${NUM_NARROW}`}>
                {v(total)}
              </span>
              <span className={`tw-mt-1 tw-block ${EX_TEXT.cap}`}>
                {rich(locale, "explained.tdh.how.n.statTotal", {
                  cycle: v(cycle),
                })}
              </span>
            </div>
            <div>
              <span className={`tw-block ${EX_TEXT.numL} ${NUM_NARROW}`}>
                {v(identities)}
              </span>
              <span className={`tw-mt-1 tw-block ${EX_TEXT.cap}`}>
                {ht(locale, "explained.tdh.how.n.statIdentities")}
              </span>
            </div>
            <div>
              <span className={`tw-block ${EX_TEXT.numL} ${NUM_NARROW}`}>
                {v(wallets)}
              </span>
              <span className={`tw-mt-1 tw-block ${EX_TEXT.cap}`}>
                {ht(locale, "explained.tdh.how.n.statWallets")}
              </span>
            </div>
            <div className="tw-col-span-2 lg:tw-col-span-1">
              <span className={`tw-block ${EX_TEXT.numL} ${NUM_NARROW}`}>
                {v(delta)}
              </span>
              {previous && days && (
                <span className={`tw-mt-1 tw-block ${EX_TEXT.cap}`}>
                  {rich(locale, "explained.tdh.how.n.statDelta", {
                    date: (
                      <FactText fact={days} locale={locale}>
                        {formatUtcDay(locale, previous.date)}
                      </FactText>
                    ),
                  })}
                </span>
              )}
            </div>
          </div>
          <figcaption
            className={`tw-mt-3.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3.5 tw-gap-y-1 ${EX_TEXT.meta}`}
          >
            <span>
              {ht(locale, "explained.tdh.how.n.source")}{" "}
              <b className="tw-font-semibold tw-text-iron-300">
                {ht(locale, "explained.tdh.how.n.sourceName")}
              </b>
              {fileName !== null && fileUrl !== null && (
                <>
                  {", "}
                  <FactText fact={fileUrl} locale={locale}>
                    {fileName}
                  </FactText>
                </>
              )}
            </span>
            {written !== null && (
              <FactText
                fact={written}
                locale={locale}
                className="before:tw-mr-3.5 before:tw-content-['·']"
              >
                <AsOf fact={written} locale={locale} />
              </FactText>
            )}
            {cycle !== null && (
              <Link
                className={`${EX_LINK} tw-font-semibold before:tw-mr-3.5 before:tw-text-iron-400 before:tw-content-['·']`}
                href={`/network/tdh/verification/${cycle.value}`}
              >
                {ht(locale, "explained.tdh.how.n.receipt")}
              </Link>
            )}
          </figcaption>
        </figure>
      )}
      <div className="tw-mt-16">
        <TotalsLens locale={locale} />
      </div>
    </Section>
  );
}
