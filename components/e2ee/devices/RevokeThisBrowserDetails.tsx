"use client";

import Link from "next/link";
import Button from "@/components/utils/button/Button";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import { useE2eeBackup } from "@/hooks/e2ee/useE2eeBackup";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeBackupSnapshot } from "@/lib/e2ee/backup";
import { E2eeBanner } from "../ui/E2eeBanner";

type BackupState = "on" | "off" | "unknown";

const BACKUP_KEYS: Record<BackupState, MessageKey> = {
  on: "e2ee.devices.revokeThisBackupOn",
  off: "e2ee.devices.revokeThisBackupOff",
  unknown: "e2ee.devices.revokeThisBackupUnknown",
};

/** Whether this browser's encrypted chats are in a finished backup. */
function getBackupState(snapshot: E2eeBackupSnapshot | null): BackupState {
  if (snapshot?.phase === "off") {
    return "off";
  }
  if (
    snapshot?.phase === "on" &&
    !snapshot.uploading &&
    snapshot.lastBackupAt !== null
  ) {
    return "on";
  }
  return "unknown";
}

/**
 * Where "Set up backup first" leads: the backup card on this page, or a link
 * to the page that has it.
 */
type SetUpBackupAction =
  | { readonly onClick: () => void }
  | { readonly href: string };

function SetUpBackupFirst({
  action,
  labelKey,
}: {
  readonly action: SetUpBackupAction;
  readonly labelKey: MessageKey;
}) {
  const locale = useBrowserLocale();
  if ("href" in action) {
    return (
      <Link
        href={action.href}
        className={getButtonClasses({ variant: "secondary", size: "sm" })}
      >
        {t(locale, labelKey)}
      </Link>
    );
  }
  return (
    <Button variant="secondary" size="sm" onClick={action.onClick}>
      {t(locale, labelKey)}
    </Button>
  );
}

/**
 * What revoking the browser in use ends, and whether its encrypted chats
 * survive: with backup off it warns and offers to set backup up first.
 */
export function RevokeThisBrowserDetails({
  signedPosts,
  encryptedDms,
  setUpBackup,
}: {
  readonly signedPosts: boolean;
  readonly encryptedDms: boolean;
  readonly setUpBackup: SetUpBackupAction | null;
}) {
  const locale = useBrowserLocale();
  const { snapshot } = useE2eeBackup();
  const backup = getBackupState(snapshot);
  // The backup card is behind this dialog, so an unknown state needs no
  // button there; elsewhere the link leads to the card.
  const showAction =
    setUpBackup !== null &&
    (backup === "off" || (backup === "unknown" && "href" in setUpBackup));

  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-text-sm tw-leading-6 tw-text-iron-300">
      {signedPosts ? (
        <p className="tw-m-0">{t(locale, "e2ee.devices.revokeThisPosts")}</p>
      ) : null}
      {encryptedDms ? (
        <>
          <p className="tw-m-0">{t(locale, "e2ee.devices.revokeThisDms")}</p>
          <E2eeBanner
            tone={backup === "on" ? "info" : "warning"}
            live={false}
            action={
              showAction ? (
                <SetUpBackupFirst
                  action={setUpBackup}
                  labelKey={
                    backup === "off"
                      ? "e2ee.devices.revokeThisSetUpBackup"
                      : "e2ee.devices.revokeThisCheckBackup"
                  }
                />
              ) : undefined
            }
          >
            {t(locale, BACKUP_KEYS[backup])}
          </E2eeBanner>
        </>
      ) : null}
    </div>
  );
}
