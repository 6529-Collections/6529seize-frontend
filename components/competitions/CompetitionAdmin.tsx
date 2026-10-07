"use client";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/outline";
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
  isMultiCompetitionEnabled,
  newCompetitionRequestKey,
} from "@/helpers/competition.helpers";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CompetitionAppearance from "./CompetitionAppearance";
import CompetitionPauseHistory from "./CompetitionPauseHistory";
import { COMPETITION_BUTTON, COMPETITION_INPUT } from "./CompetitionState";

function getLifecycleActions(
  lifecycle: ApiCompetitionLifecycle,
  legacy: boolean
): CompetitionAction[] {
  if (legacy) return [];
  switch (lifecycle) {
    case ApiCompetitionLifecycle.Draft:
      return ["publish", "archive"];
    case ApiCompetitionLifecycle.Published:
      return [];
    case ApiCompetitionLifecycle.Archived:
      return ["clone"];
    case ApiCompetitionLifecycle.Ended:
    case ApiCompetitionLifecycle.Cancelled:
      return ["archive", "clone"];
  }
}

export default function CompetitionAdmin({
  paused,
  onEdit,
}: {
  readonly paused: boolean | null;
  readonly onEdit: () => void;
}) {
  const { competition, hub } = useCompetition();
  const legacy = hub.legacy_primary_competition_id === competition.id;
  const { requestAuth } = useAuth();
  const locale = useBrowserLocale();
  const router = useRouter();
  const client = useQueryClient();
  const [action, setAction] = useState<CompetitionAction | null>(null);
  const [actionVersion, setActionVersion] = useState(
    competition.config_version
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef<{
    action: CompetitionAction;
    reason: string;
    version: number;
    key: string;
  } | null>(null);
  const canAdminister =
    isMultiCompetitionEnabled() && competition.permissions.administer;
  const actions = getLifecycleActions(competition.lifecycle, legacy);
  const openAction = (command: CompetitionAction) => {
    setActionVersion(competition.config_version);
    setReason("");
    setFailed(false);
    setAction(command);
  };
  const execute = async () => {
    const trimmedReason = reason.trim();
    if (!action || busy || (action === "pause" && !trimmedReason)) return;
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
        pending.current.reason !== trimmedReason ||
        pending.current.version !== actionVersion
      )
        pending.current = {
          action,
          reason: trimmedReason,
          version: actionVersion,
          key: newCompetitionRequestKey(),
        };
      const result = await performCompetitionAction(identity, action, {
        idempotency_key: pending.current.key,
        config_version: actionVersion,
        reason: trimmedReason,
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
    <>
      <CompetitionPauseHistory
        action={
          canAdminister &&
          competition.lifecycle === ApiCompetitionLifecycle.Published &&
          paused !== null ? (
            <button
              type="button"
              className={`${COMPETITION_BUTTON} tw-gap-2`}
              disabled={busy}
              onClick={() => openAction(paused ? "resume" : "pause")}
            >
              {paused ? (
                <PlayIcon className="tw-size-4" aria-hidden="true" />
              ) : (
                <PauseIcon className="tw-size-4" aria-hidden="true" />
              )}
              {t(locale, paused ? "competitions.resume" : "competitions.pause")}
            </button>
          ) : null
        }
      />
      <CompetitionAppearance />
      {canAdminister &&
        (actions.length > 0 ||
          competition.lifecycle === ApiCompetitionLifecycle.Draft) && (
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {competition.lifecycle === ApiCompetitionLifecycle.Draft && (
              <button
                type="button"
                className={COMPETITION_BUTTON}
                onClick={onEdit}
              >
                {t(locale, "competitions.finishSetup")}
              </button>
            )}
            {actions.map((command) => (
              <button
                key={command}
                type="button"
                className={COMPETITION_BUTTON}
                disabled={busy}
                onClick={() => openAction(command)}
              >
                {t(locale, `competitions.${command}`)}
              </button>
            ))}
          </div>
        )}
      {action && (
        <MobileWrapperConfirmationDialog
          isConfirming={busy}
          confirmDisabled={action === "pause" && !reason.trim()}
          isOpen
          title={t(locale, "competitions.confirmAction", {
            action: t(locale, `competitions.${action}`),
            title: competition.title,
          })}
          message={t(
            locale,
            action === "pause"
              ? "competitions.pauseConsequences"
              : "competitions.actionConsequences"
          )}
          confirmText={t(locale, "competitions.confirm")}
          cancelText={t(locale, "competitions.dismiss")}
          onClose={() => {
            if (!busy) setAction(null);
          }}
          onConfirm={() => {
            void execute();
          }}
        >
          {action !== "resume" && (
            <div className="tw-mt-5">
              <label
                className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
                htmlFor="competition-action-reason"
              >
                {t(
                  locale,
                  action === "pause"
                    ? "competitions.reasonRequired"
                    : "competitions.reasonOptional"
                )}
              </label>
              <textarea
                id="competition-action-reason"
                className={`${COMPETITION_INPUT} tw-min-h-28 tw-resize-y tw-text-sm`}
                value={reason}
                required={action === "pause"}
                maxLength={2000}
                rows={3}
                disabled={busy}
                aria-describedby={
                  action === "pause"
                    ? "competition-pause-reason-help"
                    : undefined
                }
                onChange={(event) => setReason(event.target.value)}
              />
              {action === "pause" && (
                <p
                  id="competition-pause-reason-help"
                  className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400"
                >
                  {t(locale, "competitions.pauseReasonHelp")}
                </p>
              )}
            </div>
          )}
          {failed && (
            <p role="alert" className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-red">
              {t(locale, "competitions.failure")}
            </p>
          )}
        </MobileWrapperConfirmationDialog>
      )}
    </>
  );
}
