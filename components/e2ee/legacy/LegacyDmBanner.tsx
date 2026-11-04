"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getEncryptedConversationRoute } from "@/helpers/navigation.helpers";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useStartEncryptedChatFromDm } from "../plaintext/PlaintextDmEncryptionNotice";
import { E2eeBanner } from "../ui/E2eeBanner";
import { useE2eeNow } from "../useE2eeNow";
import { LegacyDmExportDialog } from "./LegacyDmExportDialog";
import { LegacyDmImportDialog } from "./LegacyDmImportDialog";
import {
  formatLegacyDmDeletionDate,
  isLegacyDmClosed,
} from "./legacyDmRetention";
import { useEncryptedEquivalent } from "./useEncryptedEquivalent";

const ACTION_CLASS =
  "tw-max-w-full tw-min-h-8 tw-break-words tw-px-2.5 tw-py-1 tw-text-center tw-text-xs !tw-whitespace-normal";

/**
 * Unencrypted DM threads (D146): a permanent notice that the history leaves
 * 6529's servers on the deletion date, with export, start or open the
 * encrypted chat, and move the history into it. The composer is replaced by
 * the notice once an encrypted chat with the same people exists on this
 * device, and for everyone from the deletion date.
 */
export function LegacyDmComposerGate({
  wave,
  enabled,
  children,
}: {
  readonly wave: ApiWave;
  readonly enabled: boolean;
  readonly children: ReactNode;
}) {
  const active = enabled && isE2eeEnabled();
  const now = useE2eeNow();
  const equivalent = useEncryptedEquivalent(wave, active);
  if (!active) {
    return <>{children}</>;
  }
  // Before the first client tick `now` is 0: never treat that as closed.
  const closed = now > 0 && isLegacyDmClosed(now);
  const readOnly = closed || equivalent !== null;
  return (
    <>
      <LegacyDmBanner
        wave={wave}
        closed={closed}
        encryptedG={equivalent?.g ?? null}
      />
      {readOnly ? null : children}
    </>
  );
}

function LegacyDmBanner({
  wave,
  closed,
  encryptedG,
}: {
  readonly wave: ApiWave;
  readonly closed: boolean;
  readonly encryptedG: string | null;
}) {
  const locale = useBrowserLocale();
  const { activeProfileProxy } = useAuth();
  const { engine, status } = useE2ee();
  const start = useStartEncryptedChatFromDm(wave);
  const [dialog, setDialog] = useState<"export" | "import" | null>(null);
  const date = formatLegacyDmDeletionDate(locale);
  const isProxy = activeProfileProxy !== null;

  if (closed) {
    return (
      <E2eeBanner tone="warning" live={false} className="tw-mx-2 tw-mb-2">
        {t(locale, "e2ee.legacy.banner.closed", { date })}
      </E2eeBanner>
    );
  }

  const canMove = encryptedG !== null && engine !== null && status === "ready";
  let encryptedAction: ReactNode = null;
  if (encryptedG) {
    encryptedAction = (
      <Link
        href={getEncryptedConversationRoute(encryptedG)}
        className={getButtonClasses({
          variant: "secondary",
          size: null,
          className: `${ACTION_CLASS} tw-no-underline`,
        })}
      >
        {t(locale, "e2ee.legacy.action.openEncrypted")}
      </Link>
    );
  } else if (start.available) {
    encryptedAction = (
      <Button
        variant="secondary"
        size={null}
        className={ACTION_CLASS}
        loading={start.pending}
        onClick={() => void start.start()}
      >
        {t(locale, "e2ee.plaintext.startShort")}
      </Button>
    );
  }

  return (
    <section
      aria-label={t(locale, "e2ee.legacy.region")}
      className="tw-mx-2 tw-mb-2 tw-@container/legacy-dm"
    >
      <E2eeBanner
        tone="warning"
        live={false}
        compactActions
        action={
          isProxy ? null : (
            <>
              <Button
                variant="ghost"
                size={null}
                className={`${ACTION_CLASS} !tw-text-amber-100`}
                onClick={() => setDialog("export")}
              >
                {t(locale, "e2ee.legacy.action.export")}
              </Button>
              {canMove ? (
                <Button
                  variant="secondary"
                  size={null}
                  className={ACTION_CLASS}
                  onClick={() => setDialog("import")}
                >
                  {t(locale, "e2ee.legacy.action.move")}
                </Button>
              ) : null}
              {encryptedAction}
            </>
          )
        }
      >
        <strong className="tw-font-semibold">
          {t(locale, "e2ee.legacy.banner.label")}
        </strong>{" "}
        {t(locale, "e2ee.legacy.banner.deletion", { date })}
        {encryptedG ? (
          <span className="tw-mt-1 tw-block">
            {t(locale, "e2ee.legacy.readOnly")}
          </span>
        ) : null}
      </E2eeBanner>
      {dialog === "export" ? (
        <LegacyDmExportDialog
          open
          onClose={() => setDialog(null)}
          wave={wave}
        />
      ) : null}
      {dialog === "import" && encryptedG && engine ? (
        <LegacyDmImportDialog
          open
          onClose={() => setDialog(null)}
          wave={wave}
          g={encryptedG}
          engine={engine}
        />
      ) : null}
    </section>
  );
}
