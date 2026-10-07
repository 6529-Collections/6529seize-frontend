"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCompetition } from "@/contexts/CompetitionContext";
import { TabToggle } from "@/components/common/TabToggle";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import MyStreamWaveMyVotes from "@/components/brain/my-stream/votes/MyStreamWaveMyVotes";
import CompetitionMyVotes from "./CompetitionMyVotes";
import CompetitionVoters from "./CompetitionVoters";
import CompetitionVoteActivity from "./CompetitionVoteActivity";

const VOTE_TABS = ["mine", "all", "activity"] as const;

function CompetitionPersonalVotes() {
  const { competition, hub, wave } = useCompetition();
  const viewer = useCompetitionViewer();
  const locale = useBrowserLocale();
  const navigateDrop = useCompetitionDropNavigation();
  if (!viewer)
    return (
      <p className="tw-p-4 tw-text-sm tw-text-iron-400">
        {t(locale, "competitions.signIn")}
      </p>
    );
  return hub.legacy_primary_competition_id === competition.id ? (
    <MyStreamWaveMyVotes wave={wave} onDropClick={navigateDrop} />
  ) : (
    <CompetitionMyVotes />
  );
}

export default function CompetitionVotes() {
  const { competition } = useCompetition();
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const locale = useBrowserLocale();
  const requested =
    search.get("voteTab") ?? (search.get("tab") === "voters" ? "all" : null);
  const active = VOTE_TABS.find((tab) => tab === requested) ?? "mine";
  const labels = {
    mine: t(locale, "competitions.myVotes"),
    all: t(locale, "competitions.allVotes"),
    activity: t(locale, "competitions.voteActivity"),
  };
  return (
    <div className="tw-space-y-4" key={competition.id}>
      <TabToggle
        options={VOTE_TABS.map((key) => ({
          key,
          label: labels[key],
          panelId: `competition-${competition.id}-votes-${key}`,
        }))}
        activeKey={active}
        onSelect={(key) => {
          const params = new URLSearchParams(search.toString());
          params.set("tab", "votes");
          params.set("voteTab", key);
          params.delete("entry");
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }}
      />
      {VOTE_TABS.map((key) => (
        <section
          key={key}
          role="tabpanel"
          id={`competition-${competition.id}-votes-${key}`}
          aria-label={labels[key]}
          hidden={active !== key}
        >
          {active === key && key === "mine" && <CompetitionPersonalVotes />}
          {active === key && key === "all" && <CompetitionVoters />}
          {active === key && key === "activity" && <CompetitionVoteActivity />}
        </section>
      ))}
    </div>
  );
}
