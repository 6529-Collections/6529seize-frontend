"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { formatE2eeDateTime, tCount } from "../e2eeFormat";
import { E2eeDialog } from "../ui/E2eeDialog";
import {
  buildLegacyDmExport,
  downloadTextFile,
  fetchLegacyDmDrops,
  legacyDmExportFileName,
  renderLegacyDmHtml,
  participantsOf,
  type LegacyDmExport,
} from "./legacyDmExport";
import { formatLegacyDmDeletionDate } from "./legacyDmRetention";

type Phase =
  | { kind: "idle" }
  | { kind: "reading"; count: number }
  | { kind: "ready"; data: LegacyDmExport; at: Date }
  | { kind: "error" };

/** Export of what this member can read in an unencrypted DM (D146). */
export function LegacyDmExportDialog({
  open,
  onClose,
  wave,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly wave: ApiWave;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const prepare = async () => {
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
      const at = new Date();
      const handle = connectedProfile?.handle ?? null;
      const data = buildLegacyDmExport({
        waveId: wave.id,
        name: wave.name,
        participants: participantsOf(drops),
        exportedBy: {
          profile_id: connectedProfile?.id ?? "",
          handle,
        },
        exportedAt: at,
        notice: t(locale, "e2ee.legacy.file.notice", {
          handle: handle
            ? `@${handle}`
            : t(locale, "e2ee.legacy.file.unknownAuthor"),
          date: formatDate(locale, at),
          deletionDate: formatLegacyDmDeletionDate(locale),
        }),
        drops,
      });
      setPhase({ kind: "ready", data, at });
    } catch {
      setPhase(
        controller.signal.aborted ? { kind: "idle" } : { kind: "error" }
      );
    }
  };

  const close = () => {
    controllerRef.current?.abort();
    setPhase({ kind: "idle" });
    onClose();
  };

  const downloadJson = (data: LegacyDmExport, at: Date) =>
    downloadTextFile(
      legacyDmExportFileName(wave.name, at, "json"),
      JSON.stringify(data, null, 2),
      "application/json"
    );

  const downloadHtml = (data: LegacyDmExport, at: Date) =>
    downloadTextFile(
      legacyDmExportFileName(wave.name, at, "html"),
      renderLegacyDmHtml(data, {
        lang: locale,
        title: t(locale, "e2ee.legacy.file.title", { name: wave.name }),
        exportedAt: t(locale, "e2ee.legacy.file.exportedAt", {
          date: formatE2eeDateTime(locale, at.getTime()),
        }),
        participants: t(locale, "e2ee.legacy.file.participants"),
        replyTo: t(locale, "e2ee.legacy.file.replyTo"),
        edited: t(locale, "e2ee.legacy.file.edited"),
        media: t(locale, "e2ee.legacy.file.media"),
        unknownAuthor: t(locale, "e2ee.legacy.file.unknownAuthor"),
        formatTime: (ms) => formatE2eeDateTime(locale, ms),
      }),
      "text/html"
    );

  let status: string | null = null;
  if (phase.kind === "reading") {
    status = tCount(
      locale,
      {
        one: "e2ee.legacy.export.progress.one",
        other: "e2ee.legacy.export.progress.other",
      },
      phase.count
    );
  } else if (phase.kind === "ready") {
    status = tCount(
      locale,
      {
        one: "e2ee.legacy.export.ready.one",
        other: "e2ee.legacy.export.ready.other",
      },
      phase.data.messages.length
    );
  } else if (phase.kind === "error") {
    status = t(locale, "e2ee.legacy.export.failed");
  }

  let footer;
  if (phase.kind === "ready") {
    footer = (
      <>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => downloadJson(phase.data, phase.at)}
        >
          {t(locale, "e2ee.legacy.export.json")}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => downloadHtml(phase.data, phase.at)}
        >
          {t(locale, "e2ee.legacy.export.html")}
        </Button>
      </>
    );
  } else {
    footer = (
      <Button
        variant="primary"
        size="sm"
        loading={phase.kind === "reading"}
        onClick={() => void prepare()}
      >
        {phase.kind === "error"
          ? t(locale, "e2ee.legacy.export.retry")
          : t(locale, "e2ee.legacy.export.start")}
      </Button>
    );
  }

  return (
    <E2eeDialog
      open={open}
      onClose={close}
      title={t(locale, "e2ee.legacy.export.title")}
      closeLabel={t(locale, "e2ee.action.close")}
      description={t(locale, "e2ee.legacy.export.description")}
      footer={footer}
    >
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "e2ee.legacy.export.media", {
          date: formatLegacyDmDeletionDate(locale),
        })}
      </p>
      <p
        role="status"
        aria-live="polite"
        className="tw-mb-0 tw-mt-3 tw-min-h-6 tw-text-sm tw-text-iron-200"
      >
        {status}
      </p>
    </E2eeDialog>
  );
}
