"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  formatFullDate,
  formatFullDateTime,
  formatToFullDivision,
  getMintNumberForMintDate,
  getSeasonIndexForDate,
  getSeasonStartDate,
  immediatelyNextMintDate,
  isMintDayDate,
  printCalendarInvites,
  ymd,
} from "./meme-calendar.helpers";

/**
 * Layout wrapper: two equal-height cards side-by-side on md+,
 * stacked on small screens.
 */
export default function MemeCalendarOverview() {
  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
      <div className="tw-h-full">
        <MemeCalendarOverviewNextMint />
      </div>
      <div className="tw-h-full">
        <MemeCalendarOverviewUpcomingMints />
      </div>
    </div>
  );
}

/**
 * Card 1 — Next mint: big number, date, live countdown, calendar links.
 */
export function MemeCalendarOverviewNextMint() {
  const [now, setNow] = useState(new Date());

  // tick every second for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const nextMint = useMemo(() => immediatelyNextMintDate(now), [now]);
  const memeNo = useMemo(() => getMintNumberForMintDate(nextMint), [nextMint]);

  const diffMs = nextMint.getTime() - now.getTime();
  const diff = diffMs > 0 ? msToParts(diffMs) : { d: 0, h: 0, m: 0, s: 0 };

  // All-day event on the mint date (end-exclusive next day)
  const start = new Date(
    nextMint.getFullYear(),
    nextMint.getMonth(),
    nextMint.getDate()
  );
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const invitesHtml = useMemo(
    () => printCalendarInvites(start, memeNo),
    [start, memeNo]
  );

  return (
    <div className="tw-h-full tw-min-h-[220px] tw-p-4 tw-flex tw-flex-col tw-justify-between tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#181818]">
      <div className="tw-space-y-2">
        <div className="tw-text-sm tw-text-gray-400">Next Mint</div>
        <div className="tw-text-3xl md:tw-text-4xl tw-font-bold">
          #{memeNo.toLocaleString()}
        </div>
        <div className="tw-text-lg tw-text-gray-200">
          {formatFullDateTime(nextMint)}
        </div>
        <div className="tw-text-sm tw-text-gray-300">
          {formatToFullDivision(nextMint)}
        </div>

        <div className="tw-pt-4 tw-text-sm tw-text-gray-400">Minting in</div>
        <div className="tw-text-2xl tw-font-semibold">
          {(() => {
            const parts: string[] = [];
            if (diff.d > 0) {
              parts.push(`${diff.d}d`);
              parts.push(`${diff.h}h`);
              parts.push(`${diff.m}m`);
              parts.push(`${diff.s}s`);
            } else if (diff.h > 0) {
              parts.push(`${diff.h}h`);
              parts.push(`${diff.m}m`);
              parts.push(`${diff.s}s`);
            } else if (diff.m > 0) {
              parts.push(`${diff.m}m`);
              parts.push(`${diff.s}s`);
            } else {
              parts.push(`${diff.s}s`);
            }
            return parts.join(" : ");
          })()}
        </div>
      </div>

      <div
        className="tw-pt-4"
        dangerouslySetInnerHTML={{
          __html: invitesHtml,
        }}
      />
    </div>
  );
}

/**
 * Card 2 — Upcoming mints for the current SZN.
 * Shows a simple table of remaining Mon/Wed/Fri dates in this season.
 */
export function MemeCalendarOverviewUpcomingMints() {
  const [now] = useState(new Date());

  const { seasonStart, seasonEndInclusive } = useMemo(() => {
    const idx = getSeasonIndexForDate(now);
    const start = getSeasonStartDate(idx);
    const end = addMonths(start, 2); // inclusive end month
    return { seasonStart: start, seasonEndInclusive: end };
  }, [now]);

  const rows = useMemo(() => {
    // Start from today (or next day) but don’t go before seasonStart
    const startScan = new Date(
      Math.max(
        new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(),
        new Date(seasonStart.getFullYear(), seasonStart.getMonth(), 1).getTime()
      )
    );
    // Walk day-by-day and pick mint days (Mon/Wed/Fri) within the season
    const out: { date: Date; meme: number }[] = [];
    const cursor = new Date(startScan);
    const seasonEndLastDay = new Date(
      seasonEndInclusive.getFullYear(),
      seasonEndInclusive.getMonth() + 1,
      0
    );
    while (cursor <= seasonEndLastDay) {
      if (isMintDayDate(cursor)) {
        const d = new Date(cursor);
        out.push({ date: d, meme: getMintNumberForMintDate(d) });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    // Remove past mints earlier today
    const todayYmd = ymd(now);
    return out.filter((x) => ymd(x.date) > todayYmd);
  }, [now, seasonStart, seasonEndInclusive]);

  return (
    <div className="tw-h-full tw-min-h-[220px] tw-p-4 tw-flex tw-flex-col tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#181818]">
      <div className="tw-flex tw-items-baseline tw-justify-between tw-mb-3">
        <div className="tw-text-sm tw-text-gray-400">
          Upcoming Mints for SZN {getSeasonIndexForDate(now) + 1}
        </div>
        <div className="tw-text-xs tw-text-gray-500">
          {formatFullDate(seasonStart)} - {formatFullDate(seasonEndInclusive)}
        </div>
      </div>

      <div className="tw-overflow-x-auto tw-flex-1 tw-min-h-0 md:tw-max-h-[220px] md:tw-overflow-y-auto">
        <table className="tw-w-full tw-text-sm">
          <thead></thead>
          <tbody className="tw-divide-y tw-divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td className="tw-py-3 tw-text-gray-500" colSpan={3}>
                  No upcoming mints in this season.
                </td>
              </tr>
            ) : (
              rows.map(({ date, meme }) => {
                const title = `Meme #${meme}`;
                // All-day event for that calendar day
                const start = new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate()
                );
                const end = new Date(start);
                end.setDate(end.getDate() + 1);

                return (
                  <tr key={ymd(date)}>
                    <td className="tw-py-2 tw-pr-4 tw-font-semibold">
                      #{meme.toLocaleString()}
                    </td>
                    <td className="tw-py-2 tw-pr-4">{formatFullDate(date)}</td>
                    <td
                      className="tw-py-2 tw-text-right"
                      dangerouslySetInnerHTML={{
                        __html: printCalendarInvites(date, meme, "#fff", 18),
                      }}></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function msToParts(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { d, h, m, s: sec };
}
