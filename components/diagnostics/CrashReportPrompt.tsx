"use client";

import Button from "@/components/utils/button/Button";
import { publicEnv } from "@/config/env";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/diagnostics";
import dynamic from "next/dynamic";
import { useId, useState } from "react";

// Loaded only when the person asks to review the report.
const DiagnosticsPanel = dynamic(() => import("./DiagnosticsPanel"), {
  ssr: false,
});

/**
 * The crash prompt (R14 §4.4): after an error boundary catches a crash, it
 * offers to send the team a report. Nothing is sent unless the person opens
 * the report, reviews it and chooses Send.
 */
export default function CrashReportPrompt() {
  const locale = useBrowserLocale();
  const id = useId();
  const [open, setOpen] = useState(false);

  if (publicEnv.NEXT_PUBLIC_FEATURE_DIAGNOSTICS !== "true") return null;

  return (
    <div className="tw-mt-6 tw-box-border tw-w-full tw-max-w-3xl tw-px-4">
      <section
        aria-labelledby={`${id}-heading`}
        className="tw-space-y-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-text-left sm:tw-p-6"
      >
        <h2
          id={`${id}-heading`}
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
        >
          {t(locale, "diagnostics.crash.heading")}
        </h2>
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "diagnostics.crash.text")}
        </p>
        <Button
          variant="secondary"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((value) => !value)}
        >
          {t(
            locale,
            open ? "diagnostics.crash.hide" : "diagnostics.crash.review"
          )}
        </Button>
        <div id={`${id}-panel`} hidden={!open}>
          {open && <DiagnosticsPanel headingLevel={3} />}
        </div>
      </section>
    </div>
  );
}
