"use client";
import { useRouter } from "next/navigation";
import { useCompetitionHub } from "@/hooks/competitions/useCompetitionQueries";
import { useWaveData } from "@/hooks/useWaveData";
import {
  getCompetitionsRoute,
  isCompetitionAccessError,
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
  const wave = useWaveData({
    waveId,
    onWaveNotFound: () => undefined,
  });
  let content = <CompetitionState />;
  const accessRejected = [hub.error, wave.error].some(isCompetitionAccessError);
  if (
    accessRejected ||
    (!(hub.data && wave.data) && (hub.isError || wave.isError))
  )
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
      className="tw-h-full tw-min-h-0 tw-scroll-pb-24 tw-overflow-y-auto tw-px-4 tw-pt-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 hover:tw-scrollbar-thumb-white/15 sm:tw-px-6 sm:tw-pt-6"
      style={isApp ? waveViewStyle : undefined}
    >
      <div className="tw-mx-auto tw-flex tw-min-h-full tw-w-full tw-max-w-[680px] tw-flex-col tw-items-start tw-gap-5">
        <CompetitionBackLink waveId={waveId} />
        {content}
      </div>
    </section>
  );
}
