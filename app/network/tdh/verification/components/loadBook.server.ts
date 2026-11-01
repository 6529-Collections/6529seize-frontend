import { cache } from "react";
import type { FeedDayInput } from "@/lib/explained/factInputs";
import { loadFactInputs } from "@/lib/explained/feed.server";
import { createFactBook, type FactBook } from "@/lib/explained/facts";
import {
  LATEST_DAY_REVALIDATE_SECONDS,
  OLDER_DAY_REVALIDATE_SECONDS,
  loadVerificationDay,
} from "@/lib/tdh/verification/loadVerification.server";
import type { VerificationDay } from "@/lib/tdh/verification/schema";

/**
 * The facts of the daily check and of a day's receipt, read once per
 * server render: every source the facts layer reads, plus the day files
 * the page shows. The daily check reads every day file, since only a file
 * says when it was written, and a result written late or re-run is marked
 * (↻) wherever the page lists it; an older file is cached an hour. A
 * receipt reads its day and the day before it, so its change since then is
 * a fact too.
 */
interface DayFile {
  readonly day: VerificationDay;
  /** The file exactly as read, for the browser to hash again. */
  readonly text: string | null;
}

export interface PageBook {
  readonly book: FactBook;
  /** The day files read, by cycle. */
  readonly files: ReadonlyMap<number, DayFile>;
  /** Every cycle the feed's index lists, oldest first. */
  readonly cycles: readonly number[];
}

async function loadDays(
  cycles: readonly number[],
  latest: number
): Promise<Map<number, FeedDayInput & DayFile>> {
  const loads = await Promise.all(
    cycles.map(async (cycle) => {
      const load = await loadVerificationDay(
        cycle,
        cycle === latest
          ? LATEST_DAY_REVALIDATE_SECONDS
          : OLDER_DAY_REVALIDATE_SECONDS
      );
      return load.status === "ok"
        ? ([
            cycle,
            {
              day: load.day,
              sha256: load.sha256,
              url: load.dayUrl,
              text: load.text,
            },
          ] as const)
        : null;
    })
  );
  return new Map(loads.filter((entry) => entry !== null));
}

/**
 * The page's facts, with the day files `pick` chooses from the index's
 * cycles (oldest first) read as well.
 */
async function loadPageBook(
  pick: (cycles: readonly number[]) => readonly number[]
): Promise<PageBook> {
  const inputs = await loadFactInputs();
  const feed = inputs.feed;
  if (!feed) {
    return { book: createFactBook(inputs), files: new Map(), cycles: [] };
  }
  const cycles = feed.index.days
    .map((day) => day.cycleDay)
    .sort((a, b) => a - b);
  const latest = cycles.at(-1) ?? feed.latest.day.cycleDay;
  const files = await loadDays(pick(cycles), latest);
  const days = [...files.values()].sort(
    (a, b) => a.day.cycleDay - b.day.cycleDay
  );
  return {
    book: createFactBook({
      ...inputs,
      feed: days.length > 0 ? { ...feed, days } : feed,
    }),
    files,
    cycles,
  };
}

/** The daily check: every published day. */
export const loadCheckBook = cache(
  (): Promise<PageBook> => loadPageBook((cycles) => cycles)
);

/** A day's receipt: the day, and the day before it when the feed has it. */
export const loadDayBook = cache(
  (cycle: number): Promise<PageBook> =>
    loadPageBook((cycles) =>
      cycles.filter((value) => value === cycle || value === cycle - 1)
    )
);
