"use client";

import { useEffect, useMemo, useState } from "react";
import type { DisplayTz } from "./meme-calendar.helpers";
import {
  addMonths,
  displayedSeasonNumberFromIndex,
  formatFullDate,
  formatFullDateTime,
  formatToFullDivision,
  getMintNumberForMintDate,
  getSeasonIndexForDate,
  getSeasonStartDate,
  immediatelyNextMintInstantUTC,
  isMintEligibleUtcDay,
  mintStartInstantUtcForMintDay,
  printCalendarInvites,
  ymd,
} from "./meme-calendar.helpers";

/**
 * Layout wrapper: global Local/UTC toggle + two cards
 */
export default function MemeCalendarOverview({
  displayTz,
}: {
  displayTz: DisplayTz;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        <div className="tw-h-full">
          <MemeCalendarOverviewNextMint displayTz={displayTz} />
        </div>
        <div className="tw-h-full">
          <MemeCalendarOverviewUpcomingMints displayTz={displayTz} />
        </div>
      </div>
    </div>
  );
}

/**
 * Card 1 — Next mint: big number, date (single line governed by global toggle),
 * live countdown, calendar links.
 */
export function MemeCalendarOverviewNextMint({
  displayTz,
}: {
  displayTz: DisplayTz;
}) {
  const [now, setNow] = useState(new Date());

  // tick every second for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const nextMintInstantUtc = useMemo(
    () => immediatelyNextMintInstantUTC(now),
    [now]
  );

  // Mint number is based on the UTC *day* of that instant
  const nextMintUtcDay = useMemo(
    () =>
      new Date(
        Date.UTC(
          nextMintInstantUtc.getUTCFullYear(),
          nextMintInstantUtc.getUTCMonth(),
          nextMintInstantUtc.getUTCDate()
        )
      ),
    [nextMintInstantUtc]
  );
  const memeNo = useMemo(
    () => getMintNumberForMintDate(nextMintUtcDay),
    [nextMintUtcDay]
  );

  const diffMs = nextMintInstantUtc.getTime() - now.getTime();
  const diff = diffMs > 0 ? msToParts(diffMs) : { d: 0, h: 0, m: 0, s: 0 };

  const invitesHtml = useMemo(
    () => printCalendarInvites(nextMintInstantUtc, memeNo),
    [nextMintInstantUtc, memeNo]
  );

  return (
    <div className="tw-h-full tw-min-h-[220px] tw-p-4 tw-flex tw-flex-col tw-justify-between tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#181818]">
      <div className="tw-space-y-2">
        <div className="tw-text-sm tw-text-gray-400">Next Mint</div>
        <div className="tw-text-3xl md:tw-text-4xl tw-font-bold">
          #{memeNo.toLocaleString()}
        </div>
        <div className="tw-text-lg tw-text-gray-200">
          {formatFullDateTime(nextMintInstantUtc, displayTz)}
        </div>
        <div className="tw-text-sm tw-text-gray-400">
          {formatToFullDivision(nextMintInstantUtc)}
        </div>

        <div className="tw-pt-4 tw-text-sm tw-text-gray-400">Minting in</div>
        <div className="tw-text-2xl tw-font-semibold">
          {(() => {
            const parts: string[] = [];
            if (diff.d > 0) {
              parts.push(
                `${diff.d}d`,
                `${diff.h}h`,
                `${diff.m}m`,
                `${diff.s}s`
              );
            } else if (diff.h > 0) {
              parts.push(`${diff.h}h`, `${diff.m}m`, `${diff.s}s`);
            } else if (diff.m > 0) {
              parts.push(`${diff.m}m`, `${diff.s}s`);
            } else {
              parts.push(`${diff.s}s`);
            }
            return parts.join(" : ");
          })()}
        </div>
      </div>

      <div
        className="tw-pt-4"
        dangerouslySetInnerHTML={{ __html: invitesHtml }}
      />
    </div>
  );
}

/**
 * Card 2 — Upcoming mints for the current SZN.
 * Shows a table of remaining Mon/Wed/Fri date-times (timed, not all-day).
 */
export function MemeCalendarOverviewUpcomingMints({
  displayTz,
}: {
  displayTz: DisplayTz;
}) {
  const [now] = useState(new Date());

  const { seasonStart, seasonEndInclusive } = useMemo(() => {
    const idx = getSeasonIndexForDate(now);
    const start = getSeasonStartDate(idx);
    const end = addMonths(start, 2); // inclusive end month
    return { seasonStart: start, seasonEndInclusive: end };
  }, [now]);

  const rows = useMemo(() => {
    // UTC versions of today and season bounds
    const todayUtcDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const seasonStartUtcDay = new Date(
      Date.UTC(seasonStart.getUTCFullYear(), seasonStart.getUTCMonth(), 1)
    );
    const seasonEndLastUtcDay = new Date(
      Date.UTC(
        seasonEndInclusive.getUTCFullYear(),
        seasonEndInclusive.getUTCMonth() + 1,
        0
      )
    );

    // Start scanning from max(today, seasonStart)
    const scanStart = new Date(
      Math.max(todayUtcDay.getTime(), seasonStartUtcDay.getTime())
    );
    const out: { utcDay: Date; instantUtc: Date; meme: number }[] = [];

    const cursor = new Date(scanStart);
    while (cursor <= seasonEndLastUtcDay) {
      if (isMintEligibleUtcDay(cursor)) {
        const mintInstant = mintStartInstantUtcForMintDay(cursor);
        out.push({
          utcDay: new Date(cursor),
          instantUtc: mintInstant,
          meme: getMintNumberForMintDate(cursor),
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // Only future mints (instant must be after 'now')
    return out.filter((x) => x.instantUtc.getTime() > now.getTime());
  }, [now, seasonStart, seasonEndInclusive]);

  return (
    <div className="tw-h-full tw-min-h-[220px] tw-p-4 tw-flex tw-flex-col tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#181818]">
      <div className="tw-flex tw-items-baseline tw-justify-between tw-mb-3">
        <div className="tw-text-sm tw-text-gray-400">
          Upcoming Mints for SZN{" "}
          {displayedSeasonNumberFromIndex(getSeasonIndexForDate(now))}
        </div>
        <div className="tw-text-xs tw-text-gray-500">
          {formatFullDate(seasonStart, displayTz)} -{" "}
          {formatFullDate(seasonEndInclusive, displayTz)}
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
              rows.map(({ utcDay, instantUtc, meme }) => (
                <tr key={ymd(utcDay)}>
                  <td className="tw-py-2 tw-pr-4 tw-font-semibold">
                    #{meme.toLocaleString()}
                  </td>
                  <td className="tw-py-2 tw-pr-4">
                    {formatFullDateTime(instantUtc, displayTz)}
                  </td>
                  <td
                    className="tw-py-2 tw-text-right"
                    dangerouslySetInnerHTML={{
                      __html: printCalendarInvites(
                        instantUtc,
                        meme,
                        "#fff",
                        18
                      ),
                    }}></td>
                </tr>
              ))
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
