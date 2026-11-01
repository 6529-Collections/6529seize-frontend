import Link from "next/link";
import type { ReactNode } from "react";
import { DefinitionChip } from "@/components/explained/evidence/notes";
import FactValue from "@/components/explained/facts/FactValue";
import Hash from "@/components/explained/marks/Hash";
import { EX_LAYOUT, EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { factText, type Fact, type FactBook } from "@/lib/explained/facts";
import { formatUtcDay } from "@/lib/explained/format";
import { dateOfCycle } from "@/lib/explained/registry/helpers";
import { pt, type DayKey } from "../components/copy";
import { FactText } from "@/components/explained/facts/FactText";
import { rich } from "@/components/explained/rich";
import type { DayView } from "../components/dayModel";

/**
 * A receipt's side and foot (TDH-DESIGN.md §4.5): the day at a glance, the
 * two right totals, the note for anyone writing their own TDH, and the
 * builds that computed the day.
 */
const PANEL =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-6 max-[359px]:tw-p-4";
const MONO =
  "tw-font-mono tw-text-[13px] tw-normal-case tw-text-iron-50 md:tw-text-sm";

function Glance({
  day,
  cycle,
  locale,
}: {
  readonly day: DayView;
  readonly cycle: number;
  readonly locale: SupportedLocale;
}) {
  const delta = day.fact("delta");
  const rows: readonly (readonly [DayKey, ReactNode])[] = [
    [
      "explained.tdh.day.glance.identities",
      <FactValue key="i" fact={day.fact("identities")} locale={locale} />,
    ],
    [
      "explained.tdh.day.glance.wallets",
      <FactValue key="w" fact={day.fact("wallets")} locale={locale} />,
    ],
    [
      "explained.tdh.day.glance.rust",
      rich(locale, "explained.tdh.day.glance.rustRun", {
        runtime: (
          <FactValue fact={day.fact("builds.rust.runtime")} locale={locale} />
        ),
      }),
    ],
    [
      "explained.tdh.day.glance.python",
      rich(locale, "explained.tdh.day.glance.pythonRun", {
        runtime: (
          <FactValue fact={day.fact("builds.python.runtime")} locale={locale} />
        ),
      }),
    ],
  ];
  return (
    <section className={PANEL} aria-labelledby="day-glance">
      <h2 className={`${EX_TEXT.label} tw-m-0`} id="day-glance">
        {pt(locale, "explained.tdh.day.glance.label")}
      </h2>
      <span
        className={`${EX_TEXT.numL} tw-mt-2.5 tw-block max-[359px]:tw-text-2xl max-[359px]:tw-leading-8`}
      >
        <FactValue fact={day.fact("total")} locale={locale} />
      </span>
      <span className={`${EX_TEXT.cap} tw-block`}>
        {delta === null
          ? pt(locale, "explained.tdh.day.glance.total")
          : rich(locale, "explained.tdh.day.glance.delta", {
              delta: <FactValue fact={delta} locale={locale} />,
              date: (
                <FactText fact={delta} locale={locale}>
                  {formatUtcDay(locale, dateOfCycle(cycle - 1))}
                </FactText>
              ),
            })}
      </span>
      <dl className="tw-m-0 tw-mt-4 tw-grid tw-grid-cols-[max-content_minmax(0,1fr)] tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-text-[15px] tw-leading-6 max-[359px]:tw-grid-cols-1">
        {rows.map(([key, node]) => (
          <div key={key} className="tw-contents">
            <dt className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3 tw-pr-7 tw-text-iron-400 max-[359px]:tw-border-b-0 max-[359px]:tw-pb-0">
              {pt(locale, key)}
            </dt>
            <dd className="tw-m-0 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3 tw-text-iron-50 max-[359px]:tw-pt-0.5">
              {node}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TwoTotals({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const proofCycle = book.maybe<number>("site.proofA.cycle");
  return (
    <DefinitionChip title={pt(locale, "explained.tdh.day.totals.label")}>
      {rich(locale, "explained.tdh.day.totals.body", {
        date: (
          <FactText fact={proofCycle} locale={locale}>
            {proofCycle === null
              ? ""
              : formatUtcDay(locale, dateOfCycle(proofCycle.value))}
          </FactText>
        ),
        withBurn: (
          <FactValue
            fact={book.maybe("site.proofA.totalWithBurn")}
            locale={locale}
          />
        ),
        withoutBurn: (
          <FactValue
            fact={book.maybe("site.proofA.totalWithoutBurn")}
            locale={locale}
          />
        ),
      })}
    </DefinitionChip>
  );
}

/** Where 6529.io's signed uploads live: one Arweave transaction each. */
const ARWEAVE = "https://arweave.net/";

/** A link to one of 6529.io's uploads of the day, by its Arweave id. */
export function UploadLink({
  day,
  field,
  label,
}: {
  readonly day: DayView;
  readonly field: "liveUpload" | "liveWalletUpload";
  readonly label: string;
}) {
  const id = day.text(field);
  if (id === null) {
    return <>{label}</>;
  }
  return (
    <a
      className={EX_LINK}
      href={`${ARWEAVE}${id}`}
      target="_blank"
      rel="noopener noreferrer"
      data-fact={day.id(field)}
    >
      {label}
    </a>
  );
}

function OwnTdh({
  day,
  locale,
}: {
  readonly day: DayView;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-l-[3px] tw-border-solid tw-border-iron-700 tw-border-l-primary-400 tw-bg-primary-400/[0.04] tw-px-5 tw-py-[18px]">
      <span
        className={`${EX_TEXT.label} tw-mb-1.5 tw-block tw-text-primary-300`}
      >
        {pt(locale, "explained.tdh.day.own.label")}
      </span>
      <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {rich(locale, "explained.tdh.day.own.body", {
          spec: (
            <Link className={EX_LINK} href="/network/tdh/specification#s9">
              {pt(locale, "explained.tdh.day.own.spec")}
            </Link>
          ),
          pin: (
            <Link className={EX_LINK} href="/network/tdh/implementations#roots">
              {pt(locale, "explained.tdh.day.own.pin")}
            </Link>
          ),
          identities: (
            <UploadLink
              day={day}
              field="liveUpload"
              label={pt(locale, "explained.tdh.day.own.identities")}
            />
          ),
          wallets: (
            <UploadLink
              day={day}
              field="liveWalletUpload"
              label={pt(locale, "explained.tdh.day.own.wallets")}
            />
          ),
        })}
      </p>
    </div>
  );
}

export function DaySide({
  day,
  book,
  cycle,
  locale,
}: {
  readonly day: DayView;
  readonly book: FactBook;
  readonly cycle: number;
  readonly locale: SupportedLocale;
}) {
  return (
    // On a phone the side's parts join the page's single column, and the
    // day at a glance, the headline, comes before the receipt.
    <aside className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-content-start tw-gap-4 max-lg:tw-contents">
      <div className="max-lg:tw-order-first">
        <Glance day={day} cycle={cycle} locale={locale} />
      </div>
      <TwoTotals book={book} locale={locale} />
      <OwnTdh day={day} locale={locale} />
    </aside>
  );
}

interface BuildRow {
  readonly program: DayKey;
  readonly commit: ReactNode;
  readonly binaryLabel: DayKey;
  readonly binary: ReactNode;
  readonly run: ReactNode;
}

function hashCell(fact: Fact | null, locale: SupportedLocale): ReactNode {
  return fact === null ? (
    <FactValue fact={null} locale={locale} />
  ) : (
    <Hash value={factText(fact)} locale={locale} />
  );
}

function buildRows(day: DayView, locale: SupportedLocale): BuildRow[] {
  const none = pt(locale, "explained.tdh.day.builds.none");
  return [
    {
      program: "explained.tdh.day.builds.rust",
      commit: (
        <FactValue
          fact={day.fact("builds.rust.commit")}
          locale={locale}
          className={MONO}
        />
      ),
      binaryLabel: "explained.tdh.day.builds.binaryShort",
      binary: hashCell(day.fact("builds.rust.binary"), locale),
      run: <FactValue fact={day.fact("builds.rust.runtime")} locale={locale} />,
    },
    {
      program: "explained.tdh.day.builds.python",
      commit: (
        <FactValue
          fact={day.fact("builds.python.commit")}
          locale={locale}
          className={MONO}
        />
      ),
      binaryLabel: "explained.tdh.day.builds.source",
      binary: pt(locale, "explained.tdh.day.builds.pythonSource"),
      run: (
        <FactValue fact={day.fact("builds.python.runtime")} locale={locale} />
      ),
    },
    {
      program: "explained.tdh.day.builds.live",
      commit: pt(locale, "explained.tdh.day.builds.liveCommit"),
      binaryLabel: "explained.tdh.day.builds.upload",
      binary: rich(locale, "explained.tdh.day.builds.liveUpload", {
        hash: hashCell(day.fact("liveSha"), locale),
        link: (
          <UploadLink
            day={day}
            field="liveUpload"
            label={pt(locale, "explained.tdh.day.builds.liveOpen")}
          />
        ),
      }),
      run: none,
    },
  ];
}

const TH =
  "tw-border-0 tw-border-b tw-border-solid tw-border-iron-700 tw-py-2.5 tw-pr-3.5 tw-text-left tw-align-bottom tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400 last:tw-pr-0";
const TD =
  "tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3.5 tw-pr-3.5 tw-align-top tw-text-iron-300 last:tw-pr-0";

export function Builds({
  day,
  locale,
}: {
  readonly day: DayView;
  readonly locale: SupportedLocale;
}) {
  const rows = buildRows(day, locale);
  const head = (key: DayKey) => pt(locale, key);
  return (
    <section
      className={`${EX_LAYOUT.sectionTight} ${EX_LAYOUT.ed}`}
      aria-labelledby="day-builds"
    >
      <h2 className={`${EX_TEXT.label} tw-m-0 lg:tw-pt-2.5`} id="day-builds">
        {pt(locale, "explained.tdh.day.builds.label")}
      </h2>
      <div className={EX_LAYOUT.edWide}>
        <table
          className="tw-hidden tw-w-full tw-border-collapse tw-text-base tw-leading-6 md:tw-table"
          aria-label={pt(locale, "explained.tdh.day.builds.caption")}
        >
          <thead>
            <tr>
              <th className={TH}>{head("explained.tdh.day.builds.program")}</th>
              <th className={TH}>{head("explained.tdh.day.builds.commit")}</th>
              <th className={TH}>{head("explained.tdh.day.builds.binary")}</th>
              <th className={`${TH} tw-text-right`}>
                {head("explained.tdh.day.builds.run")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.program}>
                <td className={`${TD} tw-font-semibold tw-text-iron-50`}>
                  {head(row.program)}
                </td>
                <td className={TD}>{row.commit}</td>
                <td className={TD}>{row.binary}</td>
                <td className={`${TD} tw-whitespace-nowrap tw-text-right`}>
                  {row.run}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="tw-m-0 tw-list-none tw-p-0 md:tw-hidden">
          {rows.map((row) => (
            <li
              key={row.program}
              className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3"
            >
              <b className="tw-block tw-pb-1.5 tw-font-semibold tw-text-iron-50">
                {head(row.program)}
              </b>
              <dl className="tw-m-0 tw-grid tw-gap-2 tw-text-[15px] tw-leading-6">
                {(
                  [
                    ["explained.tdh.day.builds.commit", row.commit],
                    [row.binaryLabel, row.binary],
                    ["explained.tdh.day.builds.run", row.run],
                  ] as const
                ).map(([key, node]) => (
                  <div key={key}>
                    <dt className={EX_TEXT.label}>{head(key)}</dt>
                    <dd className="tw-m-0 tw-text-iron-300">{node}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
        <p className={`${EX_TEXT.cap} tw-m-0 tw-mt-3`}>
          {pt(locale, "explained.tdh.day.builds.note")}
        </p>
      </div>
    </section>
  );
}
