"use client";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useCompetitionSignatureFor } from "@/hooks/competitions/useCompetitionSignature";
import {
  newCompetitionRequestKey,
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
import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type {
  SingleWaveDropVoteMode,
  SingleWaveDropVoteSize,
} from "@/components/waves/drop/SingleWaveDropVote.types";
import SingleWaveDropVoteSlider from "@/components/waves/drop/SingleWaveDropVoteSlider";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";

interface CompetitionVoteProps {
  readonly entryId: string;
  readonly dropId: string;
  readonly disabled: boolean;
}

export function CompetitionVoteForm({
  competition,
  compact = false,
  voteMode = "numeric",
  size,
  onVoteSuccess,
  entryId,
  dropId,
  disabled,
}: CompetitionVoteProps & {
  readonly competition: ApiCompetition;
  readonly compact?: boolean;
  readonly voteMode?: SingleWaveDropVoteMode | undefined;
  readonly size?: SingleWaveDropVoteSize | undefined;
  readonly onVoteSuccess?: (() => void) | undefined;
}) {
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  const { requestAuth, connectedProfile } = useAuth();
  const viewer = useCompetitionViewer();
  const locale = useBrowserLocale();
  const creditLabel =
    WAVE_VOTING_LABELS[competition.voting.credit_type as ApiWaveCreditType];
  const client = useQueryClient();
  const sign = useCompetitionSignatureFor(competition);
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
      onVoteSuccess?.();
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
  if (compact)
    return (
      <form
        data-vote-controls
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="tw-col-span-3 tw-row-start-4 tw-flex tw-w-full tw-min-w-0 tw-cursor-default tw-flex-col @[46rem]/my-vote:tw-contents sm:@[16rem]/my-vote:tw-row-start-3 sm:@[36rem]/my-vote:tw-col-span-1 sm:@[36rem]/my-vote:tw-col-start-3 sm:@[36rem]/my-vote:tw-max-w-72"
      >
        <label className="tw-sr-only" htmlFor={`competition-vote-${entryId}`}>
          {t(locale, "competitions.voteValue")}
        </label>
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-pr-1 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus-within:tw-ring-2 focus-within:tw-ring-primary-400 @[46rem]/my-vote:tw-col-start-4 @[46rem]/my-vote:tw-row-start-1 @[46rem]/my-vote:tw-self-end">
          <input
            id={`competition-vote-${entryId}`}
            type="number"
            step="1"
            min={min ?? undefined}
            max={max ?? undefined}
            value={value}
            onChange={(event) =>
              setDraft({ source, value: event.target.value })
            }
            disabled={busy || disabled || !competition.permissions.vote}
            aria-invalid={!valid}
            aria-describedby={`competition-vote-range-${entryId}`}
            className="tw-h-10 tw-w-full tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border-0 tw-bg-transparent tw-pl-3 tw-text-sm tw-font-semibold tw-text-iron-50 focus:tw-ring-0"
          />
          <span className="tw-max-w-[40%] tw-flex-shrink-0 tw-break-words tw-py-1 tw-text-xs tw-leading-4 tw-text-iron-400">
            {creditLabel}
          </span>
          <button
            type="submit"
            className="tw-h-8 tw-flex-shrink-0 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-bg-primary-500 tw-px-3 tw-text-xs tw-font-semibold tw-text-white disabled:tw-bg-transparent disabled:tw-text-iron-500"
            disabled={
              busy ||
              disabled ||
              !competition.permissions.vote ||
              !valid ||
              numeric === credit.data.current_vote
            }
          >
            {t(locale, busy ? "competitions.saving" : "competitions.vote")}
          </button>
        </div>
        <p
          id={`competition-vote-range-${entryId}`}
          className="tw-mb-0 tw-mt-2 tw-min-w-0 tw-text-xs tw-leading-5 tw-text-iron-400 @[46rem]/my-vote:tw-col-start-4 @[46rem]/my-vote:tw-row-start-2 @[46rem]/my-vote:tw-mt-0 @[46rem]/my-vote:tw-self-start"
        >
          {t(locale, "competitions.voteRange", {
            min: formatInteger(locale, min ?? 0),
            max: formatInteger(locale, max ?? 0),
          })}
        </p>
        {failed && (
          <p
            role="alert"
            className="tw-m-0 tw-text-xs tw-text-red @[46rem]/my-vote:tw-col-start-4 @[46rem]/my-vote:tw-row-start-3"
          >
            {t(locale, "competitions.failure")}
          </p>
        )}
      </form>
    );
  return (
    <div className="tw-space-y-3">
      <CompetitionCredits budget={credit.data} />
      <p className="tw-text-sm tw-text-iron-400">{creditLabel}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="tw-space-y-3"
      >
        {voteMode === "slider" ? (
          <fieldset
            className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0"
            disabled={busy || disabled || !competition.permissions.vote}
          >
            <legend className="tw-sr-only">
              {t(locale, "competitions.voteValue")}
            </legend>
            <SingleWaveDropVoteSlider
              voteValue={Number.isFinite(numeric) ? numeric : 0}
              minValue={min ?? 0}
              maxValue={max ?? 0}
              size={size}
              label={creditLabel}
              setVoteValue={(next) => {
                setDraft({
                  source,
                  value: String(
                    typeof next === "function" ? next(numeric) : next
                  ),
                });
                setSaved(false);
              }}
            />
          </fieldset>
        ) : (
          <>
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
            </div>
          </>
        )}
        <button
          type="submit"
          className={COMPETITION_BUTTON}
          disabled={busy || disabled || !competition.permissions.vote || !valid}
        >
          {t(locale, busy ? "competitions.saving" : "competitions.vote")}
        </button>
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
