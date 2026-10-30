"use client";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
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
  isCompetitionAccessError,
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
import { updateCompetitionVoteInCache } from "@/components/react-query-wrapper/utils/updateCompetitionVoteInCache";

const COMPACT_VOTE_LAYOUT =
  "tw-col-span-3 tw-row-start-3 tw-w-full tw-min-w-0 tw-@container/vote-controls @[32rem]/my-vote:tw-col-span-2 @[32rem]/my-vote:tw-col-start-2 @[46rem]/my-vote:tw-col-span-1 @[46rem]/my-vote:tw-col-start-4 @[46rem]/my-vote:tw-row-span-2 @[46rem]/my-vote:tw-row-start-1";

interface CompetitionVoteProps {
  readonly entryId: string;
  readonly dropId: string;
  readonly disabled: boolean;
}

export function useCompetitionVoteBudget(
  competition: ApiCompetition,
  entryId: string,
  enabled = true
) {
  const { connectedProfile } = useAuth();
  const viewer = useCompetitionViewer();
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  return useQuery({
    queryKey: [
      QueryKey.COMPETITION_CREDITS,
      { ...competitionScope(identity), viewer, entry_id: entryId },
    ],
    queryFn: ({ signal }) => fetchCompetitionCredits(identity, entryId, signal),
    enabled: enabled && Boolean(connectedProfile),
    retry: false,
    staleTime: 0,
  });
}

export function CompetitionVoteForm({
  competition,
  budgetEnabled = true,
  budgetVisibilityRef,
  compact = false,
  voteMode = "numeric",
  size,
  onVoteSuccess,
  onExplainVote,
  controlledDraft,
  reply,
  entryId,
  dropId,
  disabled,
}: CompetitionVoteProps & {
  readonly competition: ApiCompetition;
  readonly budgetEnabled?: boolean | undefined;
  readonly budgetVisibilityRef?: Ref<HTMLDivElement> | undefined;
  readonly controlledDraft?:
    | {
        readonly value: string;
        readonly onChange: (value: string | null) => void;
      }
    | undefined;
  readonly reply?:
    | {
        readonly content: ReactNode;
        readonly isValid: boolean;
        readonly onVoteApplied: () => Promise<void>;
      }
    | undefined;
  readonly compact?: boolean;
  readonly voteMode?: SingleWaveDropVoteMode | undefined;
  readonly size?: SingleWaveDropVoteSize | undefined;
  readonly onVoteSuccess?: (() => void) | undefined;
  readonly onExplainVote?:
    | ((voteTotal: number, voteChange: number) => void)
    | undefined;
}) {
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  const { requestAuth, connectedProfile } = useAuth();
  const viewer = useCompetitionViewer();
  const currentViewer = useRef<string | null | undefined>(viewer);
  // Async vote completions must see viewer changes and unmounts at commit.
  useLayoutEffect(() => {
    currentViewer.current = viewer;
    return () => {
      currentViewer.current = undefined;
    };
  }, [viewer]);
  const locale = useBrowserLocale();
  const explainTooltipId = useId();
  const creditLabel =
    WAVE_VOTING_LABELS[competition.voting.credit_type as ApiWaveCreditType];
  const client = useQueryClient();
  const sign = useCompetitionSignatureFor(competition);
  const credit = useCompetitionVoteBudget(competition, entryId, budgetEnabled);
  const [draft, setDraft] = useState<{ source: string; value: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastVote, setLastVote] = useState<{
    source: string;
    total: number;
    change: number;
  } | null>(null);
  const pending = useRef<{
    actor: string | null;
    body: ApiSetCompetitionVoteRequest;
  } | null>(null);
  const source = `${competition.id}:${entryId}:${viewer ?? "anonymous"}`;
  const value =
    controlledDraft?.value ??
    (draft?.source === source
      ? draft.value
      : String(credit.data?.current_vote ?? 0));
  const setVoteDraft = (next: string) => {
    if (controlledDraft) controlledDraft.onChange(next);
    else setDraft({ source, value: next });
  };
  const numeric = Number(value);
  const errorDescriptionId = failed
    ? `competition-vote-error-${entryId}`
    : undefined;
  const rangeDescriptionId = `competition-vote-range-${entryId}`;
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
    if (
      busy ||
      !valid ||
      reply?.isValid === false ||
      disabled ||
      !competition.permissions.vote
    )
      return;
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
      const budget = await setCompetitionVote(identity, entryId, body);
      pending.current = null;
      await updateCompetitionVoteInCache(client, {
        ...identity,
        viewer,
        entryId,
        dropId,
        budget,
        isCurrentViewer: () => currentViewer.current === viewer,
      });
      if (currentViewer.current === viewer) {
        setDraft(null);
        controlledDraft?.onChange(null);
        setSaved(true);
        setLastVote({
          source,
          total: numeric,
          change: numeric - (credit.data?.current_vote ?? 0),
        });
        void reply?.onVoteApplied();
        onVoteSuccess?.();
      }
      void invalidateCompetition(client, identity).catch(() => undefined);
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
  if (credit.isPending)
    return compact ? (
      <div
        ref={budgetVisibilityRef}
        role="status"
        aria-label={t(locale, "competitions.loading")}
        className={COMPACT_VOTE_LAYOUT}
      >
        <div
          aria-hidden="true"
          className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-2 tw-gap-y-1"
        >
          <div
            className={`tw-col-span-2 tw-h-11 tw-animate-pulse tw-rounded-lg tw-bg-iron-900 @[24rem]/vote-controls:tw-col-span-1 motion-reduce:tw-animate-none ${onExplainVote ? "" : "@[24rem]/vote-controls:!tw-col-span-2"}`}
          />
          <div className="tw-row-start-2 tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-900 @[24rem]/vote-controls:tw-col-span-2 motion-reduce:tw-animate-none" />
          {onExplainVote && (
            <div className="tw-col-start-2 tw-row-start-2 tw-h-11 tw-w-24 tw-animate-pulse tw-rounded-md tw-bg-iron-900 @[24rem]/vote-controls:tw-row-start-1 @[46rem]/my-vote:tw-h-9 @[46rem]/my-vote:tw-w-24 motion-reduce:tw-animate-none" />
          )}
        </div>
      </div>
    ) : (
      <CompetitionState />
    );
  if (
    credit.isError &&
    (!credit.data || isCompetitionAccessError(credit.error))
  )
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
        className={`${COMPACT_VOTE_LAYOUT} tw-cursor-default`}
      >
        <label className="tw-sr-only" htmlFor={`competition-vote-${entryId}`}>
          {t(locale, "competitions.voteValue")}
        </label>
        <div
          ref={budgetVisibilityRef}
          className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-2 tw-gap-y-1"
        >
          <div
            className={`tw-col-span-2 tw-flex tw-min-w-0 tw-items-center tw-gap-x-1 tw-rounded-lg tw-bg-iron-900 tw-pr-1 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus-within:tw-ring-2 focus-within:tw-ring-primary-400 @[24rem]/vote-controls:tw-col-span-1 @[46rem]/my-vote:tw-gap-x-2 ${onExplainVote ? "" : "@[24rem]/vote-controls:!tw-col-span-2"}`}
          >
            <input
              id={`competition-vote-${entryId}`}
              type="number"
              step="1"
              min={min ?? undefined}
              max={max ?? undefined}
              value={value}
              onChange={(event) => setVoteDraft(event.target.value)}
              disabled={busy || disabled || !competition.permissions.vote}
              aria-invalid={!valid}
              aria-describedby={[rangeDescriptionId, errorDescriptionId]
                .filter(Boolean)
                .join(" ")}
              className="tw-h-11 tw-w-[12ch] tw-min-w-[10ch] tw-max-w-[12ch] tw-flex-1 tw-rounded-lg tw-border-0 tw-bg-transparent tw-pl-3 tw-pr-0 tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-50 tw-outline-none [appearance:textfield] focus:tw-ring-0 @[46rem]/my-vote:tw-h-9 @[46rem]/my-vote:tw-min-w-0 @[46rem]/my-vote:tw-text-sm [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
            />
            <span className="tw-ml-auto tw-mr-2 tw-flex-shrink-0 tw-whitespace-nowrap tw-py-1 tw-text-xs tw-leading-4 tw-text-iron-400">
              {creditLabel}
            </span>
            <button
              type="submit"
              className="tw-group/vote-save tw-h-11 tw-min-w-11 tw-flex-shrink-0 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0 tw-py-1 tw-text-xs tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              disabled={
                busy ||
                disabled ||
                !competition.permissions.vote ||
                !valid ||
                numeric === credit.data.current_vote
              }
            >
              <span className="tw-flex tw-h-9 tw-w-full tw-items-center tw-justify-center tw-rounded-md tw-bg-primary-500 tw-px-2 group-disabled/vote-save:tw-bg-transparent group-disabled/vote-save:tw-text-iron-500">
                {t(locale, busy ? "competitions.saving" : "competitions.vote")}
              </span>
            </button>
          </div>
          <p
            id={rangeDescriptionId}
            className="tw-row-start-2 tw-m-0 tw-min-w-0 tw-break-words tw-text-xs tw-leading-5 tw-text-iron-400 @[24rem]/vote-controls:tw-col-span-2"
          >
            {t(locale, "competitions.voteRange", {
              min: formatInteger(locale, min ?? 0),
              max: formatInteger(locale, max ?? 0),
            })}
          </p>
          {onExplainVote && (
            <>
              <Button
                variant="tertiary"
                size="sm"
                className="tw-relative tw-col-start-2 tw-row-start-2 tw-my-1 tw-self-center after:tw-absolute after:tw-inset-x-0 after:tw-top-1/2 after:tw-h-11 after:-tw-translate-y-1/2 after:tw-content-[''] @[24rem]/vote-controls:tw-row-start-1 @[46rem]/my-vote:tw-my-0"
                aria-label={t(locale, "waves.voteRationale.explainAriaLabel")}
                data-tooltip-id={explainTooltipId}
                data-tooltip-content={t(
                  locale,
                  "waves.voteRationale.savedDescription"
                )}
                disabled={
                  busy ||
                  disabled ||
                  !competition.permissions.vote ||
                  credit.data.current_vote === null ||
                  credit.data.current_vote === 0
                }
                onClick={() => {
                  const total = credit.data.current_vote ?? 0;
                  onExplainVote(
                    total,
                    lastVote?.source === source && lastVote.total === total
                      ? lastVote.change
                      : 0
                  );
                }}
              >
                {t(locale, "waves.voteRationale.explain")}
              </Button>
              <BodyPortalTooltip
                id={explainTooltipId}
                place="top"
                offset={8}
                opacity={1}
                style={TOOLTIP_STYLES}
                className="tw-max-w-64 tw-whitespace-normal"
                closeEvents={{ mouseleave: true, blur: true, click: true }}
                globalCloseEvents={{
                  escape: true,
                  clickOutsideAnchor: true,
                  scroll: true,
                }}
              />
            </>
          )}
        </div>
        {failed && (
          <p
            id={errorDescriptionId}
            role="alert"
            className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-red"
          >
            {t(locale, "competitions.failure")}
          </p>
        )}
      </form>
    );
  return (
    <div className="tw-space-y-3 group-[.is-vote-panel]/inline-vote:tw-contents group-[.is-vote-panel]/inline-vote:tw-space-y-0">
      <CompetitionCredits budget={credit.data} />
      <p className="tw-text-sm tw-text-iron-400 group-[.is-vote-panel]/inline-vote:tw-col-start-1 group-[.is-vote-panel]/inline-vote:tw-row-start-1 group-[.is-vote-panel]/inline-vote:tw-m-0 group-[.is-vote-panel]/inline-vote:tw-flex group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-contents group-[.is-vote-panel]/inline-vote:tw-flex-wrap group-[.is-vote-panel]/inline-vote:tw-items-center group-[.is-vote-panel]/inline-vote:tw-gap-x-1.5">
        <span className="tw-hidden tw-font-medium tw-text-iron-400 group-[.is-vote-panel]/inline-vote:tw-col-start-1 group-[.is-vote-panel]/inline-vote:tw-row-start-1 group-[.is-vote-panel]/inline-vote:tw-inline">
          {t(locale, "competitions.voteValue")}
        </span>
        <span className="group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-pointer-events-none group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-z-10 group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-col-span-2 group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-col-start-1 group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-row-start-2 group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-mr-3 group-[.is-vote-panel:has(input[type=range])]/inline-vote:tw-hidden group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-justify-self-end group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-text-[13px] group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-leading-4 group-[.is-vote-panel:has(input[type=number])]/inline-vote:tw-text-iron-500">
          {creditLabel}
        </span>
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="tw-space-y-3 group-[.is-vote-panel]/inline-vote:tw-contents group-[.is-vote-panel]/inline-vote:tw-space-y-0 group-[.is-vote-panel]/inline-vote:[&>output]:tw-col-span-2 group-[.is-vote-panel]/inline-vote:[&>p]:tw-col-span-2 group-[.is-vote-panel]/inline-vote:[&>p]:tw-m-0"
      >
        {voteMode === "slider" ? (
          <fieldset
            className="tw-m-0 tw-min-w-0 tw-border-0 tw-px-0 tw-pb-6 tw-pt-0 group-[.is-vote-panel]/inline-vote:tw-col-span-2 group-[.is-vote-panel]/inline-vote:tw-row-start-2 group-[.is-vote-panel]/inline-vote:tw-px-2 group-[.is-mini]/inline-vote:tw-pt-8 group-[.is-vote-panel:not(.is-mini)]/inline-vote:tw-pb-2 group-[.is-vote-panel]/inline-vote:tw-pb-0 group-[.is-vote-panel]/inline-vote:focus-within:tw-rounded-lg group-[.is-vote-panel]/inline-vote:focus-within:tw-ring-2 group-[.is-vote-panel]/inline-vote:focus-within:tw-ring-primary-400"
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
                setVoteDraft(
                  String(typeof next === "function" ? next(numeric) : next)
                );
                setSaved(false);
              }}
            />
          </fieldset>
        ) : (
          <>
            <label
              htmlFor={`competition-vote-${entryId}`}
              className="tw-block tw-text-sm tw-text-iron-200 group-[.is-vote-panel]/inline-vote:tw-sr-only"
            >
              {t(locale, "competitions.voteValue")}
            </label>
            <div className="tw-flex tw-flex-wrap tw-gap-2 group-[.is-vote-panel]/inline-vote:tw-col-span-2 group-[.is-vote-panel]/inline-vote:tw-col-start-1 group-[.is-vote-panel]/inline-vote:tw-row-start-2">
              <input
                id={`competition-vote-${entryId}`}
                type="number"
                step="1"
                min={min ?? undefined}
                max={max ?? undefined}
                className={`${COMPETITION_INPUT} !tw-w-40 group-[.is-vote-panel:not(.is-mini)]/inline-vote:tw-h-11 group-[.is-vote-panel]/inline-vote:tw-h-9 group-[.is-vote-panel]/inline-vote:!tw-w-full group-[.is-vote-panel]/inline-vote:tw-min-w-0 group-[.is-vote-panel]/inline-vote:tw-border-iron-800 group-[.is-vote-panel]/inline-vote:tw-bg-iron-900 group-[.is-vote-panel]/inline-vote:tw-py-0 group-[.is-vote-panel]/inline-vote:tw-pl-3 group-[.is-vote-panel]/inline-vote:tw-pr-28 group-[.is-vote-panel]/inline-vote:tw-text-[13px] group-[.is-vote-panel]/inline-vote:tw-font-semibold group-[.is-vote-panel]/inline-vote:tw-tabular-nums group-[.is-vote-panel]/inline-vote:tw-leading-4 group-[.is-vote-panel]/inline-vote:tw-transition-colors group-[.is-vote-panel]/inline-vote:tw-duration-150 group-[.is-vote-panel]/inline-vote:[appearance:textfield] group-[.is-vote-panel]/inline-vote:hover:tw-border-iron-700 group-[.is-vote-panel]/inline-vote:focus:tw-border-primary-500/70 group-[.is-vote-panel]/inline-vote:touch-only:tw-h-11 group-[.is-vote-panel]/inline-vote:touch-only:tw-text-base group-[.is-vote-panel]/inline-vote:motion-reduce:tw-transition-none group-[.is-vote-panel]/inline-vote:max-sm:tw-h-11 group-[.is-vote-panel]/inline-vote:max-sm:tw-text-base group-[.is-vote-panel:not(.is-mini)]/inline-vote:sm:desktop-hover:tw-text-sm group-[.is-vote-panel]/inline-vote:[&::-webkit-inner-spin-button]:tw-appearance-none group-[.is-vote-panel]/inline-vote:[&::-webkit-outer-spin-button]:tw-appearance-none`}
                value={value}
                disabled={busy || disabled || !competition.permissions.vote}
                aria-invalid={!valid}
                aria-describedby={errorDescriptionId}
                onChange={(event) => {
                  setVoteDraft(event.target.value);
                  setSaved(false);
                }}
              />
            </div>
          </>
        )}
        {reply?.content}
        <button
          type="submit"
          className={`${COMPETITION_BUTTON} group-[.is-vote-panel]/inline-vote:tw-col-start-2 group-[.is-vote-panel]/inline-vote:tw-row-start-4 group-[.is-vote-panel]/inline-vote:tw-min-h-8 group-[.is-vote-panel]/inline-vote:tw-place-self-end group-[.is-vote-panel]/inline-vote:tw-border-transparent group-[.is-vote-panel]/inline-vote:tw-bg-primary-500 group-[.is-vote-panel]/inline-vote:tw-px-3.5 group-[.is-vote-panel]/inline-vote:tw-py-1.5 group-[.is-vote-panel]/inline-vote:tw-text-[13px] group-[.is-vote-panel]/inline-vote:tw-text-white group-[.is-vote-panel]/inline-vote:hover:tw-bg-primary-600 group-[.is-vote-panel]/inline-vote:disabled:tw-cursor-default group-[.is-vote-panel]/inline-vote:disabled:tw-bg-iron-800 group-[.is-vote-panel]/inline-vote:disabled:tw-text-iron-600`}
          disabled={
            busy ||
            disabled ||
            !competition.permissions.vote ||
            !valid ||
            reply?.isValid === false
          }
        >
          {t(locale, busy ? "competitions.saving" : "competitions.vote")}
        </button>
        {(disabled || !competition.permissions.vote) && (
          <p className="tw-text-sm tw-text-iron-400">
            {t(locale, "competitions.voteClosed")}
          </p>
        )}
        {failed && (
          <p
            id={errorDescriptionId}
            role="alert"
            className="tw-text-sm tw-text-red"
          >
            {t(locale, "competitions.failure")}
          </p>
        )}
        {saved && (
          <output className="tw-block tw-text-sm tw-text-emerald-400">
            {t(locale, "competitions.saved")}
          </output>
        )}
      </form>
    </div>
  );
}
