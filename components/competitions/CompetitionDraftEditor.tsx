"use client";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCompetitionDraftInput } from "@/generated/models/ApiCompetitionDraftInput";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveConfig } from "@/components/waves/create-wave/hooks/useWaveConfig";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import CreateWaveStepContent from "@/components/waves/create-wave/CreateWaveStepContent";
import CreateWaveGroup from "@/components/waves/create-wave/groups/CreateWaveGroup";
import CreateWaveDisplaySettings from "@/components/waves/create-wave/overview/CreateWaveDisplaySettings";
import RankScheduleModeSelector from "@/components/waves/create-wave/overview/type/RankScheduleModeSelector";
import { CreateWaveStep, CreateWaveGroupConfigType } from "@/types/waves.types";
import { getCreateWaveValidationErrors } from "@/helpers/waves/create-wave.validation";
import {
  competitionDraftToForm,
  competitionFormToDraft,
} from "@/helpers/competition-config.helpers";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import {
  competitionEndpoint,
  competitionScope,
  createCompetition,
  updateCompetition,
  invalidateCompetition,
} from "@/services/api/competitions-api";
import {
  getCompetitionRoute,
  newCompetitionRequestKey,
} from "@/helpers/competition.helpers";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  useCompetitionViewer,
  useCompetitionResource,
} from "@/hooks/competitions/useCompetitionQueries";
import { useAuth } from "@/components/auth/Auth";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  CompetitionState,
  COMPETITION_BUTTON,
  COMPETITION_INPUT,
} from "./CompetitionState";

const STEPS = [
  CreateWaveStep.OVERVIEW,
  CreateWaveStep.GROUPS,
  CreateWaveStep.DATES,
  CreateWaveStep.DROPS,
  CreateWaveStep.VOTING,
  CreateWaveStep.OUTCOMES,
  CreateWaveStep.RULES,
  CreateWaveStep.REVIEW,
];

function DraftForm({
  wave,
  competition,
  initial,
  lockedRules = false,
  onClose,
}: {
  readonly wave: ApiWave;
  readonly competition?: ApiCompetition;
  readonly initial?: ApiCompetitionDraftInput;
  readonly lockedRules?: boolean;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const router = useRouter();
  const client = useQueryClient();
  const { connectedProfile, requestAuth } = useAuth();
  const controller = useWaveConfig({
    initialViewGroupId: wave.visibility.scope.group?.id ?? null,
    initialWaveType: ApiWaveType.Rank,
    initialConfigTransform: (defaults) =>
      initial
        ? competitionDraftToForm(initial, defaults, wave)
        : {
            ...defaults,
            groups: {
              ...defaults.groups,
              admin: wave.wave.admin_group.group?.id ?? null,
            },
          },
  });
  const { config, step } = controller;
  const [description, setDescription] = useState(initial?.description ?? "");
  const [voteSignature, setVoteSignature] = useState(
    initial?.voting.signature_required ?? false
  );
  const [confirmClose, setConfirmClose] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"conflict" | "failure" | null>(null);
  const [version, setVersion] = useState(competition?.config_version ?? 0);
  const pending = useRef<{ fingerprint: string; key: string } | null>(null);
  const inFlight = useRef(false);
  const conflictCopyKey = useRef<string | null>(null);
  const { submit: submitGroup } = useGroupMutations({
    requestAuth,
    onGroupCreate: () => undefined,
  });
  const input = useMemo(() => {
    const draft = competitionFormToDraft(config, description);
    if (lockedRules && initial)
      return {
        ...initial,
        title: draft.title,
        description: draft.description,
        presentation: draft.presentation,
      };
    return {
      ...draft,
      voting: { ...draft.voting, signature_required: voteSignature },
    };
  }, [config, description, voteSignature, lockedRules, initial]);
  const fingerprint = JSON.stringify(input);
  const [savedFingerprint, setSavedFingerprint] = useState(
    initial ? fingerprint : ""
  );
  const published =
    competition?.lifecycle === ApiCompetitionLifecycle.Published;
  const fullSteps =
    config.dates.ongoingRanking && config.overview.type === ApiWaveType.Rank
      ? STEPS.filter((value) => value !== CreateWaveStep.OUTCOMES)
      : STEPS;
  const steps = lockedRules
    ? [CreateWaveStep.OVERVIEW, CreateWaveStep.RULES, CreateWaveStep.REVIEW]
    : fullSteps;
  const index = steps.indexOf(step);

  const save = async () => {
    if (inFlight.current || !input.title.trim() || error === "conflict") return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!(await requestAuth()).success) return;
      if (pending.current?.fingerprint !== fingerprint)
        pending.current = { fingerprint, key: newCompetitionRequestKey() };
      const result = competition
        ? await updateCompetition(
            { waveId: wave.id, competitionId: competition.id },
            {
              idempotency_key: pending.current.key,
              config_version: version,
              config: input,
            }
          )
        : await createCompetition(wave.id, {
            idempotency_key: pending.current.key,
            config: input,
          });
      setVersion(result.config_version);
      setSavedFingerprint(fingerprint);
      pending.current = null;
      await invalidateCompetition(client, {
        waveId: wave.id,
        competitionId: result.id,
      });
      if (!competition)
        router.replace(`${getCompetitionRoute(wave.id, result.id)}?edit=1`);
    } catch (failure) {
      setError(
        getStructuredApiErrorStatus(failure) === 409 ? "conflict" : "failure"
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const saveConflictCopy = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      if (!(await requestAuth()).success) return;
      conflictCopyKey.current ??= newCompetitionRequestKey();
      const result = await createCompetition(wave.id, {
        idempotency_key: conflictCopyKey.current,
        config: input,
      });
      await invalidateCompetition(client, {
        waveId: wave.id,
        competitionId: result.id,
      });
      router.replace(`${getCompetitionRoute(wave.id, result.id)}?edit=1`);
    } catch {
      setError("conflict");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const autosave = useEffectEvent(save);
  useEffect(() => {
    if (
      !competition ||
      published ||
      input.title.length === 0 ||
      fingerprint === savedFingerprint ||
      error
    )
      return;
    const timer = setTimeout(() => {
      void autosave();
    }, 1500);
    return () => clearTimeout(timer);
  }, [
    competition,
    published,
    input.title,
    fingerprint,
    savedFingerprint,
    error,
  ]);

  useEffect(() => {
    if (fingerprint === savedFingerprint) return;
    const preventExit = (event: BeforeUnloadEvent) => event.preventDefault();
    globalThis.addEventListener("beforeunload", preventExit);
    return () => globalThis.removeEventListener("beforeunload", preventExit);
  }, [fingerprint, savedFingerprint]);

  const move = (direction: "forward" | "backward") => {
    const next = steps[index + (direction === "forward" ? 1 : -1)];
    if (next !== undefined) void controller.onStep({ step: next, direction });
  };
  const onInlineGroupCreate = async (
    payload: Parameters<typeof submitGroup>[0]["payload"]
  ) => {
    const result = await submitGroup({
      payload,
      currentHandle: connectedProfile?.handle ?? null,
    });
    return result.ok ? result.group : null;
  };
  const invalid = getCreateWaveValidationErrors({ config, step }).length > 0;
  let content;
  if (step === CreateWaveStep.OVERVIEW)
    content = (
      <div className="tw-space-y-4">
        <label className="tw-block tw-space-y-2 tw-text-sm tw-text-iron-300">
          <span>{t(locale, "competitions.titleLabel")}</span>
          <input
            required
            maxLength={250}
            className={COMPETITION_INPUT}
            value={config.overview.name}
            onChange={(event) =>
              controller.setOverview({
                ...config.overview,
                name: event.target.value,
              })
            }
          />
        </label>
        <label className="tw-block tw-space-y-2 tw-text-sm tw-text-iron-300">
          <span>{t(locale, "competitions.description")}</span>
          <textarea
            rows={4}
            className={COMPETITION_INPUT}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="tw-block tw-space-y-2 tw-text-sm tw-text-iron-300">
          <span>{t(locale, "competitions.type")}</span>
          <select
            className={COMPETITION_INPUT}
            disabled={published}
            value={config.overview.type}
            onChange={(event) =>
              controller.setOverview({
                ...config.overview,
                type:
                  event.target.value === String(ApiWaveType.Approve)
                    ? ApiWaveType.Approve
                    : ApiWaveType.Rank,
              })
            }
          >
            <option value={ApiWaveType.Rank}>
              {t(locale, "competitions.rank")}
            </option>
            <option value={ApiWaveType.Approve}>
              {t(locale, "competitions.approve")}
            </option>
          </select>
        </label>
        {!lockedRules && config.overview.type === ApiWaveType.Rank && (
          <RankScheduleModeSelector
            ongoingRanking={config.dates.ongoingRanking ?? false}
            onChange={(ongoingRanking) =>
              controller.setDates({ ...config.dates, ongoingRanking })
            }
          />
        )}
        <CreateWaveDisplaySettings
          waveType={config.overview.type}
          display={config.display}
          errors={controller.errors}
          onChange={controller.setDisplay}
        />
      </div>
    );
  else if (step === CreateWaveStep.GROUPS)
    content = (
      <div className="tw-space-y-6">
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, "competitions.configHint")}
        </p>
        {[
          CreateWaveGroupConfigType.CAN_DROP,
          CreateWaveGroupConfigType.CAN_VOTE,
        ].map((groupType) => (
          <CreateWaveGroup
            key={groupType}
            waveName={config.overview.name}
            waveType={config.overview.type}
            groupType={groupType}
            groups={config.groups}
            groupsCache={controller.groupsCache}
            chatEnabled={true}
            adminCanDeleteDrops={false}
            setChatEnabled={() => undefined}
            setDropsAdminCanDelete={() => undefined}
            onGroupSelect={(group) =>
              controller.onGroupSelect({ group, groupType })
            }
            onCriteriaReplacementChange={() => undefined}
            onGroupResolutionChange={() => undefined}
            onInlineGroupCreate={onInlineGroupCreate}
            showMatchWaveAccess
            onMatchWaveAccess={() => controller.onGroupMatchView(groupType)}
            errorMessage={null}
          />
        ))}
      </div>
    );
  else
    content = (
      <CreateWaveStepContent
        controller={controller}
        descriptionSnapshot={null}
        onCriteriaReplacementChange={() => undefined}
        onGroupResolutionChange={() => undefined}
        onInlineGroupCreate={onInlineGroupCreate}
      />
    );
  let saveStatus = t(locale, "competitions.version", { version });
  if (busy) saveStatus = t(locale, "competitions.saving");
  else if (fingerprint === savedFingerprint)
    saveStatus = t(locale, "competitions.saved");
  return (
    <section className="tw-space-y-5" aria-labelledby="competition-draft-title">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h1
          id="competition-draft-title"
          className="tw-text-xl tw-font-semibold tw-text-iron-100"
        >
          {t(locale, competition ? "competitions.edit" : "competitions.new")}
        </h1>
        <span role="status" className="tw-text-xs tw-text-iron-400">
          {saveStatus}
        </span>
      </div>
      <p className="tw-text-sm tw-text-iron-400">
        {t(locale, "competitions.overlap")}
      </p>
      <fieldset
        disabled={busy || error === "conflict"}
        className="tw-min-w-0 tw-border-0 tw-p-0"
      >
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4">
          {content}
          {step === CreateWaveStep.VOTING && (
            <label className="tw-mt-4 tw-flex tw-min-h-11 tw-items-center tw-gap-3 tw-text-sm tw-text-iron-200">
              <input
                type="checkbox"
                checked={voteSignature}
                onChange={(event) => setVoteSignature(event.target.checked)}
              />
              {t(locale, "competitions.requireVoteSignature")}
            </label>
          )}
        </div>
      </fieldset>
      {controller.errors.length > 0 && invalid && (
        <p role="alert" className="tw-text-red">
          {t(locale, "competitions.required")}
        </p>
      )}
      {error && (
        <p role="alert" className="tw-text-red">
          {t(
            locale,
            error === "conflict"
              ? "competitions.conflict"
              : "competitions.failure"
          )}
        </p>
      )}
      {error === "conflict" && (
        <button
          type="button"
          className={COMPETITION_BUTTON}
          disabled={busy}
          onClick={() => {
            void saveConflictCopy();
          }}
        >
          {t(locale, "competitions.saveCopy")}
        </button>
      )}
      {error === "conflict" && (
        <button
          type="button"
          className={COMPETITION_BUTTON}
          onClick={() => globalThis.location.reload()}
        >
          {t(locale, "competitions.reload")}
        </button>
      )}
      <div className="tw-sticky tw-bottom-0 tw-flex tw-flex-wrap tw-gap-2 tw-bg-iron-950 tw-py-4 tw-pb-[max(1rem,env(safe-area-inset-bottom))]">
        {index > 0 && (
          <button
            type="button"
            className={COMPETITION_BUTTON}
            disabled={busy}
            onClick={() => move("backward")}
          >
            {t(locale, "competitions.previous")}
          </button>
        )}
        {index < steps.length - 1 && (
          <button
            type="button"
            className={COMPETITION_BUTTON}
            disabled={busy}
            onClick={() => move("forward")}
          >
            {t(locale, "competitions.next")}
          </button>
        )}
        <button
          type="button"
          className={COMPETITION_BUTTON}
          disabled={busy || !input.title.trim() || error === "conflict"}
          onClick={() => {
            void save();
          }}
        >
          {t(locale, "competitions.save")}
        </button>
        <button
          type="button"
          className={COMPETITION_BUTTON}
          disabled={busy}
          onClick={() =>
            fingerprint === savedFingerprint ? onClose() : setConfirmClose(true)
          }
        >
          {t(locale, "competitions.cancelEdit")}
        </button>
      </div>
      {confirmClose && (
        <MobileWrapperConfirmationDialog
          isOpen
          title={t(locale, "competitions.discardTitle")}
          message={t(locale, "competitions.discardMessage")}
          confirmText={t(locale, "competitions.discard")}
          cancelText={t(locale, "competitions.dismiss")}
          onClose={() => setConfirmClose(false)}
          onConfirm={onClose}
        />
      )}
    </section>
  );
}

export default function CompetitionDraftEditor({
  wave,
  competition,
  onClose,
}: {
  readonly wave: ApiWave;
  readonly competition?: ApiCompetition;
  readonly onClose: () => void;
}) {
  const viewer = useCompetitionViewer();
  const identity = { waveId: wave.id, competitionId: competition?.id ?? "new" };
  const query = useQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      "configuration",
    ],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiCompetitionDraftInput>({
        endpoint: `${competitionEndpoint(identity)}/configuration`,
        signal,
        errorMode: "structured",
      }),
    enabled: Boolean(competition),
    retry: false,
  });
  const entries = useCompetitionResource(
    identity,
    "entries",
    { limit: "1" },
    competition?.lifecycle === ApiCompetitionLifecycle.Published
  );
  if (!competition) return <DraftForm wave={wave} onClose={onClose} />;
  if (
    query.isPending ||
    (competition.lifecycle === ApiCompetitionLifecycle.Published &&
      entries.isPending)
  )
    return <CompetitionState />;
  if (query.isError || entries.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
        }}
      />
    );
  return (
    <DraftForm
      key={competition.id}
      wave={wave}
      competition={competition}
      initial={query.data}
      lockedRules={Boolean(
        entries.data?.pages.some((page) => page.data.length > 0)
      )}
      onClose={onClose}
    />
  );
}
