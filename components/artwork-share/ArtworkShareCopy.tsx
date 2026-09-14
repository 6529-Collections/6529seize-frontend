import {
  CheckIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function ArtworkShareCopy({
  value,
  locale,
  caption = false,
}: {
  readonly value: string;
  readonly locale: SupportedLocale;
  readonly caption?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const fieldId = useId();
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const copyLabel = t(
    locale,
    caption ? "artworkShare.copyCaption" : "artworkShare.copyLink"
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      flushSync(() => {
        setExpanded(true);
        setStatus("error");
      });
      fieldRef.current?.focus();
      fieldRef.current?.select();
    }
  }

  return (
    <div className="tw-min-w-0">
      <div
        className={`tw-flex tw-min-w-0 tw-items-center tw-gap-2 ${caption ? "" : "tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/20 tw-pl-3"}`}
      >
        {caption ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={fieldId}
            onClick={() => setExpanded((open) => !open)}
            className="tw-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-sm tw-text-iron-300 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "artworkShare.captionLabel")}
            <ChevronDownIcon
              aria-hidden="true"
              className={`tw-size-3.5 tw-shrink-0 ${expanded ? "tw-rotate-180" : ""}`}
            />
          </button>
        ) : (
          <input
            ref={(element) => {
              fieldRef.current = element;
            }}
            aria-label={t(locale, "artworkShare.artworkLink")}
            value={value}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
            className="tw-min-w-0 tw-flex-1 tw-truncate tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-text-iron-400 focus:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          />
        )}
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={copyLabel}
          title={copyLabel}
          className="tw-inline-flex tw-min-h-11 tw-min-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-font-medium tw-text-iron-200 hover:tw-bg-white/5 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
        >
          {status === "copied" ? (
            <CheckIcon className="tw-size-4" aria-hidden="true" />
          ) : (
            <ClipboardDocumentIcon className="tw-size-4" aria-hidden="true" />
          )}
          {caption &&
            (status === "copied"
              ? t(locale, "artworkShare.copied")
              : t(locale, "artworkShare.copy"))}
        </button>
      </div>
      {caption && (
        <div id={fieldId} hidden={!expanded}>
          <textarea
            ref={(element) => {
              fieldRef.current = element;
            }}
            aria-label={t(locale, "artworkShare.captionLabel")}
            value={value}
            readOnly
            rows={4}
            onFocus={(event) => event.currentTarget.select()}
            className="tw-mt-1 tw-w-full tw-resize-y tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/20 tw-p-3 tw-text-sm tw-leading-6 tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          />
        </div>
      )}
      <output
        className={
          status === "error"
            ? "tw-mt-2 tw-block tw-text-xs tw-leading-5 tw-text-iron-300"
            : "tw-sr-only"
        }
      >
        {status === "copied" && t(locale, "artworkShare.copied")}
        {status === "error" && t(locale, "artworkShare.copyError")}
      </output>
    </div>
  );
}
