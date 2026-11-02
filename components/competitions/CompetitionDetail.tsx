"use client";
import clsx from "clsx";
import { isCompetitionSubmissionHistory } from "@/helpers/competition-lifecycle.helpers";
import { ApiCompetitionCapability } from "@/generated/models/ApiCompetitionCapability";
import { competitionPresentationWave } from "@/helpers/competition-presentation.helpers";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
import { WaveLeaderboardCurationDropModal } from "@/components/waves/leaderboard/create/WaveLeaderboardCurationDropModal";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";
import {
  getWaveOutcomeVisibilityFromMetadata,
  getApproveWaveTabLabelsFromMetadata,
} from "@/helpers/waves/wave-metadata.helpers";
import { useMemo, useState, type RefObject } from "react";
import { WaveDisplayMetadataContext } from "@/contexts/WaveDisplayMetadataContext";
import { TabToggle } from "@/components/common/TabToggle";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useWaveTabNavigation } from "@/hooks/useWaveTabNavigation";
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
  isCompetitionAccessError,
} from "@/helpers/competition.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CompetitionState } from "./CompetitionState";
import CompetitionAdmin from "./CompetitionAdmin";
import CompetitionResources from "./CompetitionResources";
import CompetitionEntryForm from "./CompetitionEntryForm";
import CompetitionDraftEditor from "./CompetitionDraftEditor";
import CompetitionBackLink from "./CompetitionBackLink";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";

export function NativeCompetitionContent({
  embedded = false,
  scrollContainerRef: providedScrollContainer,
}: {
  readonly embedded?: boolean;
  readonly scrollContainerRef?: RefObject<HTMLDivElement | null> | undefined;
}) {
  const { competition, wave } = useCompetition();
  const isMainStage = competition.capabilities.includes(
    ApiCompetitionCapability.MainStage
  );
  const isCuration = competition.capabilities.includes(
    ApiCompetitionCapability.Curation
  );
  const isQuorum = competition.capabilities.includes(
    ApiCompetitionCapability.Quorum
  );
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(
    null
  );
  const localScrollContainerRef = useMemo(
    () => ({ current: scrollContainer }),
    [scrollContainer]
  );
  const scrollContainerRef = providedScrollContainer ?? localScrollContainerRef;
  const { isApp } = useDeviceInfo();
  const { waveViewStyle } = useLayout();
  const locale = useBrowserLocale();
  const pathname = usePathname();
  const router = useRouter();
  const navigateTab = useWaveTabNavigation();
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
    if (value === "rules") return t(locale, "competitions.settings");
    if (value === "outcomes") return t(locale, "competitions.outcomeTab");
    if (value === "leaderboard" && isCompetitionSubmissionHistory(competition))
      return t(locale, "competitions.submissions");
    if (competition.type === ApiCompetitionType.Approve) {
      if (value === "leaderboard") return approveLabels.approvals;
      if (value === "decisions") return approveLabels.approved;
    }
    return t(locale, `competitions.${value}`);
  };
  const [entering, setEntering] = useState(false);
  const pauses = useCompetitionPauseState({
    waveId: wave.id,
    competitionId: competition.id,
  });
  const paused = pauses.isSuccess ? pauses.data : null;
  const tabOptions = COMPETITION_TABS.filter(
    (value) => outcomesVisible || value !== "outcomes"
  ).map((value) => ({
    key: value,
    label: tabLabel(value),
    panelId: `competition-${competition.id}-${value}`,
  }));
  const selectTab = (value: string) => navigateTab(`${pathname}?tab=${value}`);
  const isVotesView = tab === "votes" && !search.get("entry");
  const contentHeader = (
    <>
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
      {entering && isMainStage && (
        <MemesArtSubmissionModal
          isOpen
          wave={competitionPresentationWave(wave, competition)}
          onClose={() => setEntering(false)}
        />
      )}
      {entering && isCuration && (
        <WaveLeaderboardCurationDropModal
          isOpen
          wave={competitionPresentationWave(wave, competition)}
          onClose={() => setEntering(false)}
        />
      )}
      {entering && isQuorum && (
        <WaveDropCreate
          wave={competitionPresentationWave(wave, competition)}
          onCancel={() => setEntering(false)}
          onSuccess={() => setEntering(false)}
        />
      )}
      {entering && !isMainStage && !isCuration && !isQuorum && (
        <CompetitionEntryForm
          key={competition.id}
          onClose={() => setEntering(false)}
        />
      )}
    </>
  );
  if (
    competition.permissions.administer &&
    (competition.lifecycle === ApiCompetitionLifecycle.Draft ||
      (search.get("edit") === "1" &&
        competition.permissions.edit_rules_after_activity === true))
  )
    return (
      <CompetitionDraftEditor
        wave={wave}
        competition={competition}
        onClose={() => {
          const params = new URLSearchParams(search.toString());
          params.delete("edit");
          params.set("tab", "rules");
          router.replace(
            competition.lifecycle === ApiCompetitionLifecycle.Draft
              ? getCompetitionsRoute(wave.id)
              : `${pathname}?${params.toString()}`
          );
        }}
      />
    );
  return (
    <div
      ref={providedScrollContainer ? undefined : setScrollContainer}
      style={embedded && isApp ? waveViewStyle : undefined}
      className={
        embedded
          ? "tw-h-full tw-min-h-0 tw-space-y-5 tw-overflow-y-auto tw-p-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 hover:tw-scrollbar-thumb-white/15"
          : "tw-space-y-5"
      }
    >
      {!embedded && (
        <div
          data-competition-navigation="detail"
          className="tw-flex tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-2 sm:tw-px-4"
        >
          <div className="tw-min-w-0 tw-flex-1 tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500">
            <TabToggle
              transition
              options={tabOptions}
              activeKey={tab}
              onSelect={selectTab}
            />
          </div>
        </div>
      )}
      {!isVotesView && contentHeader}
      <section
        role={embedded ? undefined : "tabpanel"}
        id={`competition-${competition.id}-${tab}`}
        aria-label={tabLabel(tab)}
        className={clsx("tw-space-y-5", {
          "first:-tw-mt-4": embedded && isVotesView,
        })}
      >
        <WaveDisplayMetadataContext.Provider value={displayMetadata}>
          <CompetitionResources
            key={tab}
            embedded={embedded}
            scrollContainerRef={scrollContainerRef}
            tab={tab}
            onCreateDrop={
              competition.permissions.submit &&
              competition.lifecycle === ApiCompetitionLifecycle.Published
                ? () => setEntering((current) => !current)
                : undefined
            }
          >
            {isVotesView && contentHeader}
          </CompetitionResources>
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
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(
    null
  );
  const scrollContainerRef = useMemo(
    () => ({ current: scrollContainer }),
    [scrollContainer]
  );
  const { isApp } = useDeviceInfo();
  const { waveViewStyle } = useLayout();
  const wave = useWaveData({
    waveId,
    onWaveNotFound: () => undefined,
  });
  const hub = useCompetitionHub(waveId);
  const competition = useCompetitionDetail({ waveId, competitionId });
  const isDraft = competition.data?.lifecycle === ApiCompetitionLifecycle.Draft;
  const hasCachedContent = Boolean(hub.data && competition.data && wave.data);
  const accessRejected = [hub.error, competition.error, wave.error].some(
    isCompetitionAccessError
  );
  const error =
    accessRejected ||
    (!hasCachedContent && (hub.isError || competition.isError || wave.isError));
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
        <NativeCompetitionContent scrollContainerRef={scrollContainerRef} />
      </CompetitionProvider>
    );
  return (
    <div
      ref={setScrollContainer}
      data-competition-detail
      style={isApp && isDraft ? waveViewStyle : undefined}
      className={`tw-h-full tw-min-h-0 tw-overflow-y-auto tw-px-4 tw-pt-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 hover:tw-scrollbar-thumb-white/15 sm:tw-px-6 sm:tw-pt-6 ${isDraft ? "tw-scroll-pb-24" : "tw-pb-4 sm:tw-pb-6"}`}
    >
      <div
        className={`tw-mx-auto tw-max-w-5xl ${isDraft ? "tw-flex tw-min-h-full tw-flex-col tw-gap-5" : "tw-space-y-5"}`}
      >
        <header className="tw-space-y-3">
          <nav>
            <CompetitionBackLink waveId={waveId} />
          </nav>
          {!error && competition.data && !isDraft && hub.data && (
            <h1 className="tw-m-0 tw-min-w-0 tw-break-words tw-text-xl tw-font-bold tw-leading-tight tw-text-iron-50 sm:tw-text-2xl">
              {competition.data.title}
            </h1>
          )}
        </header>
        {content}
      </div>
    </div>
  );
}
