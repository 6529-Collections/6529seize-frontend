import React, { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrainMobileTabs from "./mobile/BrainMobileTabs";
import BrainMobileWaves from "./mobile/BrainMobileWaves";
import { useRouter } from "next/router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiDrop, ApiWaveType } from "../../generated/models/ObjectSerializer";
import { commonApiFetch } from "../../services/api/common-api";
import BrainDesktopDrop from "./BrainDesktopDrop";
import BrainMobileAbout from "./mobile/BrainMobileAbout";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useWaveData } from "../../hooks/useWaveData";
import MyStreamWaveLeaderboard from "./my-stream/MyStreamWaveLeaderboard";
import MyStreamWaveOutcome from "./my-stream/MyStreamWaveOutcome";
import Notifications from "./notifications/Notifications";
import { WaveWinners } from "../waves/winners/WaveWinners";
import { useWaveTimers } from "../../hooks/useWaveTimers";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import MyStreamWaveMyVotes from "./my-stream/votes/MyStreamWaveMyVotes";
import MyStreamWaveFAQ from "./my-stream/MyStreamWaveFAQ";
import { useWave } from "../../hooks/useWave";

export enum BrainView {
  DEFAULT = "DEFAULT",
  WAVES = "WAVES",
  ABOUT = "ABOUT",
  LEADERBOARD = "LEADERBOARD",
  WINNERS = "WINNERS",
  OUTCOME = "OUTCOME",
  MY_VOTES = "MY_VOTES",
  FAQ = "FAQ",
  NOTIFICATIONS = "NOTIFICATIONS",
}

interface Props {
  children: ReactNode;
}

const BrainMobile: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const [activeView, setActiveView] = useState<BrainView>(BrainView.DEFAULT);
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: router.query.drop as string }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${router.query.drop}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!router.query.drop,
  });

  const { data: wave } = useWaveData({
    waveId: router.query.wave as string,
    onWaveNotFound: () => {
      router.push(
        { pathname: router.pathname, query: { wave: null } },
        undefined,
        {
          shallow: true,
        }
      );
    },
  });

  const { isMemesWave } = useWave(wave);

  const {
    voting: { isCompleted },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);

  const onDropClick = (drop: ExtendedDrop) => {
    const currentQuery = { ...router.query };
    currentQuery.drop = drop.id;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const onDropClose = () => {
    const currentQuery = { ...router.query };
    delete currentQuery.drop;
    router.push({ pathname: router.pathname, query: currentQuery }, undefined, {
      shallow: true,
    });
  };

  const isDropOpen =
    drop &&
    drop?.id?.toLowerCase() === (router.query.drop as string)?.toLowerCase();

  const isRankWave = wave?.wave.type === ApiWaveType.Rank;

  // Handle tab visibility changes
  useEffect(() => {
    if (!wave) return;

    const isInLeaderboardAndVotingHasEnded =
      activeView === BrainView.LEADERBOARD && isCompleted;
    const isInWinnersAndFirstDecisionHasntPassed =
      activeView === BrainView.WINNERS && !firstDecisionDone;
    const isInMyVotesAndIsNotMemeWave =
      activeView === BrainView.MY_VOTES && !isMemesWave;
    const isInFAQAndIsNotMemeWave =
      activeView === BrainView.FAQ && !isMemesWave;

    // If on Leaderboard tab and voting has ended, switch to Default
    if (
      isInLeaderboardAndVotingHasEnded ||
      isInWinnersAndFirstDecisionHasntPassed ||
      isInMyVotesAndIsNotMemeWave ||
      isInFAQAndIsNotMemeWave
    ) {
      setActiveView(BrainView.DEFAULT);
    }
  }, [wave, isCompleted, firstDecisionDone, activeView, isMemesWave]);

  const viewComponents: Record<BrainView, ReactNode> = {
    [BrainView.WAVES]: (
      <BrainMobileWaves activeWaveId={router.query.wave as string} />
    ),
    [BrainView.ABOUT]: (
      <BrainMobileAbout activeWaveId={router.query.wave as string} />
    ),
    [BrainView.DEFAULT]: children,
    [BrainView.LEADERBOARD]:
      isRankWave && !!wave ? (
        <MyStreamWaveLeaderboard wave={wave} onDropClick={onDropClick} />
      ) : null,
    [BrainView.WINNERS]:
      isRankWave && !!wave ? (
        <div className="tw-px-2 sm:tw-px-4">
          <WaveWinners wave={wave} onDropClick={onDropClick} />
        </div>
      ) : null,
    [BrainView.OUTCOME]:
      isRankWave && !!wave ? <MyStreamWaveOutcome wave={wave} /> : null,
    [BrainView.MY_VOTES]:
      isRankWave && !!wave ? (
        <MyStreamWaveMyVotes wave={wave} onDropClick={onDropClick} />
      ) : null,
    [BrainView.FAQ]:
      isRankWave && isMemesWave && !!wave ? <MyStreamWaveFAQ wave={wave} /> : null,
    [BrainView.NOTIFICATIONS]: <Notifications />,
  };

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-h-full">
      {isDropOpen && (
        <div className="tw-absolute tw-inset-0 tw-z-[1000]">
          <BrainDesktopDrop
            drop={{
              ...drop,
              stableKey: drop.id,
              stableHash: drop.id,
            }}
            onClose={onDropClose}
          />
        </div>
      )}
      <BrainMobileTabs
        activeView={activeView}
        onViewChange={setActiveView}
        wave={wave}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="tw-flex-1"
        >
          {viewComponents[activeView]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BrainMobile;
