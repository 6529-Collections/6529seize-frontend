import Link from "next/link";
import type { ReactNode } from "react";
import {
  DayTile,
  ribbonDays,
  type DayKind,
  type ResultDay,
  type RibbonDay,
} from "@/components/explained/evidence/DayRibbon";
import { kt } from "@/components/explained/i18n";
import { Glyph } from "@/components/explained/marks/glyphs";
import { EX_FOCUS } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { Fact } from "@/lib/explained/facts";
import { formatCount, formatUtcDay } from "@/lib/explained/format";
import { dateOfCycle } from "@/lib/explained/registry/helpers";
import { pt } from "./copy";
import { FactText } from "@/components/explained/facts/FactText";
import { rich } from "@/components/explained/rich";
import { DAY_TILE, checkStateOf, type CheckState } from "./dayModel";

/**
 * Every result so far (TDH-DESIGN.md §4.4): one tile per published day,
 * each a link to its receipt, then the open day, the days to come and the
 * cutover, "about". A cycle the feed's index skips between two results is
 * a day with no file (◌, EXPLAINED.md §3 rule 8), drawn in its place. Ten
 * tiles across on a desktop: when the feed holds more results than fit,
 * the newest are drawn and every result opens below the ribbon.
 */
const RIBBON_COLUMNS = 10;

export interface RibbonInput {
  readonly days: readonly ResultDay[];
  readonly open: {
    readonly date: string;
    readonly minutesLeft: number;
    readonly progress: number;
  } | null;
  /** The cutover's date, while it is still ahead of the open day. */
  readonly cutover: string | null;
}

/** One closed cycle: its result, or no file for it. */
type ResultSlot =
  | { readonly kind: "result"; readonly day: ResultDay }
  | { readonly kind: "gap"; readonly cycle: number; readonly date: string };

/**
 * Every closed cycle from the first result to the latest, oldest first: the
 * results, and a gap for each cycle between them the index does not list.
 */
export function resultSlots(days: readonly ResultDay[]): ResultSlot[] {
  const sorted = [...days].sort((a, b) => a.cycle - b.cycle);
  const slots: ResultSlot[] = [];
  sorted.forEach((day, index) => {
    const before = sorted[index - 1];
    if (before !== undefined) {
      for (let cycle = before.cycle + 1; cycle < day.cycle; cycle += 1) {
        slots.push({ kind: "gap", cycle, date: dateOfCycle(cycle) });
      }
    }
    slots.push({ kind: "result", day });
  });
  return slots;
}

/**
 * The tile after the results: the open day. Empty tiles for days to come
 * would take the room of days already compared, so none is drawn.
 */
function trailingTiles(input: RibbonInput): RibbonDay[] {
  return ribbonDays({
    days: [],
    ...(input.open ? { open: input.open } : {}),
    ...(input.cutover ? { cutover: input.cutover } : {}),
    futureDays: 0,
  });
}

/** The closed cycles the ribbon has room for, newest last. */
export function ribbonResults(input: RibbonInput): readonly ResultSlot[] {
  const room = Math.max(1, RIBBON_COLUMNS - trailingTiles(input).length);
  return resultSlots(input.days).slice(-room);
}

function stateOf(day: ResultDay): CheckState {
  return checkStateOf(day.verdict, {
    identitiesEqual: day.identitiesEqual,
    identitiesTotal: day.identitiesTotal,
  });
}

function countFor(day: ResultDay, kind: DayKind): number {
  const equal = day.identitiesEqual ?? 0;
  return kind === "differs"
    ? Math.max(0, (day.identitiesTotal ?? 0) - equal)
    : equal;
}

/** A day the kit's tiles have no word for: compared without 6529.io, or a verdict unknown here. */
function NotComparedTile({
  day,
  locale,
}: {
  readonly day: ResultDay;
  readonly locale: SupportedLocale;
}) {
  const date = formatUtcDay(locale, day.date);
  return (
    <div
      className="tw-flex tw-h-full tw-min-h-[84px] tw-flex-col tw-justify-between tw-rounded-lg tw-border tw-border-dashed tw-border-iron-400 tw-p-2 md:tw-min-h-[104px] md:tw-px-3 md:tw-py-2.5"
      role="img"
      aria-label={pt(locale, "explained.tdh.check.ribbon.notComparedName", {
        date,
        cycle: formatCount(locale, day.cycle),
      })}
      data-day="notCompared"
    >
      <span
        className="tw-flex tw-items-center tw-justify-between tw-gap-1 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50 md:tw-text-[15px]"
        aria-hidden="true"
      >
        <span className="tw-whitespace-nowrap">{date}</span>
        <Glyph kind="notGuaranteed" />
      </span>
      <span
        className="tw-text-xs tw-leading-4 tw-text-iron-400 md:tw-text-[13px] md:tw-leading-[18px]"
        aria-hidden="true"
      >
        {pt(locale, "explained.tdh.check.ribbon.notCompared")}
      </span>
    </div>
  );
}

function resultTile(
  day: ResultDay,
  locale: SupportedLocale,
  simulatedDiffer: number | null,
  withWritten: boolean
): ReactNode {
  if (simulatedDiffer !== null) {
    return (
      <DayTile
        kind="simulated"
        date={day.date}
        cycle={day.cycle}
        count={simulatedDiffer}
        locale={locale}
      />
    );
  }
  const kind = DAY_TILE[stateOf(day)];
  const [tile] = ribbonDays({
    days: [withWritten ? day : { ...day, writtenAt: null }],
  });
  const face =
    kind === null || tile === undefined ? (
      <NotComparedTile day={day} locale={locale} />
    ) : (
      <DayTile
        {...tile}
        kind={kind}
        count={countFor(day, kind)}
        locale={locale}
      />
    );
  return (
    <Link
      href={`/network/tdh/verification/${day.cycle}`}
      className={`tw-block tw-h-full tw-rounded-lg tw-no-underline tw-transition-[filter] hover:tw-brightness-125 motion-reduce:tw-transition-none ${EX_FOCUS}`}
      prefetch={false}
    >
      {face}
    </Link>
  );
}

function slotTile(
  slot: ResultSlot,
  locale: SupportedLocale,
  simulatedDiffer: number | null,
  withWritten = true
): { readonly key: string; readonly node: ReactNode } {
  if (slot.kind === "gap") {
    // No file for this cycle: no receipt to open, so not a link.
    return {
      key: `missing-${slot.cycle}`,
      node: (
        <DayTile
          kind="missing"
          date={slot.date}
          cycle={slot.cycle}
          locale={locale}
        />
      ),
    };
  }
  return {
    key: `result-${slot.day.cycle}`,
    node: resultTile(slot.day, locale, simulatedDiffer, withWritten),
  };
}

interface GridItem {
  readonly key: string;
  readonly node: ReactNode;
  readonly hideOnPhone?: boolean;
}

/**
 * The ribbon's grid. Its columns follow the width the ribbon gets, not the
 * window's: ten across from 56rem, five from 34rem, four from 20rem (a
 * phone), two below (a narrow window, or 400% zoom). A list, so a screen
 * reader hears each tile with its date (EXPLAINED.md §11).
 */
function RibbonGrid({
  label,
  items,
}: {
  readonly label: string;
  readonly items: readonly GridItem[];
}) {
  return (
    <div className="tw-@container">
      <ol
        className="tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-2 tw-p-0 @[20rem]:tw-grid-cols-4 @[20rem]:tw-gap-1.5 @[34rem]:tw-grid-cols-5 @[34rem]:tw-gap-2 @[56rem]:tw-grid-cols-10"
        aria-label={label}
        data-fig="ribbon"
      >
        {items.map((item) => (
          <li
            key={item.key}
            className={item.hideOnPhone ? "max-md:tw-hidden" : ""}
          >
            {item.node}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function CheckRibbon({
  input,
  locale,
  simulatedDiffer = null,
}: {
  readonly input: RibbonInput;
  readonly locale: SupportedLocale;
  /** On a simulated failing day: identities that differ on the latest tile. */
  readonly simulatedDiffer?: number | null;
}) {
  const shown = ribbonResults(input);
  const latest = input.days.reduce<number | null>(
    (max, day) => (max === null || day.cycle > max ? day.cycle : max),
    null
  );
  const items: GridItem[] = [
    ...shown.map((slot) =>
      slotTile(
        slot,
        locale,
        slot.kind === "result" && slot.day.cycle === latest
          ? simulatedDiffer
          : null
      )
    ),
    ...trailingTiles(input).map((tile) => ({
      key: `${tile.kind}-${tile.date}`,
      hideOnPhone: tile.hideOnPhone ?? false,
      node: <DayTile {...tile} locale={locale} />,
    })),
  ];
  return (
    <RibbonGrid label={kt(locale, "explained.kit.day.ribbon")} items={items} />
  );
}

/**
 * Every closed cycle, oldest first, behind one control: the ribbon draws
 * only the newest, and a reader looking for an older day's receipt opens
 * the whole record here. Shown only when the ribbon cannot hold it all.
 */
export function AllResults({
  input,
  daysFact,
  locale,
}: {
  readonly input: RibbonInput;
  /** The index's list of results (`tdh.days`), which every count here comes from. */
  readonly daysFact: Fact | null;
  readonly locale: SupportedLocale;
}) {
  const slots = resultSlots(input.days);
  if (slots.length <= ribbonResults(input).length) {
    return null;
  }
  const missing = slots.some((slot) => slot.kind === "gap");
  const count = (value: number) => (
    <FactText fact={daysFact} locale={locale}>
      {formatCount(locale, value)}
    </FactText>
  );
  return (
    <details className="tw-group tw-mt-4" data-all-results="">
      <summary
        className={`tw-inline-flex tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-rounded-md tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-primary-300 hover:tw-underline hover:tw-underline-offset-[3px] [&::-webkit-details-marker]:tw-hidden ${EX_FOCUS}`}
      >
        <span
          className="tw-inline-block tw-transition-transform group-open:tw-rotate-90 motion-reduce:tw-transition-none"
          aria-hidden="true"
        >
          ›
        </span>
        <span>
          {rich(locale, "explained.tdh.check.ribbon.all", {
            count: count(slots.length),
          })}
        </span>
      </summary>
      <div className="tw-mt-3">
        <RibbonGrid
          label={pt(locale, "explained.tdh.check.ribbon.allLabel")}
          // The page reads every day file, so each tile says when its file
          // was written, and a late or re-run result carries its mark.
          items={slots.map((slot) => slotTile(slot, locale, null, true))}
        />
        {missing && (
          <p className="tw-m-0 tw-mt-3 tw-text-[15px] tw-leading-[23px] tw-text-iron-400">
            {pt(locale, "explained.tdh.check.ribbon.missing")}
          </p>
        )}
      </div>
    </details>
  );
}
