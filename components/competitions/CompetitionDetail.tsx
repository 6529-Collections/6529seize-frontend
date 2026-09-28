"use client";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";
import {
  getWaveOutcomeVisibilityFromMetadata,
  getWaveSubmissionButtonLabelOverrideFromMetadata,
  getApproveWaveDisplayMetadataDraft,
} from "@/helpers/waves/wave-metadata.helpers";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  useCompetitionDetail,
  useCompetitionHub,
  useCompetitionPauseState,
} from "@/hooks/competitions/useCompetitionQueries";
import { useWaveData } from "@/hooks/useWaveData";
import {
  CompetitionProvider,
  useCompetition,
} from "@/contexts/CompetitionContext";
import {
  COMPETITION_TABS,
  getCompetitionTab,
  isMultiCompetitionEnabled,
  getCompetitionsRoute,
} from "@/helpers/competition.helpers";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";
import { CompetitionState, COMPETITION_BUTTON } from "./CompetitionState";
import CompetitionAdmin from "./CompetitionAdmin";
import CompetitionResources from "./CompetitionResources";
import CompetitionExistingEntry from "./CompetitionExistingEntry";
import CompetitionEntryForm from "./CompetitionEntryForm";
import CompetitionDraftEditor from "./CompetitionDraftEditor";

function NativeCompetitionContent() {
  const { competition, wave } = useCompetition();
  const locale = useBrowserLocale();
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const presentation = (competition.presentation ?? []).map((item, id) => ({
    ...item,
    id,
  }));
  const outcomesVisible = getWaveOutcomeVisibilityFromMetadata(presentation);
  const selectedTab = getCompetitionTab(search.get("tab"));
  const tab =
    selectedTab === "outcomes" && !outcomesVisible ? "entries" : selectedTab;
  const submitLabel =
    getWaveSubmissionButtonLabelOverrideFromMetadata(presentation) ??
    t(locale, "competitions.submit");
  const approveLabels = getApproveWaveDisplayMetadataDraft(presentation);
  const tabLabel = (value: (typeof COMPETITION_TABS)[number]) => {
    if (competition.type === ApiCompetitionType.Approve) {
      if (value === "leaderboard" && approveLabels.approvalsTabLabel)
        return approveLabels.approvalsTabLabel;
      if (value === "decisions" && approveLabels.approvedTabLabel)
        return approveLabels.approvedTabLabel;
    }
    return t(locale, `competitions.${value}`);
  };
  const [entering, setEntering] = useState(false);
  const [associating, setAssociating] = useState(false);
  const mutationsEnabled = isMultiCompetitionEnabled();
  const editing = mutationsEnabled && search.get("edit") === "1";
  const pauses = useCompetitionPauseState({
    waveId: wave.id,
    competitionId: competition.id,
  });
  const paused = pauses.isSuccess ? pauses.data : null;
  if (
    editing &&
    (competition.lifecycle === ApiCompetitionLifecycle.Draft ||
      competition.lifecycle === ApiCompetitionLifecycle.Published) &&
    competition.permissions.administer
  )
    return (
      <CompetitionDraftEditor
        wave={wave}
        competition={competition}
        onClose={() => router.replace(pathname)}
      />
    );
  return (
    <div className="tw-space-y-5">
      <header className="tw-space-y-2">
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {t(locale, `competitions.type.${competition.type}`)} ·{" "}
          {t(locale, `competitions.phase.${competition.computed_phase}`)}
        </p>
        <h1 className="tw-m-0 tw-break-words tw-text-2xl tw-font-semibold tw-text-iron-100">
          {competition.title}
        </h1>
        {competition.description && (
          <p className="tw-whitespace-pre-wrap tw-text-sm tw-text-iron-300">
            {competition.description}
          </p>
        )}
        <p className="tw-text-xs tw-text-iron-400">
          {t(locale, "competitions.version", {
            version: competition.config_version,
          })}
        </p>
      </header>
      {pauses.isError && (
        <CompetitionState
          error
          retry={() => {
            void pauses.refetch();
          }}
        />
      )}
      {paused && (
        <p
          role="status"
          className="tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-sm tw-text-amber-300"
        >
          {t(locale, "competitions.paused")}
        </p>
      )}
      {competition.voting.ends_at !== null && (
        <p className="tw-text-sm tw-text-iron-300">
          {t(locale, "competitions.ends", {
            date: formatDate(locale, competition.voting.ends_at, {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </p>
      )}
      {!competition.permissions.submit && (
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, "competitions.submitClosed")}
        </p>
      )}
      {mutationsEnabled && (
        <CompetitionAdmin
          paused={paused}
          onEdit={() => router.push(`${pathname}?edit=1`)}
        />
      )}
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        {mutationsEnabled &&
          competition.permissions.submit &&
          competition.lifecycle === ApiCompetitionLifecycle.Published && (
            <button
              type="button"
              className={COMPETITION_BUTTON}
              aria-expanded={entering}
              onClick={() => setEntering((current) => !current)}
            >
              {submitLabel}
            </button>
          )}
        {mutationsEnabled &&
          competition.permissions.submit &&
          competition.lifecycle === ApiCompetitionLifecycle.Published && (
            <button
              type="button"
              className={COMPETITION_BUTTON}
              aria-expanded={associating}
              onClick={() => setAssociating((current) => !current)}
            >
              {t(locale, "competitions.existing")}
            </button>
          )}
      </div>
      {mutationsEnabled && associating && (
        <CompetitionExistingEntry onClose={() => setAssociating(false)} />
      )}
      {mutationsEnabled && entering && (
        <CompetitionEntryForm
          key={competition.id}
          onClose={() => setEntering(false)}
        />
      )}
      <nav
        className="tw-flex tw-flex-wrap tw-gap-2"
        aria-label={t(locale, "competitions.title")}
      >
        {COMPETITION_TABS.filter(
          (value) => outcomesVisible || value !== "outcomes"
        ).map((value) => (
          <Link
            key={value}
            href={`${pathname}?tab=${value}`}
            className={`${COMPETITION_BUTTON} ${tab === value ? "!tw-border-primary-400 !tw-bg-primary-500/20" : ""}`}
            aria-current={tab === value ? "page" : undefined}
          >
            {tabLabel(value)}
          </Link>
        ))}
      </nav>
      <CompetitionResources key={tab} tab={tab} />
    </div>
  );
}

export default function CompetitionDetail({
  waveId,
  competitionId,
}: {
  readonly waveId: string;
  readonly competitionId: string;
}) {
  const locale = useBrowserLocale();
  const wave = useWaveData({ waveId, onWaveNotFound: () => undefined });
  const hub = useCompetitionHub(waveId);
  const competition = useCompetitionDetail({ waveId, competitionId });
  const error = hub.isError || competition.isError || wave.isError;
  let content = <CompetitionState />;
  if (error)
    content = (
      <CompetitionState
        error
        retry={() => {
          void hub.refetch();
          void competition.refetch();
          void wave.refetch();
        }}
      />
    );
  else if (hub.data && competition.data && wave.data)
    content = (
      <CompetitionProvider
        value={{
          hub: hub.data,
          competition: competition.data,
          wave: wave.data,
        }}
      >
        {hub.data.legacy_primary_competition_id === competitionId ? (
          <div className="tw-h-[70dvh]">
            <MyStreamWave waveId={waveId} />
          </div>
        ) : (
          <NativeCompetitionContent />
        )}
      </CompetitionProvider>
    );
  return (
    <section className="tw-h-full tw-min-h-0 tw-overflow-y-auto tw-p-4 sm:tw-p-6">
      <div className="tw-mx-auto tw-max-w-5xl tw-space-y-5">
        <nav className="tw-flex tw-flex-wrap tw-gap-2">
          <Link
            href={getCompetitionsRoute(waveId)}
            className={COMPETITION_BUTTON}
          >
            {t(locale, "competitions.back")}
          </Link>
          <Link href={getWavePathRoute(waveId)} className={COMPETITION_BUTTON}>
            {t(locale, "competitions.chat")}
          </Link>
        </nav>
        {content}
      </div>
    </section>
  );
}
