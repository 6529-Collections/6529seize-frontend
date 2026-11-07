"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/diagnostics";
import {
  getFlightSnapshot,
  type FlightEntry,
  type FlightSnapshot,
} from "@/services/diagnostics/flightRecorder";
import {
  captureScreenshot,
  isScreenshotSupported,
} from "@/services/diagnostics/screenshot";
import {
  sendDiagnostics,
  type SendResult,
} from "@/services/diagnostics/sendDiagnostics";
import { useCallback, useId, useRef, useState } from "react";

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

const WS_KEYS = {
  connected: "diagnostics.entry.wsConnected",
  connecting: "diagnostics.entry.wsConnecting",
  authenticating: "diagnostics.entry.wsAuthenticating",
  disconnected: "diagnostics.entry.wsDisconnected",
} as const;

const ERROR_KIND_KEYS = {
  unhandled_error: "diagnostics.errorKind.unhandled_error",
  unhandled_rejection: "diagnostics.errorKind.unhandled_rejection",
  chunk_load: "diagnostics.errorKind.chunk_load",
  boundary: "diagnostics.errorKind.boundary",
  resource: "diagnostics.errorKind.resource",
  other: "diagnostics.errorKind.other",
} as const;

const ASSET_KIND_KEYS = {
  script: "diagnostics.assetKind.script",
  style: "diagnostics.assetKind.style",
  font: "diagnostics.assetKind.font",
  image: "diagnostics.assetKind.image",
  media: "diagnostics.assetKind.media",
  other: "diagnostics.assetKind.other",
} as const;

// Routes, endpoints, error names and messages, and action-lifecycle kinds are
// technical identifiers from the app itself; they stay as recorded.
function describeEntry(locale: SupportedLocale, entry: FlightEntry): string {
  switch (entry.k) {
    case "nav":
      return t(locale, "diagnostics.entry.nav", { route: entry.route });
    case "api":
      return t(locale, "diagnostics.entry.api", {
        method: entry.method,
        endpoint: entry.endpoint,
        status: String(entry.status),
        ms: formatInteger(locale, entry.ms),
      });
    case "ws":
      return t(
        locale,
        Object.hasOwn(WS_KEYS, entry.state)
          ? WS_KEYS[entry.state as keyof typeof WS_KEYS]
          : "diagnostics.entry.wsOther"
      );
    case "action":
      return entry.legal
        ? t(locale, "diagnostics.entry.action", {
            from: entry.from,
            to: entry.to,
            event: entry.event,
          })
        : t(locale, "diagnostics.entry.actionIgnored", {
            from: entry.from,
            event: entry.event,
          });
    case "error":
      return t(locale, "diagnostics.entry.error", {
        kind: t(locale, ERROR_KIND_KEYS[entry.kind]),
        name: entry.name,
        message: entry.message,
      }).trim();
    case "long_task":
      return t(locale, "diagnostics.entry.longTask", {
        ms: formatInteger(locale, entry.ms),
      });
    case "asset":
      return t(locale, "diagnostics.entry.asset", {
        kind: t(locale, ASSET_KIND_KEYS[entry.kind]),
      });
    case "visibility":
      return t(
        locale,
        entry.state === "hidden"
          ? "diagnostics.entry.pageHidden"
          : "diagnostics.entry.pageVisible"
      );
  }
}

function EntryList({
  locale,
  entries,
  labelledBy,
}: {
  readonly locale: SupportedLocale;
  readonly entries: readonly FlightEntry[];
  readonly labelledBy: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="tw-text-sm tw-text-iron-400">
        {t(locale, "diagnostics.activity.empty")}
      </p>
    );
  }
  return (
    <ol
      aria-labelledby={labelledBy}
      className="tw-m-0 tw-max-h-80 tw-list-none tw-space-y-1 tw-overflow-y-auto tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-font-mono tw-text-xs tw-text-iron-300"
      tabIndex={0}
    >
      {entries.map((entry, index) => (
        <li key={`${entry.at}-${index}`} className="tw-break-words">
          <time
            dateTime={new Date(entry.at).toISOString()}
            className="tw-mr-2 tw-text-iron-500"
          >
            {formatTime(locale, entry.at, TIME_FORMAT)}
          </time>
          {describeEntry(locale, entry)}
        </li>
      ))}
    </ol>
  );
}

const ERROR_KEYS = {
  too_large: "diagnostics.error.too_large",
  rate_limited: "diagnostics.error.rate_limited",
  unavailable: "diagnostics.error.unavailable",
  offline: "diagnostics.error.offline",
  failed: "diagnostics.error.failed",
} as const;

type Phase =
  | { readonly kind: "preview" }
  | { readonly kind: "sending" }
  | { readonly kind: "sent"; readonly code: string }
  | {
      readonly kind: "error";
      readonly reason: Extract<SendResult, { ok: false }>["reason"];
    };

/**
 * Shows exactly what a diagnostics bundle holds and sends it only when the
 * person chooses to (R14 §4.3). Used by the Send diagnostics page and the
 * crash prompt. It reads device state, so callers render it in the browser
 * only (`next/dynamic` with `ssr: false`).
 */
export default function DiagnosticsPanel({
  headingLevel = 2,
}: {
  readonly headingLevel?: 2 | 3;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  const [snapshot, setSnapshot] = useState<FlightSnapshot>(getFlightSnapshot);
  const [screenshotSupported] = useState(isScreenshotSupported);
  const [attachScreenshot, setAttachScreenshot] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotFailed, setScreenshotFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "preview" });
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const codeRef = useRef<HTMLElement>(null);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const SubHeading = headingLevel === 2 ? "h3" : "h4";

  // Moves focus to "Report sent" when it appears: screen readers announce the
  // heading, then read the code and instructions that follow.
  const focusHeading = useCallback((node: HTMLElement | null) => {
    node?.focus();
  }, []);

  const capture = async () => {
    setScreenshotFailed(false);
    const image = await captureScreenshot();
    setScreenshot(image);
    setScreenshotFailed(image === null);
  };

  const send = async () => {
    setPhase({ kind: "sending" });
    const result = await sendDiagnostics(
      attachScreenshot && screenshot ? { ...snapshot, screenshot } : snapshot
    );
    setPhase(
      result.ok
        ? { kind: "sent", code: result.code }
        : { kind: "error", reason: result.reason }
    );
  };

  const copy = async () => {
    if (phase.kind !== "sent") return;
    try {
      await navigator.clipboard.writeText(phase.code);
      setCopyState("copied");
    } catch {
      const selection = globalThis.getSelection();
      if (codeRef.current && selection) {
        selection.selectAllChildren(codeRef.current);
      }
      setCopyState("failed");
    }
  };

  if (phase.kind === "sent") {
    return (
      <section aria-labelledby={`${id}-sent`} className="tw-space-y-3">
        <Heading
          id={`${id}-sent`}
          ref={focusHeading}
          tabIndex={-1}
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "diagnostics.sent.heading")}
        </Heading>
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "diagnostics.sent.codeLabel")}
        </p>
        <code
          ref={codeRef}
          className="tw-inline-block tw-rounded-lg tw-bg-iron-900 tw-px-4 tw-py-2 tw-font-mono tw-text-2xl tw-tracking-wider tw-text-iron-50"
        >
          {phase.code}
        </code>
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "diagnostics.sent.instructions")}
        </p>
        <Button variant="secondary" onClick={() => void copy()}>
          {t(locale, "diagnostics.sent.copy")}
        </Button>
        <p
          role="status"
          className="tw-m-0 tw-min-h-5 tw-text-sm tw-text-iron-300"
        >
          {copyState === "copied" ? t(locale, "diagnostics.sent.copied") : ""}
          {copyState === "failed"
            ? t(locale, "diagnostics.sent.copyFailed")
            : ""}
        </p>
      </section>
    );
  }

  const sending = phase.kind === "sending";
  const previous = snapshot.previous;
  return (
    <section aria-labelledby={`${id}-preview`} className="tw-space-y-5">
      <div className="tw-space-y-2">
        <Heading
          id={`${id}-preview`}
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
        >
          {t(locale, "diagnostics.preview.heading")}
        </Heading>
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "diagnostics.preview.never")}
        </p>
      </div>

      <div className="tw-space-y-2">
        <SubHeading className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          {t(locale, "diagnostics.device.heading")}
        </SubHeading>
        <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-1 tw-text-sm sm:tw-grid-cols-[auto_1fr]">
          {(
            [
              ["diagnostics.device.version", snapshot.app_version],
              ["diagnostics.device.platform", snapshot.platform],
              ["diagnostics.device.device", snapshot.device],
              ["diagnostics.device.browser", snapshot.browser],
              [
                "diagnostics.device.flags",
                snapshot.flags.length > 0
                  ? snapshot.flags.join(", ")
                  : t(locale, "diagnostics.device.flagsNone"),
              ],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="tw-contents">
              <dt className="tw-text-iron-400">{t(locale, key)}</dt>
              <dd className="tw-m-0 tw-break-words tw-text-iron-100">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="tw-space-y-2">
        <SubHeading
          id={`${id}-activity`}
          className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
        >
          {t(locale, "diagnostics.activity.heading")}
        </SubHeading>
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">
          {t(locale, "diagnostics.activity.count", {
            count: formatInteger(locale, snapshot.entries.length),
          })}
        </p>
        <EntryList
          locale={locale}
          entries={snapshot.entries}
          labelledBy={`${id}-activity`}
        />
      </div>

      {previous && (
        <div className="tw-space-y-2">
          <SubHeading
            id={`${id}-previous`}
            className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
          >
            {t(locale, "diagnostics.previous.heading")}
          </SubHeading>
          <EntryList
            locale={locale}
            entries={previous.entries}
            labelledBy={`${id}-previous`}
          />
        </div>
      )}

      <details className="tw-text-sm">
        <summary className="tw-cursor-pointer tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "diagnostics.raw.summary")}
        </summary>
        <pre
          tabIndex={0}
          className="tw-mt-2 tw-max-h-80 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-xs tw-text-iron-300"
        >
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      </details>

      {screenshotSupported && (
        <div className="tw-space-y-2">
          <div className="tw-flex tw-items-start tw-gap-3">
            <input
              id={`${id}-screenshot`}
              type="checkbox"
              checked={attachScreenshot}
              onChange={(event) => setAttachScreenshot(event.target.checked)}
              aria-describedby={`${id}-screenshot-hint`}
              className="tw-mt-1 tw-size-5 tw-shrink-0"
            />
            <div>
              <label
                htmlFor={`${id}-screenshot`}
                className="tw-text-sm tw-font-medium tw-text-iron-100"
              >
                {t(locale, "diagnostics.screenshot.label")}
              </label>
              <p
                id={`${id}-screenshot-hint`}
                className="tw-m-0 tw-text-sm tw-text-iron-400"
              >
                {t(locale, "diagnostics.screenshot.hint")}
              </p>
            </div>
          </div>
          {attachScreenshot && (
            <div className="tw-space-y-2 tw-pl-8">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void capture()}
              >
                {t(
                  locale,
                  screenshot
                    ? "diagnostics.screenshot.retake"
                    : "diagnostics.screenshot.capture"
                )}
              </Button>
              {screenshot && (
                // A local data URL the person just captured; nothing to optimize.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshot}
                  alt={t(locale, "diagnostics.screenshot.alt")}
                  className="tw-block tw-max-h-64 tw-max-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700"
                />
              )}
              {screenshotFailed && (
                <p role="status" className="tw-m-0 tw-text-sm tw-text-iron-400">
                  {t(locale, "diagnostics.screenshot.failed")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <Button onClick={() => void send()} loading={sending}>
          {t(locale, "diagnostics.send")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setSnapshot(getFlightSnapshot())}
          disabled={sending}
        >
          {t(locale, "diagnostics.refresh")}
        </Button>
      </div>
      <p
        role="status"
        className="tw-m-0 tw-min-h-5 tw-text-sm tw-text-iron-300"
      >
        {sending ? t(locale, "diagnostics.sending") : ""}
      </p>
      {phase.kind === "error" && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
          {t(locale, ERROR_KEYS[phase.reason])}
        </p>
      )}
    </section>
  );
}
