import type { ReactNode } from "react";
import BrowserHash from "@/components/explained/evidence/BrowserHash";
import {
  ReceiptNote,
  type ReceiptRowData,
  type ReceiptRowId,
} from "@/components/explained/evidence/Receipt";
import FactValue from "@/components/explained/facts/FactValue";
import { kt, type KitKey } from "@/components/explained/i18n";
import DriftNote from "@/components/explained/marks/DriftNote";
import Hash from "@/components/explained/marks/Hash";
import Mark, { type MarkKind } from "@/components/explained/marks/Mark";
import type { SupportedLocale } from "@/i18n/locales";
import {
  fmt,
  type Fact,
  type FactBook,
  type FactId,
} from "@/lib/explained/facts";
import { formatCount, formatUtcClock } from "@/lib/explained/format";
import { pt } from "../components/copy";
import { FactText } from "@/components/explained/facts/FactText";
import { rich } from "@/components/explained/rich";
import {
  checkState,
  snapshotInstant,
  type CheckState,
  type DayView,
} from "../components/dayModel";

/**
 * A day's receipt, row by row (TDH-DESIGN.md §4.5), in the kit's fixed
 * order. Every value is a fact of the day's own file; each row also has a
 * plain-text form, with hashes in full, for "Copy the receipt as text".
 */
interface Row extends ReceiptRowData {
  readonly text: string;
}

/**
 * P26's vector that pins the registry hash: case 0 of
 * `design/tdh-reference/vectors/28-registry-hash.json` is the tdh-v1.4
 * registry. A vector's number is its name, not a quantity.
 */
const REGISTRY_VECTOR = "28";

const QUIET = "tw-text-[15px] tw-font-normal tw-text-iron-400";
const MONO = "tw-font-mono tw-text-sm tw-normal-case tw-text-iron-50";

const MARK_OF: Record<CheckState, MarkKind> = {
  equal: "tested",
  knownCause: "tested",
  liveDiffers: "shownFalse",
  programsDiffer: "shownFalse",
  notCompared: "notGuaranteed",
  unknown: "notGuaranteed",
};

const WORD_OF: Record<CheckState, KitKey | null> = {
  equal: "explained.kit.verdict.equal",
  knownCause: "explained.kit.verdict.knownCause",
  liveDiffers: "explained.kit.verdict.differs",
  programsDiffer: "explained.kit.verdict.differs",
  notCompared: null,
  unknown: null,
};

interface Ctx {
  readonly day: DayView;
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}

function quiet(children: ReactNode): ReactNode {
  return <span className={QUIET}>{children}</span>;
}

function value(ctx: Ctx, field: Parameters<DayView["fact"]>[0]): ReactNode {
  return <FactValue fact={ctx.day.fact(field)} locale={ctx.locale} />;
}

function plain(
  fact: Fact | null,
  locale: SupportedLocale,
  long = false
): string {
  if (fact === null) {
    return kt(locale, "explained.kit.facts.unavailable");
  }
  return fmt(fact, locale, long ? "long" : "short");
}

/** A hash with its copy button, or "not available". */
function hashOf(
  ctx: Ctx,
  field: Parameters<DayView["fact"]>[0],
  options: { readonly copy?: string; readonly stripes?: boolean } = {}
): ReactNode {
  const hex = ctx.day.text(field);
  if (hex === null) {
    return <FactValue fact={null} locale={ctx.locale} />;
  }
  return (
    <Hash
      value={hex}
      locale={ctx.locale}
      copy={options.copy !== undefined}
      stripes={options.stripes ?? false}
      {...(options.copy === undefined ? {} : { name: options.copy })}
    />
  );
}

function verdictRow(ctx: Ctx): Row {
  const { day, locale } = ctx;
  const state = checkState(day);
  const word = WORD_OF[state];
  const ownWord =
    state === "notCompared"
      ? "explained.tdh.check.verdict.notComparedWord"
      : "explained.tdh.check.verdict.unknownWord";
  const label = word === null ? pt(locale, ownWord) : kt(locale, word);
  const of = (pair: "identities" | "wallets") =>
    rich(locale, "explained.tdh.day.row.of", {
      equal: value(ctx, `agree.live.${pair}.equal`),
      total: value(ctx, `agree.live.${pair}.total`),
    });
  const ofText = (pair: "identities" | "wallets") =>
    pt(locale, "explained.tdh.day.row.of", {
      equal: plain(day.fact(`agree.live.${pair}.equal`), locale),
      total: plain(day.fact(`agree.live.${pair}.total`), locale),
    });
  const counts =
    state === "notCompared"
      ? pt(locale, "explained.tdh.day.row.notCompared")
      : pt(locale, "explained.tdh.day.row.counts", {
          identities: ofText("identities"),
          wallets: ofText("wallets"),
        });
  return {
    id: "verdict",
    value: (
      <>
        <Mark kind={MARK_OF[state]} label={label} locale={locale} />
        {quiet(
          state === "notCompared"
            ? counts
            : rich(locale, "explained.tdh.day.row.counts", {
                identities: of("identities"),
                wallets: of("wallets"),
              })
        )}
      </>
    ),
    text: `${label}, ${counts}`,
  };
}

function totalRow(ctx: Ctx): Row {
  const { day, locale } = ctx;
  const total = day.num("total");
  const agree =
    total !== null &&
    total === day.num("total.python") &&
    total === day.num("total.live");
  const note = agree
    ? pt(locale, "explained.tdh.day.row.totalAgree")
    : pt(locale, "explained.tdh.day.row.totalSplit", {
        python: plain(day.fact("total.python"), locale),
        live: plain(day.fact("total.live"), locale),
      });
  return {
    id: "total",
    value: (
      <>
        {value(ctx, "total")}
        {quiet(
          agree
            ? note
            : rich(locale, "explained.tdh.day.row.totalSplit", {
                python: value(ctx, "total.python"),
                live: value(ctx, "total.live"),
              })
        )}
      </>
    ),
    text: `${plain(day.fact("total"), locale)} (${note})`,
  };
}

function differencesRow(ctx: Ctx): Row {
  const { day, locale } = ctx;
  const identities = day.num("differences.identities") ?? 0;
  const wallets = day.num("differences.wallets") ?? 0;
  if (identities + wallets === 0) {
    const none = pt(locale, "explained.tdh.day.row.differencesNone");
    return { id: "differences", value: none, text: none };
  }
  return {
    id: "differences",
    value: (
      <span>
        {rich(locale, "explained.tdh.day.row.differences", {
          identities: value(ctx, "differences.identities"),
          wallets: value(ctx, "differences.wallets"),
        })}
      </span>
    ),
    text: pt(locale, "explained.tdh.day.row.differences", {
      identities: formatCount(locale, identities),
      wallets: formatCount(locale, wallets),
    }),
  };
}

function historyRow(ctx: Ctx): Row {
  const { day, locale } = ctx;
  if (day.text("mode") === "checked") {
    const checked = pt(locale, "explained.tdh.day.row.historyChecked");
    return {
      id: "history",
      value: <Mark kind="tested" label={checked} locale={locale} />,
      text: checked,
    };
  }
  const notYet = pt(locale, "explained.tdh.day.row.historyNotYet");
  const note = pt(locale, "explained.tdh.day.row.historyNote");
  return {
    id: "history",
    value: (
      <>
        <Mark kind="notYet" label={notYet} locale={locale} />
        {quiet(pt(locale, "explained.tdh.day.row.historyNote"))}
      </>
    ),
    text: `${notYet}: ${note}`,
  };
}

/** Whether the file's rule version, rule ID and registry are all P26's. */
function underCurrentRules(ctx: Ctx): boolean {
  const { day, book } = ctx;
  const same = (field: "ruleVersion" | "ruleId" | "registry", id: FactId) => {
    const reported = day.text(field);
    return reported !== null && reported === book.maybe(id)?.value;
  };
  return (
    same("ruleVersion", "rules.version") &&
    same("ruleId", "rules.ruleId") &&
    same("registry", "rules.registry")
  );
}

function ruleVersionNote(ctx: Ctx): ReactNode {
  const { day, book, locale } = ctx;
  const reported = day.text("ruleVersion");
  const current = book.maybe("rules.version");
  if (reported !== null && current !== null && reported !== current.value) {
    return (
      <DriftNote by={["D136", "D137"]} locale={locale} inline>
        {rich(locale, "explained.tdh.day.row.drift", {
          version: (
            <FactValue fact={current} locale={locale} className={MONO} />
          ),
          ruleId: (
            <FactValue fact={book.maybe("rules.ruleId")} locale={locale} />
          ),
        })}
        {checkState(day) === "equal" &&
          ` ${pt(locale, "explained.tdh.day.row.driftEqual")}`}
      </DriftNote>
    );
  }
  return underCurrentRules(ctx) ? (
    <ReceiptNote>{pt(locale, "explained.tdh.day.row.current")}</ReceiptNote>
  ) : null;
}

function ruleVersionRow(ctx: Ctx): Row {
  const { day, locale } = ctx;
  const reported = day.text("ruleVersion");
  const asReported = kt(locale, "explained.kit.receipt.asReported");
  const note = ruleVersionNote(ctx);
  return {
    id: "ruleVersion",
    value: (
      <>
        <FactValue
          fact={day.fact("ruleVersion")}
          locale={locale}
          className={MONO}
        />
        {quiet(asReported)}
      </>
    ),
    ...(note === null ? {} : { note }),
    text: `${reported ?? plain(null, locale)} (${asReported})`,
  };
}

function ruleIdRow(ctx: Ctx): Row {
  const { day, locale } = ctx;
  const reported = day.text("ruleId");
  return {
    id: "ruleId",
    value: hashOf(ctx, "ruleId", {
      copy: kt(locale, "explained.kit.receipt.ruleId"),
    }),
    text: reported ?? plain(null, locale),
  };
}

function registryRow(ctx: Ctx): Row {
  const { day, book, locale } = ctx;
  const reported = day.text("registry");
  const pinned =
    reported !== null && reported === book.maybe("rules.registry")?.value;
  return {
    id: "registry",
    value: (
      <>
        {hashOf(ctx, "registry", {
          copy: kt(locale, "explained.kit.receipt.registry"),
        })}
        {pinned &&
          quiet(
            rich(locale, "explained.tdh.day.row.vector", {
              name: <span data-ex-allow-number="">{REGISTRY_VECTOR}</span>,
            })
          )}
      </>
    ),
    text: reported ?? plain(null, locale),
  };
}

function rootRow(
  ctx: Ctx,
  id: "cycleRoot" | "walletRoot" | "historyRoot",
  field: "roots.cycle" | "roots.wallet" | "roots.history"
): Row {
  const { day, locale } = ctx;
  const root = day.text(field);
  const label = kt(locale, `explained.kit.receipt.${id}`);
  return {
    id,
    value: hashOf(ctx, field, { copy: label, stripes: id === "cycleRoot" }),
    ...(id === "cycleRoot" && root !== null
      ? {
          note: (
            <ReceiptNote>
              {rich(
                locale,
                underCurrentRules(ctx)
                  ? "explained.tdh.day.row.cycleRootNote"
                  : "explained.tdh.day.row.cycleRootRetired",
                {
                  size: (
                    <FactText fact={day.fact(field)} locale={locale}>
                      {formatCount(locale, root.replace(/^0x/, "").length / 2)}
                    </FactText>
                  ),
                  version: (
                    <FactValue
                      fact={day.fact("ruleVersion")}
                      locale={locale}
                      className={MONO}
                    />
                  ),
                }
              )}
            </ReceiptNote>
          ),
        }
      : {}),
    text: root ?? plain(null, locale),
  };
}

function recordsRow(ctx: Ctx): Row {
  const { day, locale } = ctx;
  const rust = day.text("recordsSha");
  const python = day.text("recordsSha.python");
  const same = rust !== null && rust === python;
  const note = same
    ? pt(locale, "explained.tdh.day.row.recordsSame")
    : pt(locale, "explained.tdh.day.row.recordsDiffer", {
        hash: python ?? plain(null, locale),
      });
  return {
    id: "records",
    value: (
      <>
        {hashOf(ctx, "recordsSha", { stripes: true })}
        {quiet(
          same
            ? note
            : rich(locale, "explained.tdh.day.row.recordsDiffer", {
                hash: hashOf(ctx, "recordsSha.python", { stripes: true }),
              })
        )}
      </>
    ),
    text: `${rust ?? plain(null, locale)} (${note})`,
  };
}

function fileRow(ctx: Ctx, text: string | null): Row {
  const { day, locale } = ctx;
  const stated = day.text("file.sha256");
  const url = day.text("file.url");
  const name = url === null ? "" : url.split("/").slice(-2).join("/");
  // The browser hashes the file's bytes as this page's server read them; a
  // file not read as text is fetched again from the feed.
  let bytes: { readonly text: string } | { readonly src: string } | null = null;
  if (text !== null) {
    bytes = { text };
  } else if (url !== null) {
    bytes = { src: url };
  }
  return {
    id: "file",
    value:
      stated === null || bytes === null ? (
        <FactValue fact={null} locale={locale} />
      ) : (
        // The byte count is the browser's own measure of the file, not a fact.
        <span className="tw-w-full" data-ex-allow-number="">
          <BrowserHash expected={stated} locale={locale} {...bytes} />
        </span>
      ),
    note: (
      <ReceiptNote>
        {rich(locale, writtenLate(day) ? "explained.tdh.day.row.fileNoteLate" : "explained.tdh.day.row.fileNote", {
          file: (
            <FactText fact={day.fact("file.url")} locale={locale}>
              {name}
            </FactText>
          ),
          written: (
            <FactValue
              fact={day.fact("writtenAt")}
              locale={locale}
              style="long"
            />
          ),
          hash: <FactValue fact={day.fact("file.sha256")} locale={locale} />,
        })}
      </ReceiptNote>
    ),
    text: `${name}: SHA-256 ${stated ?? plain(null, locale)}`,
  };
}

/**
 * Written late or re-run: more than 2 h 40 min after its day began, as the
 * daily check's ribbon marks it (↻).
 */
const LATE_AFTER_MS = (2 * 60 + 40) * 60_000;

function writtenLate(day: DayView): boolean {
  const written = day.text("writtenAt");
  const date = day.text("date");
  if (written === null || date === null) return false;
  return Date.parse(written) - Date.parse(`${date}T00:00:00Z`) > LATE_AFTER_MS;
}

/** Every row of a day's receipt, in its fixed order. */
export function receiptRows(
  day: DayView,
  book: FactBook,
  locale: SupportedLocale,
  fileText: string | null
): Row[] {
  const ctx: Ctx = { day, book, locale };
  const date = day.text("date");
  const midnight =
    date === null ? "" : formatUtcClock(locale, snapshotInstant(date));
  const snapshotNote = pt(locale, "explained.tdh.day.row.snapshot", {
    midnight,
  });
  return [
    {
      id: "result",
      value: (
        <span>
          {rich(locale, "explained.tdh.day.row.result", {
            date: (
              <FactValue fact={day.fact("date")} locale={locale} style="long" />
            ),
            cycle: value(ctx, "cycle"),
          })}
        </span>
      ),
      text: pt(locale, "explained.tdh.day.row.result", {
        date: plain(day.fact("date"), locale, true),
        cycle: plain(day.fact("cycle"), locale),
      }),
    },
    {
      id: "snapshot",
      value: (
        <>
          {value(ctx, "cutoff")}
          {quiet(
            rich(locale, "explained.tdh.day.row.snapshot", {
              midnight: (
                <FactText fact={day.fact("date")} locale={locale}>
                  {midnight}
                </FactText>
              ),
            })
          )}
        </>
      ),
      text: `${plain(day.fact("cutoff"), locale)} (${snapshotNote})`,
    },
    verdictRow(ctx),
    totalRow(ctx),
    differencesRow(ctx),
    historyRow(ctx),
    ruleVersionRow(ctx),
    ruleIdRow(ctx),
    registryRow(ctx),
    rootRow(ctx, "cycleRoot", "roots.cycle"),
    rootRow(ctx, "walletRoot", "roots.wallet"),
    rootRow(ctx, "historyRoot", "roots.history"),
    {
      id: "input",
      value: (
        <>
          {hashOf(ctx, "inputSha")}
          {quiet(pt(locale, "explained.tdh.day.row.inputNote"))}
        </>
      ),
      text: day.text("inputSha") ?? plain(null, locale),
    },
    recordsRow(ctx),
    fileRow(ctx, fileText),
  ];
}

/** The receipt as plain text: a title line, each row as "label: value", the source. */
export function receiptText(
  rows: readonly Row[],
  day: DayView,
  locale: SupportedLocale
): string {
  const label = (id: ReceiptRowId) => kt(locale, `explained.kit.receipt.${id}`);
  const title = pt(locale, "explained.tdh.day.text.title", {
    date: plain(day.fact("date"), locale, true),
    cycle: plain(day.fact("cycle"), locale),
  });
  const source = pt(locale, "explained.tdh.day.text.source", {
    url: day.text("file.url") ?? plain(null, locale),
  });
  return [
    title,
    "",
    ...rows.map((row) => `${label(row.id)}: ${row.text}`),
    "",
    source,
    "",
  ].join("\n");
}
