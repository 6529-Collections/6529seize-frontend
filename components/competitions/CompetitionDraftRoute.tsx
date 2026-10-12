"use client";
import { useRouter } from "next/navigation";
import { useCompetitionHub } from "@/hooks/competitions/useCompetitionQueries";
import { useWaveData } from "@/hooks/useWaveData";
import {
  getCompetitionsRoute,
  isMultiCompetitionEnabled,
} from "@/helpers/competition.helpers";
import { CompetitionState } from "./CompetitionState";
import CompetitionDraftEditor from "./CompetitionDraftEditor";
import CompetitionBackLink from "./CompetitionBackLink";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";

export default function CompetitionDraftRoute({
  waveId,
}: {
  readonly waveId: string;
}) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const { waveViewStyle } = useLayout();
  const hub = useCompetitionHub(waveId);
  const wave = useWaveData({ waveId, onWaveNotFound: () => undefined });
  let content = <CompetitionState />;
  if (hub.isError || wave.isError || !isMultiCompetitionEnabled())
    content = <CompetitionState error />;
  else if (hub.data && wave.data)
    content = hub.data.permissions.create_competition ? (
      <CompetitionDraftEditor
        wave={wave.data}
        onClose={() => router.push(getCompetitionsRoute(waveId))}
      />
    ) : (
      <CompetitionState error />
    );
  return (
    <section
      className="tw-h-full tw-min-h-0 tw-scroll-pb-24 tw-overflow-y-auto tw-px-4 tw-pt-4 sm:tw-px-6 sm:tw-pt-6"
      style={isApp ? waveViewStyle : undefined}
    >
      <div className="tw-mx-auto tw-max-w-4xl tw-space-y-5">
        <CompetitionBackLink waveId={waveId} />
        {content}
      </div>
    </section>
  );
}
