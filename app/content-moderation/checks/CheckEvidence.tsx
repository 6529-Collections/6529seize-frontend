"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export function collectEvidenceLinks(value: unknown): string[] {
  const links = new Set<string>();
  function visit(item: unknown, depth: number) {
    if (depth > 8 || links.size >= 30) return;
    if (typeof item === "string") {
      try {
        const url = new URL(item);
        if (url.protocol === "https:" && !url.username && !url.password)
          links.add(url.href);
      } catch {
        /* Ordinary evidence text is deliberately not linkified. */
      }
    } else if (Array.isArray(item)) {
      item.slice(0, 100).forEach((child) => visit(child, depth + 1));
    } else if (item !== null && typeof item === "object") {
      Object.values(item)
        .slice(0, 100)
        .forEach((child) => visit(child, depth + 1));
    }
  }
  visit(value, 0);
  return [...links];
}

export function InertEvidence({ value }: { readonly value: unknown }) {
  return (
    <pre className="tw-m-0 tw-max-h-96 tw-overflow-y-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-lg tw-bg-black tw-p-4 tw-font-mono tw-text-sm tw-leading-6 tw-text-iron-200 [overflow-wrap:anywhere]">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function CheckEvidence({
  evidence,
}: {
  readonly evidence: object | null;
}) {
  const locale = useBrowserLocale();
  const links = collectEvidenceLinks(evidence);
  return (
    <div className="tw-space-y-4">
      <p className="tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "checks.evidenceHelp")}
      </p>
      {evidence ? (
        <InertEvidence value={evidence} />
      ) : (
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, "checks.noPreview")}
        </p>
      )}
      {links.length > 0 && (
        <details>
          <summary className="tw-min-h-11 tw-cursor-pointer tw-content-center tw-text-sm tw-font-semibold tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
            {t(locale, "checks.externalLinks")}
          </summary>
          <p className="tw-text-sm tw-text-iron-400">
            {t(locale, "checks.externalWarning")}
          </p>
          <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
            {links.map((url, index) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="tw-inline-flex tw-min-h-11 tw-items-center tw-break-all tw-text-sm tw-text-primary-300 tw-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  aria-label={t(locale, "checks.openExternal", {
                    number: formatInteger(locale, index + 1),
                  })}
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
