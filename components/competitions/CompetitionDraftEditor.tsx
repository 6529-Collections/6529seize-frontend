"use client";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCompetitionDraftInput } from "@/generated/models/ApiCompetitionDraftInput";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { useWaveConfig } from "@/components/waves/create-wave/hooks/useWaveConfig";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import { useCompetitionDraftSave } from "@/hooks/competitions/useCompetitionDraftSave";
import { readCompetitionEditorDraft } from "@/helpers/competition-editor-draft.helpers";
import CreateWaveStepContent from "@/components/waves/create-wave/CreateWaveStepContent";
import CreateWaveGroup from "@/components/waves/create-wave/groups/CreateWaveGroup";
import CreateWaveDisplaySettings from "@/components/waves/create-wave/overview/CreateWaveDisplaySettings";
import RankScheduleModeSelector from "@/components/waves/create-wave/overview/type/RankScheduleModeSelector";
import CreateWaveDropdown from "@/components/waves/create-wave/utils/CreateWaveDropdown";
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
  performCompetitionAction,
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
import Button from "@/components/utils/button/Button";
import { CompetitionState, COMPETITION_BUTTON } from "./CompetitionState";

const EDITOR_INPUT =
  "tw-block tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-base tw-text-iron-50 hover:tw-border-iron-600 focus:tw-border-primary-400 focus:tw-outline focus:tw-outline-2 focus:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 sm:tw-text-sm";
const subscribeHydration = () => () => undefined;

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

function getSaveStatus(
  locale: ReturnType<typeof useBrowserLocale>,
  persistence: ReturnType<typeof useCompetitionDraftSave>
) {
  if (persistence.busy) return t(locale, "competitions.saving");
  if (persistence.isSaved) return t(locale, "competitions.saved");
  return t(
    locale,
    persistence.localSaved
      ? "competitions.savedLocally"
      : "competitions.unsaved"
  );
}

function DraftForm({
  wave,
  competition,
  initial,
  lockedRules = false,
  preservePublishedRules = false,
  lockVotingCredits = false,
  onClose,
}: {
  readonly wave: ApiWave;
  readonly competition?: ApiCompetition;
  readonly initial?: ApiCompetitionDraftInput;
  readonly lockedRules?: boolean;
  readonly preservePublishedRules?: boolean;
  readonly lockVotingCredits?: boolean;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const router = useRouter();
  const client = useQueryClient();
  const { connectedProfile, requestAuth } = useAuth();
  const viewer = useCompetitionViewer();
  const storageKey = `competition-editor:v1:${viewer ?? "anonymous"}:${wave.id}:${competition?.id ?? "new"}`;
  const [restored] = useState(() =>
    readCompetitionEditorDraft(storageKey, Boolean(competition))
  );
  const seed = restored?.input ?? initial;
  const anonymityLocked =
    competition !== undefined &&
    competition.lifecycle !== ApiCompetitionLifecycle.Draft;
  const controller = useWaveConfig({
    initialViewGroupId: wave.visibility.scope.group?.id ?? null,
    initialWaveType: ApiWaveType.Rank,
    initialConfigTransform: (defaults) =>
      seed
        ? competitionDraftToForm(seed, defaults, wave)
        : {
            ...defaults,
            groups: {
              ...defaults.groups,
              admin: wave.wave.admin_group.group?.id ?? null,
            },
          },
  });
  const { config, step } = controller;
  const [description, setDescription] = useState(seed?.description ?? "");
  const [voteSignature, setVoteSignature] = useState(
    seed?.voting.signature_required ?? false
  );
  const [anonymousSubmissions, setAnonymousSubmissions] = useState(
    (anonymityLocked ? initial : seed)?.participation.anonymous_submissions ??
      false
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<"conflict" | "failure" | null>(null);
  const publishCommand = useRef<{ version: number; key: string } | null>(null);
  const inFlight = useRef(false);
  const conflictCopyKey = useRef<string | null>(null);
  const formRef = useRef<HTMLElement>(null);
  useKeyboardFocusScroll(formRef);
  const [saveErrorFocusRequest, setSaveErrorFocusRequest] = useState(0);
  const votingErrors = getCreateWaveValidationErrors({
    config,
    step: CreateWaveStep.VOTING,
  });
  const votingInvalid = !lockedRules && votingErrors.length > 0;
  const visibleErrors =
    saveErrorFocusRequest > 0 && step === CreateWaveStep.VOTING
      ? votingErrors
      : controller.errors;
  const { submit: submitGroup } = useGroupMutations({
    requestAuth,
    onGroupCreate: () => undefined,
  });
  const input = useMemo(() => {
    const draft = competitionFormToDraft(config, description);
    draft.participation.anonymous_submissions = anonymityLocked
      ? (initial?.participation.anonymous_submissions ?? false)
      : anonymousSubmissions;
    if (lockedRules && initial)
      return {
        ...initial,
        title: draft.title,
        description: draft.description,
        presentation: draft.presentation,
        participation: {
          ...initial.participation,
          scope: draft.participation.scope,
        },
        voting: { ...initial.voting, scope: draft.voting.scope },
      };
    const voting = { ...draft.voting, signature_required: voteSignature };
    if (preservePublishedRules && initial)
      return {
        ...draft,
        participation: {
          ...draft.participation,
          submission_strategy:
            initial.participation.submission_strategy ?? null,
        },
        voting: lockVotingCredits
          ? {
              ...voting,
              credit_type: initial.voting.credit_type,
              credit_scope:
                initial.voting.credit_scope ?? ApiWaveCreditScope.Wave,
              credit_category: initial.voting.credit_category,
              creditor_id: initial.voting.creditor_id,
              credit_nfts: initial.voting.credit_nfts ?? [],
              forbid_negative_votes: initial.voting.forbid_negative_votes,
            }
          : voting,
        rules: {
          ...draft.rules,
          type: initial.rules.type,
          max_winners:
            config.overview.type === ApiWaveType.Rank
              ? initial.rules.max_winners
              : draft.rules.max_winners,
        },
        outcomes: initial.outcomes,
      };
    return { ...draft, voting };
  }, [
    config,
    description,
    voteSignature,
    lockedRules,
    initial,
    preservePublishedRules,
    lockVotingCredits,
    anonymousSubmissions,
    anonymityLocked,
  ]);
  const fingerprint = JSON.stringify(input);
  const [initialFingerprint] = useState(initial ? fingerprint : "");
  const persistence = useCompetitionDraftSave({
    waveId: wave.id,
    storageKey,
    input,
    competition,
    restored,
    initialFingerprint,
    canSave: !votingInvalid && Boolean(input.title.trim()),
    requestAuth,
  });
  const busy = submitting;
  const displayedError = error ?? persistence.error;
  const published =
    competition?.lifecycle === ApiCompetitionLifecycle.Published;
  const fullSteps =
    config.dates.ongoingRanking && config.overview.type === ApiWaveType.Rank
      ? STEPS.filter((value) => value !== CreateWaveStep.OUTCOMES)
      : STEPS;
  const steps = lockedRules
    ? [
        CreateWaveStep.OVERVIEW,
        CreateWaveStep.GROUPS,
        CreateWaveStep.RULES,
        CreateWaveStep.REVIEW,
      ]
    : fullSteps;
  const index = steps.indexOf(step);

  const validateVotingForSave = () => {
    if (!votingInvalid) return true;
    setError(null);
    void controller.onStep({
      step: CreateWaveStep.VOTING,
      direction: "backward",
    });
    setSaveErrorFocusRequest((value) => value + 1);
    return false;
  };

  useEffect(() => {
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- The invalid field must mount before focus can move to it.
    if (!saveErrorFocusRequest && !controller.errorFocusRequest) return;
    const field = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]'
    );
    field?.focus({ preventScroll: true });
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [saveErrorFocusRequest, controller.errorFocusRequest, step]);

  const close = async (requireSaved = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await persistence.save();
      const retained = persistence.retain();
      if (!result && (requireSaved || !retained)) {
        setError("failure");
        return;
      }
      if (result) persistence.clear();
      onClose();
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };
  const publish = async () => {
    if (inFlight.current || !validateVotingForSave()) return;
    const invalidStep = steps.find(
      (value) =>
        getCreateWaveValidationErrors({ config, step: value }).length > 0
    );
    if (invalidStep !== undefined) {
      void controller.onStep({ step: invalidStep, direction: "backward" });
      setSaveErrorFocusRequest((value) => value + 1);
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const savedCompetition = await persistence.save();
      if (!savedCompetition || !(await requestAuth()).success) return;
      if (publishCommand.current?.version !== savedCompetition.config_version) {
        publishCommand.current = {
          version: savedCompetition.config_version,
          key: newCompetitionRequestKey(),
        };
      }
      const result = await performCompetitionAction(
        { waveId: wave.id, competitionId: savedCompetition.id },
        "publish",
        {
          idempotency_key: publishCommand.current.key,
          config_version: savedCompetition.config_version,
        }
      );
      persistence.clear();
      await invalidateCompetition(client, {
        waveId: wave.id,
        competitionId: result.id,
      });
      router.replace(getCompetitionRoute(wave.id, result.id));
    } catch (error_) {
      setError(
        getStructuredApiErrorStatus(error_) === 409 ? "conflict" : "failure"
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };
  const saveConflictCopy = async () => {
    if (inFlight.current) return;
    if (!validateVotingForSave()) return;
    inFlight.current = true;
    setSubmitting(true);
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
      setSubmitting(false);
    }
  };
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
      <div className="tw-space-y-6">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-[minmax(0,1fr)_190px]">
          <label className="tw-block tw-min-w-0 tw-space-y-2 tw-text-sm tw-font-medium tw-text-iron-300">
            <span>{t(locale, "competitions.titleLabel")}</span>
            <input
              required
              maxLength={250}
              className={EDITOR_INPUT}
              value={config.overview.name}
              onChange={(event) =>
                controller.setOverview({
                  ...config.overview,
                  name: event.target.value,
                })
              }
            />
          </label>
          <div className="tw-min-w-0 tw-space-y-2 tw-text-sm tw-font-medium tw-text-iron-300">
            <span>{t(locale, "competitions.type")}</span>
            <CreateWaveDropdown
              mobileSheet
              ariaLabel={t(locale, "competitions.type")}
              disabled={published || busy || displayedError === "conflict"}
              value={config.overview.type}
              options={[
                {
                  value: ApiWaveType.Rank,
                  label: t(locale, "competitions.rank"),
                },
                {
                  value: ApiWaveType.Approve,
                  label: t(locale, "competitions.approve"),
                },
              ]}
              onChange={(type) =>
                controller.setOverview({
                  ...config.overview,
                  type,
                })
              }
            />
          </div>
        </div>
        <label className="tw-block tw-space-y-2 tw-text-sm tw-font-medium tw-text-iron-300">
          <span>{t(locale, "competitions.description")}</span>
          <textarea
            rows={4}
            className={`${EDITOR_INPUT} tw-resize-y`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="tw-space-y-2">
          <label className="tw-flex tw-min-h-11 tw-items-center tw-gap-3 tw-text-sm tw-font-medium tw-text-iron-200">
            <input
              type="checkbox"
              checked={anonymousSubmissions}
              onChange={(event) =>
                setAnonymousSubmissions(event.target.checked)
              }
              disabled={anonymityLocked}
              aria-describedby="competition-anonymity-description"
              className="tw-h-4 tw-w-4 tw-accent-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            />
            {t(locale, "competitions.anonymousSubmissions")}
          </label>
          <p
            id="competition-anonymity-description"
            className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400"
          >
            {t(locale, "competitions.anonymityDescription")}
          </p>
        </div>
        {!lockedRules && config.overview.type === ApiWaveType.Rank && (
          <RankScheduleModeSelector
            isCompetition
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
        isCompetition
        lockSubmissionStrategy={preservePublishedRules}
        lockOutcomeDefinitions={preservePublishedRules}
        lockVotingCredits={lockVotingCredits}
        controller={{ ...controller, errors: visibleErrors }}
        descriptionSnapshot={null}
        onCriteriaReplacementChange={() => undefined}
        onGroupResolutionChange={() => undefined}
        onInlineGroupCreate={onInlineGroupCreate}
      />
    );
  const saveStatus = getSaveStatus(locale, persistence);
  return (
    <section
      ref={formRef}
      className="tw-mx-auto tw-flex tw-w-full tw-max-w-[680px] tw-flex-1 tw-flex-col tw-gap-6"
      aria-labelledby="competition-draft-title"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h1
          id="competition-draft-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-title tw-text-iron-50 sm:tw-text-[28px] sm:tw-leading-[34px]"
        >
          {t(locale, published ? "competitions.edit" : "competitions.new")}
        </h1>
        <output className="tw-text-xs tw-text-iron-400">{saveStatus}</output>
      </div>
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {t(locale, "competitions.overlap")}
      </p>
      <fieldset
        disabled={busy || displayedError === "conflict"}
        className="tw-min-w-0 tw-border-0 tw-p-0"
      >
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
      </fieldset>
      {visibleErrors.length > 0 && invalid && (
        <p role="alert" className="tw-m-0 tw-text-red">
          {t(locale, "competitions.required")}
        </p>
      )}
      {displayedError && (
        <p role="alert" className="tw-m-0 tw-text-red">
          {t(
            locale,
            displayedError === "conflict"
              ? "competitions.conflict"
              : "competitions.failure"
          )}
        </p>
      )}
      {persistence.error === "failure" && (
        <button
          type="button"
          className={`${COMPETITION_BUTTON} tw-self-start`}
          disabled={busy || persistence.busy}
          onClick={() => {
            void persistence.save();
          }}
        >
          {t(locale, "competitions.retry")}
        </button>
      )}
      {displayedError === "conflict" && (
        <button
          type="button"
          className={`${COMPETITION_BUTTON} tw-self-start`}
          disabled={busy}
          onClick={() => {
            void saveConflictCopy();
          }}
        >
          {t(locale, "competitions.saveCopy")}
        </button>
      )}
      {displayedError === "conflict" && (
        <button
          type="button"
          className={`${COMPETITION_BUTTON} tw-self-start`}
          onClick={() => {
            persistence.clear();
            globalThis.location.reload();
          }}
        >
          {t(locale, "competitions.reload")}
        </button>
      )}
      <div className="tw-sticky tw-bottom-0 tw-z-20 tw-mt-auto tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-black tw-py-4 tw-pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="ghost"
          size="md"
          className="tw-mr-auto"
          disabled={busy}
          onClick={() => {
            void close();
          }}
        >
          {t(locale, "competitions.cancelEdit")}
        </Button>
        {index > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={busy}
            onClick={() => move("backward")}
          >
            {t(locale, "competitions.previous")}
          </Button>
        )}
        {index < steps.length - 1 && (
          <Button
            type="button"
            variant="action"
            size="md"
            disabled={busy}
            onClick={() => move("forward")}
          >
            {t(locale, "competitions.next")}
          </Button>
        )}
        {index === steps.length - 1 && !published && (
          <Button
            type="button"
            variant="action"
            size="md"
            disabled={busy || displayedError === "conflict"}
            onClick={() => {
              void publish();
            }}
          >
            {t(locale, "competitions.publish")}
          </Button>
        )}
        {index === steps.length - 1 && published && (
          <Button
            type="button"
            variant="action"
            size="md"
            disabled={busy || displayedError === "conflict"}
            onClick={() => {
              if (validateVotingForSave()) void close(true);
            }}
          >
            {t(locale, "competitions.save")}
          </Button>
        )}
      </div>
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
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false
  );
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
  if (!hydrated) return <CompetitionState />;
  if (!competition)
    return (
      <DraftForm
        key={`${wave.id}:${viewer ?? "anonymous"}`}
        wave={wave}
        onClose={onClose}
      />
    );
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
          void entries.refetch();
          void query.refetch();
        }}
      />
    );
  return (
    <DraftForm
      key={`${competition.id}:${viewer ?? "anonymous"}`}
      wave={wave}
      competition={competition}
      initial={query.data}
      lockedRules={
        competition.permissions.edit_rules_after_activity !== true &&
        Boolean(entries.data?.pages.some((page) => page.data.length > 0))
      }
      preservePublishedRules={
        competition.permissions.edit_rules_after_activity === true
      }
      lockVotingCredits={
        competition.permissions.edit_rules_after_activity === true &&
        competition.permissions.edit_credit_rules !== true
      }
      onClose={onClose}
    />
  );
}
