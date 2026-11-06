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
  getCompetitionsRoute,
  newCompetitionRequestKey,
} from "@/helpers/competition.helpers";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CompetitionAppearance from "./CompetitionAppearance";
import CompetitionPauseHistory from "./CompetitionPauseHistory";
import { COMPETITION_BUTTON, COMPETITION_INPUT } from "./CompetitionState";

function getLifecycleActions(
  lifecycle: ApiCompetitionLifecycle
): CompetitionAction[] {
  switch (lifecycle) {
    case ApiCompetitionLifecycle.Draft:
      return ["publish", "archive"];
    case ApiCompetitionLifecycle.Published:
      return ["archive"];
    case ApiCompetitionLifecycle.Archived:
      return ["clone"];
    case ApiCompetitionLifecycle.Ended:
    case ApiCompetitionLifecycle.Cancelled:
      return ["archive", "clone"];
  }
}

export default function CompetitionAdmin({
  paused = null,
  onEdit,
  archiveOnly = false,
}: {
  readonly paused?: boolean | null;
  readonly onEdit?: () => void;
  readonly archiveOnly?: boolean;
}) {
  const { competition } = useCompetition();
  const { requestAuth } = useAuth();
  const locale = useBrowserLocale();
  const router = useRouter();
  const client = useQueryClient();
  const [action, setAction] = useState<CompetitionAction | null>(null);
  const [actionSnapshot, setActionSnapshot] = useState({
    version: competition.config_version,
    lifecycle: competition.lifecycle,
  });
  const { version: actionVersion, lifecycle: actionLifecycle } = actionSnapshot;
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef<{
    action: CompetitionAction;
    reason: string;
    version: number;
    key: string;
  } | null>(null);
  const canAdminister = competition.permissions.administer;
  const canEditRules =
    competition.permissions.edit_rules_after_activity === true;
  const actions = getLifecycleActions(competition.lifecycle).filter(
    (command) => !archiveOnly || command === "archive"
  );
  const published = competition.lifecycle === ApiCompetitionLifecycle.Published;
  const reasonRequired =
    action === "pause" ||
    (action === "archive" &&
      published &&
      competition.permissions.archive_requires_reason !== false);
  const reasonHelpId =
    action === "pause"
      ? "competition-pause-reason-help"
      : "competition-archive-reason-help";
  const actionLabel = (command: CompetitionAction) =>
    t(
      locale,
      command === "archive" && published
        ? "competitions.archiveAndStop"
        : `competitions.${command}`
    );
  const consequences = () => {
    if (action === "pause") return "competitions.pauseConsequences";
    if (action === "archive" && published)
      return "competitions.archiveStopConsequences";
    if (action === "archive") return "competitions.archiveConsequences";
    return "competitions.actionConsequences";
  };
  const openAction = (command: CompetitionAction) => {
    setActionSnapshot({
      version: competition.config_version,
      lifecycle: competition.lifecycle,
    });
    setReason("");
    setFailed(false);
    setAction(command);
  };
  const execute = async () => {
    const trimmedReason = reason.trim();
    if (!action || busy || (reasonRequired && !trimmedReason)) return;
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
      if (
        action === "archive" &&
        actionLifecycle === ApiCompetitionLifecycle.Draft
      )
        router.push(getCompetitionsRoute(competition.wave_id));
    } catch {
      setFailed(true);
      await invalidateCompetition(client, identity);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {!archiveOnly && (
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
                {t(
                  locale,
                  paused ? "competitions.resume" : "competitions.pause"
                )}
              </button>
            ) : null
          }
        />
      )}
      {!archiveOnly && <CompetitionAppearance />}
      {canAdminister &&
        (actions.length > 0 ||
          competition.lifecycle === ApiCompetitionLifecycle.Draft ||
          canEditRules) && (
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {!archiveOnly &&
              onEdit &&
              competition.lifecycle === ApiCompetitionLifecycle.Draft && (
                <button
                  type="button"
                  className={COMPETITION_BUTTON}
                  onClick={onEdit}
                >
                  {t(locale, "competitions.finishSetup")}
                </button>
              )}
            {!archiveOnly && onEdit && canEditRules && (
              <button
                type="button"
                className={COMPETITION_BUTTON}
                onClick={onEdit}
              >
                {t(locale, "competitions.editRules")}
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
                {actionLabel(command)}
              </button>
            ))}
          </div>
        )}
      {action && (
        <MobileWrapperConfirmationDialog
          isConfirming={busy}
          confirmDisabled={reasonRequired && !reason.trim()}
          isOpen
          title={t(locale, "competitions.confirmAction", {
            action: actionLabel(action),
            title: competition.title,
          })}
          message={t(locale, consequences())}
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
                  reasonRequired
                    ? "competitions.reasonRequired"
                    : "competitions.reasonOptional"
                )}
              </label>
              <textarea
                id="competition-action-reason"
                className={`${COMPETITION_INPUT} tw-min-h-28 tw-resize-y tw-text-sm`}
                value={reason}
                required={reasonRequired}
                maxLength={2000}
                rows={3}
                disabled={busy}
                aria-describedby={reasonRequired ? reasonHelpId : undefined}
                onChange={(event) => setReason(event.target.value)}
              />
              {reasonRequired && (
                <p
                  id={reasonHelpId}
                  className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400"
                >
                  {t(
                    locale,
                    action === "pause"
                      ? "competitions.pauseReasonHelp"
                      : "competitions.archiveReasonHelp"
                  )}
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
