"use client";

import Link from "next/link";
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
  getNextMintStart,
  isMintEligibleUtcDay,
  mintStartInstantUtcForMintDay,
  printCalendarInvites,
  ymd,
} from "./meme-calendar.helpers";

/**
 * Layout wrapper: global Local/UTC toggle + two cards
 */
interface MemeCalendarOverviewProps {
  readonly displayTz: DisplayTz;
  readonly showViewAll?: boolean;
}

export default function MemeCalendarOverview({
  displayTz,
  showViewAll = false,
}: MemeCalendarOverviewProps) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-h-full tw-flex tw-items-center tw-gap-3">
        <h1>
          <span className="font-lightest">The Memes</span> Minting Calendar
        </h1>
        {showViewAll && (
          <Link href={`/meme-calendar`} className="tw-no-underline">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-bold tw-border-b-[3px] tw-border-current hover:tw-text-[#bbb] max-[800px]:tw-text-[12px]">
              View Full Calendar
            </span>
          </Link>
        )}
      </div>
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
interface MemeCalendarOverviewNextMintProps {
  readonly displayTz: DisplayTz;
}

export function MemeCalendarOverviewNextMint({
  displayTz,
}: MemeCalendarOverviewNextMintProps) {
  const [now, setNow] = useState(new Date());
  // Keep a stable target instant so we don't recompute calendar HTML every tick
  const [targetInstant, setTargetInstant] = useState(() =>
    getNextMintStart(new Date())
  );

  // tick every second for countdown and advance target when it actually changes
  useEffect(() => { 
    const t = setInterval(() => {
      setNow((prev) => {
        const current = new Date();
        // If the computed next mint instant has changed, update once
        const computed = getNextMintStart(current);
        if (computed.getTime() !== targetInstant.getTime()) {
          setTargetInstant(computed);
        }
        return current;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [targetInstant]);

  const targetUtcDay = useMemo(
    () =>
      new Date(
        Date.UTC(
          targetInstant.getUTCFullYear(),
          targetInstant.getUTCMonth(),
          targetInstant.getUTCDate()
        )
      ),
    [targetInstant]
  );
  const memeNo = useMemo(
    () => getMintNumberForMintDate(targetUtcDay),
    [targetUtcDay]
  );

  const diffMs = targetInstant.getTime() - now.getTime();
  const diff = diffMs > 0 ? msToParts(diffMs) : { d: 0, h: 0, m: 0, s: 0 };

  const invitesHtml = useMemo(
    () => printCalendarInvites(targetInstant, memeNo),
    [memeNo, targetInstant]
  );

  return (
    <div className="tw-p-4 tw-flex tw-flex-col tw-justify-between tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#222222]">
      <div className="tw-space-y-1">
        <div className="tw-text-sm tw-text-gray-400">Next Mint</div>
        <div className="tw-text-3xl md:tw-text-4xl tw-font-bold">
          #{memeNo.toLocaleString()}
        </div>
        <div className="tw-text-lg tw-font-semibold">
          {formatFullDateTime(targetInstant, displayTz)}
        </div>
        <div className="tw-text-sm">{formatToFullDivision(targetInstant)}</div>

        <div className="tw-pt-2 tw-text-sm tw-text-gray-400">Minting in</div>
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
        className="tw-pt-3"
        dangerouslySetInnerHTML={{ __html: invitesHtml }}
      />
    </div>
  );
}

/**
 * Card 2 — Upcoming mints for the current SZN.
 * Shows a table of remaining Mon/Wed/Fri date-times (timed, not all-day).
 */
interface MemeCalendarOverviewUpcomingMintsProps {
  readonly displayTz: DisplayTz;
}

export function MemeCalendarOverviewUpcomingMints({
  displayTz,
}: MemeCalendarOverviewUpcomingMintsProps) {
  const [now] = useState(new Date());

  const { seasonStart, seasonEndInclusive, seasonIndex, rows } = useMemo(() => {
    function buildRows(start: Date, end: Date) {
      const todayUtcDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
      const seasonStartUtcDay = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)
      );
      const seasonEndLastUtcDay = new Date(
        Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)
      );
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
      return out.filter((x) => x.instantUtc.getTime() > now.getTime());
    }

    const idx = getSeasonIndexForDate(now);
    const start = getSeasonStartDate(idx);
    const end = addMonths(start, 2);
    let seasonRows = buildRows(start, end);
    if (seasonRows.length === 0) {
      const nextIdx = idx + 1;
      const nextStart = getSeasonStartDate(nextIdx);
      const nextEnd = addMonths(nextStart, 2);
      seasonRows = buildRows(nextStart, nextEnd);
      return {
        seasonStart: nextStart,
        seasonEndInclusive: nextEnd,
        seasonIndex: nextIdx,
        rows: seasonRows,
      };
    }
    return {
      seasonStart: start,
      seasonEndInclusive: end,
      seasonIndex: idx,
      rows: seasonRows,
    };
  }, [now]);

  return (
    <div className="tw-h-full tw-p-4 tw-flex tw-flex-col tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#222222]">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
        <div className="tw-font-semibold">
          Upcoming Mints for SZN {displayedSeasonNumberFromIndex(seasonIndex)}
        </div>
        <div className="tw-text-sm tw-text-gray-400">
          {formatFullDate(seasonStart, displayTz)} -{" "}
          {formatFullDate(seasonEndInclusive, displayTz)}
        </div>
      </div>

      <div className="tw-overflow-x-auto tw-flex-1 tw-max-h-[350px] tw-overflow-y-auto">
        <table className="tw-w-full tw-text-sm">
          <thead></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="tw-py-3 tw-text-gray-500" colSpan={3}>
                  No upcoming mints in this season.
                </td>
              </tr>
            ) : (
              rows.map(({ utcDay, instantUtc, meme }) => (
                <tr key={ymd(utcDay)}>
                  <td className="tw-py-2 tw-font-semibold">
                    #{meme.toLocaleString()}
                  </td>
                  <td className="tw-py-2 tw-pr-4">
                    {formatFullDateTime(instantUtc, displayTz)}
                  </td>
                  <td
                    className="tw-py-2 tw-flex align-items-center justify-content-end"
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
