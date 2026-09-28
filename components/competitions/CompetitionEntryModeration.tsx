"use client";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useCompetition } from "@/contexts/CompetitionContext";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import {
  invalidateCompetition,
  performCompetitionEntryAction,
} from "@/services/api/competitions-api";
import { newCompetitionRequestKey } from "@/helpers/competition.helpers";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { COMPETITION_BUTTON, COMPETITION_INPUT } from "./CompetitionState";

export default function CompetitionEntryModeration({
  entry,
}: {
  readonly entry: ApiCompetitionEntry;
}) {
  const { competition } = useCompetition();
  const { connectedProfile, activeProfileProxy, requestAuth } = useAuth();
  const client = useQueryClient();
  const locale = useBrowserLocale();
  const [action, setAction] = useState<"withdraw" | "disqualify" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestKey = useRef(newCompetitionRequestKey());
  if (
    entry.status !== ApiCompetitionEntryStatus.Active ||
    competition.lifecycle !== ApiCompetitionLifecycle.Published
  )
    return null;
  const canWithdraw =
    (activeProfileProxy?.created_by.id ?? connectedProfile?.id) ===
    entry.submitter.id;
  if (!canWithdraw && !competition.permissions.administer) return null;
  const execute = async () => {
    if (!action || busy) return;
    setBusy(true);
    setFailed(false);
    const identity = {
      waveId: competition.wave_id,
      competitionId: competition.id,
    };
    try {
      if (!(await requestAuth()).success) return;
      await performCompetitionEntryAction(identity, entry.id, action, {
        idempotency_key: requestKey.current,
        config_version: competition.config_version,
        reason,
      });
      requestKey.current = newCompetitionRequestKey();
      setAction(null);
      await invalidateCompetition(client, identity);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="tw-space-y-2">
      <label
        className="tw-block tw-text-xs tw-text-iron-400"
        htmlFor={`entry-reason-${entry.id}`}
      >
        {t(locale, "competitions.reason")}
      </label>
      <input
        id={`entry-reason-${entry.id}`}
        className={COMPETITION_INPUT}
        value={reason}
        onChange={(event) => {
          setReason(event.target.value);
          requestKey.current = newCompetitionRequestKey();
        }}
      />
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        {canWithdraw && (
          <button
            type="button"
            disabled={busy}
            className={COMPETITION_BUTTON}
            onClick={() => setAction("withdraw")}
          >
            {t(locale, "competitions.withdraw")}
          </button>
        )}
        {competition.permissions.administer && (
          <button
            type="button"
            disabled={busy}
            className={COMPETITION_BUTTON}
            onClick={() => setAction("disqualify")}
          >
            {t(locale, "competitions.disqualify")}
          </button>
        )}
      </div>
      {failed && (
        <p role="alert" className="tw-text-sm tw-text-red">
          {t(locale, "competitions.failure")}
        </p>
      )}
      {action && (
        <MobileWrapperConfirmationDialog
          isConfirming={busy}
          isOpen
          title={t(locale, `competitions.${action}`)}
          message={t(locale, "competitions.actionConsequences")}
          confirmText={t(locale, "competitions.confirm")}
          cancelText={t(locale, "competitions.dismiss")}
          onClose={() => {
            if (!busy) setAction(null);
          }}
          onConfirm={() => {
            void execute();
          }}
        />
      )}
    </div>
  );
}
