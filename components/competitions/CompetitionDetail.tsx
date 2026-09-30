"use client";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";
import {
  getWaveOutcomeVisibilityFromMetadata,
  getApproveWaveTabLabelsFromMetadata,
} from "@/helpers/waves/wave-metadata.helpers";
import { useMemo, useState } from "react";
import { WaveDisplayMetadataContext } from "@/contexts/WaveDisplayMetadataContext";
import { TabToggle } from "@/components/common/TabToggle";
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
  getCompetitionsRoute,
  isMultiCompetitionEnabled,
} from "@/helpers/competition.helpers";
import { ContentTabProvider } from "@/components/brain/ContentTabContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";
import { CompetitionState } from "./CompetitionState";
import CompetitionAdmin from "./CompetitionAdmin";
import CompetitionResources from "./CompetitionResources";
import CompetitionEntryForm from "./CompetitionEntryForm";
import CompetitionDraftEditor from "./CompetitionDraftEditor";
import CompetitionBackLink from "./CompetitionBackLink";

function NativeCompetitionContent() {
  const { competition, wave } = useCompetition();
  const locale = useBrowserLocale();
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const displayMetadata = useMemo(
    () => ({
      waveId: wave.id,
      metadata: (competition.presentation ?? []).map((item, id) => ({
        ...item,
        id,
      })),
    }),
    [wave.id, competition.presentation]
  );
  const presentation = displayMetadata.metadata;
  const outcomesVisible = getWaveOutcomeVisibilityFromMetadata(presentation);
  const selectedTab = getCompetitionTab(
    search.get("edit") === "1" &&
      competition.lifecycle !== ApiCompetitionLifecycle.Draft
      ? "rules"
      : search.get("tab")
  );
  const tab =
    selectedTab === "outcomes" && !outcomesVisible
      ? "leaderboard"
      : selectedTab;
  const approveLabels = getApproveWaveTabLabelsFromMetadata(presentation);
  const tabLabel = (value: (typeof COMPETITION_TABS)[number]) => {
    if (value === "rules") return t(locale, "competitions.configuration");
    if (competition.type === ApiCompetitionType.Approve) {
      if (value === "leaderboard") return approveLabels.approvals;
      if (value === "decisions") return approveLabels.approved;
    }
    return t(locale, `competitions.${value}`);
  };
  const [entering, setEntering] = useState(false);
  const mutationsEnabled = isMultiCompetitionEnabled();
  const pauses = useCompetitionPauseState({
    waveId: wave.id,
    competitionId: competition.id,
  });
  const paused = pauses.isSuccess ? pauses.data : null;
  if (
    mutationsEnabled &&
    competition.lifecycle === ApiCompetitionLifecycle.Draft &&
    competition.permissions.administer
  )
    return (
      <CompetitionDraftEditor
        wave={wave}
        competition={competition}
        onClose={() => router.replace(getCompetitionsRoute(wave.id))}
      />
    );
  return (
    <div className="tw-space-y-5">
      <div className="tw-flex tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-2 sm:tw-px-4">
        <div className="tw-min-w-0 tw-flex-1 tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500">
          <TabToggle
            options={COMPETITION_TABS.filter(
              (value) => outcomesVisible || value !== "outcomes"
            ).map((value) => ({
              key: value,
              label: tabLabel(value),
              panelId: `competition-${competition.id}-${value}`,
            }))}
            activeKey={tab}
            onSelect={(value) =>
              router.push(`${pathname}?tab=${value}`, { scroll: false })
            }
          />
        </div>
      </div>
      {pauses.isError && (
        <CompetitionState
          error
          retry={() => {
            void pauses.refetch();
          }}
        />
      )}
      {paused && (
        <output className="tw-block tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-sm tw-text-amber-300">
          {t(locale, "competitions.paused")}
        </output>
      )}
      {!competition.permissions.submit && (
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, "competitions.submitClosed")}
        </p>
      )}
      {mutationsEnabled && entering && (
        <CompetitionEntryForm
          key={competition.id}
          onClose={() => setEntering(false)}
        />
      )}
      <section
        role="tabpanel"
        id={`competition-${competition.id}-${tab}`}
        aria-label={tabLabel(tab)}
        className="tw-space-y-5"
      >
        <WaveDisplayMetadataContext.Provider value={displayMetadata}>
          <CompetitionResources
            key={tab}
            tab={tab}
            onCreateDrop={
              mutationsEnabled &&
              competition.permissions.submit &&
              competition.lifecycle === ApiCompetitionLifecycle.Published
                ? () => setEntering((current) => !current)
                : undefined
            }
          />
        </WaveDisplayMetadataContext.Provider>
        {tab === "rules" && (
          <CompetitionAdmin
            paused={paused}
            onEdit={() => router.push(`${pathname}?edit=1`)}
          />
        )}
      </section>
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
            <ContentTabProvider competitionOnly>
              <MyStreamWave waveId={waveId} competitionOnly />
            </ContentTabProvider>
          </div>
        ) : (
          <NativeCompetitionContent />
        )}
      </CompetitionProvider>
    );
  return (
    <section className="tw-h-full tw-min-h-0 tw-overflow-y-auto tw-p-4 sm:tw-p-6">
      <div className="tw-mx-auto tw-max-w-5xl tw-space-y-5">
        <header className="tw-space-y-3">
          <nav>
            <CompetitionBackLink waveId={waveId} />
          </nav>
          {competition.data &&
            competition.data.lifecycle !== ApiCompetitionLifecycle.Draft &&
            hub.data &&
            hub.data.legacy_primary_competition_id !== competitionId && (
              <h1 className="tw-m-0 tw-min-w-0 tw-break-words tw-text-xl tw-font-bold tw-leading-tight tw-text-iron-50 sm:tw-text-2xl">
                {competition.data.title}
              </h1>
            )}
        </header>
        {content}
      </div>
    </section>
  );
}
