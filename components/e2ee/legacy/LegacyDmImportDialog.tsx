"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/utils/button/Button";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { E2eeEngine } from "@/lib/e2ee/types";
import { tCount } from "../e2eeFormat";
import { E2eeDialog } from "../ui/E2eeDialog";
import { collectLegacyDmItems, fetchLegacyDmDrops } from "./legacyDmExport";
import {
  browserImportIo,
  runLegacyDmImport,
  type LegacyImportProgress,
  type LegacyImportResult,
} from "./legacyDmImport";
import { formatLegacyDmDeletionDate } from "./legacyDmRetention";

type Phase =
  | { kind: "idle" }
  | { kind: "reading"; count: number }
  | { kind: "moving"; progress: LegacyImportProgress }
  | { kind: "finished"; result: LegacyImportResult }
  | { kind: "error" };

/**
 * Moves the DM's history into the encrypted chat `g` (D146). Runs in this
 * tab; closing the dialog stops it, and a later run picks up where it left.
 */
export function LegacyDmImportDialog({
  open,
  onClose,
  wave,
  g,
  engine,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly wave: ApiWave;
  readonly g: string;
  readonly engine: E2eeEngine;
}) {
  const locale = useBrowserLocale();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const start = async (skipMedia = false) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setPhase({ kind: "reading", count: 0 });
    try {
      const drops = await fetchLegacyDmDrops({
        waveId: wave.id,
        signal: controller.signal,
        onProgress: (count) => setPhase({ kind: "reading", count }),
      });
      const result = await runLegacyDmImport({
        g,
        waveId: wave.id,
        items: collectLegacyDmItems(drops),
        deps: { engine, ...browserImportIo },
        signal: controller.signal,
        onProgress: (progress) => setPhase({ kind: "moving", progress }),
        skipMedia,
      });
      setPhase({ kind: "finished", result });
    } catch {
      setPhase(
        controller.signal.aborted ? { kind: "idle" } : { kind: "error" }
      );
    }
  };

  const stop = () => controllerRef.current?.abort();
  const close = () => {
    stop();
    onClose();
  };
  const running = phase.kind === "reading" || phase.kind === "moving";
  const date = formatLegacyDmDeletionDate(locale);
  const storageFull =
    phase.kind === "finished" &&
    phase.result.outcome === "paused" &&
    phase.result.pause === "storage";

  return (
    <E2eeDialog
      open={open}
      onClose={close}
      title={t(locale, "e2ee.legacy.import.title")}
      closeLabel={t(locale, "e2ee.action.close")}
      size="md"
      description={t(locale, "e2ee.legacy.import.intro")}
      footer={
        running ? (
          <Button variant="secondary" size="sm" onClick={stop}>
            {t(locale, "e2ee.legacy.import.stop")}
          </Button>
        ) : (
          <>
            {storageFull ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void start(true)}
              >
                {t(locale, "e2ee.legacy.import.continueWithoutMedia")}
              </Button>
            ) : null}
            <Button variant="primary" size="sm" onClick={() => void start()}>
              {phase.kind === "idle"
                ? t(locale, "e2ee.legacy.import.start")
                : t(locale, "e2ee.legacy.import.continue")}
            </Button>
          </>
        )
      }
    >
      <div className="tw-flex tw-flex-col tw-gap-3 tw-text-sm tw-leading-6 tw-text-iron-300">
        <p className="tw-m-0">{t(locale, "e2ee.legacy.import.label")}</p>
        <p className="tw-m-0">
          {t(locale, "e2ee.legacy.import.audience", { date })}
        </p>
        <p className="tw-m-0">{t(locale, "e2ee.legacy.import.keepOpen")}</p>
        <ImportStatus phase={phase} />
      </div>
    </E2eeDialog>
  );
}

function ImportStatus({ phase }: { readonly phase: Phase }) {
  const locale = useBrowserLocale();
  const n = (value: number) => formatInteger(locale, value);
  let lines: string[] = [];
  let progress: LegacyImportProgress | null = null;
  switch (phase.kind) {
    case "idle":
      break;
    case "reading":
      lines = [
        tCount(
          locale,
          {
            one: "e2ee.legacy.export.progress.one",
            other: "e2ee.legacy.export.progress.other",
          },
          phase.count
        ),
      ];
      break;
    case "moving":
      progress = phase.progress;
      break;
    case "finished":
      progress = phase.result;
      lines = [finishedLine(locale, phase.result)];
      break;
    case "error":
      lines = [t(locale, "e2ee.legacy.import.error")];
      break;
  }
  const done = progress
    ? progress.sent + progress.skipped + progress.failed
    : 0;
  return (
    <div
      role="status"
      aria-live="polite"
      className="tw-flex tw-flex-col tw-gap-1"
    >
      {progress ? (
        <>
          <progress
            className="tw-h-2 tw-w-full tw-accent-primary-400"
            max={Math.max(progress.total, 1)}
            value={done}
            aria-label={t(locale, "e2ee.legacy.import.progressLabel")}
          />
          <p className="tw-m-0 tw-text-iron-200">
            {t(locale, "e2ee.legacy.import.progress", {
              done: n(done),
              total: n(progress.total),
            })}
          </p>
          <p className="tw-m-0">
            {t(locale, "e2ee.legacy.import.media", {
              moved: n(progress.mediaMoved),
              tooLarge: n(progress.mediaTooLarge),
              notMoved: n(progress.mediaNotMoved),
            })}
          </p>
          {progress.failed > 0 ? (
            <p className="tw-m-0 tw-text-amber-200">
              {tCount(
                locale,
                {
                  one: "e2ee.legacy.import.failedSome.one",
                  other: "e2ee.legacy.import.failedSome.other",
                },
                progress.failed
              )}
            </p>
          ) : null}
        </>
      ) : null}
      {lines.map((line) => (
        <p key={line} className="tw-m-0 tw-text-iron-200">
          {line}
        </p>
      ))}
    </div>
  );
}

function finishedLine(
  locale: ReturnType<typeof useBrowserLocale>,
  result: LegacyImportResult
): string {
  if (result.outcome === "paused") {
    return result.pause === "storage"
      ? t(locale, "e2ee.legacy.import.pausedStorage")
      : t(locale, "e2ee.legacy.import.paused");
  }
  if (result.outcome === "cancelled") {
    return t(locale, "e2ee.legacy.import.cancelled");
  }
  return t(locale, "e2ee.legacy.import.done", {
    sent: formatInteger(locale, result.sent),
    skipped: formatInteger(locale, result.skipped),
  });
}
