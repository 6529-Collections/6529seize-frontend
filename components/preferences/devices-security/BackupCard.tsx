"use client";

import { useId, type ReactNode } from "react";
import { useDeviceSecurityState } from "@/components/device-signing/DeviceSecurityStatus";
import {
  getDeviceSetupScope,
  getDeviceSetupTitleKey,
  openDeviceSetup,
} from "@/components/device-signing/deviceSetup";
import {
  BackupStatusPill,
  type BackupPillState,
} from "@/components/e2ee/backup/BackupStatusPill";
import { E2eeBackupPanel } from "@/components/e2ee/backup/E2eeBackupPanel";
import { useRequestE2eeEngine } from "@/components/e2ee/e2eeEngineRequest";
import { hasContent } from "@/components/e2ee/ui/hasContent";
import Button from "@/components/utils/button/Button";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";

function BackupStateCard({
  pill,
  bodyKey,
  action,
  busy = false,
}: {
  readonly pill: BackupPillState | null;
  readonly bodyKey: MessageKey;
  readonly action?: ReactNode;
  readonly busy?: boolean;
}) {
  const locale = useBrowserLocale();
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      className="tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <h2
          id={titleId}
          className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50"
        >
          {t(locale, "e2ee.backup.title")}
        </h2>
        {pill ? <BackupStatusPill locale={locale} state={pill} /> : null}
      </div>
      {busy ? (
        <output className="tw-block tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, bodyKey)}
        </output>
      ) : (
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, bodyKey)}
        </p>
      )}
      {hasContent(action) ? (
        <div className="tw-flex tw-flex-wrap tw-gap-2">{action}</div>
      ) : null}
    </section>
  );
}

/**
 * Encrypted backup first on Devices & security. Backup lives in the
 * encrypted-messages engine, so until it runs here the card says why, with
 * the one step that helps.
 */
export function BackupCard() {
  const locale = useBrowserLocale();
  // Backup lives in the engine: wherever this card is, the engine runs.
  useRequestE2eeEngine();
  const e2ee = useE2ee();
  const { proof, canEnableEncryption } = useDeviceSecurityState();
  const setupScope = getDeviceSetupScope(proof, canEnableEncryption);
  switch (e2ee.status) {
    case "disabled":
    case "proxy":
      return null;
    case "ready":
      // Ready comes before GET /e2ee/me names this device; until then backup
      // can't act for it ("Set up encrypted messages on this device first").
      return e2ee.thisDevice ? (
        <E2eeBackupPanel />
      ) : (
        <BackupStateCard pill={null} bodyKey="e2ee.backup.status.loading" busy />
      );
    case "idle":
    case "loading":
      return (
        <BackupStateCard pill={null} bodyKey="e2ee.backup.status.loading" busy />
      );
    case "unavailable":
      return <BackupStateCard pill="unavailable" bodyKey="e2ee.gate.noWallet" />;
    case "unsupported":
      return (
        <BackupStateCard
          pill="unavailable"
          bodyKey="e2ee.gate.unsupported.title"
        />
      );
    case "elsewhere":
      return (
        <BackupStateCard
          pill="unknown"
          bodyKey="devicesSecurity.backup.elsewhere"
          action={
            <Button variant="secondary" size="sm" onClick={e2ee.takeOverHere}>
              {t(locale, "e2ee.gate.elsewhere.action")}
            </Button>
          }
        />
      );
    case "load-failed":
    case "error":
      return (
        <BackupStateCard
          pill="unknown"
          bodyKey="devicesSecurity.backup.failed"
          action={
            <Button variant="secondary" size="sm" onClick={e2ee.restart}>
              {t(locale, "e2ee.action.retry")}
            </Button>
          }
        />
      );
    case "needs-enrollment":
    case "enrolling":
      return (
        <BackupStateCard
          pill="unavailable"
          bodyKey="devicesSecurity.backup.needsDms"
          action={
            setupScope === "both" || setupScope === "dms" ? (
              <Button
                variant="action"
                size="sm"
                onClick={() => openDeviceSetup(setupScope)}
              >
                {t(locale, getDeviceSetupTitleKey(setupScope, false))}
              </Button>
            ) : null
          }
        />
      );
    case "device-limit":
      return (
        <BackupStateCard
          pill="unavailable"
          bodyKey="devicesSecurity.backup.needsDms"
        />
      );
  }
}
