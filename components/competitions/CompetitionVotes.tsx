"use client";

import type { ReactNode } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCompetition } from "@/contexts/CompetitionContext";
import { TabToggleWithOverflow } from "@/components/common/TabToggleWithOverflow";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import MyStreamWaveMyVotes from "@/components/brain/my-stream/votes/MyStreamWaveMyVotes";
import HeaderUserConnect from "@/components/header/user/HeaderUserConnect";
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
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-3 tw-p-4">
        <p className="tw-m-0 tw-text-sm tw-italic tw-text-iron-500">
          {t(locale, "competitions.signIn")}
        </p>
        <HeaderUserConnect label={t(locale, "competitions.connectWallet")} />
      </div>
    );
  return hub.legacy_primary_competition_id === competition.id ? (
    <MyStreamWaveMyVotes wave={wave} onDropClick={navigateDrop} />
  ) : (
    <CompetitionMyVotes />
  );
}

export default function CompetitionVotes({
  embedded = false,
  children,
}: {
  readonly embedded?: boolean;
  readonly children?: ReactNode;
}) {
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
    <div
      className="tw-space-y-4 [&_[role=status]_p]:tw-italic"
      key={competition.id}
    >
      <div
        className={`tw-bg-iron-950 tw-py-1.5 [&_[role=tablist]]:tw-flex-wrap [&_[role=tablist]]:tw-gap-y-2.5 ${embedded ? "-tw-mx-4 tw-px-4" : ""}`}
      >
        <TabToggleWithOverflow
          transition
          variant="compactPills"
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
            router.replace(`${pathname}?${params.toString()}`, {
              scroll: false,
            });
          }}
        />
      </div>
      {children}
      {VOTE_TABS.map((key) => (
        <section
          key={key}
          role="tabpanel"
          id={`competition-${competition.id}-votes-${key}`}
          aria-label={labels[key]}
          className={embedded && key === "mine" ? "-tw-mx-4" : undefined}
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
