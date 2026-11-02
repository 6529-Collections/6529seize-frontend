"use client";

// global-error replaces the root layout, so none of the app's providers
// (title, auth, locale, query client, ...) are mounted here. Everything this
// file renders must work without context: no hooks that read a provider, no
// shared components that do, and no dependency on the layout's global CSS
// (it is not guaranteed to be loaded when this boundary takes over).

import {
  getErrorBoundaryRetry,
  type ErrorBoundaryRetryProps,
} from "@/components/error/errorBoundaryRetry";
import { publicEnv } from "@/config/env";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, tRich } from "@/i18n/messages";
import { extractErrorDetails } from "@/utils/error-extractor";
import * as Sentry from "@sentry/nextjs";
import { useEffect, useMemo } from "react";

const SUPPORT_EMAIL = "support@6529.io";

// Self-contained stylesheet: the shared Tailwind/global CSS may be absent. The
// stack trace wraps and grows with the page instead of scrolling in a nested
// box, so it needs no extra tab stop to stay keyboard accessible.
const GLOBAL_ERROR_CSS = `
html,body{margin:0;background:#000;color:#fff;font-family:Montserrat,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5}
.global-error{box-sizing:border-box;display:flex;align-items:center;justify-content:center;min-height:100vh;min-height:100dvh;padding:24px 16px}
.global-error__card{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;max-width:36rem;text-align:center}
.global-error__title{margin:0;font-size:1.75rem;font-weight:600;line-height:1.2}
.global-error__text{margin:0;color:#cecfd4}
.global-error__link{color:#84adff;text-decoration:underline;text-underline-offset:3px}
.global-error__link:hover{color:#fff}
.global-error__actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px 24px}
.global-error__retry{min-height:44px;padding:10px 24px;border:0;border-radius:8px;background:#395fe4;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.global-error__retry:hover{background:#3f69fc}
.global-error__retry:focus-visible,.global-error__link:focus-visible,.global-error__summary:focus-visible{outline:2px solid #84adff;outline-offset:3px}
.global-error__details{width:100%;margin-top:16px;text-align:left}
.global-error__summary{cursor:pointer;font-weight:600;text-align:center}
.global-error__trace{margin:8px 0 0;padding:16px;border-radius:8px;background:#111;color:#cecfd4;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
`;

type GlobalErrorProps = ErrorBoundaryRetryProps & {
  readonly error: Error & { digest?: string | undefined };
};

export default function GlobalError({
  error,
  ...retryProps
}: GlobalErrorProps) {
  const retry = getErrorBoundaryRetry(retryProps);
  // useBrowserLocale only reads navigator (after hydration) and falls back to
  // en-US, so it is safe to use without any provider.
  const locale = useBrowserLocale();

  useEffect(() => {
    if (!publicEnv.SENTRY_DSN) return;
    Sentry.captureException(error);
  }, [error]);

  const stackTrace = useMemo(
    () => extractErrorDetails(error, "GLOBAL_ERROR"),
    [error]
  );
  const digest = error.digest;
  const hasDetails = Boolean(digest) || stackTrace !== "";

  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{t(locale, "globalError.documentTitle")}</title>
        <style>{GLOBAL_ERROR_CSS}</style>
      </head>
      <body>
        <main className="global-error">
          <div className="global-error__card">
            <h1 className="global-error__title">
              {t(locale, "globalError.title")}
            </h1>
            <p className="global-error__text">
              {tRich(locale, "globalError.description", {
                email: (
                  <a
                    key="email"
                    className="global-error__link"
                    href={`mailto:${SUPPORT_EMAIL}`}
                  >
                    {SUPPORT_EMAIL}
                  </a>
                ),
              })}
            </p>
            <div className="global-error__actions">
              <button
                type="button"
                className="global-error__retry"
                onClick={() => retry()}
              >
                {t(locale, "globalError.retry")}
              </button>
              {/* A plain anchor is deliberate: it does a full document load,
                  which resets the app state that just failed, instead of a
                  client-side navigation through the router that failed. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a // react-doctor-disable-line react-doctor/nextjs-no-a-element deliberate full document load
                className="global-error__link"
                href="/"
              >
                {t(locale, "globalError.home")}
              </a>
            </div>
            {hasDetails && (
              <details className="global-error__details">
                <summary className="global-error__summary">
                  {t(locale, "globalError.detailsSummary")}
                </summary>
                <pre className="global-error__trace">
                  {digest
                    ? `${t(locale, "globalError.errorId", { digest })}\n\n`
                    : ""}
                  {stackTrace}
                </pre>
              </details>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
