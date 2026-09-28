"use client";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useAuth } from "@/components/auth/Auth";
import {
  invalidateCompetition,
  performCompetitionAction,
  type CompetitionAction,
} from "@/services/api/competitions-api";
import {
  getCompetitionRoute,
  newCompetitionRequestKey,
} from "@/helpers/competition.helpers";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { COMPETITION_BUTTON, COMPETITION_INPUT } from "./CompetitionState";

export default function CompetitionAdmin({
  paused,
  onEdit,
}: {
  readonly paused: boolean | null;
  readonly onEdit: () => void;
}) {
  const { competition } = useCompetition();
  const { requestAuth } = useAuth();
  const locale = useBrowserLocale();
  const router = useRouter();
  const client = useQueryClient();
  const [action, setAction] = useState<CompetitionAction | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef<{
    action: CompetitionAction;
    reason: string;
    version: number;
    key: string;
  } | null>(null);
  if (!competition.permissions.administer) return null;
  let actions: CompetitionAction[] = ["archive", "clone"];
  if (competition.lifecycle === ApiCompetitionLifecycle.Draft)
    actions = ["publish", "cancel", "archive"];
  else if (competition.lifecycle === ApiCompetitionLifecycle.Published)
    actions = [
      ...(paused === null
        ? []
        : [paused ? ("resume" as const) : ("pause" as const)]),
      "end",
      "cancel",
    ];
  else if (competition.lifecycle === ApiCompetitionLifecycle.Archived)
    actions = ["clone"];
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
      if (
        pending.current?.action !== action ||
        pending.current.reason !== reason ||
        pending.current.version !== competition.config_version
      )
        pending.current = {
          action,
          reason,
          version: competition.config_version,
          key: newCompetitionRequestKey(),
        };
      const result = await performCompetitionAction(identity, action, {
        idempotency_key: pending.current.key,
        config_version: competition.config_version,
        reason,
      });
      pending.current = null;
      setAction(null);
      await invalidateCompetition(client, identity);
      if (action === "clone")
        router.push(getCompetitionRoute(competition.wave_id, result.id));
    } catch {
      setFailed(true);
      await invalidateCompetition(client, identity);
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4">
      <summary className="tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-100">
        {t(locale, "competitions.admin")}
      </summary>
      <div className="tw-mt-4 tw-space-y-4">
        <label
          className="tw-block tw-text-sm tw-text-iron-300"
          htmlFor="competition-action-reason"
        >
          {t(locale, "competitions.reason")}
        </label>
        <input
          id="competition-action-reason"
          className={COMPETITION_INPUT}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          {(competition.lifecycle === ApiCompetitionLifecycle.Draft ||
            competition.lifecycle === ApiCompetitionLifecycle.Published) && (
            <button
              type="button"
              className={COMPETITION_BUTTON}
              onClick={onEdit}
            >
              {t(locale, "competitions.edit")}
            </button>
          )}
          {actions.map((command) => (
            <button
              key={command}
              type="button"
              className={COMPETITION_BUTTON}
              disabled={busy}
              onClick={() => setAction(command)}
            >
              {t(locale, `competitions.${command}`)}
            </button>
          ))}
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
            title={t(locale, "competitions.confirmAction", {
              action: t(locale, `competitions.${action}`),
              title: competition.title,
            })}
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
    </details>
  );
}
