"use client";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  competitionScope,
  fetchCompetitionCredits,
  invalidateCompetition,
  setCompetitionVote,
} from "@/services/api/competitions-api";
import type { ApiSetCompetitionVoteRequest } from "@/generated/models/ApiSetCompetitionVoteRequest";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import { useCompetitionSignature } from "@/hooks/competitions/useCompetitionSignature";
import {
  newCompetitionRequestKey,
  isMultiCompetitionEnabled,
  isRejectedCompetitionCommand,
} from "@/helpers/competition.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import {
  CompetitionState,
  COMPETITION_BUTTON,
  COMPETITION_INPUT,
} from "./CompetitionState";
import CompetitionCredits from "./CompetitionCredits";

function CompetitionVoteForm({
  entryId,
  dropId,
  disabled,
}: {
  readonly entryId: string;
  readonly dropId: string;
  readonly disabled: boolean;
}) {
  const { competition } = useCompetition();
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  const { requestAuth, connectedProfile } = useAuth();
  const viewer = useCompetitionViewer();
  const locale = useBrowserLocale();
  const client = useQueryClient();
  const sign = useCompetitionSignature();
  const credit = useQuery({
    queryKey: [
      QueryKey.COMPETITION_CREDITS,
      { ...competitionScope(identity), viewer, entry_id: entryId },
    ],
    queryFn: ({ signal }) => fetchCompetitionCredits(identity, entryId, signal),
    enabled: Boolean(connectedProfile),
    retry: false,
    staleTime: 0,
  });
  const [draft, setDraft] = useState<{ source: string; value: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const pending = useRef<{
    actor: string | null;
    body: ApiSetCompetitionVoteRequest;
  } | null>(null);
  const source = `${competition.id}:${entryId}:${viewer ?? "anonymous"}`;
  const value =
    draft?.source === source
      ? draft.value
      : String(credit.data?.current_vote ?? 0);
  const numeric = Number(value);
  const min = credit.data?.min_vote;
  const max = credit.data?.max_vote;
  const valid =
    value.trim() !== "" &&
    Number.isSafeInteger(numeric) &&
    min !== null &&
    min !== undefined &&
    max !== null &&
    max !== undefined &&
    numeric >= min &&
    numeric <= max;
  const submit = async () => {
    if (busy || !valid || disabled || !competition.permissions.vote) return;
    setBusy(true);
    setFailed(false);
    setSaved(false);
    try {
      if (!(await requestAuth()).success) return;
      let body =
        pending.current?.actor === viewer ? pending.current.body : null;
      if (
        body?.value !== numeric ||
        body.config_version !== competition.config_version
      ) {
        body = {
          idempotency_key: newCompetitionRequestKey(),
          config_version: competition.config_version,
          value: numeric,
        };
        if (competition.voting.signature_required)
          body.signature = await sign(
            "VOTE_SET",
            { value: numeric },
            entryId,
            dropId
          );
        pending.current = { actor: viewer, body };
      }
      await setCompetitionVote(identity, entryId, body);
      pending.current = null;
      setDraft(null);
      setSaved(true);
      await invalidateCompetition(client, identity);
    } catch (error) {
      if (isRejectedCompetitionCommand(error)) pending.current = null;
      setFailed(true);
      await credit.refetch();
    } finally {
      setBusy(false);
    }
  };
  if (!connectedProfile)
    return (
      <p className="tw-text-sm tw-text-iron-400">
        {t(locale, "competitions.signIn")}
      </p>
    );
  if (credit.isPending) return <CompetitionState />;
  if (credit.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void credit.refetch();
        }}
      />
    );
  return (
    <div className="tw-space-y-3">
      <CompetitionCredits budget={credit.data} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="tw-space-y-3"
      >
        <label
          htmlFor={`competition-vote-${entryId}`}
          className="tw-block tw-text-sm tw-text-iron-200"
        >
          {t(locale, "competitions.voteValue")}
        </label>
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <input
            id={`competition-vote-${entryId}`}
            type="number"
            step="1"
            min={min ?? undefined}
            max={max ?? undefined}
            className={`${COMPETITION_INPUT} !tw-w-40`}
            value={value}
            disabled={busy || disabled || !competition.permissions.vote}
            aria-invalid={!valid}
            aria-describedby={[
              `competition-vote-range-${entryId}`,
              ...(failed ? [`competition-vote-error-${entryId}`] : []),
            ].join(" ")}
            onChange={(event) => {
              setDraft({ source, value: event.target.value });
              setSaved(false);
            }}
          />
          <button
            type="submit"
            className={COMPETITION_BUTTON}
            disabled={
              busy || disabled || !competition.permissions.vote || !valid
            }
          >
            {t(locale, busy ? "competitions.saving" : "competitions.vote")}
          </button>
        </div>
        {min !== null &&
          min !== undefined &&
          max !== null &&
          max !== undefined && (
            <p
              id={`competition-vote-range-${entryId}`}
              className="tw-text-xs tw-text-iron-400"
            >
              {t(locale, "competitions.voteRange", {
                min: formatInteger(locale, min),
                max: formatInteger(locale, max),
              })}
            </p>
          )}
        {(disabled || !competition.permissions.vote) && (
          <p className="tw-text-sm tw-text-iron-400">
            {t(locale, "competitions.voteClosed")}
          </p>
        )}
        {failed && (
          <p
            id={`competition-vote-error-${entryId}`}
            role="alert"
            className="tw-text-sm tw-text-red"
          >
            {t(locale, "competitions.failure")}
          </p>
        )}
        {saved && (
          <p role="status" className="tw-text-sm tw-text-emerald-400">
            {t(locale, "competitions.saved")}
          </p>
        )}
      </form>
    </div>
  );
}

export default function CompetitionVote(
  props: Parameters<typeof CompetitionVoteForm>[0]
) {
  return isMultiCompetitionEnabled() ? (
    <CompetitionVoteForm {...props} />
  ) : null;
}
