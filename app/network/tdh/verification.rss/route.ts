import { publicEnv } from "@/config/env";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { loadVerificationIndex } from "@/lib/tdh/verification/loadVerification.server";
import { indexDayVerdict } from "@/lib/tdh/verification/states";
import { formatCycleDate } from "../verification/components/verificationFormat";

// The feed follows the published index, as the dashboard does.
export const revalidate = 600;

/** The newest days the feed lists. */
const FEED_DAYS = 60;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * The daily comparison as an RSS 2.0 feed: one item per published day, with
 * its verdict and how many identity records agree, newest first, so a reader
 * hears of a difference as soon as the day is published. An item's date is
 * the feed's own `generatedAt` for the day when the index states one, and
 * otherwise the cycle's boundary, 00:00 UTC of its date.
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
          .slice(0, FEED_DAYS)
      : [];
  const items = days.map((day) => {
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
    const description = `${agreement} ${totals}`;
    const published = new Date(
      day.generatedAt ?? `${day.date}T00:00:00Z`
    ).toUTCString();
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
    `    <description>${escapeXml(t(locale, "network.tdh.verify.rss.description"))}</description>`,
    "    <language>en-us</language>",
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
