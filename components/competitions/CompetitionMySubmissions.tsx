"use client";

import { useAuth } from "@/components/auth/Auth";
import MySubmissionsButton from "@/components/waves/leaderboard/MySubmissionsButton";
import MySubmissionsDialog from "@/components/waves/leaderboard/MySubmissionsDialog";
import WaveLeaderboardError from "@/components/waves/leaderboard/WaveLeaderboardError";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionResource } from "@/hooks/competitions/useCompetitionQueries";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useState } from "react";
import CompetitionEntryCard from "./CompetitionEntryCard";
import { CompetitionLoadMore } from "./CompetitionLoadMore";
import { CompetitionState } from "./CompetitionState";

export default function CompetitionMySubmissions() {
  const { competition } = useCompetition();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const locale = useBrowserLocale();
  const authorId = connectedProfile?.id;
  const scope = `${competition.wave_id}:${competition.id}:${authorId ?? "anonymous"}:${activeProfileProxy?.id ?? "self"}`;
  const [openScope, setOpenScope] = useState<string | null>(null);
  const isOpen = openScope === scope && !!authorId && !activeProfileProxy;
  const query = useCompetitionResource(
    { waveId: competition.wave_id, competitionId: competition.id },
    "entries",
    { submitter: authorId ?? "", sort: "submitted_at", direction: "DESC" },
    isOpen
  );
  if (!authorId || activeProfileProxy) return null;
  const loadedEntries = query.data?.pages.flatMap((page) => page.data) ?? [];
  const entries = loadedEntries.filter(
    (entry) =>
      entry.wave_id === competition.wave_id &&
      entry.competition_id === competition.id &&
      entry.submitter.id === authorId
  );
  const invalidEntries = entries.length !== loadedEntries.length;
  const hasEntries = entries.length > 0;
  return (
    <>
      <MySubmissionsButton onClick={() => setOpenScope(scope)}>
        {t(locale, "waves.submissions.mine")}
      </MySubmissionsButton>
      <MySubmissionsDialog
        isOpen={isOpen}
        onClose={() => setOpenScope(null)}
        competitionName={competition.title}
      >
        {() => (
          <div className="tw-space-y-4">
            {query.isPending && <CompetitionState />}
            {(query.isError || invalidEntries) && (
              <WaveLeaderboardError
                hasEntries={hasEntries}
                retrying={query.isFetching}
                onRetry={() => {
                  void query.refetch();
                }}
              />
            )}
            {!query.isPending &&
              !query.isError &&
              !invalidEntries &&
              !hasEntries && (
                <output className="tw-block tw-text-sm tw-text-iron-300">
                  {t(locale, "waves.submissions.empty")}
                </output>
              )}
            {entries.map((entry) => (
              <div key={entry.id} className="tw-space-y-2">
                <p className="tw-m-0 tw-text-sm tw-text-iron-300">
                  {t(locale, `waves.submissions.entryStatus.${entry.status}`)}
                </p>
                <CompetitionEntryCard
                  entryId={entry.id}
                  dropId={entry.drop_id}
                  onOpenDrop={() => setOpenScope(null)}
                />
              </div>
            ))}
            <CompetitionLoadMore query={query} />
          </div>
        )}
      </MySubmissionsDialog>
    </>
  );
}
