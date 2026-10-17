import { publicEnv } from "@/config/env";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  LATEST_DAY_REVALIDATE_SECONDS,
  OLDER_DAY_REVALIDATE_SECONDS,
  loadVerificationDay,
  loadVerificationIndex,
} from "@/lib/tdh/verification/loadVerification.server";
import type { VerificationDay } from "@/lib/tdh/verification/schema";
import {
  TDH_RSS_FEED_DAYS,
  indexDayVerdict,
} from "@/lib/tdh/verification/states";
import { formatCycleDate } from "../verification/components/verificationFormat";

// The feed follows the published index, as the dashboard does.
export const revalidate = 600;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** An RFC 822 date for RSS. */
function rssDate(value: string): string {
  return new Date(value).toUTCString();
}

/**
 * The daily comparison as an RSS 2.0 feed: one item for each of the newest
 * `TDH_RSS_FEED_DAYS` published days, with its verdict, how many identity
 * records agree with 6529.io and between the Rust core and the Python
 * reference, and the totals, newest first, so a
 * reader hears of a difference as soon as the day is published. An item's
 * date is when the feed wrote the day's file (its `generatedAt`, from the
 * file or the index), else when the index was written, else the cycle's
 * boundary, 00:00 UTC of its date; the channel's build date is the index's.
 */
export async function GET(): Promise<Response> {
  const locale = DEFAULT_LOCALE;
  const base = publicEnv.BASE_ENDPOINT.replace(/\/$/, "");
  const dashboard = `${base}/network/tdh/verification`;
  const load = await loadVerificationIndex();
  const days =
    load.status === "ok"
      ? [...load.index.days]
          .sort((left, right) => right.cycleDay - left.cycleDay)
          .slice(0, TDH_RSS_FEED_DAYS)
      : [];
  const files = await Promise.all(
    days.map(async (day, position): Promise<VerificationDay | null> => {
      const dayLoad = await loadVerificationDay(
        day.cycleDay,
        position === 0
          ? LATEST_DAY_REVALIDATE_SECONDS
          : OLDER_DAY_REVALIDATE_SECONDS
      );
      return dayLoad.status === "ok" ? dayLoad.day : null;
    })
  );
  const indexWritten =
    load.status === "ok" ? (load.index.generatedAt ?? null) : null;
  const items = days.map((day, position) => {
    const file = files[position] ?? null;
    const link = `${dashboard}/${day.cycleDay}`;
    const verdict = t(
      locale,
      `network.tdh.shared.pill.${indexDayVerdict(day)}` as MessageKey
    );
    const title = t(locale, "network.tdh.verify.rss.itemTitle", {
      date: formatCycleDate(locale, day.date),
      verdict,
    });
    const agreement =
      day.identitiesTotal === null
        ? t(locale, "network.tdh.verify.rss.itemNoLive")
        : t(locale, "network.tdh.verify.rss.item", {
            equal: formatInteger(locale, day.identitiesEqual ?? 0),
            total: formatInteger(locale, day.identitiesTotal),
            cycle: formatInteger(locale, day.cycleDay),
          });
    const totals = t(locale, "network.tdh.verify.rss.itemTotals", {
      rust: formatInteger(locale, day.totalTdh.rust),
      python:
        day.totalTdh.python === null
          ? "–"
          : formatInteger(locale, day.totalTdh.python),
      live:
        day.totalTdh.live === null
          ? "–"
          : formatInteger(locale, day.totalTdh.live),
    });
    const python = file?.agreement.rustVsPython ?? null;
    const pythonLine =
      python === null
        ? ""
        : ` ${t(locale, "network.tdh.verify.rss.itemPython", {
            equal: formatInteger(locale, python.identitiesEqual),
            total: formatInteger(locale, python.identitiesTotal),
          })}`;
    const written =
      file?.generatedAt ?? day.generatedAt ?? indexWritten ?? null;
    const writtenLine =
      written === null
        ? ""
        : ` ${t(locale, "network.tdh.verify.rss.itemFile", {
            time: rssDate(written),
          })}`;
    const description = `${agreement}${pythonLine} ${totals}${writtenLine}`;
    const published = rssDate(written ?? `${day.date}T00:00:00Z`);
    return [
      "    <item>",
      `      <title>${escapeXml(title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <description>${escapeXml(description)}</description>`,
      `      <pubDate>${escapeXml(published)}</pubDate>`,
      "    </item>",
    ].join("\n");
  });
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(t(locale, "network.tdh.verify.rss.title"))}</title>`,
    `    <link>${escapeXml(dashboard)}</link>`,
    `    <description>${escapeXml(
      t(locale, "network.tdh.verify.rss.description", {
        days: formatInteger(locale, TDH_RSS_FEED_DAYS),
      })
    )}</description>`,
    "    <language>en-us</language>",
    ...(indexWritten === null
      ? []
      : [
          `    <lastBuildDate>${escapeXml(rssDate(indexWritten))}</lastBuildDate>`,
        ]),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
