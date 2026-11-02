"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { factsAsJson } from "@/lib/explained/facts";
import { formatUtcLongDay } from "@/lib/explained/format";
import { useFactSnapshot } from "../facts/FactsProvider";
import { kt, type KitKey } from "../i18n";
import { EX_FOCUS } from "../tokens";
import { pageToMarkdown } from "./pageMarkdown";

/**
 * The five actions under every page's How we know (EXPLAINED.md §6.2): copy
 * the page as Markdown, cite it, report an error, the corrections log, and
 * every number's source as JSON (the page's facts, as the server read them).
 */
const ACTION = `tw-inline-flex tw-min-h-6 tw-cursor-pointer tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-primary-300 tw-no-underline hover:tw-underline ${EX_FOCUS}`;

export default function HowWeKnowActions({
  locale,
  title,
  slug,
  reportHref,
  correctionsHref,
}: {
  readonly locale: SupportedLocale;
  /** The page's title, for the citation. */
  readonly title: string;
  /** A file-name stem for the JSON download: "tdh-daily-check". */
  readonly slug: string;
  readonly reportHref: string;
  readonly correctionsHref: string;
}) {
  const snapshot = useFactSnapshot();
  const [done, setDone] = useState<"markdown" | "cite" | null>(null);
  // The citation, shown once copied, so it can be checked before pasting.
  const [cited, setCited] = useState<string | null>(null);

  const copy = async (which: "markdown" | "cite", text: string) => {
    try {
      // Plain-HTTP pages and older browsers have no clipboard.
      const clipboard = navigator.clipboard as Clipboard | undefined;
      await clipboard?.writeText(text);
    } finally {
      setDone(which);
    }
  };
  const url = () => globalThis.location.href.split("#")[0] ?? "";
  const onMarkdown = (event: MouseEvent<HTMLButtonElement>) => {
    const root = event.currentTarget.closest("[data-explained-shell]");
    const page = root?.querySelector("[data-ex-article]") ?? root;
    if (page) void copy("markdown", pageToMarkdown(page, url()));
  };
  const onCite = () => {
    // A title that ends a sentence already takes no second full stop.
    const citation = kt(locale, "explained.kit.hwk.citation", {
      title: title.replace(/[.\s]+$/, ""),
      url: url(),
      date: formatUtcLongDay(locale, snapshot.asOf),
    });
    setCited(citation);
    void copy("cite", citation);
  };
  const onJson = () => {
    const blob = new Blob([factsAsJson(snapshot)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${slug}-sources.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const label = (key: KitKey, which: "markdown" | "cite") =>
    done === which ? kt(locale, "explained.kit.hwk.copied") : kt(locale, key);

  return (
    <div
      className="tw-mt-[26px] tw-flex tw-flex-wrap tw-gap-x-[22px] tw-gap-y-2"
      data-ex-nocopy=""
    >
      <button
        type="button"
        className={ACTION}
        onClick={onMarkdown}
        aria-live="polite"
      >
        {label("explained.kit.hwk.copyMarkdown", "markdown")}
      </button>
      <button
        type="button"
        className={ACTION}
        onClick={onCite}
        aria-live="polite"
      >
        {label("explained.kit.hwk.cite", "cite")}
      </button>
      <Link className={ACTION} href={reportHref}>
        {kt(locale, "explained.kit.hwk.report")}
      </Link>
      <Link className={ACTION} href={correctionsHref}>
        {kt(locale, "explained.kit.hwk.corrections")}
      </Link>
      <button type="button" className={ACTION} onClick={onJson}>
        {kt(locale, "explained.kit.hwk.sources")}
      </button>
      {cited !== null && (
        <p
          className="tw-m-0 tw-w-full tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-400 [overflow-wrap:anywhere]"
          data-citation=""
        >
          {cited}
        </p>
      )}
    </div>
  );
}
